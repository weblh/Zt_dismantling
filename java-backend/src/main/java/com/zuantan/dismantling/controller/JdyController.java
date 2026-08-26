package com.zuantan.dismantling.controller;

import com.zuantan.dismantling.common.PageResult;
import com.zuantan.dismantling.common.Result;
import com.zuantan.dismantling.dto.JdyConfigRequest;
import com.zuantan.dismantling.dto.JdyStatusResponse;
import com.zuantan.dismantling.dto.JdySyncResult;
import com.zuantan.dismantling.entity.JdyForm;
import com.zuantan.dismantling.entity.JdyFormData;
import com.zuantan.dismantling.service.JdyBusinessDataService;
import com.zuantan.dismantling.service.JdySyncService;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jdy")
public class JdyController {

    private final JdySyncService jdySyncService;
    private final JdyBusinessDataService jdyBusinessDataService;

    public JdyController(JdySyncService jdySyncService, JdyBusinessDataService jdyBusinessDataService) {
        this.jdySyncService = jdySyncService;
        this.jdyBusinessDataService = jdyBusinessDataService;
    }

    @GetMapping("/status")
    public Result<JdyStatusResponse> status() {
        return Result.success(jdySyncService.getStatus());
    }

    @PostMapping("/config")
    public Result<Void> updateConfig(@Valid @RequestBody JdyConfigRequest request) {
        try {
            jdySyncService.updateConfig(request);
            return Result.success("简道云配置已保存", null);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/forms/refresh")
    public Result<List<JdyForm>> refreshForms() {
        try {
            return Result.success(jdySyncService.refreshForms());
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/forms")
    public Result<List<JdyForm>> listForms() {
        return Result.success(jdySyncService.listForms());
    }

    @PostMapping("/sync")
    public Result<JdySyncResult> syncAll() {
        try {
            return Result.success(jdySyncService.syncAllForms());
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/sync/{entryId}")
    public Result<Integer> syncOne(@PathVariable String entryId) {
        try {
            return Result.success(jdySyncService.syncOneForm(entryId));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/data")
    public Result<PageResult<List<JdyFormData>>> listData(
            @RequestParam(required = false) String entryId,
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "20") int pageSize) {
        return Result.success(jdySyncService.listData(entryId, pageNo, pageSize));
    }

    @GetMapping("/data/{id}")
    public Result<JdyFormData> dataDetail(@PathVariable Long id) {
        try {
            return Result.success(jdySyncService.getDataDetail(id));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/business/{bizKey}")
    public Result<PageResult<List<Map<String, Object>>>> businessData(
            @PathVariable String bizKey,
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String keyword) {
        try {
            return Result.success(jdyBusinessDataService.listBusinessData(bizKey, pageNo, pageSize, keyword));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/business/{bizKey}/fields")
    public Result<Map<String, Object>> businessFields(@PathVariable String bizKey) {
        try {
            return Result.success(jdyBusinessDataService.compareFields(bizKey));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/schemas/refresh")
    public Result<Integer> refreshSchemas() {
        try {
            return Result.success(jdyBusinessDataService.refreshAllSchemas());
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }
}
