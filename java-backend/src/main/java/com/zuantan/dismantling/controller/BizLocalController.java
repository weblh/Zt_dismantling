package com.zuantan.dismantling.controller;

import com.zuantan.dismantling.common.Result;
import com.zuantan.dismantling.service.BizLocalService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/biz-local")
public class BizLocalController {

    private final BizLocalService bizLocalService;

    public BizLocalController(BizLocalService bizLocalService) {
        this.bizLocalService = bizLocalService;
    }

    @GetMapping("/{bizKey}/rows")
    public Result<List<Map<String, Object>>> getRows(@PathVariable String bizKey) {
        return Result.success(bizLocalService.getRows(bizKey));
    }

    @PutMapping("/{bizKey}/rows")
    public Result<Void> putRows(@PathVariable String bizKey, @RequestBody List<Map<String, Object>> rows) {
        bizLocalService.saveRows(bizKey, rows);
        return Result.success("保存成功", null);
    }
}
