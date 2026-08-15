package com.zuantan.dismantling.controller;

import com.zuantan.dismantling.common.PageResult;
import com.zuantan.dismantling.common.Result;
import com.zuantan.dismantling.dto.DingtalkConfigRequest;
import com.zuantan.dismantling.dto.DingtalkStatusResponse;
import com.zuantan.dismantling.entity.DingtalkEvent;
import com.zuantan.dismantling.service.DingtalkApprovalFormService;
import com.zuantan.dismantling.service.DingtalkStreamService;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/dingtalk")
public class DingtalkController {

    private final DingtalkStreamService dingtalkStreamService;
    private final DingtalkApprovalFormService approvalFormService;

    public DingtalkController(DingtalkStreamService dingtalkStreamService,
                              DingtalkApprovalFormService approvalFormService) {
        this.dingtalkStreamService = dingtalkStreamService;
        this.approvalFormService = approvalFormService;
    }

    @GetMapping("/status")
    public Result<DingtalkStatusResponse> status() {
        return Result.success(dingtalkStreamService.getStatus());
    }

    @PostMapping("/config")
    public Result<Void> updateConfig(@Valid @RequestBody DingtalkConfigRequest request) {
        try {
            dingtalkStreamService.updateConfig(request);
            return Result.success("配置已保存", null);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/start")
    public Result<Void> start() {
        try {
            dingtalkStreamService.start();
            return Result.success("Stream 通道已启动", null);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/stop")
    public Result<Void> stop() {
        dingtalkStreamService.stop();
        return Result.success("Stream 通道已停止", null);
    }

    @PostMapping("/sync-missed-approvals")
    public Result<Integer> syncMissedApprovals(
            @RequestParam(required = false, defaultValue = "2") Integer recentDays) {
        try {
            if (recentDays != null && recentDays > 0) {
                return Result.success(approvalFormService.syncRecentMissedApprovalEvents(recentDays));
            }
            return Result.success(approvalFormService.syncRecentMissedApprovalEvents(2));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/events")
    public Result<PageResult<List<DingtalkEvent>>> listEvents(
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String eventType) {
        return Result.success(dingtalkStreamService.listEvents(pageNo, pageSize, eventType));
    }

    @GetMapping("/events/{id}")
    public Result<DingtalkEvent> eventDetail(@PathVariable Long id) {
        try {
            return Result.success(dingtalkStreamService.getEventDetail(id));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }
}
