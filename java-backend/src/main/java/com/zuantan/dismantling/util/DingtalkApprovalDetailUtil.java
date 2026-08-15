package com.zuantan.dismantling.util;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import org.springframework.util.StringUtils;

public final class DingtalkApprovalDetailUtil {

    private DingtalkApprovalDetailUtil() {
    }

    public static String extractBusinessId(JSONObject detail) {
        if (detail == null) {
            return null;
        }

        String businessId = detail.getString("businessId");
        if (StringUtils.hasText(businessId)) {
            return businessId;
        }

        JSONObject formData = detail.getJSONObject("formData");
        if (formData != null) {
            JSONObject pmcField = formData.getJSONObject("pmc_business_id");
            if (pmcField != null && StringUtils.hasText(pmcField.getString("value"))) {
                return pmcField.getString("value");
            }
        }

        JSONArray formComponents = detail.getJSONArray("formComponentValues");
        if (formComponents != null) {
            for (int i = 0; i < formComponents.size(); i++) {
                JSONObject component = formComponents.getJSONObject(i);
                if (component == null) {
                    continue;
                }
                String id = component.getString("id");
                String bizAlias = component.getString("bizAlias");
                if ("pmc_business_id".equals(id) || "pmc_business_id".equals(bizAlias)) {
                    String value = component.getString("value");
                    if (StringUtils.hasText(value)) {
                        return value;
                    }
                }
            }
        }

        return null;
    }

    public static String resolveLabelFromSchema(String formSchema, String fieldId) {
        if (!StringUtils.hasText(formSchema) || !StringUtils.hasText(fieldId)) {
            return null;
        }
        try {
            JSONObject schema = JSONObject.parseObject(formSchema);
            return findLabelInSchemaItems(schema.getJSONArray("items"), fieldId);
        } catch (Exception ignored) {
            return null;
        }
    }

    public static String resolveBizAliasFromSchema(String formSchema, String fieldId) {
        if (!StringUtils.hasText(formSchema) || !StringUtils.hasText(fieldId)) {
            return null;
        }
        try {
            JSONObject schema = JSONObject.parseObject(formSchema);
            return findBizAliasInSchemaItems(schema.getJSONArray("items"), fieldId);
        } catch (Exception ignored) {
            return null;
        }
    }

    private static String findLabelInSchemaItems(JSONArray items, String fieldId) {
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
            String childLabel = findLabelInSchemaItems(item.getJSONArray("children"), fieldId);
            if (StringUtils.hasText(childLabel)) {
                return childLabel;
            }
        }
        return null;
    }

    private static String findBizAliasInSchemaItems(JSONArray items, String fieldId) {
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
                return props.getString("bizAlias");
            }
            String childBizAlias = findBizAliasInSchemaItems(item.getJSONArray("children"), fieldId);
            if (StringUtils.hasText(childBizAlias)) {
                return childBizAlias;
            }
        }
        return null;
    }
}
