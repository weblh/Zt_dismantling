package com.zuantan.dismantling.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "dingtalk.approval.scheduled")
public class DingtalkApprovalScheduledProperties {

    private boolean enabled = true;
    /** 每天 16:30 执行 */
    private String cron = "0 30 16 * * ?";
    /** 补同步最近 N 天内的钉钉事件 */
    private int recentDays = 2;

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

    public int getRecentDays() {
        return recentDays;
    }

    public void setRecentDays(int recentDays) {
        this.recentDays = recentDays;
    }
}
