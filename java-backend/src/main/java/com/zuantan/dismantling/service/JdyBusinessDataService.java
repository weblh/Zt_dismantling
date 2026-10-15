package com.zuantan.dismantling.service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zuantan.dismantling.common.PageResult;
import com.zuantan.dismantling.entity.JdyForm;
import com.zuantan.dismantling.entity.JdyFormData;
import com.zuantan.dismantling.entity.JdyPricingFormData;
import com.zuantan.dismantling.mapper.JdyFormDataMapper;
import com.zuantan.dismantling.mapper.JdyFormMapper;
import com.zuantan.dismantling.mapper.JdyPricingFormDataMapper;
import com.zuantan.dismantling.util.JdyBusinessForms;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class JdyBusinessDataService {

    private static final DateTimeFormatter DISPLAY_TIME =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DateTimeFormatter DISPLAY_DATE =
            DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final ZoneId ZONE = ZoneId.of("Asia/Shanghai");

    private final JdyFormMapper jdyFormMapper;
    private final JdyFormDataMapper jdyFormDataMapper;
    private final JdyPricingFormDataMapper jdyPricingFormDataMapper;
    private final JdyApiService jdyApiService;

    public JdyBusinessDataService(JdyFormMapper jdyFormMapper,
                                  JdyFormDataMapper jdyFormDataMapper,
                                  JdyPricingFormDataMapper jdyPricingFormDataMapper,
                                  JdyApiService jdyApiService) {
        this.jdyFormMapper = jdyFormMapper;
        this.jdyFormDataMapper = jdyFormDataMapper;
        this.jdyPricingFormDataMapper = jdyPricingFormDataMapper;
        this.jdyApiService = jdyApiService;
    }

    public Map<String, Object> compareFields(String bizKey) {
        String entryId = requireEntryId(bizKey);
        Map<String, String> fieldMap = JdyBusinessForms.fieldMapOf(bizKey);
        JSONObject schema = loadOrFetchSchema(entryId);
        JSONArray widgets = schema.getJSONArray("widgets");
        JSONArray sysWidgets = schema.getJSONArray("sysWidgets");

        List<String> jdyBizLabels = new ArrayList<>();
        Map<String, String> labelToWidget = new HashMap<>();
        if (widgets != null) {
            for (int i = 0; i < widgets.size(); i++) {
                JSONObject w = widgets.getJSONObject(i);
                String label = w.getString("label");
                jdyBizLabels.add(label);
                labelToWidget.put(label, w.getString("name"));
            }
        }

        List<String> expectedBiz = new ArrayList<>();
        List<String> expectedSys = new ArrayList<>();
        for (Map.Entry<String, String> e : fieldMap.entrySet()) {
            if ("submitter".equals(e.getValue())
                    || "submitTime".equals(e.getValue())
                    || "updateTime".equals(e.getValue())) {
                expectedSys.add(e.getKey());
            } else {
                expectedBiz.add(e.getKey());
            }
        }

        List<String> missingInJdy = new ArrayList<>();
        for (String label : expectedBiz) {
            if (!labelToWidget.containsKey(label) && !labelToWidget.containsKey(normalizeLabel(label))) {
                boolean found = false;
                for (String jdyLabel : labelToWidget.keySet()) {
                    if (normalizeLabel(jdyLabel).equals(normalizeLabel(label))) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    missingInJdy.add(label);
                }
            }
        }
        List<String> extraInJdy = new ArrayList<>();
        for (String label : jdyBizLabels) {
            if (!fieldMap.containsKey(label) && !fieldMap.containsKey(normalizeLabel(label))) {
                boolean mapped = false;
                for (String expected : fieldMap.keySet()) {
                    if (normalizeLabel(expected).equals(normalizeLabel(label))) {
                        mapped = true;
                        break;
                    }
                }
                if (!mapped) {
                    extraInJdy.add(label);
                }
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("bizKey", bizKey);
        result.put("entryId", entryId);
        result.put("consistent", missingInJdy.isEmpty());
        result.put("expectedBizFields", expectedBiz);
        result.put("expectedSysFields", expectedSys);
        result.put("jdyBizFields", jdyBizLabels);
        result.put("jdySysFields", sysWidgets);
        result.put("missingInJdy", missingInJdy);
        result.put("extraInJdy", extraInJdy);
        result.put("fieldMap", fieldMap);
        result.put("labelToWidget", labelToWidget);
        return result;
    }

    public PageResult<List<Map<String, Object>>> listBusinessData(String bizKey,
                                                                  int pageNo,
                                                                  int pageSize,
                                                                  String keyword) {
        String entryId = requireEntryId(bizKey);
        Map<String, String> fieldMap = JdyBusinessForms.fieldMapOf(bizKey);
        Map<String, String> labelToWidget = buildLabelToWidget(entryId);

        LambdaQueryWrapper<JdyFormData> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(JdyFormData::getEntryId, entryId);
        if (StringUtils.hasText(keyword)) {
            wrapper.like(JdyFormData::getRawData, keyword.trim());
        }
        wrapper.orderByDesc(JdyFormData::getId);
        Page<JdyFormData> page = jdyFormDataMapper.selectPage(new Page<>(pageNo, pageSize), wrapper);

        List<Map<String, Object>> records = new ArrayList<>();
        for (JdyFormData row : page.getRecords()) {
            records.add(mapRow(row.getId(), row.getDataId(), row.getRawData(), row.getCreatorName(),
                    row.getJdyCreateTime(), row.getJdyUpdateTime(), fieldMap, labelToWidget));
        }
        return new PageResult<>(page.getTotal(), records);
    }

    /** 议价应用镜像分页（与收车分表）。 */
    public PageResult<List<Map<String, Object>>> listPricingBusinessData(String bizKey,
                                                                         int pageNo,
                                                                         int pageSize,
                                                                         String keyword) {
        String entryId = requireEntryId(bizKey);
        Map<String, String> fieldMap = JdyBusinessForms.fieldMapOf(bizKey);
        Map<String, String> labelToWidget = buildLabelToWidget(entryId);

        LambdaQueryWrapper<JdyPricingFormData> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(JdyPricingFormData::getEntryId, entryId);
        if (StringUtils.hasText(keyword)) {
            wrapper.like(JdyPricingFormData::getRawData, keyword.trim());
        }
        wrapper.orderByDesc(JdyPricingFormData::getId);
        Page<JdyPricingFormData> page = jdyPricingFormDataMapper.selectPage(new Page<>(pageNo, pageSize), wrapper);

        List<Map<String, Object>> records = new ArrayList<>();
        for (JdyPricingFormData row : page.getRecords()) {
            Map<String, Object> item = mapRow(row.getId(), row.getDataId(), row.getRawData(), row.getCreatorName(),
                    row.getJdyCreateTime(), row.getJdyUpdateTime(), fieldMap, labelToWidget);
            item.put("_source", JdyBusinessForms.SOURCE_PRICING);
            records.add(item);
        }
        return new PageResult<>(page.getTotal(), records);
    }

    public int refreshAllSchemas() {
        int count = 0;
        for (Map.Entry<String, String> e : JdyBusinessForms.allEntryIds().entrySet()) {
            refreshSchema(e.getValue());
            count++;
        }
        return count;
    }

    public JSONObject refreshSchema(String entryId) {
        try {
            String appId = jdyApiService.getEffectiveAppId();
            if (!StringUtils.hasText(appId)) {
                appId = JdyBusinessForms.APP_ID;
            }
            JSONObject schema = jdyApiService.getWidgetSchema(appId, entryId);
            saveSchema(appId, entryId, schema);
            return schema;
        } catch (Exception ex) {
            throw new RuntimeException("刷新字段结构失败: " + ex.getMessage(), ex);
        }
    }

    private Map<String, Object> mapRow(Long id,
                                       String dataId,
                                       String rawData,
                                       String creatorName,
                                       String jdyCreateTime,
                                       String jdyUpdateTime,
                                       Map<String, String> fieldMap,
                                       Map<String, String> labelToWidget) {
        JSONObject raw = parseRaw(rawData);
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", id);
        item.put("dataId", dataId);

        for (Map.Entry<String, String> e : fieldMap.entrySet()) {
            String label = e.getKey();
            String field = e.getValue();
            Object value;
            if ("submitter".equals(field)) {
                value = extractCreatorName(raw, creatorName);
            } else if ("submitTime".equals(field)) {
                value = formatDateTime(firstNonBlank(raw.getString("createTime"), jdyCreateTime));
            } else if ("updateTime".equals(field)) {
                value = formatDateTime(firstNonBlank(raw.getString("updateTime"), jdyUpdateTime));
            } else if ("processStatus".equals(field)) {
                value = firstNonBlank(raw.getString("flowState"), stringify(raw.get("flowState")));
            } else {
                String widget = resolveWidget(labelToWidget, label);
                value = widget == null ? null : normalizeValue(raw.get(widget), field, label);
                if (value == null) {
                    // 英文控件名 / 字段名直接存在于 raw_data
                    value = normalizeValue(raw.get(label), field, label);
                }
                if (value == null) {
                    value = normalizeValue(raw.get(field), field, label);
                }
            }
            // 同一 field 可能对应多个简道云标签；后出现的空 widget 不应覆盖已有值
            if (value != null) {
                item.put(field, value);
            } else if (!item.containsKey(field)) {
                item.put(field, null);
            }
            item.put(label, value);
        }
        return item;
    }

    private Object extractCreatorName(JSONObject raw, String fallbackName) {
        if (StringUtils.hasText(fallbackName)) {
            return fallbackName;
        }
        if (raw != null) {
            Object creator = raw.get("creator");
            if (creator instanceof JSONObject) {
                String name = ((JSONObject) creator).getString("name");
                if (StringUtils.hasText(name)) {
                    return name;
                }
            }
        }
        return null;
    }

    private Object normalizeValue(Object rawValue, String field, String label) {
        if (rawValue == null) {
            return null;
        }
        if (rawValue instanceof JSONObject) {
            JSONObject obj = (JSONObject) rawValue;
            if (obj.containsKey("name")) {
                return obj.getString("name");
            }
            return obj.toJSONString();
        }
        if (rawValue instanceof JSONArray) {
            JSONArray arr = (JSONArray) rawValue;
            if ("photos".equals(field) || "pickTopPhotos".equals(field) || "inspectionPhotos".equals(field)) {
                java.util.List<String> urls = new java.util.ArrayList<>();
                for (int i = 0; i < arr.size(); i++) {
                    Object item = arr.get(i);
                    if (item instanceof JSONObject) {
                        JSONObject obj = (JSONObject) item;
                        String url = firstNonBlank(obj.getString("url"), obj.getString("previewUrl"));
                        urls.add(StringUtils.hasText(url) ? url : ("img-" + i));
                    } else if (item != null) {
                        urls.add(String.valueOf(item));
                    }
                }
                return urls;
            }
            if ("details".equals(field)) {
                return arr;
            }
            return arr.toJSONString();
        }
        String text = String.valueOf(rawValue).trim();
        if ("settlementStatus".equals(field)) {
            if ("已结账".equals(text) || "settled".equalsIgnoreCase(text)) {
                return "settled";
            }
            return "unsettled";
        }
        if (isBooleanLikeField(field, label)) {
            return toBoolean(text);
        }
        if (isNumberLikeField(field)) {
            return toNumber(text);
        }
        if (field.toLowerCase(Locale.ROOT).contains("date")
                || field.toLowerCase(Locale.ROOT).contains("time")
                || "datetime".equals(field)) {
            if (field.toLowerCase(Locale.ROOT).endsWith("date") && !field.toLowerCase(Locale.ROOT).contains("time")) {
                return formatDate(text);
            }
            return formatDateTime(text);
        }
        return text;
    }

    private boolean isBooleanLikeField(String field, String label) {
        return "isNegotiated".equals(field)
                || "drivingLicense".equals(field)
                || "registrationCert".equals(field)
                || "isChecked".equals(field)
                || "flattened".equals(field)
                || "commercial".equals(field)
                || "gradeB".equals(field);
    }

    private boolean isNumberLikeField(String field) {
        return "tonnage".equals(field)
                || "iron".equals(field)
                || "aluminum".equals(field)
                || "ternary".equals(field)
                || "battery".equals(field)
                || "tire".equals(field)
                || "netWeight".equals(field)
                || "kgDiff".equals(field)
                || "deductNetWeight".equals(field)
                || "deductBattery".equals(field)
                || "goodCondition".equals(field)
                || "deductTwoBox".equals(field)
                || "deductBreadBox".equals(field)
                || "deductIronRing".equals(field)
                || "deductDiesel".equals(field)
                || "selfDelivery".equals(field)
                || "deductSmallParts".equals(field)
                || "unitPrice".equals(field)
                || "totalPrice".equals(field)
                || "price".equals(field)
                || "totalAmount".equals(field)
                || "vehicleCount".equals(field)
                || "totalTonnage".equals(field)
                || "shredding".equals(field)
                || "scrapSteel".equals(field)
                || "chassis".equals(field)
                || "copper".equals(field)
                || "aluminum".equals(field)
                || "plastic".equals(field)
                || "smallParts".equals(field)
                || "rubber".equals(field)
                || "other".equals(field)
                || "grossWeight".equals(field)
                || "tareWeight".equals(field)
                || "outWeight".equals(field)
                || "actualAmount".equals(field);
    }

    private Boolean toBoolean(String text) {
        if (!StringUtils.hasText(text)) {
            return false;
        }
        String v = text.trim();
        return "是".equals(v) || "true".equalsIgnoreCase(v) || "1".equals(v) || "议价".equals(v);
    }

    private Object toNumber(String text) {
        if (!StringUtils.hasText(text)) {
            return null;
        }
        try {
            if (text.contains(".")) {
                return Double.parseDouble(text);
            }
            return Long.parseLong(text);
        } catch (NumberFormatException e) {
            return text;
        }
    }

    private String formatDateTime(String iso) {
        LocalDateTime dt = parseDateTime(iso);
        return dt == null ? iso : DISPLAY_TIME.format(dt);
    }

    private String formatDate(String iso) {
        LocalDateTime dt = parseDateTime(iso);
        return dt == null ? iso : DISPLAY_DATE.format(dt);
    }

    private LocalDateTime parseDateTime(String iso) {
        if (!StringUtils.hasText(iso)) {
            return null;
        }
        try {
            if (iso.endsWith("Z") || iso.contains("T")) {
                return LocalDateTime.ofInstant(Instant.parse(iso), ZONE);
            }
            if (iso.length() >= 19) {
                return LocalDateTime.parse(iso.substring(0, 19).replace(' ', 'T'));
            }
        } catch (Exception ignored) {
            // ignore
        }
        return null;
    }

    private String resolveWidget(Map<String, String> labelToWidget, String label) {
        if (labelToWidget.containsKey(label)) {
            return labelToWidget.get(label);
        }
        String normalized = normalizeLabel(label);
        for (Map.Entry<String, String> e : labelToWidget.entrySet()) {
            if (normalizeLabel(e.getKey()).equals(normalized)) {
                return e.getValue();
            }
        }
        return null;
    }

    private String normalizeLabel(String label) {
        if (label == null) {
            return "";
        }
        return label.replace(" ", "").replace("　", "").trim();
    }

    private Map<String, String> buildLabelToWidget(String entryId) {
        JSONObject schema = loadOrFetchSchema(entryId);
        Map<String, String> map = new HashMap<>();
        JSONArray widgets = schema.getJSONArray("widgets");
        if (widgets != null) {
            for (int i = 0; i < widgets.size(); i++) {
                JSONObject w = widgets.getJSONObject(i);
                map.put(w.getString("label"), w.getString("name"));
            }
        }
        return map;
    }

    private JSONObject loadOrFetchSchema(String entryId) {
        JdyForm form = findForm(entryId);
        if (form != null && StringUtils.hasText(form.getWidgetSchema())) {
            return JSON.parseObject(form.getWidgetSchema());
        }
        return refreshSchema(entryId);
    }

    private void saveSchema(String appId, String entryId, JSONObject schema) {
        JdyForm form = findForm(entryId);
        LocalDateTime now = LocalDateTime.now();
        if (form == null) {
            form = new JdyForm();
            form.setAppId(appId);
            form.setEntryId(entryId);
            form.setFormName(entryId);
            form.setStatus(1);
            form.setDataCount(0);
            form.setCreatedAt(now);
        }
        form.setWidgetSchema(schema.toJSONString());
        form.setUpdatedAt(now);
        if (form.getId() == null) {
            jdyFormMapper.insert(form);
        } else {
            jdyFormMapper.updateById(form);
        }
    }

    private JdyForm findForm(String entryId) {
        LambdaQueryWrapper<JdyForm> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(JdyForm::getEntryId, entryId).last("limit 1");
        return jdyFormMapper.selectOne(wrapper);
    }

    private String requireEntryId(String bizKey) {
        String entryId = JdyBusinessForms.entryIdOf(bizKey);
        if (!StringUtils.hasText(entryId)) {
            throw new RuntimeException("未知业务表单: " + bizKey);
        }
        return entryId;
    }

    private JSONObject parseRaw(String raw) {
        if (!StringUtils.hasText(raw)) {
            return new JSONObject();
        }
        try {
            return JSON.parseObject(raw);
        } catch (Exception e) {
            return new JSONObject();
        }
    }

    private String stringify(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private String firstNonBlank(String a, String b) {
        if (StringUtils.hasText(a)) {
            return a;
        }
        return b;
    }
}
