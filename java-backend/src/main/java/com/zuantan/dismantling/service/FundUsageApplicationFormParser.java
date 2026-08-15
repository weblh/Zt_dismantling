package com.zuantan.dismantling.service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.zuantan.dismantling.entity.DingtalkApprovalForm;
import com.zuantan.dismantling.entity.FundUsageApplication;
import com.zuantan.dismantling.entity.FundUsageApplicationItem;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class FundUsageApplicationFormParser {

    public ParsedApplication parse(DingtalkApprovalForm approvalForm) {
        ParsedApplication parsed = new ParsedApplication();
        FundUsageApplication header = buildHeader(approvalForm);
        List<FundUsageApplicationItem> items = new ArrayList<>();

        if (StringUtils.hasText(approvalForm.getFormComponents())) {
            JSONArray components = JSON.parseArray(approvalForm.getFormComponents());
            if (components != null) {
                for (int i = 0; i < components.size(); i++) {
                    JSONObject component = components.getJSONObject(i);
                    if (component == null) {
                        continue;
                    }
                    parseComponent(header, items, component);
                }
            }
        }

        if (items.isEmpty() && StringUtils.hasText(approvalForm.getRawDetail())) {
            parseFromRawDetail(header, items, approvalForm.getRawDetail());
        } else {
            enrichFromRawDetail(header, approvalForm.getRawDetail());
        }

        if (header.getTotalAmount() == null && !items.isEmpty()) {
            BigDecimal sum = BigDecimal.ZERO;
            for (FundUsageApplicationItem item : items) {
                if (item.getAmount() != null) {
                    sum = sum.add(item.getAmount());
                }
            }
            if (sum.compareTo(BigDecimal.ZERO) > 0) {
                header.setTotalAmount(sum);
            }
        }

        if (!StringUtils.hasText(header.getPaymentType()) && !items.isEmpty()) {
            header.setPaymentType(items.get(0).getPaymentType());
        }
        if (!StringUtils.hasText(header.getPaymentReason()) && !items.isEmpty()) {
            header.setPaymentReason(items.get(0).getPaymentReason());
        }

        parsed.setHeader(header);
        parsed.setItems(items);
        return parsed;
    }

    private FundUsageApplication buildHeader(DingtalkApprovalForm approvalForm) {
        FundUsageApplication header = new FundUsageApplication();
        header.setApprovalFormId(approvalForm.getId());
        header.setProcessInstanceId(approvalForm.getProcessInstanceId());
        header.setProcessCode(approvalForm.getProcessCode());
        header.setBusinessId(approvalForm.getBusinessId());
        header.setTitle(approvalForm.getTitle());
        header.setSubmitterId(approvalForm.getStaffId());
        header.setSubmitterName(parseSubmitterName(approvalForm.getTitle()));
        header.setApprovalResult(approvalForm.getApprovalResult());
        header.setBizCategoryId(approvalForm.getBizCategoryId());
        header.setApprovalUrl(approvalForm.getApprovalUrl());
        header.setSubmitTime(approvalForm.getSubmitTime());
        header.setFinishTime(approvalForm.getFinishTime());
        header.setCreatedAt(LocalDateTime.now());
        return header;
    }

    private void parseComponent(FundUsageApplication header, List<FundUsageApplicationItem> items, JSONObject component) {
        String name = component.getString("name");
        String value = component.getString("value");
        String componentType = component.getString("componentType");
        String extValue = component.getString("extValue");

        if (isTableField(componentType, name)) {
            items.addAll(parseTableRows(value, component.get("value")));
            return;
        }

        if ("CalculateField".equalsIgnoreCase(componentType)) {
            applyTotalAmount(header, value, extValue);
            return;
        }

        if ("DDAttachment".equalsIgnoreCase(componentType)) {
            header.setAttachmentInfo(parseAttachment(value));
            return;
        }

        applyHeaderField(header, name, value, extValue);
    }

    private void enrichFromRawDetail(FundUsageApplication header, String rawDetail) {
        if (!StringUtils.hasText(rawDetail)) {
            return;
        }
        try {
            JSONObject detail = JSON.parseObject(rawDetail);
            if (detail == null) {
                return;
            }
            if (!StringUtils.hasText(header.getOriginatorDept())) {
                header.setOriginatorDept(firstNonBlank(
                        detail.getString("originatorDeptName"),
                        detail.getString("originatorDeptNameLastStage")));
            }
            JSONObject originatorInfo = detail.getJSONObject("originatorInfo");
            if (originatorInfo != null && !StringUtils.hasText(header.getSubmitterName())) {
                header.setSubmitterName(originatorInfo.getString("name"));
            }
        } catch (Exception ignored) {
            // ignore malformed raw detail
        }
    }

    private void parseFromRawDetail(FundUsageApplication header, List<FundUsageApplicationItem> items, String rawDetail) {
        try {
            JSONObject detail = JSON.parseObject(rawDetail);
            if (detail == null) {
                return;
            }

            JSONObject originatorInfo = detail.getJSONObject("originatorInfo");
            if (originatorInfo != null && !StringUtils.hasText(header.getSubmitterName())) {
                header.setSubmitterName(originatorInfo.getString("name"));
            }

            JSONObject formData = detail.getJSONObject("formData");
            if (formData == null) {
                return;
            }

            for (String key : formData.keySet()) {
                JSONObject field = formData.getJSONObject(key);
                if (field == null) {
                    continue;
                }
                String value = field.getString("value");
                String extValue = field.getString("extendValue");

                if (key.startsWith("TableField")) {
                    items.addAll(parseTableRows(value, value));
                    continue;
                }
                if (key.startsWith("CalculateField")) {
                    applyTotalAmount(header, value, extValue);
                    continue;
                }
                if (key.startsWith("DDAttachment")) {
                    header.setAttachmentInfo(parseAttachment(value));
                    continue;
                }
                if ("originatorDeptName".equals(key) || "originatorDeptNameLastStage".equals(key)) {
                    header.setOriginatorDept(value);
                    continue;
                }
                if ("pmc_business_id".equals(key) && StringUtils.hasText(value)) {
                    header.setBusinessId(value);
                }

                String label = resolveLabelFromSchema(detail.getString("formSchema"), key);
                applyHeaderField(header, label, value, extValue);
            }
        } catch (Exception ignored) {
            // ignore malformed raw detail
        }
    }

    private String resolveLabelFromSchema(String formSchema, String fieldId) {
        if (!StringUtils.hasText(formSchema) || !StringUtils.hasText(fieldId)) {
            return null;
        }
        try {
            JSONObject schema = JSON.parseObject(formSchema);
            return findLabelInSchemaItems(schema.getJSONArray("items"), fieldId);
        } catch (Exception ignored) {
            return null;
        }
    }

    private String findLabelInSchemaItems(JSONArray items, String fieldId) {
        if (items == null) {
            return null;
        }
        for (int i = 0; i < items.size(); i++) {
            JSONObject item = items.getJSONObject(i);
            if (item == null) {
                continue;
            }
            JSONObject props = item.getJSONObject("props");
            if (props != null && fieldId.equals(props.getString("id"))) {
                return props.getString("label");
            }
            JSONArray children = item.getJSONArray("children");
            String childLabel = findLabelInSchemaItems(children, fieldId);
            if (StringUtils.hasText(childLabel)) {
                return childLabel;
            }
        }
        return null;
    }

    private void applyHeaderField(FundUsageApplication header, String name, String value, String extValue) {
        if (!StringUtils.hasText(name)) {
            return;
        }

        if (matches(name, "部门")) {
            header.setDepartment(value);
        } else if (matches(name, "付款类型")) {
            header.setPaymentType(firstNonBlank(value, parseSelectLabel(extValue)));
        } else if (matches(name, "付款事由")) {
            header.setPaymentReason(value);
        } else if (matches(name, "总金额", "合计金额")) {
            applyTotalAmount(header, value, extValue);
        } else if (matches(name, "附件")) {
            header.setAttachmentInfo(parseAttachment(value));
        }
    }

    private void applyTotalAmount(FundUsageApplication header, String value, String extValue) {
        header.setTotalAmount(parseAmount(value));
        String upper = parseAmountUpper(extValue);
        if (StringUtils.hasText(upper)) {
            header.setTotalAmountUpper(upper);
        }
    }

    private List<FundUsageApplicationItem> parseTableRows(String stringValue, Object rawValue) {
        List<FundUsageApplicationItem> items = new ArrayList<>();
        JSONArray rows = toRowArray(stringValue, rawValue);
        if (rows == null || rows.isEmpty()) {
            return items;
        }

        for (int rowIndex = 0; rowIndex < rows.size(); rowIndex++) {
            Map<String, String> fieldMap = toFieldMap(rows.get(rowIndex));
            if (fieldMap.isEmpty()) {
                continue;
            }

            FundUsageApplicationItem item = new FundUsageApplicationItem();
            item.setRowIndex(rowIndex + 1);
            item.setPaymentType(firstValue(fieldMap, "付款类型"));
            item.setPaymentReason(firstValue(fieldMap, "付款事由"));
            item.setPaymentMethod(firstValue(fieldMap, "付款方式"));
            item.setAmount(parseAmount(firstValue(fieldMap, "金额（元）", "金额")));
            item.setPayeeName(firstValue(fieldMap, "收款单位"));
            item.setPayeeAccount(firstValue(fieldMap, "收款账号"));
            item.setBankName(firstValue(fieldMap, "开户行", "开户银行"));
            item.setBankCode(firstValue(fieldMap, "银行行号"));
            item.setRawRowJson(JSON.toJSONString(fieldMap));
            item.setCreatedAt(LocalDateTime.now());
            items.add(item);
        }
        return items;
    }

    private JSONArray toRowArray(String stringValue, Object rawValue) {
        if (rawValue instanceof JSONArray) {
            return (JSONArray) rawValue;
        }
        if (StringUtils.hasText(stringValue)) {
            try {
                return JSON.parseArray(stringValue);
            } catch (Exception ignored) {
                return null;
            }
        }
        return null;
    }

    private Map<String, String> toFieldMap(Object rowObj) {
        Map<String, String> fieldMap = new HashMap<>();
        if (rowObj instanceof JSONObject) {
            JSONObject row = (JSONObject) rowObj;
            if (row.containsKey("rowValue")) {
                JSONArray rowValue = row.getJSONArray("rowValue");
                if (rowValue != null) {
                    for (int i = 0; i < rowValue.size(); i++) {
                        JSONObject cell = rowValue.getJSONObject(i);
                        if (cell == null) {
                            continue;
                        }
                        putCell(fieldMap, cell.getString("label"), cell.get("value"));
                        putCell(fieldMap, cell.getString("key"), cell.get("value"));
                    }
                }
                return fieldMap;
            }
            for (String key : row.keySet()) {
                fieldMap.put(key, row.getString(key));
            }
            return fieldMap;
        }
        if (rowObj instanceof JSONArray) {
            JSONArray row = (JSONArray) rowObj;
            for (int i = 0; i < row.size(); i++) {
                JSONObject cell = row.getJSONObject(i);
                if (cell != null) {
                    putCell(fieldMap, cell.getString("name"), cell.get("value"));
                    putCell(fieldMap, cell.getString("label"), cell.get("value"));
                }
            }
        }
        return fieldMap;
    }

    private void putCell(Map<String, String> fieldMap, String key, Object value) {
        if (!StringUtils.hasText(key) || value == null) {
            return;
        }
        fieldMap.put(key, formatCellValue(value));
    }

    private String formatCellValue(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof String) {
            return (String) value;
        }
        if (value instanceof JSONArray) {
            JSONArray array = (JSONArray) value;
            return array.stream()
                    .map(element -> {
                        if (element instanceof JSONObject) {
                            JSONObject obj = (JSONObject) element;
                            return firstNonBlank(obj.getString("fileName"), obj.getString("name"), obj.toJSONString());
                        }
                        return String.valueOf(element);
                    })
                    .collect(Collectors.joining(", "));
        }
        if (value instanceof JSONObject) {
            return ((JSONObject) value).toJSONString();
        }
        return String.valueOf(value);
    }

    private String parseAttachment(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            JSONArray files = JSON.parseArray(value);
            if (files == null || files.isEmpty()) {
                return value;
            }
            return files.stream()
                    .map(file -> {
                        if (file instanceof JSONObject) {
                            return ((JSONObject) file).getString("fileName");
                        }
                        return String.valueOf(file);
                    })
                    .filter(StringUtils::hasText)
                    .collect(Collectors.joining(", "));
        } catch (Exception ignored) {
            return value;
        }
    }

    private String parseSelectLabel(String extValue) {
        if (!StringUtils.hasText(extValue)) {
            return null;
        }
        try {
            JSONObject ext = JSON.parseObject(extValue);
            if (ext != null) {
                return ext.getString("label");
            }
        } catch (Exception ignored) {
            // ignore
        }
        return null;
    }

    private String parseAmountUpper(String extValue) {
        if (!StringUtils.hasText(extValue)) {
            return null;
        }
        try {
            JSONObject ext = JSON.parseObject(extValue);
            if (ext != null) {
                return ext.getString("upper");
            }
        } catch (Exception ignored) {
            // ignore
        }
        return null;
    }

    private boolean isTableField(String componentType, String name) {
        if ("TableField".equalsIgnoreCase(componentType)) {
            return true;
        }
        return matches(name, "表格", "付款明细");
    }

    private boolean matches(String name, String... aliases) {
        if (!StringUtils.hasText(name)) {
            return false;
        }
        for (String alias : aliases) {
            if (name.equals(alias) || name.contains(alias)) {
                return true;
            }
        }
        return false;
    }

    private String firstValue(Map<String, String> fieldMap, String... aliases) {
        for (String alias : aliases) {
            for (Map.Entry<String, String> entry : fieldMap.entrySet()) {
                if (matches(entry.getKey(), alias) && StringUtils.hasText(entry.getValue())) {
                    return entry.getValue();
                }
            }
        }
        return null;
    }

    private BigDecimal parseAmount(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            String normalized = value.replace(",", "").replace("元", "").trim();
            return new BigDecimal(normalized);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String parseSubmitterName(String title) {
        if (!StringUtils.hasText(title) || !title.contains("提交")) {
            return null;
        }
        return title.substring(0, title.indexOf("提交")).trim();
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value;
            }
        }
        return null;
    }

    public static class ParsedApplication {
        private FundUsageApplication header;
        private List<FundUsageApplicationItem> items;

        public FundUsageApplication getHeader() {
            return header;
        }

        public void setHeader(FundUsageApplication header) {
            this.header = header;
        }

        public List<FundUsageApplicationItem> getItems() {
            return items;
        }

        public void setItems(List<FundUsageApplicationItem> items) {
            this.items = items;
        }
    }
}
