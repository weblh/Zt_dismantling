package com.zuantan.dismantling.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 腾讯云 COS 配置。SecretId / SecretKey 仅通过环境变量或 application-local.yml 注入，禁止写入可提交配置。
 */
@Component
@ConfigurationProperties(prefix = "cos")
public class CosProperties {

    /** 例如 https://hcr-1300429327.cos.ap-beijing.myqcloud.com */
    private String baseUrl = "https://hcr-1300429327.cos.ap-beijing.myqcloud.com";

    private String region = "ap-beijing";

    private String bucket = "hcr-1300429327";

    /** 仅服务端使用，切勿下发前端 */
    private String secretId = "";

    /** 仅服务端使用，切勿下发前端 */
    private String secretKey = "";

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getBucket() {
        return bucket;
    }

    public void setBucket(String bucket) {
        this.bucket = bucket;
    }

    public String getSecretId() {
        return secretId;
    }

    public void setSecretId(String secretId) {
        this.secretId = secretId;
    }

    public String getSecretKey() {
        return secretKey;
    }

    public void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
    }

    /** 去掉末尾斜杠后的根地址 */
    public String normalizedBaseUrl() {
        if (baseUrl == null || baseUrl.trim().isEmpty()) {
            return "";
        }
        String url = baseUrl.trim();
        while (url.endsWith("/")) {
            url = url.substring(0, url.length() - 1);
        }
        return url;
    }

    public boolean isCredentialConfigured() {
        return StringUtils.hasText(secretId) && StringUtils.hasText(secretKey);
    }
}
