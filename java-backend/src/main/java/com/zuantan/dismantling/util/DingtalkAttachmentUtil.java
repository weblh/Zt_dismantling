package com.zuantan.dismantling.util;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.zuantan.dismantling.vo.AttachmentFileVO;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public final class DingtalkAttachmentUtil {

    private static final Set<String> PREVIEWABLE_TYPES = new HashSet<>();

    static {
        PREVIEWABLE_TYPES.add("jpg");
        PREVIEWABLE_TYPES.add("jpeg");
        PREVIEWABLE_TYPES.add("png");
        PREVIEWABLE_TYPES.add("gif");
        PREVIEWABLE_TYPES.add("webp");
        PREVIEWABLE_TYPES.add("bmp");
        PREVIEWABLE_TYPES.add("pdf");
    }

    private DingtalkAttachmentUtil() {
    }

    public static JSONArray extractAttachments(Object rowObj) {
        JSONArray attachments = new JSONArray();
        Set<String> seenFileIds = new HashSet<>();
        collectAttachmentsFromRow(rowObj, attachments, seenFileIds);
        return attachments;
    }

    public static String toAttachmentFilesJson(Object rowObj) {
        JSONArray attachments = extractAttachments(rowObj);
        if (attachments.isEmpty()) {
            return null;
        }
        return attachments.toJSONString();
    }

    public static List<AttachmentFileVO> parseAttachmentFiles(String attachmentFilesJson) {
        List<AttachmentFileVO> files = new ArrayList<>();
        Set<String> seenFileIds = new HashSet<>();
        if (!StringUtils.hasText(attachmentFilesJson)) {
            return files;
        }
        try {
            JSONArray array = JSON.parseArray(attachmentFilesJson);
            if (array == null) {
                return files;
            }
            for (int i = 0; i < array.size(); i++) {
                JSONObject obj = array.getJSONObject(i);
                if (obj == null) {
                    continue;
                }
                String fileId = obj.getString("fileId");
                if (!StringUtils.hasText(fileId) || !seenFileIds.add(fileId)) {
                    continue;
                }
                AttachmentFileVO file = new AttachmentFileVO();
                file.setFileId(fileId);
                file.setSpaceId(obj.getString("spaceId"));
                file.setFileName(cleanFileName(obj.getString("fileName")));
                file.setFileType(normalizeFileType(obj.getString("fileType"), file.getFileName()));
                file.setFileSize(obj.getLong("fileSize"));
                file.setPreviewable(isPreviewable(file.getFileType(), file.getFileName()));
                files.add(file);
            }
        } catch (Exception ignored) {
            // ignore malformed json
        }
        return files;
    }

    public static String formatAttachmentNames(JSONArray array) {
        if (array == null || array.isEmpty()) {
            return null;
        }
        List<String> names = new ArrayList<>();
        Set<String> seenFileIds = new HashSet<>();
        for (int i = 0; i < array.size(); i++) {
            JSONObject obj = array.getJSONObject(i);
            if (obj == null) {
                continue;
            }
            String fileId = obj.getString("fileId");
            if (StringUtils.hasText(fileId) && !seenFileIds.add(fileId)) {
                continue;
            }
            String name = cleanFileName(firstNonBlank(obj.getString("fileName"), obj.getString("name")));
            if (StringUtils.hasText(name)) {
                names.add(name);
            }
        }
        return names.isEmpty() ? null : String.join(", ", names);
    }

    public static boolean isPreviewable(String fileType, String fileName) {
        String normalized = normalizeFileType(fileType, fileName);
        return StringUtils.hasText(normalized) && PREVIEWABLE_TYPES.contains(normalized);
    }

    public static String resolveContentType(String fileType, String fileName) {
        String normalized = normalizeFileType(fileType, fileName);
        if (!StringUtils.hasText(normalized)) {
            return "application/octet-stream";
        }
        switch (normalized) {
            case "jpg":
            case "jpeg":
                return "image/jpeg";
            case "png":
                return "image/png";
            case "gif":
                return "image/gif";
            case "webp":
                return "image/webp";
            case "bmp":
                return "image/bmp";
            case "pdf":
                return "application/pdf";
            default:
                return "application/octet-stream";
        }
    }

    public static String cleanFileName(String fileName) {
        if (!StringUtils.hasText(fileName)) {
            return fileName;
        }
        return fileName.replaceAll("_\\d*_\\[B@[0-9a-fA-F]+", "")
                .replaceAll("\\[B@[0-9a-fA-F]+", "");
    }

    private static void collectAttachmentsFromRow(Object rowObj, JSONArray attachments, Set<String> seenFileIds) {
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
                        appendAttachmentCellOnce(attachments, seenFileIds, cell);
                    }
                }
            }
        }
    }

    private static void appendAttachmentCellOnce(JSONArray attachments, Set<String> seenFileIds, JSONObject cell) {
        Object value = cell.get("value");
        if (value == null) {
            return;
        }
        String bizAlias = cell.getString("bizAlias");
        String key = cell.getString("key");
        String label = cell.getString("label");
        if (isAttachmentKey(bizAlias) || isAttachmentKey(key) || isAttachmentKey(label)) {
            appendAttachmentValue(attachments, seenFileIds, value);
        }
    }

    private static void appendAttachmentValue(JSONArray attachments, Set<String> seenFileIds, Object value) {
        if (value instanceof JSONArray) {
            appendAttachmentArray(attachments, seenFileIds, (JSONArray) value);
        } else if (value instanceof String && ((String) value).trim().startsWith("[")) {
            try {
                appendAttachmentArray(attachments, seenFileIds, JSON.parseArray((String) value));
            } catch (Exception ignored) {
                // ignore malformed attachment json
            }
        }
    }

    private static boolean isAttachmentKey(String key) {
        return key.contains("Attachment")
                || "reimbursementAttachement".equals(key)
                || "附件".equals(key);
    }

    private static void appendAttachmentArray(JSONArray target, Set<String> seenFileIds, JSONArray source) {
        if (source == null) {
            return;
        }
        for (int i = 0; i < source.size(); i++) {
            Object element = source.get(i);
            if (!(element instanceof JSONObject)) {
                continue;
            }
            JSONObject file = (JSONObject) element;
            String fileId = file.getString("fileId");
            if (!StringUtils.hasText(fileId) || !seenFileIds.add(fileId)) {
                continue;
            }
            JSONObject copy = new JSONObject();
            copy.put("fileId", fileId);
            copy.put("spaceId", file.getString("spaceId"));
            copy.put("fileName", cleanFileName(firstNonBlank(file.getString("fileName"), file.getString("name"))));
            copy.put("fileType", file.getString("fileType"));
            copy.put("fileSize", file.getLong("fileSize"));
            target.add(copy);
        }
    }

    private static String normalizeFileType(String fileType, String fileName) {
        if (StringUtils.hasText(fileType)) {
            return fileType.toLowerCase(Locale.ROOT).replace(".", "");
        }
        if (!StringUtils.hasText(fileName) || !fileName.contains(".")) {
            return null;
        }
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
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
