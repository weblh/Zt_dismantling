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
import java.util.concurrent.ConcurrentHashMap;

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
    /** 过磅同步实时列表短缓存，避免翻页反复打简道云。 */
    private final Map<String, LiveListCache> weighingSyncCache = new ConcurrentHashMap<>();
    /** 业务收货全量缓存。简道云该表约三万条，拉全量较慢，缓存 15 分钟。 */
    private final Map<String, LiveListCache> receiptCache = new ConcurrentHashMap<>();
    /** 报废车入库全量缓存。简道云该表约三万条，拉全量较慢，缓存 15 分钟。 */
    private final Map<String, LiveListCache> scrappedVehicleCache = new ConcurrentHashMap<>();

    private static final class LiveListCache {
        final long expiresAt;
        final List<Map<String, Object>> rows;

        LiveListCache(long expiresAt, List<Map<String, Object>> rows) {
            this.expiresAt = expiresAt;
            this.rows = rows;
        }
    }

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
        Map<String, Object> empty = new LinkedHashMap<>();
        empty.put("bizKey", bizKey);
        empty.put("message", "简道云镜像已下线");
        empty.put("expectedBizFields", new ArrayList<>());
        empty.put("expectedSysFields", new ArrayList<>());
        empty.put("jdyBizFields", new ArrayList<>());
        empty.put("jdySysFields", new ArrayList<>());
        empty.put("missingInJdy", new ArrayList<>());
        empty.put("extraInJdy", new ArrayList<>());
        return empty;
    }

    @SuppressWarnings("unused")
    private Map<String, Object> compareFieldsLegacy(String bizKey) {
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
        if ("weighing-sync".equals(bizKey)) {
            return listWeighingSyncLive(pageNo, pageSize, keyword);
        }
        if ("receipt".equals(bizKey)) {
            return listReceiptFromDb(pageNo, pageSize, keyword);
        }
        if ("weighing-inspection".equals(bizKey)) {
            return listWeighingInspectionFromDb(pageNo, pageSize, keyword);
        }
        if ("inspection-photo".equals(bizKey)) {
            return listInspectionPhotoFromDb(pageNo, pageSize, keyword);
        }
        if ("scrapped-vehicle".equals(bizKey)) {
            return listScrappedVehicleFromDb(pageNo, pageSize, keyword);
        }
        // 简道云镜像表已下线
        return new PageResult<>(0L, new ArrayList<>());
    }

    /**
     * 业务收货：只读本地 jdy_form_data，按简道云创建时间最新在前。
     * 打开页面不再请求简道云；点「同步」才会全量拉取写入。
     * 大板车为空时补「大板车」，日期按 yyyy-MM-dd 展示。
     */
    private PageResult<List<Map<String, Object>>> listReceiptFromDb(int pageNo, int pageSize, String keyword) {
        int safePage = Math.max(pageNo, 1);
        int safeSize = Math.min(Math.max(pageSize, 1), 100);
        String entryId = requireEntryId("receipt");
        Map<String, String> fieldMap = JdyBusinessForms.fieldMapOf("receipt");
        Map<String, String> labelToWidget = receiptWidgetMap();

        LambdaQueryWrapper<JdyFormData> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(JdyFormData::getEntryId, entryId);
        if (StringUtils.hasText(keyword)) {
            wrapper.like(JdyFormData::getRawData, keyword.trim());
        }
        wrapper.orderByDesc(JdyFormData::getJdyCreateTime).orderByDesc(JdyFormData::getId);
        Page<JdyFormData> page = jdyFormDataMapper.selectPage(new Page<>(safePage, safeSize), wrapper);

        List<Map<String, Object>> records = new ArrayList<>();
        for (JdyFormData row : page.getRecords()) {
            Map<String, Object> item = mapRow(row.getId(), row.getDataId(), row.getRawData(), row.getCreatorName(),
                    row.getJdyCreateTime(), row.getJdyUpdateTime(), fieldMap, labelToWidget);
            Object truck = item.get("bigTruck");
            if (truck == null || !StringUtils.hasText(String.valueOf(truck))) {
                item.put("bigTruck", "大板车");
                item.put("大板车", "大板车");
            }
            Object dt = item.get("datetime");
            if (dt != null && StringUtils.hasText(String.valueOf(dt))) {
                String text = String.valueOf(dt);
                if (text.length() >= 10) {
                    item.put("datetime", text.substring(0, 10));
                    item.put("日期时间", text.substring(0, 10));
                }
            }
            records.add(item);
        }
        return new PageResult<>(page.getTotal(), records);
    }

    public void clearReceiptCache() {
        receiptCache.clear();
    }

    /**
     * 过磅查验：只读本地 jdy_form_data。打开页面不请求简道云；点「同步」才会全量写入。
     */
    private PageResult<List<Map<String, Object>>> listWeighingInspectionFromDb(int pageNo, int pageSize, String keyword) {
        int safePage = Math.max(pageNo, 1);
        int safeSize = Math.min(Math.max(pageSize, 1), 100);
        String entryId = requireEntryId("weighing-inspection");
        Map<String, String> fieldMap = JdyBusinessForms.fieldMapOf("weighing-inspection");
        Map<String, String> labelToWidget = weighingInspectionWidgetMap();

        LambdaQueryWrapper<JdyFormData> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(JdyFormData::getEntryId, entryId);
        if (StringUtils.hasText(keyword)) {
            wrapper.like(JdyFormData::getRawData, keyword.trim());
        }
        wrapper.orderByDesc(JdyFormData::getJdyCreateTime).orderByDesc(JdyFormData::getId);
        Page<JdyFormData> page = jdyFormDataMapper.selectPage(new Page<>(safePage, safeSize), wrapper);

        List<Map<String, Object>> records = new ArrayList<>();
        for (JdyFormData row : page.getRecords()) {
            records.add(mapRow(row.getId(), row.getDataId(), row.getRawData(), row.getCreatorName(),
                    row.getJdyCreateTime(), row.getJdyUpdateTime(), fieldMap, labelToWidget));
        }
        return new PageResult<>(page.getTotal(), records);
    }

    private Map<String, String> weighingInspectionWidgetMap() {
        Map<String, String> map = new LinkedHashMap<>();
        map.put("编号", "number");
        map.put("销户/议价", "procurement_type");
        map.put("过磅日期", "eighing_date");
        map.put("车牌号", "car_number");
        map.put("回车日期", "return_date");
        map.put("车辆类型", "car_type");
        map.put("车辆型号", "vehicle_type");
        map.put("供应商", "supplier");
        map.put("业务员", "salesperson");
        map.put("回车地", "return_address");
        map.put("吨位", "tonnage");
        map.put("压扁", "_widget_1718854113794");
        map.put("营运", "_widget_1718854113796");
        map.put("B 级", "_widget_1718854113798");
        map.put("B级", "_widget_1718854113798");
        map.put("铁", "iron");
        map.put("铝", "aluminium");
        map.put("三元", "sanyuan");
        map.put("电瓶", "battery");
        map.put("轮胎", "_widget_1753845474778");
        map.put("备注", "remark");
        return map;
    }

    private Map<String, String> receiptWidgetMap() {
        Map<String, String> map = new LinkedHashMap<>();
        map.put("供应商名称", "_widget_1714274782100");
        map.put("回车地", "_widget_1715151402907");
        map.put("联系电话", "_widget_1714274782101");
        map.put("日期时间", "_widget_1714274782102");
        map.put("大板车", "_widget_1718853215057");
        map.put("车牌号", "_widget_1714274754595");
        map.put("销户/议价", "_widget_1714274754596");
        map.put("车主身份信息", "_widget_1714274782096");
        map.put("行车本", "_widget_1714274782094");
        map.put("登记证书", "_widget_1714274782092");
        map.put("需说明事项", "_widget_1714274754606");
        map.put("是否查验", "_widget_1715151500531");
        return map;
    }

    private Map<String, String> loadReceiptWidgets(String appId, String entryId) {
        Map<String, String> map = new LinkedHashMap<>();
        map.put("供应商名称", "_widget_1714274782100");
        map.put("回车地", "_widget_1715151402907");
        map.put("联系电话", "_widget_1714274782101");
        map.put("日期时间", "_widget_1714274782102");
        map.put("大板车", "_widget_1718853215057");
        map.put("车牌号", "_widget_1714274754595");
        map.put("销户/议价", "_widget_1714274754596");
        map.put("车主身份信息", "_widget_1714274782096");
        map.put("行车本", "_widget_1714274782094");
        map.put("登记证书", "_widget_1714274782092");
        map.put("需说明事项", "_widget_1714274754606");
        map.put("是否查验", "_widget_1715151500531");
        try {
            JSONObject schema = jdyApiService.getWidgetSchema(appId, entryId);
            JSONArray widgets = schema == null ? null : schema.getJSONArray("widgets");
            if (widgets != null) {
                for (int i = 0; i < widgets.size(); i++) {
                    JSONObject w = widgets.getJSONObject(i);
                    if (w != null && StringUtils.hasText(w.getString("label")) && StringUtils.hasText(w.getString("name"))) {
                        map.put(w.getString("label"), w.getString("name"));
                    }
                }
            }
        } catch (Exception ignored) {
            // 控件清单拉取失败时使用已核对的业务收货字段
        }
        return map;
    }

    /**
     * 查验照片：只读本地 jdy_form_data。打开页面不再请求简道云；点「同步」才会全量拉取写入。
     */
    private PageResult<List<Map<String, Object>>> listInspectionPhotoFromDb(int pageNo, int pageSize, String keyword) {
        int safePage = Math.max(pageNo, 1);
        int safeSize = Math.min(Math.max(pageSize, 1), 100);
        String entryId = requireEntryId("inspection-photo");
        String entryWidget = "_widget_1714276637630";
        String plateWidget = "_widget_1718500021055";
        String imageWidget = "_widget_1714455437727";

        LambdaQueryWrapper<JdyFormData> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(JdyFormData::getEntryId, entryId);
        if (StringUtils.hasText(keyword)) {
            wrapper.like(JdyFormData::getRawData, keyword.trim());
        }
        wrapper.orderByDesc(JdyFormData::getJdyCreateTime).orderByDesc(JdyFormData::getId);
        Page<JdyFormData> page = jdyFormDataMapper.selectPage(new Page<>(safePage, safeSize), wrapper);

        List<Map<String, Object>> records = new ArrayList<>();
        for (JdyFormData row : page.getRecords()) {
            JSONObject raw = parseRaw(row.getRawData());
            Map<String, Object> item = slimInspectionPhoto(row.getId() == null ? 0L : row.getId(),
                    raw, entryWidget, plateWidget, imageWidget);
            if (StringUtils.hasText(row.getCreatorName())) {
                item.put("submitter", row.getCreatorName());
            }
            if (!StringUtils.hasText((String) item.get("submitTime"))) {
                item.put("submitTime", formatDateTime(row.getJdyCreateTime()));
            }
            if (!StringUtils.hasText((String) item.get("updateTime"))) {
                item.put("updateTime", formatDateTime(row.getJdyUpdateTime()));
            }
            records.add(item);
        }
        return new PageResult<>(page.getTotal(), records);
    }

    /** 只保留列表要用的字段和图片地址，避免把简道云原始报文再解析一份。 */
    private Map<String, Object> slimInspectionPhoto(long id, JSONObject raw,
                                                     String entryWidget, String plateWidget, String imageWidget) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", id);
        item.put("dataId", firstNonBlank(raw.getString("_id"), raw.getString("data_id")));
        item.put("entryCode", textOrEmpty(raw.get(entryWidget)));
        item.put("plateNumber", textOrEmpty(raw.get(plateWidget)));
        item.put("images", imageUrls(raw.get(imageWidget)));
        item.put("submitter", resolvePersonName(raw));
        item.put("submitTime", formatDateTime(raw.getString("createTime")));
        item.put("updateTime", formatDateTime(raw.getString("updateTime")));
        return item;
    }

    private String textOrEmpty(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private List<String> imageUrls(Object rawValue) {
        List<String> urls = new ArrayList<>();
        if (!(rawValue instanceof JSONArray)) {
            return urls;
        }
        JSONArray arr = (JSONArray) rawValue;
        for (int i = 0; i < arr.size(); i++) {
            Object item = arr.get(i);
            if (item instanceof JSONObject) {
                String url = firstNonBlank(((JSONObject) item).getString("url"),
                        ((JSONObject) item).getString("previewUrl"));
                if (StringUtils.hasText(url)) {
                    urls.add(url);
                }
            } else if (item != null && StringUtils.hasText(String.valueOf(item))) {
                urls.add(String.valueOf(item));
            }
        }
        return urls;
    }

    /**
     * 报废车入库：只读本地 jdy_form_data。打开页面不再请求简道云；点「同步」才会全量拉取写入。
     */
    private PageResult<List<Map<String, Object>>> listScrappedVehicleFromDb(int pageNo, int pageSize, String keyword) {
        int safePage = Math.max(pageNo, 1);
        int safeSize = Math.min(Math.max(pageSize, 1), 100);
        String entryId = requireEntryId("scrapped-vehicle");
        Map<String, String> fieldMap = JdyBusinessForms.fieldMapOf("scrapped-vehicle");
        Map<String, String> labelToWidget = scrappedVehicleWidgetMap();

        LambdaQueryWrapper<JdyFormData> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(JdyFormData::getEntryId, entryId);
        if (StringUtils.hasText(keyword)) {
            wrapper.like(JdyFormData::getRawData, keyword.trim());
        }
        wrapper.orderByDesc(JdyFormData::getJdyCreateTime).orderByDesc(JdyFormData::getId);
        Page<JdyFormData> page = jdyFormDataMapper.selectPage(new Page<>(safePage, safeSize), wrapper);

        List<Map<String, Object>> records = new ArrayList<>();
        for (JdyFormData row : page.getRecords()) {
            records.add(mapRow(row.getId(), row.getDataId(), row.getRawData(), row.getCreatorName(),
                    row.getJdyCreateTime(), row.getJdyUpdateTime(), fieldMap, labelToWidget));
        }
        return new PageResult<>(page.getTotal(), records);
    }

    public void clearScrappedVehicleCache() {
        scrappedVehicleCache.clear();
    }

    private Map<String, String> scrappedVehicleWidgetMap() {
        Map<String, String> map = new LinkedHashMap<>();
        map.put("入场编号", "_widget_1714276637630");
        map.put("销户/议价", "_widget_1715325459902");
        map.put("过磅日期", "_widget_1714276637629");
        map.put("净重", "_widget_1714281773373");
        map.put("供应商", "_widget_1716010134192");
        map.put("车辆类型", "_widget_1714281773377");
        map.put("车辆型号", "_widget_1714294408469");
        map.put("司磅员", "_widget_1714281773371");
        map.put("压扁", "_widget_1715152475297");
        map.put("营运", "_widget_1715152475293");
        map.put("B 级", "_widget_1715152475295");
        map.put("B级", "_widget_1715152475295");
        map.put("铁", "_widget_1715149705565");
        map.put("铝", "_widget_1715149705566");
        map.put("三元", "_widget_1715152573099");
        map.put("电瓶", "_widget_1714284642680");
        map.put("轮胎", "_widget_1753845619051");
        map.put("备注", "_widget_1715153261580");
        return map;
    }

    private Map<String, String> loadScrappedVehicleWidgets(String appId, String entryId) {
        Map<String, String> map = new LinkedHashMap<>();
        map.put("入场编号", "_widget_1714276637630");
        map.put("销户/议价", "_widget_1715325459902");
        map.put("过磅日期", "_widget_1714276637629");
        map.put("净重", "_widget_1714281773373");
        map.put("供应商", "_widget_1716010134192");
        map.put("车辆类型", "_widget_1714281773377");
        map.put("车辆型号", "_widget_1714294408469");
        map.put("司磅员", "_widget_1714281773371");
        map.put("压扁", "_widget_1715152475297");
        map.put("营运", "_widget_1715152475293");
        map.put("B 级", "_widget_1715152475295");
        map.put("B级", "_widget_1715152475295");
        map.put("铁", "_widget_1715149705565");
        map.put("铝", "_widget_1715149705566");
        map.put("三元", "_widget_1715152573099");
        map.put("电瓶", "_widget_1714284642680");
        map.put("轮胎", "_widget_1753845619051");
        map.put("备注", "_widget_1715153261580");
        try {
            JSONObject schema = jdyApiService.getWidgetSchema(appId, entryId);
            JSONArray widgets = schema == null ? null : schema.getJSONArray("widgets");
            if (widgets != null) {
                for (int i = 0; i < widgets.size(); i++) {
                    JSONObject w = widgets.getJSONObject(i);
                    if (w != null && StringUtils.hasText(w.getString("label")) && StringUtils.hasText(w.getString("name"))) {
                        map.put(w.getString("label"), w.getString("name"));
                    }
                }
            }
        } catch (Exception ignored) {
            // 控件清单拉取失败时使用已核对的报废车入库字段
        }
        return map;
    }

    /**
     * 过磅同步数据：过磅系统写入简道云「1、过磅同步数据」表后，经开放接口拉取。
     * 对齐简道云前端 data_process/data/find + count：按筛选分页，不整表灌入。
     * entry：66a20b980183b692cab589c9；字段：编号、议价/销户、吨位、状态。
     */
    private static final String WEIGHING_SYNC_CODE_WIDGET = "_widget_1721895833885";
    private static final String WEIGHING_SYNC_STATUS_WIDGET = "_widget_1721986619625";
    /** 默认只拉近 N 天（过磅增量），避免数万条整表超时。 */
    private static final int WEIGHING_SYNC_RECENT_DAYS = 90;
    private static final int WEIGHING_SYNC_MAX_ROWS = 5000;

    /**
     * 更新过磅同步状态（仅允许 0=已同步 / 1=待同步），写回简道云并清列表缓存。
     */
    public void updateWeighingSyncStatus(String dataId, String status) {
        if (!StringUtils.hasText(dataId)) {
            throw new RuntimeException("缺少数据 ID");
        }
        String normalized = normalizeWeighingSyncStatus(status);
        if (normalized == null) {
            throw new RuntimeException("状态仅支持：已同步、待同步");
        }
        if (!jdyApiService.isConfigured()) {
            throw new RuntimeException("简道云 API 未配置，无法更新状态");
        }
        String entryId = requireEntryId("weighing-sync");
        String appId = JdyBusinessForms.APP_ID;
        try {
            JSONObject field = new JSONObject();
            field.put("value", normalized);
            JSONObject data = new JSONObject();
            data.put(WEIGHING_SYNC_STATUS_WIDGET, field);
            jdyApiService.updateFormData(appId, entryId, dataId.trim(), data);
            weighingSyncCache.clear();
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("更新过磅同步状态失败: " + e.getMessage());
        }
    }

    /** 0/已同步 → "0"；1/待同步 → "1"；其它返回 null。 */
    private String normalizeWeighingSyncStatus(String status) {
        if (!StringUtils.hasText(status)) {
            return null;
        }
        String s = status.trim();
        if ("0".equals(s) || "已同步".equals(s)) {
            return "0";
        }
        if ("1".equals(s) || "待同步".equals(s)) {
            return "1";
        }
        return null;
    }

    private PageResult<List<Map<String, Object>>> listWeighingSyncLive(int pageNo, int pageSize, String keyword) {
        int safePage = Math.max(pageNo, 1);
        int safeSize = Math.min(Math.max(pageSize, 1), 100);
        String key = keyword == null ? "" : keyword.trim();
        // 打开列表首页时清缓存，保证拿到过磅系统同步到简道云的最新数据
        if (safePage == 1 && !StringUtils.hasText(key)) {
            weighingSyncCache.remove("recent:" + WEIGHING_SYNC_RECENT_DAYS);
        }
        List<Map<String, Object>> all = loadWeighingSyncRows(key);
        int from = Math.min((safePage - 1) * safeSize, all.size());
        int to = Math.min(from + safeSize, all.size());
        return new PageResult<>((long) all.size(), new ArrayList<>(all.subList(from, to)));
    }

    private List<Map<String, Object>> loadWeighingSyncRows(String keyword) {
        String key = keyword == null ? "" : keyword.trim();
        // 近 N 天窗口（对齐前端 find 默认列表）；关键字在窗口内本地匹配，精确编号再走 eq 查全表
        List<Map<String, Object>> recent = loadWeighingSyncRecentRows();
        if (!StringUtils.hasText(key)) {
            return recent;
        }
        String needle = key.toLowerCase(Locale.ROOT);
        List<Map<String, Object>> matched = new ArrayList<>();
        for (Map<String, Object> row : recent) {
            if (JSON.toJSONString(row).toLowerCase(Locale.ROOT).contains(needle)) {
                matched.add(row);
            }
        }
        // 开放接口 text 仅可靠支持 eq/in，精确编号可查历史全表
        Map<String, Object> exact = loadWeighingSyncByExactCode(key);
        if (exact != null) {
            String dataId = String.valueOf(exact.get("dataId"));
            boolean exists = matched.stream().anyMatch(r -> dataId.equals(String.valueOf(r.get("dataId"))));
            if (!exists) {
                matched.add(0, exact);
            }
        }
        return matched;
    }

    private List<Map<String, Object>> loadWeighingSyncRecentRows() {
        String cacheKey = "recent:" + WEIGHING_SYNC_RECENT_DAYS;
        LiveListCache cached = weighingSyncCache.get(cacheKey);
        long now = System.currentTimeMillis();
        if (cached != null && cached.expiresAt > now) {
            return cached.rows;
        }
        synchronized (weighingSyncCache) {
            cached = weighingSyncCache.get(cacheKey);
            now = System.currentTimeMillis();
            if (cached != null && cached.expiresAt > now) {
                return cached.rows;
            }
            if (!jdyApiService.isConfigured()) {
                throw new RuntimeException("简道云 API 未配置，无法读取过磅同步数据");
            }
            String entryId = requireEntryId("weighing-sync");
            String appId = JdyBusinessForms.APP_ID;
            try {
                Map<String, String> labelToWidget = loadWeighingSyncWidgets(appId, entryId);
                Map<String, String> fieldMap = JdyBusinessForms.fieldMapOf("weighing-sync");
                List<JSONObject> rawRows = jdyApiService.listFormData(
                        appId, entryId, WEIGHING_SYNC_MAX_ROWS, buildWeighingSyncRecentFilter());
                List<Map<String, Object>> mapped = mapWeighingSyncRows(rawRows, fieldMap, labelToWidget);
                java.util.Collections.reverse(mapped);
                // 短缓存：打开页拉最新后，同页翻页不重复打简道云
                weighingSyncCache.put(cacheKey, new LiveListCache(now + 30_000L, mapped));
                return mapped;
            } catch (RuntimeException e) {
                throw e;
            } catch (Exception e) {
                throw new RuntimeException("读取过磅同步数据失败: " + e.getMessage());
            }
        }
    }

    private Map<String, Object> loadWeighingSyncByExactCode(String code) {
        if (!StringUtils.hasText(code) || !jdyApiService.isConfigured()) {
            return null;
        }
        try {
            String entryId = requireEntryId("weighing-sync");
            String appId = JdyBusinessForms.APP_ID;
            Map<String, String> labelToWidget = loadWeighingSyncWidgets(appId, entryId);
            Map<String, String> fieldMap = JdyBusinessForms.fieldMapOf("weighing-sync");
            JSONObject filter = new JSONObject();
            filter.put("rel", "and");
            JSONArray cond = new JSONArray();
            JSONObject codeCond = new JSONObject();
            codeCond.put("field", WEIGHING_SYNC_CODE_WIDGET);
            codeCond.put("type", "text");
            codeCond.put("method", "eq");
            codeCond.put("value", code.trim());
            cond.add(codeCond);
            filter.put("cond", cond);
            List<JSONObject> rawRows = jdyApiService.listFormData(appId, entryId, 5, filter);
            if (rawRows.isEmpty()) {
                return null;
            }
            List<Map<String, Object>> mapped = mapWeighingSyncRows(rawRows, fieldMap, labelToWidget);
            return mapped.get(mapped.size() - 1);
        } catch (Exception e) {
            return null;
        }
    }

    private List<Map<String, Object>> mapWeighingSyncRows(List<JSONObject> rawRows,
                                                          Map<String, String> fieldMap,
                                                          Map<String, String> labelToWidget) {
        List<Map<String, Object>> mapped = new ArrayList<>();
        long seq = 1L;
        for (JSONObject raw : rawRows) {
            String dataId = raw.getString("_id");
            mapped.add(mapRow(seq++, dataId, raw.toJSONString(), resolvePersonName(raw),
                    raw.getString("createTime"), raw.getString("updateTime"), fieldMap, labelToWidget));
        }
        return mapped;
    }

    /** 近 N 天创建时间窗口（对应简道云前端 find 默认列表，避免整表超时）。 */
    private JSONObject buildWeighingSyncRecentFilter() {
        Instant start = Instant.now().minusSeconds(WEIGHING_SYNC_RECENT_DAYS * 24L * 3600L);
        JSONObject filter = new JSONObject();
        filter.put("rel", "and");
        JSONArray cond = new JSONArray();
        JSONObject timeCond = new JSONObject();
        timeCond.put("field", "createTime");
        timeCond.put("type", "datetime");
        timeCond.put("method", "range");
        JSONArray range = new JSONArray();
        range.add(start.toString());
        range.add(null);
        timeCond.put("value", range);
        cond.add(timeCond);
        filter.put("cond", cond);
        return filter;
    }

    /** 过磅同步记录的创建人经常为空，提交人回退到更新人。 */
    private String resolvePersonName(JSONObject raw) {
        String fromCreator = personName(raw.get("creator"));
        if (StringUtils.hasText(fromCreator)) {
            return fromCreator;
        }
        return personName(raw.get("updater"));
    }

    private String personName(Object person) {
        if (person instanceof JSONObject) {
            return ((JSONObject) person).getString("name");
        }
        return null;
    }

    private Map<String, String> loadWeighingSyncWidgets(String appId, String entryId) {
        Map<String, String> map = new LinkedHashMap<>();
        map.put("编号", "_widget_1721895833885");
        map.put("议价/销户", "_widget_1721895833886");
        map.put("销户/议价", "_widget_1721895833886");
        map.put("吨位", "_widget_1721895833887");
        map.put("状态", "_widget_1721986619625");
        try {
            JSONObject schema = jdyApiService.getWidgetSchema(appId, entryId);
            JSONArray widgets = schema == null ? null : schema.getJSONArray("widgets");
            if (widgets != null) {
                for (int i = 0; i < widgets.size(); i++) {
                    JSONObject w = widgets.getJSONObject(i);
                    if (w != null && StringUtils.hasText(w.getString("label")) && StringUtils.hasText(w.getString("name"))) {
                        map.put(w.getString("label"), w.getString("name"));
                    }
                }
            }
        } catch (Exception ignored) {
            // 控件清单拉取失败时使用已核对的过磅同步字段
        }
        return map;
    }

    /** 议价应用镜像分页（与收车分表）。 */
    public PageResult<List<Map<String, Object>>> listPricingBusinessData(String bizKey,
                                                                         int pageNo,
                                                                         int pageSize,
                                                                         String keyword) {
        return new PageResult<>(0L, new ArrayList<>());
    }

    /** 原镜像分页实现保留；当前不再调用。 */
    @SuppressWarnings("unused")
    private PageResult<List<Map<String, Object>>> listBusinessDataLegacy(String bizKey,
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

    @SuppressWarnings("unused")
    private PageResult<List<Map<String, Object>>> listPricingBusinessDataLegacy(String bizKey,
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
        return 0;
    }

    public JSONObject refreshSchema(String entryId) {
        return new JSONObject();
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
            if ("photos".equals(field) || "pickTopPhotos".equals(field)
                    || "inspectionPhotos".equals(field) || "images".equals(field)) {
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
                || "ownerIdInfo".equals(field)
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
        return "是".equals(v) || "true".equalsIgnoreCase(v) || "1".equals(v) || "议价".equals(v)
                || "√".equals(v) || "✓".equals(v) || "✔".equals(v);
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
