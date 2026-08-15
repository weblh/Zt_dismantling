package com.zuantan.dismantling.task;

import com.zuantan.dismantling.config.KingdeeVoucherScheduledProperties;
import com.zuantan.dismantling.service.KingdeeCombinedVoucherPushService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class KingdeeVoucherScheduledTask {

    private static final Logger log = LoggerFactory.getLogger(KingdeeVoucherScheduledTask.class);

    private final KingdeeCombinedVoucherPushService combinedVoucherPushService;
    private final KingdeeVoucherScheduledProperties scheduledProperties;

    public KingdeeVoucherScheduledTask(KingdeeCombinedVoucherPushService combinedVoucherPushService,
                                       KingdeeVoucherScheduledProperties scheduledProperties) {
        this.combinedVoucherPushService = combinedVoucherPushService;
        this.scheduledProperties = scheduledProperties;
    }

    @Scheduled(cron = "${kingdee.voucher.scheduled.cron:0 0 17 * * ?}", zone = "Asia/Shanghai")
    public void pushDailyCombinedVoucher() {
        if (!scheduledProperties.isEnabled()) {
            return;
        }

        LocalDate today = LocalDate.now();
        log.info("开始执行金蝶合并凭证定时推送：截至 {}", today);
        combinedVoucherPushService.pushAllPendingUpTo(today, null);
    }
}
