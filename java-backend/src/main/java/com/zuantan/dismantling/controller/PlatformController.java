package com.zuantan.dismantling.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zuantan.dismantling.common.PageResult;
import com.zuantan.dismantling.common.Result;
import com.zuantan.dismantling.entity.BizApp;
import com.zuantan.dismantling.entity.BizForm;
import com.zuantan.dismantling.entity.BizFormData;
import com.zuantan.dismantling.service.BizPlatformService;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 精简后的平台接口：仅保留应用/表单/数据 CRUD（供小程序等使用）。
 * Flowable 流程、打印、ACL、看板已下线。
 */
@RestController
@RequestMapping("/api/platform")
public class PlatformController {

    private final BizPlatformService platformService;

    public PlatformController(BizPlatformService platformService) {
        this.platformService = platformService;
    }

    private Long uid(HttpServletRequest request) {
        Object v = request.getAttribute("userId");
        return v instanceof Long ? (Long) v : Long.valueOf(String.valueOf(v));
    }

    @GetMapping("/apps")
    public Result<List<BizApp>> apps() {
        return Result.success(platformService.listApps());
    }

    @PostMapping("/apps")
    public Result<BizApp> saveApp(@RequestBody BizApp app) {
        return Result.success(platformService.saveApp(app));
    }

    @GetMapping("/forms")
    public Result<List<BizForm>> forms(@RequestParam(required = false) Long appId) {
        return Result.success(platformService.listForms(appId));
    }

    @GetMapping("/forms/{id}")
    public Result<BizForm> getForm(@PathVariable Long id) {
        return Result.success(platformService.getForm(id));
    }

    @PostMapping("/forms")
    public Result<BizForm> saveForm(@RequestBody BizForm form) {
        return Result.success(platformService.saveFormMeta(form));
    }

    @PutMapping("/forms/{id}/draft")
    public Result<BizForm> saveDraft(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String schema = body.get("draftSchemaJson");
        if (schema == null) {
            schema = body.get("schemaJson");
        }
        return Result.success(platformService.saveDraftSchema(id, schema));
    }

    @PostMapping("/forms/{id}/publish")
    public Result<BizForm> publish(@PathVariable Long id, HttpServletRequest request) {
        return Result.success(platformService.publishForm(id, String.valueOf(uid(request))));
    }

    @GetMapping("/forms/{formId}/data")
    public Result<PageResult<List<BizFormData>>> pageData(
            @PathVariable Long formId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest request) {
        Page<BizFormData> p = platformService.pageData(formId, page, size, uid(request));
        return Result.success(new PageResult<>(p.getTotal(), p.getRecords()));
    }

    @GetMapping("/data/{id}")
    public Result<BizFormData> getData(@PathVariable Long id) {
        return Result.success(platformService.getData(id));
    }

    @PostMapping("/forms/{formId}/data")
    public Result<BizFormData> createData(@PathVariable Long formId,
                                          @RequestBody Map<String, Object> body,
                                          HttpServletRequest request) {
        String dataJson = body.get("dataJson") != null ? body.get("dataJson").toString() : "{}";
        BizFormData row = platformService.createData(formId, dataJson, uid(request), false);
        return Result.success(row);
    }

    @PutMapping("/data/{id}")
    public Result<BizFormData> updateData(@PathVariable Long id,
                                          @RequestBody Map<String, Object> body,
                                          HttpServletRequest request) {
        String dataJson = body.get("dataJson") != null ? body.get("dataJson").toString() : "{}";
        return Result.success(platformService.updateData(id, dataJson, uid(request)));
    }

    @DeleteMapping("/data/{id}")
    public Result<Void> deleteData(@PathVariable Long id, HttpServletRequest request) {
        platformService.deleteData(id, uid(request));
        return Result.success("已删除", null);
    }

    @PostMapping("/forms/realign-menu-groups")
    public Result<Map<String, Object>> realignMenuGroups() {
        Map<String, Object> result = new HashMap<>();
        result.put("updated", platformService.realignMenuGroups());
        return Result.success(result);
    }
}
