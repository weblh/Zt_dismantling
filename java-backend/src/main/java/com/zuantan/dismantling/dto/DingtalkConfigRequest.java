package com.zuantan.dismantling.dto;

import javax.validation.constraints.NotBlank;

public class DingtalkConfigRequest {

    @NotBlank(message = "Client ID 不能为空")
    private String clientId;

    @NotBlank(message = "Client Secret 不能为空")
    private String clientSecret;

    private Boolean autoStart;

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getClientSecret() {
        return clientSecret;
    }

    public void setClientSecret(String clientSecret) {
        this.clientSecret = clientSecret;
    }

    public Boolean getAutoStart() {
        return autoStart;
    }

    public void setAutoStart(Boolean autoStart) {
        this.autoStart = autoStart;
    }
}
