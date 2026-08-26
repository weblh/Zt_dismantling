package com.zuantan.dismantling.util;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

/**
 * 将简道云 widget_schema 转为自研表单 schema（fields 数组）。
 */
public final class JdySchemaConverter {

    private JdySchemaConverter() {
    }

    public static String toPlatformSchema(String widgetSchemaJson) {
        JSONObject root = new JSONObject();
        JSONArray fields = new JSONArray();
        if (widgetSchemaJson == null || widgetSchemaJson.trim().isEmpty()) {
            root.put("fields", fields);
            return root.toJSONString();
        }
        try {
            Object parsed = JSON.parse(widgetSchemaJson);
            JSONArray widgets = extractWidgets(parsed);
            for (int i = 0; i < widgets.size(); i++) {
                JSONObject w = widgets.getJSONObject(i);
                if (w == null) {
                    continue;
                }
                JSONObject field = convertWidget(w);
                if (field != null) {
                    fields.add(field);
                }
            }
        } catch (Exception e) {
            root.put("parseError", e.getMessage());
        }
        root.put("fields", fields);
        return root.toJSONString();
    }

    private static JSONArray extractWidgets(Object parsed) {
        if (parsed instanceof JSONArray) {
            return (JSONArray) parsed;
        }
        if (parsed instanceof JSONObject) {
            JSONObject obj = (JSONObject) parsed;
            if (obj.getJSONArray("widgets") != null) {
                return obj.getJSONArray("widgets");
            }
            if (obj.getJSONObject("widget") != null) {
                JSONArray arr = new JSONArray();
                // sometimes nested
            }
            // sys + biz widgets
            JSONArray merged = new JSONArray();
            if (obj.getJSONArray("sysWidgets") != null) {
                merged.addAll(obj.getJSONArray("sysWidgets"));
            }
            if (obj.getJSONArray("widgets") != null) {
                merged.addAll(obj.getJSONArray("widgets"));
            }
            if (!merged.isEmpty()) {
                return merged;
            }
        }
        return new JSONArray();
    }

    private static JSONObject convertWidget(JSONObject w) {
        String type = firstNonBlank(w.getString("type"), w.getString("widgetType"), w.getString("widgetName"));
        String name = firstNonBlank(w.getString("name"), w.getString("widgetName"), w.getString("label"));
        String label = firstNonBlank(w.getString("label"), w.getString("title"), name);
        if (name == null || name.isEmpty()) {
            return null;
        }
        // skip layout-only
        if ("divider".equalsIgnoreCase(type) || "separator".equalsIgnoreCase(type)) {
            return null;
        }
        JSONObject field = new JSONObject();
        field.put("key", name);
        field.put("label", label != null ? label : name);
        field.put("type", mapType(type));
        field.put("required", Boolean.TRUE.equals(w.getBoolean("required"))
                || "1".equals(String.valueOf(w.get("required"))));
        if (w.getJSONArray("items") != null) {
            field.put("options", w.getJSONArray("items"));
        } else if (w.getJSONArray("options") != null) {
            field.put("options", w.getJSONArray("options"));
        }
        if (w.getJSONArray("widgets") != null && ("subform".equalsIgnoreCase(type)
                || "table".equalsIgnoreCase(type))) {
            JSONArray sub = new JSONArray();
            JSONArray children = w.getJSONArray("widgets");
            for (int i = 0; i < children.size(); i++) {
                JSONObject c = convertWidget(children.getJSONObject(i));
                if (c != null) {
                    sub.add(c);
                }
            }
            field.put("children", sub);
            field.put("type", "subform");
        }
        field.put("sourceType", type);
        return field;
    }

    private static String mapType(String jdyType) {
        if (jdyType == null) {
            return "text";
        }
        String t = jdyType.toLowerCase();
        if (t.contains("number") || t.contains("numeric") || "integer".equals(t)) {
            return "number";
        }
        if (t.contains("date") || t.contains("time")) {
            return "date";
        }
        if (t.contains("textarea") || t.contains("textare")) {
            return "textarea";
        }
        if (t.contains("radio") || t.contains("combo") || t.contains("select") || t.contains("dropdown")) {
            return "select";
        }
        if (t.contains("checkbox") || t.contains("multi")) {
            return "multiselect";
        }
        if (t.contains("image") || t.contains("photo")) {
            return "image";
        }
        if (t.contains("upload") || t.contains("file") || t.contains("attachment")) {
            return "file";
        }
        if (t.contains("user") || t.contains("member")) {
            return "user";
        }
        if (t.contains("dept") || t.contains("department")) {
            return "dept";
        }
        if (t.contains("subform") || t.contains("table")) {
            return "subform";
        }
        if (t.contains("switch") || t.contains("boolean")) {
            return "switch";
        }
        return "text";
    }

    private static String firstNonBlank(String... vals) {
        if (vals == null) {
            return null;
        }
        for (String v : vals) {
            if (v != null && !v.trim().isEmpty()) {
                return v.trim();
            }
        }
        return null;
    }
}
