package com.zuantan.dismantling.task;

import com.zuantan.dismantling.config.DingtalkApprovalScheduledProperties;
import com.zuantan.dismantling.service.DingtalkApprovalFormService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class DingtalkApprovalScheduledTask {

    private static final Logger log = LoggerFactory.getLogger(DingtalkApprovalScheduledTask.class);

    private final DingtalkApprovalFormService approvalFormService;
    private final DingtalkApprovalScheduledProperties scheduledProperties;

    public DingtalkApprovalScheduledTask(DingtalkApprovalFormService approvalFormService,
                                         DingtalkApprovalScheduledProperties scheduledProperties) {
        this.approvalFormService = approvalFormService;
        this.scheduledProperties = scheduledProperties;
    }

    @Scheduled(cron = "${dingtalk.approval.scheduled.cron:0 30 16 * * ?}", zone = "Asia/Shanghai")
    public void syncRecentMissedApprovals() {
        if (!scheduledProperties.isEnabled()) {
            return;
        }

        int recentDays = scheduledProperties.getRecentDays();
        log.info("开始执行钉钉审批定时补同步：最近 {} 天", recentDays);
        int count = approvalFormService.syncRecentMissedApprovalEvents(recentDays);
        log.info("钉钉审批定时补同步完成：共同步 {} 条", count);
    }
}
