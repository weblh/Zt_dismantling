package com.zuantan.dismantling.util;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * 钉钉审批详情入库前瘦身：去掉缩略图/二进制等大字段，附件只保留可下载所需元数据，
 * 避免 UPDATE 包体超过 MySQL max_allowed_packet。
 */
public final class DingtalkApprovalPayloadSanitizer {

    private static final int MAX_LEAF_STRING_CHARS = 32_768;

    private static final Set<String> DROP_KEYS = new HashSet<String>(Arrays.asList(
            "thumbnail", "thumbUrl", "thumb", "fileContent", "contentBytes",
            "base64", "imageData", "photoBytes", "previewData", "dataUrl"
    ));

    private static final Set<String> ATTACHMENT_META_KEYS = new HashSet<String>(Arrays.asList(
            "fileId", "spaceId", "fileName", "name", "fileType", "fileSize", "fileIdStr"
    ));

    private DingtalkApprovalPayloadSanitizer() {
    }

    public static JSONObject sanitizeDetail(JSONObject detail) {
        if (detail == null) {
            return null;
        }
        Object sanitized = sanitizeValue(detail);
        return sanitized instanceof JSONObject ? (JSONObject) sanitized : detail;
    }

    /**
     * raw_detail 不再重复存 formComponentValues（已写入 form_components 列），进一步减半包体。
     */
    public static JSONObject forRawDetailStorage(JSONObject sanitizedDetail) {
        if (sanitizedDetail == null) {
            return null;
        }
        JSONObject copy = copyObject(sanitizedDetail);
        copy.remove("formComponentValues");
        copy.remove("form_component_values");
        copy.remove("formValueVOS");
        return copy;
    }

    /**
     * 去掉历史错误写入的 rawEventBackup 嵌套，避免 raw_event 在多次 refresh 后膨胀到数十 MB。
     */
    public static String sanitizeRawEvent(String rawEvent) {
        if (!StringUtils.hasText(rawEvent)) {
            return rawEvent;
        }
        if (!rawEvent.contains("rawEventBackup") && rawEvent.length() <= MAX_LEAF_STRING_CHARS) {
            return rawEvent;
        }
        try {
            JSONObject obj = JSON.parseObject(rawEvent);
            if (obj == null) {
                return truncateLeaf(rawEvent);
            }
            obj.remove("rawEventBackup");
            for (String key : new ArrayList<String>(obj.keySet())) {
                Object value = obj.get(key);
                if (value instanceof String && ((String) value).length() > MAX_LEAF_STRING_CHARS) {
                    obj.put(key, truncateLeaf((String) value));
                }
            }
            return obj.toJSONString();
        } catch (Exception ignored) {
            return truncateLeaf(rawEvent);
        }
    }

    private static String truncateLeaf(String value) {
        if (value == null || value.length() <= MAX_LEAF_STRING_CHARS) {
            return value;
        }
        return value.substring(0, MAX_LEAF_STRING_CHARS) + "...[truncated]";
    }

    private static Object sanitizeValue(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof JSONObject) {
            return sanitizeObject((JSONObject) value);
        }
        if (value instanceof JSONArray) {
            return sanitizeArray((JSONArray) value);
        }
        if (value instanceof String) {
            return sanitizeString((String) value);
        }
        if (value instanceof Map) {
            return sanitizeObject(new JSONObject((Map<String, Object>) value));
        }
        return value;
    }

    private static JSONObject sanitizeObject(JSONObject source) {
        if (isAttachmentObject(source)) {
            return slimAttachment(source);
        }
        JSONObject target = new JSONObject(true);
        for (String key : source.keySet()) {
            if (!StringUtils.hasText(key) || DROP_KEYS.contains(key)) {
                continue;
            }
            target.put(key, sanitizeValue(source.get(key)));
        }
        return target;
    }

    private static JSONArray sanitizeArray(JSONArray source) {
        JSONArray target = new JSONArray();
        for (int i = 0; i < source.size(); i++) {
            target.add(sanitizeValue(source.get(i)));
        }
        return target;
    }

    private static Object sanitizeString(String value) {
        if (!StringUtils.hasText(value)) {
            return value;
        }
        String trimmed = value.trim();
        if ((trimmed.startsWith("{") && trimmed.endsWith("}"))
                || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
            try {
                Object parsed = JSON.parse(trimmed);
                Object sanitized = sanitizeValue(parsed);
                return sanitized == null ? value : JSON.toJSONString(sanitized);
            } catch (Exception ignored) {
                // fall through to length truncate
            }
        }
        if (value.length() > MAX_LEAF_STRING_CHARS) {
            return value.substring(0, MAX_LEAF_STRING_CHARS) + "...[truncated]";
        }
        return value;
    }

    private static boolean isAttachmentObject(JSONObject obj) {
        if (obj == null) {
            return false;
        }
        String fileId = firstNonBlank(obj.getString("fileId"), obj.getString("fileIdStr"));
        if (!StringUtils.hasText(fileId)) {
            return false;
        }
        return obj.containsKey("fileName")
                || obj.containsKey("name")
                || obj.containsKey("spaceId")
                || obj.containsKey("fileSize")
                || obj.containsKey("fileType")
                || obj.containsKey("thumbnail")
                || obj.containsKey("url");
    }

    private static JSONObject slimAttachment(JSONObject source) {
        JSONObject slim = new JSONObject(true);
        for (String key : ATTACHMENT_META_KEYS) {
            Object value = source.get(key);
            if (value != null) {
                slim.put(key, value);
            }
        }
        if (!slim.containsKey("fileName") && slim.containsKey("name")) {
            slim.put("fileName", slim.get("name"));
        }
        return slim;
    }

    private static JSONObject copyObject(JSONObject source) {
        JSONObject copy = new JSONObject(true);
        for (String key : source.keySet()) {
            copy.put(key, source.get(key));
        }
        return copy;
    }

    private static String firstNonBlank(String... values) {
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
}
