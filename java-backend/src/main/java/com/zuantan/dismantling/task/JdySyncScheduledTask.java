package com.zuantan.dismantling.task;

import com.zuantan.dismantling.dto.JdySyncResult;
import com.zuantan.dismantling.service.JdySyncService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class JdySyncScheduledTask {

    private static final Logger log = LoggerFactory.getLogger(JdySyncScheduledTask.class);

    private final JdySyncService jdySyncService;

    public JdySyncScheduledTask(JdySyncService jdySyncService) {
        this.jdySyncService = jdySyncService;
    }

    @Scheduled(cron = "${jiandaoyun.scheduled.cron:0 15 */6 * * ?}", zone = "Asia/Shanghai")
    public void syncAll() {
        if (!jdySyncService.isScheduledEnabled()) {
            return;
        }
        if (!jdySyncService.getStatus().isConfigured()) {
            log.debug("简道云定时同步跳过：未配置 API Key");
            return;
        }
        try {
            log.info("开始执行简道云全量表单定时同步");
            JdySyncResult result = jdySyncService.syncAllForms();
            log.info("简道云定时同步完成: {}", result.getMessage());
        } catch (Exception e) {
            log.error("简道云定时同步失败", e);
        }
    }
}
