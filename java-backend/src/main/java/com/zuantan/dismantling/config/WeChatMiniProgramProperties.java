package com.zuantan.dismantling.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "wechat.mini-program")
public class WeChatMiniProgramProperties {

    private String appId = "";
    private String appSecret = "";

    public String getAppId() {
        return appId;
    }

    public void setAppId(String appId) {
        this.appId = appId;
    }

    public String getAppSecret() {
        return appSecret;
    }

    public void setAppSecret(String appSecret) {
        this.appSecret = appSecret;
    }

    public boolean isConfigured() {
        return appId != null && !appId.trim().isEmpty()
                && appSecret != null && !appSecret.trim().isEmpty();
    }
}
