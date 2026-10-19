package com.zuantan.dismantling.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "hub.dashboard")
public class HubDashboardProperties {

    private boolean enabled = true;
    /** 与门户 together.hub.exchange-secret 一致 */
    private String exchangeSecret = "gongcheng-hub-exchange-2026";
    private String displayUsername = "admin";

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getExchangeSecret() {
        return exchangeSecret;
    }

    public void setExchangeSecret(String exchangeSecret) {
        this.exchangeSecret = exchangeSecret;
    }

    public String getDisplayUsername() {
        return displayUsername;
    }

    public void setDisplayUsername(String displayUsername) {
        this.displayUsername = displayUsername;
    }
}
