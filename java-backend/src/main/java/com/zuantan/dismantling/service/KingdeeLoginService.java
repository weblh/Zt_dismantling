package com.zuantan.dismantling.service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@Service
public class KingdeeLoginService {

    private static final MediaType JSON_TYPE = MediaType.parse("application/json; charset=utf-8");

    public String login(String kingdeeUrl, String dbId, String username, String password) throws IOException {
        String loginUrl = kingdeeUrl + "Kingdee.BOS.WebApi.ServicesStub.AuthService.ValidateUser.common.kdsvc";

        JSONObject requestBody = new JSONObject();
        requestBody.put("acctId", dbId);
        requestBody.put("userName", username);
        requestBody.put("password", password);
        requestBody.put("lcid", "2052");

        OkHttpClient client = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .build();

        Request request = new Request.Builder()
                .url(loginUrl)
                .post(RequestBody.create(requestBody.toJSONString(), JSON_TYPE))
                .addHeader("Content-Type", "application/json; charset=utf-8")
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("登录请求失败: " + response);
            }

            String responseBody = response.body().string();
            JSONObject jsonResult = JSON.parseObject(responseBody);

            int loginResultType = jsonResult.getIntValue("LoginResultType");
            if (loginResultType == 1) {
                return jsonResult.getString("KDSVCSessionId");
            }
            String message = jsonResult.getString("Message");
            throw new IOException("登录失败: " + message + ", 错误码: " + loginResultType);
        }
    }
}
