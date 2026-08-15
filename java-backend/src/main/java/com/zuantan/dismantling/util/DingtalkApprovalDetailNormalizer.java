package com.zuantan.dismantling.util;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import org.springframework.util.StringUtils;

public final class DingtalkApprovalDetailNormalizer {

    private DingtalkApprovalDetailNormalizer() {
    }

    public static JSONObject normalize(JSONObject raw) {
        if (raw == null) {
            return null;
        }

        JSONObject detail = raw.containsKey("result") ? raw.getJSONObject("result") : raw;
        if (detail == null) {
            return raw;
        }

        detail = unwrapDataLayer(detail);

        JSONArray components = firstArray(detail,
                "formComponentValues", "form_component_values", "formValueVOS");
        if (components != null) {
            detail.put("formComponentValues", normalizeFormComponents(components));
        }

        copyIfMissing(detail, "processCode", firstString(detail, "processCode", "process_code"));
        copyIfMissing(detail, "businessId", firstString(detail, "businessId", "business_id"));
        copyIfMissing(detail, "originatorUserId", firstString(detail, "originatorUserId", "originator_userid"));
        copyIfMissing(detail, "originatorDeptName", firstString(detail, "originatorDeptName", "originator_dept_name"));
        copyIfMissing(detail, "title", detail.getString("title"));
        copyIfMissing(detail, "result", detail.getString("result"));
        copyIfMissing(detail, "createTime", firstString(detail, "createTime", "create_time"));
        copyIfMissing(detail, "finishTime", firstString(detail, "finishTime", "finish_time"));

        return detail;
    }

    public static boolean hasFormComponents(JSONObject detail) {
        if (detail == null) {
            return false;
        }
        JSONArray components = detail.getJSONArray("formComponentValues");
        return components != null && !components.isEmpty();
    }

    private static JSONArray normalizeFormComponents(JSONArray components) {
        JSONArray normalized = new JSONArray();
        for (int i = 0; i < components.size(); i++) {
            JSONObject component = components.getJSONObject(i);
            if (component == null) {
                continue;
            }
            JSONObject copy = new JSONObject(component);
            copyIfMissing(copy, "componentType",
                    firstString(component, "componentType", "component_type"));
            copyIfMissing(copy, "bizAlias",
                    firstString(component, "bizAlias", "biz_alias"));
            copyIfMissing(copy, "extValue",
                    firstString(component, "extValue", "ext_value"));
            normalized.add(copy);
        }
        return normalized;
    }

    private static JSONArray firstArray(JSONObject json, String... keys) {
        for (String key : keys) {
            JSONArray array = json.getJSONArray(key);
            if (array != null && !array.isEmpty()) {
                return array;
            }
        }
        return null;
    }

    private static String firstString(JSONObject json, String... keys) {
        for (String key : keys) {
            String value = json.getString(key);
            if (StringUtils.hasText(value)) {
                return value;
            }
        }
        return null;
    }

    private static void copyIfMissing(JSONObject target, String key, String value) {
        if (StringUtils.hasText(value) && !StringUtils.hasText(target.getString(key))) {
            target.put(key, value);
        }
    }

    private static JSONObject unwrapDataLayer(JSONObject detail) {
        JSONObject data = detail.getJSONObject("data");
        if (data == null || !data.containsKey("formData")) {
            return detail;
        }
        JSONObject merged = new JSONObject(data);
        for (String key : detail.keySet()) {
            if (!merged.containsKey(key) || merged.get(key) == null) {
                merged.put(key, detail.get(key));
            }
        }
        return merged;
    }
}
