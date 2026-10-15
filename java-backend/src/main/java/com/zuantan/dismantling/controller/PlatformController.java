package com.zuantan.dismantling.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zuantan.dismantling.common.PageResult;
import com.zuantan.dismantling.common.Result;
import com.zuantan.dismantling.entity.BizApp;
import com.zuantan.dismantling.entity.BizForm;
import com.zuantan.dismantling.entity.BizFormAcl;
import com.zuantan.dismantling.entity.BizFormData;
import com.zuantan.dismantling.entity.BizDashboard;
import com.zuantan.dismantling.entity.BizPrintTemplate;
import com.zuantan.dismantling.service.BizAclService;
import com.zuantan.dismantling.service.BizDashboardService;
import com.zuantan.dismantling.service.BizFlowService;
import com.zuantan.dismantling.service.BizPlatformService;
import com.zuantan.dismantling.service.BizPrintService;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/platform")
public class PlatformController {

    private final BizPlatformService platformService;
    private final BizFlowService flowService;
    private final BizAclService aclService;
    private final BizPrintService printService;
    private final BizDashboardService dashboardService;

    public PlatformController(BizPlatformService platformService, BizFlowService flowService,
                              BizAclService aclService, BizPrintService printService,
                              BizDashboardService dashboardService) {
        this.platformService = platformService;
        this.flowService = flowService;
        this.aclService = aclService;
        this.printService = printService;
        this.dashboardService = dashboardService;
    }

    private Long uid(HttpServletRequest request) {
        Object v = request.getAttribute("userId");
        return v instanceof Long ? (Long) v : Long.valueOf(String.valueOf(v));
    }

    @GetMapping("/apps")
    public Result<List<BizApp>> apps() {
        platformService.ensureDefaultApp();
        return Result.success(platformService.listApps());
    }

    @GetMapping("/forms")
    public Result<List<BizForm>> forms(@RequestParam(required = false) Long appId) {
        platformService.ensureDefaultApp();
        return Result.success(platformService.listForms(appId));
    }

    @GetMapping("/forms/{id}")
    public Result<BizForm> form(@PathVariable Long id) {
        return Result.success(platformService.getForm(id));
    }

    @GetMapping("/forms/by-code/{code}")
    public Result<BizForm> formByCode(@PathVariable String code) {
        return Result.success(platformService.getFormByCode(code));
    }

    @PostMapping("/forms")
    public Result<BizForm> saveForm(@RequestBody BizForm form) {
        if (form.getAppId() == null) {
            form.setAppId(platformService.ensureDefaultApp().getId());
        }
        return Result.success(platformService.saveFormMeta(form));
    }

    @PutMapping("/forms/{id}/draft")
    public Result<BizForm> saveDraft(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return Result.success(platformService.saveDraftSchema(id, body.get("schemaJson")));
    }

    @PostMapping("/forms/{id}/publish")
    public Result<BizForm> publish(@PathVariable Long id, HttpServletRequest request) {
        Object username = request.getAttribute("username");
        return Result.success(platformService.publishForm(id, username != null ? username.toString() : null));
    }

    @GetMapping("/forms/{formId}/data")
    public Result<PageResult<List<BizFormData>>> listData(
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
        boolean startFlow = Boolean.TRUE.equals(body.get("startFlow"));
        BizFormData row = platformService.createData(formId, dataJson, uid(request), startFlow);
        if (startFlow) {
            flowService.submit(row.getId(), uid(request));
            row = platformService.getData(row.getId());
        }
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

    @PostMapping("/migrate/jdy")
    public Result<Map<String, Object>> migrateJdy(
            @RequestParam(defaultValue = "true") boolean includeData,
            @RequestParam(defaultValue = "500") int dataLimitPerForm) {
        Map<String, Object> result = platformService.migrateFromJdy(includeData, dataLimitPerForm);
        result.put("menuGroupsRealigned", platformService.realignMenuGroups());
        return Result.success(result);
    }

    @PostMapping("/forms/realign-menu-groups")
    public Result<Map<String, Object>> realignMenuGroups() {
        Map<String, Object> result = new HashMap<>();
        result.put("updated", platformService.realignMenuGroups());
        return Result.success(result);
    }

    // ---- flow ----
    @PostMapping("/flow/submit/{dataId}")
    public Result<Map<String, Object>> submit(@PathVariable Long dataId, HttpServletRequest request) {
        return Result.success(flowService.submit(dataId, uid(request)));
    }

    @PostMapping("/flow/approve/{taskId}")
    public Result<Map<String, Object>> approve(@PathVariable String taskId,
                                               @RequestBody(required = false) Map<String, String> body,
                                               HttpServletRequest request) {
        String comment = body != null ? body.get("comment") : null;
        return Result.success(flowService.approve(taskId, uid(request), comment));
    }

    @PostMapping("/flow/reject/{taskId}")
    public Result<Map<String, Object>> reject(@PathVariable String taskId,
                                              @RequestBody(required = false) Map<String, String> body,
                                              HttpServletRequest request) {
        String comment = body != null ? body.get("comment") : null;
        return Result.success(flowService.reject(taskId, uid(request), comment));
    }

    @GetMapping("/flow/todo")
    public Result<List<Map<String, Object>>> todo(HttpServletRequest request) {
        return Result.success(flowService.listTodo(uid(request)));
    }

    @GetMapping("/flow/initiated")
    public Result<List<Map<String, Object>>> initiated(HttpServletRequest request) {
        return Result.success(flowService.listInitiated(uid(request)));
    }

    @GetMapping("/flow/processed")
    public Result<List<Map<String, Object>>> processed(HttpServletRequest request) {
        return Result.success(flowService.listProcessed(uid(request)));
    }

    @GetMapping("/flow/cc")
    public Result<List<Map<String, Object>>> cc(HttpServletRequest request) {
        return Result.success(flowService.listCc(uid(request)));
    }

    // ---- acl ----
    @GetMapping("/forms/{formId}/acl")
    public Result<List<BizFormAcl>> listAcl(@PathVariable Long formId) {
        return Result.success(aclService.listRules(formId));
    }

    @PostMapping("/forms/{formId}/acl")
    public Result<BizFormAcl> saveAcl(@PathVariable Long formId, @RequestBody BizFormAcl rule) {
        rule.setFormId(formId);
        return Result.success(aclService.saveRule(rule));
    }

    @DeleteMapping("/acl/{id}")
    public Result<Void> deleteAcl(@PathVariable Long id) {
        aclService.deleteRule(id);
        return Result.success("已删除", null);
    }

    // ---- print ----
    @GetMapping("/forms/{formId}/print-templates")
    public Result<List<BizPrintTemplate>> printTemplates(@PathVariable Long formId) {
        return Result.success(printService.listByForm(formId));
    }

    @PostMapping("/print-templates")
    public Result<BizPrintTemplate> savePrint(@RequestBody BizPrintTemplate t) {
        return Result.success(printService.save(t));
    }

    @GetMapping("/data/{dataId}/print/{templateId}")
    public Result<Map<String, String>> renderPrint(@PathVariable Long dataId, @PathVariable Long templateId) {
        Map<String, String> m = new HashMap<>();
        m.put("html", printService.render(dataId, templateId));
        return Result.success(m);
    }

    // ---- dashboard ----
    @GetMapping("/dashboards")
    public Result<List<BizDashboard>> dashboards(@RequestParam(required = false) Long appId) {
        return Result.success(dashboardService.list(appId));
    }

    @PostMapping("/dashboards")
    public Result<BizDashboard> saveDashboard(@RequestBody BizDashboard d) {
        return Result.success(dashboardService.save(d));
    }

    @GetMapping("/dashboards/{id}/stats")
    public Result<Map<String, Object>> dashboardStats(@PathVariable Long id) {
        return Result.success(dashboardService.computeStats(id));
    }
}
