package com.zuantan.dismantling.service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.zuantan.dismantling.util.DingtalkApprovalDetailNormalizer;
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
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;

@Service
public class DingtalkApiService {

    private static final Logger log = LoggerFactory.getLogger(DingtalkApiService.class);
    private static final MediaType JSON_TYPE = MediaType.parse("application/json; charset=utf-8");
    private static final String ACCESS_TOKEN_URL = "https://api.dingtalk.com/v1.0/oauth2/accessToken";
    private static final String PROCESS_INSTANCE_URL = "https://api.dingtalk.com/v1.0/workflow/processInstances";
    private static final String ATTACHMENT_DOWNLOAD_URL = "https://api.dingtalk.com/v1.0/workflow/processInstances/spaces/files/urls/download";
    private static final String LEGACY_PROCESS_INSTANCE_URL = "https://oapi.dingtalk.com/topapi/processinstance/get";

    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build();

    @Value("${dingtalk.stream.client-id:}")
    private String defaultClientId;

    @Value("${dingtalk.stream.client-secret:}")
    private String defaultClientSecret;

    private volatile String runtimeClientId;
    private volatile String runtimeClientSecret;
    private volatile String cachedAccessToken;
    private volatile long tokenExpireAtMs;

    public void updateCredentials(String clientId, String clientSecret) {
        this.runtimeClientId = clientId;
        this.runtimeClientSecret = clientSecret;
        this.cachedAccessToken = null;
        this.tokenExpireAtMs = 0;
    }

    public JSONObject getProcessInstanceDetail(String processInstanceId) throws IOException {
        JSONObject detail = fetchProcessInstanceDetail(processInstanceId);
        if (!DingtalkApprovalDetailNormalizer.hasFormComponents(detail)) {
            log.warn("审批详情未返回表单字段, 尝试 legacy API: processInstanceId={}", processInstanceId);
            JSONObject legacyDetail = fetchLegacyProcessInstanceDetail(processInstanceId);
            if (DingtalkApprovalDetailNormalizer.hasFormComponents(legacyDetail)) {
                return legacyDetail;
            }
            if (detail == null) {
                return legacyDetail;
            }
        }
        return detail;
    }

    public String getApprovalAttachmentDownloadUrl(String processInstanceId, String fileId) throws IOException {
        if (!StringUtils.hasText(processInstanceId) || !StringUtils.hasText(fileId)) {
            throw new IOException("processInstanceId 或 fileId 为空");
        }

        String accessToken = getAccessToken();
        JSONObject requestBody = new JSONObject();
        requestBody.put("processInstanceId", processInstanceId);
        requestBody.put("fileId", fileId);
        requestBody.put("withCommentAttatchment", false);

        Request request = new Request.Builder()
                .url(ATTACHMENT_DOWNLOAD_URL)
                .post(RequestBody.create(requestBody.toJSONString(), JSON_TYPE))
                .addHeader("x-acs-dingtalk-access-token", accessToken)
                .addHeader("Content-Type", "application/json")
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            String body = response.body() != null ? response.body().string() : "";
            if (!response.isSuccessful()) {
                throw new IOException("获取审批附件下载地址失败, http=" + response.code() + ", body=" + body);
            }

            JSONObject json = JSON.parseObject(body);
            if (json == null) {
                throw new IOException("获取审批附件下载地址失败: 响应为空");
            }

            JSONObject result = json.getJSONObject("result");
            if (result == null) {
                result = json;
            }

            String downloadUri = result.getString("downloadUri");
            if (!StringUtils.hasText(downloadUri)) {
                throw new IOException("获取审批附件下载地址失败: downloadUri 为空, body=" + body);
            }
            return downloadUri;
        }
    }

    public byte[] downloadFile(String downloadUrl) throws IOException {
        Request request = new Request.Builder()
                .url(downloadUrl)
                .get()
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful() || response.body() == null) {
                throw new IOException("下载附件失败, http=" + response.code());
            }
            return response.body().bytes();
        }
    }

    private JSONObject fetchProcessInstanceDetail(String processInstanceId) throws IOException {
        String accessToken = getAccessToken();
        String encodedId = URLEncoder.encode(processInstanceId, StandardCharsets.UTF_8.name());
        String url = PROCESS_INSTANCE_URL
                + "?processInstanceId=" + encodedId
                + "&includeFormComponentValues=true";

        Request request = new Request.Builder()
                .url(url)
                .get()
                .addHeader("x-acs-dingtalk-access-token", accessToken)
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            String body = response.body() != null ? response.body().string() : "";
            if (!response.isSuccessful()) {
                throw new IOException("获取审批实例详情失败, http=" + response.code() + ", body=" + body);
            }

            JSONObject json = JSON.parseObject(body);
            if (json == null) {
                throw new IOException("获取审批实例详情失败: 响应为空");
            }

            return DingtalkApprovalDetailNormalizer.normalize(json);
        }
    }

    private JSONObject fetchLegacyProcessInstanceDetail(String processInstanceId) throws IOException {
        String accessToken = getAccessToken();
        JSONObject requestBody = new JSONObject();
        requestBody.put("process_instance_id", processInstanceId);

        Request request = new Request.Builder()
                .url(LEGACY_PROCESS_INSTANCE_URL + "?access_token=" + URLEncoder.encode(accessToken, StandardCharsets.UTF_8.name()))
                .post(RequestBody.create(requestBody.toJSONString(), JSON_TYPE))
                .addHeader("Content-Type", "application/json")
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            String body = response.body() != null ? response.body().string() : "";
            if (!response.isSuccessful()) {
                log.warn("legacy 审批详情 API 失败, http={}, body={}", response.code(), body);
                return null;
            }

            JSONObject json = JSON.parseObject(body);
            if (json == null) {
                return null;
            }
            Integer errcode = json.getInteger("errcode");
            if (errcode != null && errcode != 0) {
                log.warn("legacy 审批详情 API 返回错误: {}", body);
                return null;
            }

            JSONObject processInstance = json.getJSONObject("process_instance");
            if (processInstance == null) {
                return null;
            }
            return DingtalkApprovalDetailNormalizer.normalize(processInstance);
        }
    }

    private synchronized String getAccessToken() throws IOException {
        long now = System.currentTimeMillis();
        if (StringUtils.hasText(cachedAccessToken) && now < tokenExpireAtMs - 60_000) {
            return cachedAccessToken;
        }

        String clientId = StringUtils.hasText(runtimeClientId) ? runtimeClientId : defaultClientId;
        String clientSecret = StringUtils.hasText(runtimeClientSecret) ? runtimeClientSecret : defaultClientSecret;
        if (!StringUtils.hasText(clientId) || !StringUtils.hasText(clientSecret)) {
            throw new IOException("钉钉 Client ID / Client Secret 未配置");
        }

        JSONObject requestBody = new JSONObject();
        requestBody.put("appKey", clientId);
        requestBody.put("appSecret", clientSecret);

        Request request = new Request.Builder()
                .url(ACCESS_TOKEN_URL)
                .post(RequestBody.create(requestBody.toJSONString(), JSON_TYPE))
                .addHeader("Content-Type", "application/json")
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            String body = response.body() != null ? response.body().string() : "";
            if (!response.isSuccessful()) {
                throw new IOException("获取 access_token 失败, http=" + response.code() + ", body=" + body);
            }

            JSONObject json = JSON.parseObject(body);
            String accessToken = json.getString("accessToken");
            if (!StringUtils.hasText(accessToken)) {
                throw new IOException("获取 access_token 失败: " + body);
            }

            long expireInSeconds = json.getLongValue("expireIn");
            if (expireInSeconds <= 0) {
                expireInSeconds = 7200;
            }

            cachedAccessToken = accessToken;
            tokenExpireAtMs = now + expireInSeconds * 1000;
            log.debug("钉钉 access_token 已刷新");
            return accessToken;
        }
    }
}
