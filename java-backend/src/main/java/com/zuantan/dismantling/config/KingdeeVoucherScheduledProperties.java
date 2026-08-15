package com.zuantan.dismantling.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "kingdee.voucher.scheduled")
public class KingdeeVoucherScheduledProperties {

    private boolean enabled = true;
    private String cron = "0 0 17 * * ?";

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getCron() {
        return cron;
    }

    public void setCron(String cron) {
        this.cron = cron;
    }
}
