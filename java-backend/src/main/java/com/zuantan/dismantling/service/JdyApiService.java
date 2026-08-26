package com.zuantan.dismantling.service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class JdyApiService {

    private static final Logger log = LoggerFactory.getLogger(JdyApiService.class);
    private static final MediaType JSON_TYPE = MediaType.parse("application/json; charset=utf-8");

    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .build();

    @Value("${jiandaoyun.api-key:}")
    private String defaultApiKey;

    @Value("${jiandaoyun.app-id:}")
    private String defaultAppId;

    @Value("${jiandaoyun.base-url:https://api.jiandaoyun.com/api/v5}")
    private String baseUrl;

    private volatile String runtimeApiKey;
    private volatile String runtimeAppId;

    public void updateCredentials(String apiKey, String appId) {
        if (StringUtils.hasText(apiKey)) {
            this.runtimeApiKey = apiKey.trim();
        }
        if (StringUtils.hasText(appId)) {
            this.runtimeAppId = appId.trim();
        }
    }

    public String getEffectiveApiKey() {
        return StringUtils.hasText(runtimeApiKey) ? runtimeApiKey : defaultApiKey;
    }

    public String getEffectiveAppId() {
        return StringUtils.hasText(runtimeAppId) ? runtimeAppId : defaultAppId;
    }

    public boolean isConfigured() {
        return StringUtils.hasText(getEffectiveApiKey()) && StringUtils.hasText(getEffectiveAppId());
    }

    public List<JSONObject> listAllForms(String appId) throws IOException {
        List<JSONObject> all = new ArrayList<>();
        int skip = 0;
        int limit = 100;
        while (true) {
            JSONObject body = new JSONObject();
            body.put("app_id", appId);
            body.put("limit", limit);
            body.put("skip", skip);
            JSONObject resp = post("/app/entry/list", body);
            JSONArray forms = resp.getJSONArray("forms");
            if (forms == null || forms.isEmpty()) {
                break;
            }
            for (int i = 0; i < forms.size(); i++) {
                all.add(forms.getJSONObject(i));
            }
            if (forms.size() < limit) {
                break;
            }
            skip += forms.size();
        }
        return all;
    }

    public List<JSONObject> listAllFormData(String appId, String entryId) throws IOException {
        List<JSONObject> all = new ArrayList<>();
        String dataId = null;
        int limit = 100;
        while (true) {
            JSONObject body = new JSONObject();
            body.put("app_id", appId);
            body.put("entry_id", entryId);
            body.put("limit", limit);
            if (StringUtils.hasText(dataId)) {
                body.put("data_id", dataId);
            }
            JSONObject resp = post("/app/entry/data/list", body);
            JSONArray data = resp.getJSONArray("data");
            if (data == null || data.isEmpty()) {
                break;
            }
            for (int i = 0; i < data.size(); i++) {
                all.add(data.getJSONObject(i));
            }
            JSONObject last = data.getJSONObject(data.size() - 1);
            dataId = last.getString("_id");
            if (!StringUtils.hasText(dataId) || data.size() < limit) {
                break;
            }
        }
        return all;
    }

    public JSONObject getWidgetSchema(String appId, String entryId) throws IOException {
        JSONObject body = new JSONObject();
        body.put("app_id", appId);
        body.put("entry_id", entryId);
        return post("/app/entry/widget/list", body);
    }

    private JSONObject post(String path, JSONObject body) throws IOException {
        String apiKey = getEffectiveApiKey();
        if (!StringUtils.hasText(apiKey)) {
            throw new IOException("简道云 API Key 未配置。请到简道云开放平台「密钥管理」创建 API Key（不是企业信息里的 API Token）");
        }
        String url = trimSlash(baseUrl) + path;
        Request request = new Request.Builder()
                .url(url)
                .addHeader("Authorization", "Bearer " + apiKey)
                .addHeader("Content-Type", "application/json")
                .post(RequestBody.create(body.toJSONString(), JSON_TYPE))
                .build();
        try (Response response = httpClient.newCall(request).execute()) {
            String respBody = response.body() != null ? response.body().string() : "";
            if (!response.isSuccessful()) {
                log.warn("简道云 API 失败: path={}, http={}, body={}", path, response.code(), respBody);
                String msg = parseErrorMessage(respBody);
                throw new IOException("简道云 API 调用失败: " + msg);
            }
            if (!StringUtils.hasText(respBody)) {
                return new JSONObject();
            }
            return JSON.parseObject(respBody);
        }
    }

    private String parseErrorMessage(String respBody) {
        try {
            JSONObject err = JSON.parseObject(respBody);
            if (err != null) {
                Integer code = err.getInteger("code");
                String msg = err.getString("msg");
                if (code != null && code == 17018) {
                    return "API Key 无效(17018)。请使用开放平台「密钥管理」创建的 API Key，而不是企业页的 API Token";
                }
                if (StringUtils.hasText(msg)) {
                    return "code=" + code + ", " + msg;
                }
            }
        } catch (Exception ignored) {
            // ignore
        }
        return respBody;
    }

    private String trimSlash(String url) {
        if (url == null) {
            return "";
        }
        if (url.endsWith("/")) {
            return url.substring(0, url.length() - 1);
        }
        return url;
    }
}
