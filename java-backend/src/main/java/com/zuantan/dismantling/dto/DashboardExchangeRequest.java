package com.zuantan.dismantling.dto;

import javax.validation.constraints.NotBlank;

public class DashboardExchangeRequest {

    @NotBlank(message = "fengchiToken 不能为空")
    private String fengchiToken;

    private String client;

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
