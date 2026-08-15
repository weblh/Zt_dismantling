package com.zuantan.dismantling.controller;

import com.zuantan.dismantling.common.Result;
import com.zuantan.dismantling.dto.DingtalkFormConfigRequest;
import com.zuantan.dismantling.entity.DingtalkFormConfig;
import com.zuantan.dismantling.service.DingtalkFormConfigService;
import javax.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dingtalk/form-config")
public class DingtalkFormConfigController {

    private final DingtalkFormConfigService formConfigService;

    public DingtalkFormConfigController(DingtalkFormConfigService formConfigService) {
        this.formConfigService = formConfigService;
    }

    @GetMapping
    public Result<List<DingtalkFormConfig>> list() {
        return Result.success(formConfigService.listAll());
    }

    @GetMapping("/{id}")
    public Result<DingtalkFormConfig> get(@PathVariable Long id) {
        DingtalkFormConfig config = formConfigService.getById(id);
        if (config == null) {
            return Result.error(404, "配置不存在");
        }
        return Result.success(config);
    }

    @PostMapping
    public Result<DingtalkFormConfig> create(@Valid @RequestBody DingtalkFormConfigRequest request) {
        DingtalkFormConfig existing = formConfigService.getByFormId(request.getFormId());
        if (existing != null) {
            return Result.error(400, "表单ID已存在");
        }
        return Result.success(formConfigService.create(request));
    }

    @PutMapping("/{id}")
    public Result<DingtalkFormConfig> update(@PathVariable Long id, @Valid @RequestBody DingtalkFormConfigRequest request) {
        DingtalkFormConfig existing = formConfigService.getByFormId(request.getFormId());
        if (existing != null && !existing.getId().equals(id)) {
            return Result.error(400, "表单ID已存在");
        }
        DingtalkFormConfig config = formConfigService.update(id, request);
        if (config == null) {
            return Result.error(404, "配置不存在");
        }
        return Result.success(config);
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        formConfigService.delete(id);
        return Result.success();
    }

    @PostMapping("/{id}/toggle")
    public Result<DingtalkFormConfig> toggleStatus(@PathVariable Long id) {
        formConfigService.toggleStatus(id);
        DingtalkFormConfig config = formConfigService.getById(id);
        if (config == null) {
            return Result.error(404, "配置不存在");
        }
        return Result.success(config);
    }
}