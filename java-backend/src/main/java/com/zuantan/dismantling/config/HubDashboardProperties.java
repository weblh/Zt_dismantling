package com.zuantan.dismantling.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@ConfigurationProperties(prefix = "hub.dashboard")
public class HubDashboardProperties {

    private boolean enabled = true;
    private String fengchiValidateUrl = "http://127.0.0.1:8081/api/auth/current-user";
    private String displayUsername = "admin";
    private List<String> allowedEmails = new ArrayList<>();
    private List<String> allowedPhones = new ArrayList<>();

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getFengchiValidateUrl() {
        return fengchiValidateUrl;
    }

    public void setFengchiValidateUrl(String fengchiValidateUrl) {
        this.fengchiValidateUrl = fengchiValidateUrl;
    }

    public String getDisplayUsername() {
        return displayUsername;
    }

    public void setDisplayUsername(String displayUsername) {
        this.displayUsername = displayUsername;
    }

    public List<String> getAllowedEmails() {
        return allowedEmails;
    }

    public void setAllowedEmails(List<String> allowedEmails) {
        this.allowedEmails = allowedEmails;
    }

    public List<String> getAllowedPhones() {
        return allowedPhones;
    }

    public void setAllowedPhones(List<String> allowedPhones) {
        this.allowedPhones = allowedPhones;
    }
}
