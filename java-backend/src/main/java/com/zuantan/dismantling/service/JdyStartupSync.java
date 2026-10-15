package com.zuantan.dismantling.service;

import com.zuantan.dismantling.dto.JdyStatusResponse;
import com.zuantan.dismantling.dto.JdySyncResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * 启动时自动从简道云拉取数据（API Key 已在 application.yml 配置时生效）。
 */
@Component
public class JdyStartupSync implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(JdyStartupSync.class);

    private final JdySyncService jdySyncService;

    @Value("${jiandaoyun.startup-sync.enabled:true}")
    private boolean startupSyncEnabled;

    public JdyStartupSync(JdySyncService jdySyncService) {
        this.jdySyncService = jdySyncService;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!startupSyncEnabled) {
            return;
        }
        JdyStatusResponse status = jdySyncService.getStatus();
        if (!status.isConfigured()) {
            log.info("简道云启动同步跳过：未配置 API Key");
            return;
        }
        if (status.getDataCount() > 0) {
            log.info("简道云启动同步跳过：本地已有 {} 条镜像数据", status.getDataCount());
            return;
        }
        Thread syncThread = new Thread(this::syncInBackground, "jdy-startup-sync");
        syncThread.setDaemon(true);
        syncThread.start();
    }

    private void syncInBackground() {
        try {
            log.info("简道云本地无数据，启动后台全量同步…");
            JdySyncResult result = jdySyncService.syncAllForms();
            log.info("简道云启动同步完成: {}", result.getMessage());
        } catch (Exception e) {
            log.error("简道云启动同步失败", e);
        }
    }
}
