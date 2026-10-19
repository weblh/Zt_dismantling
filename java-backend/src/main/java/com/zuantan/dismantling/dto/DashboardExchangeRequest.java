package com.zuantan.dismantling.dto;

public class DashboardExchangeRequest {

    /** 门户服务端传入，与 hub.dashboard.exchange-secret 一致 */
    private String hubSecret;

    /** 可选备用 */
    private String hubToken;

    /** 旧字段，新方案不再作为通过条件 */
    private String fengchiToken;

    private String client;

    public String getHubSecret() {
        return hubSecret;
    }

    public void setHubSecret(String hubSecret) {
        this.hubSecret = hubSecret;
    }

    public String getHubToken() {
        return hubToken;
    }

    public void setHubToken(String hubToken) {
        this.hubToken = hubToken;
    }

    public String getFengchiToken() {
        return fengchiToken;
    }

    public void setFengchiToken(String fengchiToken) {
        this.fengchiToken = fengchiToken;
    }

    public String getClient() {
        return client;
    }

    public void setClient(String client) {
        this.client = client;
    }
}
