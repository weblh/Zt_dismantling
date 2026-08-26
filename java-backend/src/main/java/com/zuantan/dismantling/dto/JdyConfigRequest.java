package com.zuantan.dismantling.dto;

import javax.validation.constraints.NotBlank;

public class JdyConfigRequest {

    @NotBlank(message = "API Key 不能为空")
    private String apiKey;

    private String appId;
    private String corpId;
    private String agentId;
    private Boolean scheduledEnabled;

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getAppId() {
        return appId;
    }

    public void setAppId(String appId) {
        this.appId = appId;
    }

    public String getCorpId() {
        return corpId;
    }

    public void setCorpId(String corpId) {
        this.corpId = corpId;
    }

    public String getAgentId() {
        return agentId;
    }

    public void setAgentId(String agentId) {
        this.agentId = agentId;
    }

    public Boolean getScheduledEnabled() {
        return scheduledEnabled;
    }

    public void setScheduledEnabled(Boolean scheduledEnabled) {
        this.scheduledEnabled = scheduledEnabled;
    }
}
