package com.zuantan.dismantling.dto;

public class JdyStatusResponse {

    private boolean configured;
    private String appId;
    private String corpId;
    private String agentId;
    private String apiKeyMasked;
    private boolean scheduledEnabled;
    private long formCount;
    private long dataCount;
    private String message;

    public boolean isConfigured() {
        return configured;
    }

    public void setConfigured(boolean configured) {
        this.configured = configured;
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

    public String getApiKeyMasked() {
        return apiKeyMasked;
    }

    public void setApiKeyMasked(String apiKeyMasked) {
        this.apiKeyMasked = apiKeyMasked;
    }

    public boolean isScheduledEnabled() {
        return scheduledEnabled;
    }

    public void setScheduledEnabled(boolean scheduledEnabled) {
        this.scheduledEnabled = scheduledEnabled;
    }

    public long getFormCount() {
        return formCount;
    }

    public void setFormCount(long formCount) {
        this.formCount = formCount;
    }

    public long getDataCount() {
        return dataCount;
    }

    public void setDataCount(long dataCount) {
        this.dataCount = dataCount;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
