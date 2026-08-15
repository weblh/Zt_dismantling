package com.zuantan.dismantling.util;

import com.alibaba.fastjson.JSONObject;
import org.springframework.util.StringUtils;

public final class DingtalkApprovalEventUtil {

    private DingtalkApprovalEventUtil() {
    }

    public static JSONObject normalizePayload(JSONObject raw) {
        if (raw == null) {
            return null;
        }

        JSONObject inner = raw.getJSONObject("data");
        if (inner != null && hasApprovalIdentity(inner)) {
            JSONObject merged = new JSONObject(inner);
            copyIfMissing(merged, raw, "eventId");
            copyIfMissing(merged, raw, "EventId");
            copyIfMissing(merged, raw, "eventType");
            copyIfMissing(merged, raw, "EventType");
            return merged;
        }

        return raw;
    }

    public static String getString(JSONObject json, String... keys) {
        if (json == null || keys == null) {
            return null;
        }
        for (String key : keys) {
            String value = json.getString(key);
            if (StringUtils.hasText(value)) {
                return value;
            }
        }
        return null;
    }

    public static boolean isFinishEvent(JSONObject eventJson) {
        return "finish".equalsIgnoreCase(getString(eventJson, "type", "Type"));
    }

    public static String extractProcessCode(JSONObject json) {
        if (json == null) {
            return null;
        }
        String processCode = getString(json, "processCode", "ProcessCode");
        if (StringUtils.hasText(processCode)) {
            return processCode;
        }
        JSONObject innerData = json.getJSONObject("data");
        if (innerData != null) {
            return getString(innerData, "processCode", "ProcessCode");
        }
        return null;
    }

    public static String extractProcessInstanceId(JSONObject json) {
        return getString(json, "processInstanceId", "ProcessInstanceId", "bizId", "BizId");
    }

    private static boolean hasApprovalIdentity(JSONObject json) {
        return StringUtils.hasText(extractProcessInstanceId(json))
                || StringUtils.hasText(extractProcessCode(json));
    }

    private static void copyIfMissing(JSONObject target, JSONObject source, String key) {
        if (!target.containsKey(key) || !StringUtils.hasText(target.getString(key))) {
            String value = source.getString(key);
            if (StringUtils.hasText(value)) {
                target.put(key, value);
            }
        }
    }
}
