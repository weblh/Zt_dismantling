package com.zuantan.dismantling.controller;

import com.zuantan.dismantling.common.PageResult;
import com.zuantan.dismantling.common.Result;
import com.zuantan.dismantling.dto.JdyConfigRequest;
import com.zuantan.dismantling.dto.JdyStatusResponse;
import com.zuantan.dismantling.dto.JdySyncResult;
import com.zuantan.dismantling.entity.JdyForm;
import com.zuantan.dismantling.entity.JdyFormData;
import com.zuantan.dismantling.service.DictService;
import com.zuantan.dismantling.service.JdyBusinessDataService;
import com.zuantan.dismantling.service.JdyDashboardService;
import com.zuantan.dismantling.service.JdyMirrorStoreService;
import com.zuantan.dismantling.service.JdySyncService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jdy")
public class JdyController {

    private static final Logger log = LoggerFactory.getLogger(JdyController.class);

    private final JdySyncService jdySyncService;
    private final JdyBusinessDataService jdyBusinessDataService;
    private final JdyDashboardService jdyDashboardService;
    private final JdyMirrorStoreService jdyMirrorStoreService;
    private final DictService dictService;

    public JdyController(JdySyncService jdySyncService,
                         JdyBusinessDataService jdyBusinessDataService,
                         JdyDashboardService jdyDashboardService,
                         JdyMirrorStoreService jdyMirrorStoreService,
                         DictService dictService) {
        this.jdySyncService = jdySyncService;
        this.jdyBusinessDataService = jdyBusinessDataService;
        this.jdyDashboardService = jdyDashboardService;
        this.jdyMirrorStoreService = jdyMirrorStoreService;
        this.dictService = dictService;
    }

    @GetMapping("/status")
    public Result<JdyStatusResponse> status(
            @RequestParam(required = false) String source) {
        try {
            return Result.success(jdySyncService.getStatus(source));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
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

    /**
     * 全量同步。source=receipt 仅收车；source=pricing 仅议价；不传则双应用。
     */
    @PostMapping("/sync")
    public Result<JdySyncResult> syncAll(
            @RequestParam(required = false) String source) {
        try {
            JdySyncResult result = jdySyncService.syncAllForms(source);
            jdyDashboardService.clearDashboardCache();
            // 镜像同步后投影字典（失败不影响主流程；不重复请求简道云）
            try {
                Map<String, Object> dictResult = dictService.projectFromMirror();
                log.info("简道云同步后字典投影完成: {}", dictResult);
            } catch (Exception ex) {
                log.warn("简道云同步后字典投影失败: {}", ex.getMessage());
            }
            return Result.success(result);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/sync/{entryId}")
    public Result<Integer> syncOne(@PathVariable String entryId) {
        try {
            Integer count = jdySyncService.syncOneForm(entryId);
            jdyDashboardService.clearDashboardCache();
            return Result.success(count);
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
        return Result.error("简道云镜像已下线");
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

    /**
     * 业务收货：从简道云拉取并写入本地库，页面读库展示。
     */
    @PostMapping("/business/receipt/sync")
    public Result<JdySyncResult> syncReceiptBusiness() {
        try {
            JdySyncResult result = jdySyncService.syncReceiptBusinessForm();
            jdyBusinessDataService.clearReceiptCache();
            jdyDashboardService.clearDashboardCache();
            return Result.success(result);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 查验照片：从简道云拉取并写入本地库，页面读库展示。
     */
    @PostMapping("/business/inspection-photo/sync")
    public Result<JdySyncResult> syncInspectionPhotoBusiness() {
        try {
            JdySyncResult result = jdySyncService.syncInspectionPhotoBusinessForm();
            jdyDashboardService.clearDashboardCache();
            return Result.success(result);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 过磅查验：从简道云拉取并写入本地库，页面读库展示。
     */
    @PostMapping("/business/weighing-inspection/sync")
    public Result<JdySyncResult> syncWeighingInspection() {
        try {
            JdySyncResult result = jdySyncService.syncWeighingInspectionForm();
            jdyDashboardService.clearDashboardCache();
            return Result.success(result);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 报废车入库：从简道云拉取并写入本地库，页面读库展示。
     */
    @PostMapping("/business/scrapped-vehicle/sync")
    public Result<JdySyncResult> syncScrappedVehicleBusiness() {
        try {
            JdySyncResult result = jdySyncService.syncScrappedVehicleBusinessForm();
            jdyBusinessDataService.clearScrappedVehicleCache();
            jdyDashboardService.clearDashboardCache();
            return Result.success(result);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    /** 过磅同步：列表内改状态（待同步 / 已同步），写回简道云。 */
    @PutMapping("/business/weighing-sync/{dataId}/status")
    public Result<Void> updateWeighingSyncStatus(
            @PathVariable String dataId,
            @RequestBody Map<String, String> body) {
        try {
            String status = body == null ? null : body.get("status");
            jdyBusinessDataService.updateWeighingSyncStatus(dataId, status);
            return Result.success("状态已更新", null);
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

  /** 业务一览看板（对齐简道云 ERP 大屏） */
    @GetMapping("/dashboard/business-overview")
    public Result<Map<String, Object>> businessOverview(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        try {
            return Result.success(jdyDashboardService.getBusinessOverview(year, startDate, endDate));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    /** 数字化可视大屏统计 */
    @GetMapping("/dashboard/digital")
    public Result<Map<String, Object>> digitalDashboard(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        try {
            return Result.success(jdyDashboardService.getDigitalDashboard(year, startDate, endDate));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    /** 最近同步记录 */
    @GetMapping("/sync/logs")
    public Result<List<Map<String, Object>>> syncLogs(
            @RequestParam(defaultValue = "20") int limit) {
        return Result.success(jdyMirrorStoreService.listRecentSyncLogs(Math.min(limit, 100)));
    }
}
