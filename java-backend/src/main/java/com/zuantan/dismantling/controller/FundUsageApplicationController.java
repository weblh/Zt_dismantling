package com.zuantan.dismantling.controller;

import com.zuantan.dismantling.common.PageResult;
import com.zuantan.dismantling.common.Result;
import com.zuantan.dismantling.dto.FundUsageApplicationBatchPushRequest;
import com.zuantan.dismantling.service.FundUsageApplicationKingdeeVoucherService;
import com.zuantan.dismantling.service.FundUsageApplicationService;
import com.zuantan.dismantling.vo.FundUsageApplicationItemVO;
import com.zuantan.dismantling.vo.FundUsageApplicationVO;
import com.zuantan.dismantling.vo.KingdeeVoucherSaveResultVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/business/fund-usage-application")
public class FundUsageApplicationController {

    private final FundUsageApplicationService fundUsageApplicationService;
    private final FundUsageApplicationKingdeeVoucherService fundUsageApplicationKingdeeVoucherService;

    public FundUsageApplicationController(FundUsageApplicationService fundUsageApplicationService,
                                          FundUsageApplicationKingdeeVoucherService fundUsageApplicationKingdeeVoucherService) {
        this.fundUsageApplicationService = fundUsageApplicationService;
        this.fundUsageApplicationKingdeeVoucherService = fundUsageApplicationKingdeeVoucherService;
    }

    @GetMapping
    public Result<PageResult<List<FundUsageApplicationVO>>> listApplications(
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String businessId,
            @RequestParam(required = false) String submitterName,
            @RequestParam(required = false) String paymentType) {
        return Result.success(fundUsageApplicationService.listApplications(
                pageNo, pageSize, businessId, submitterName, paymentType));
    }

    @GetMapping("/items")
    public Result<PageResult<List<FundUsageApplicationItemVO>>> listItems(
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String businessId,
            @RequestParam(required = false) String submitterName,
            @RequestParam(required = false) String paymentType) {
        return Result.success(fundUsageApplicationService.listItems(
                pageNo, pageSize, businessId, submitterName, paymentType));
    }

    @GetMapping("/applications/{id}/items")
    public Result<List<FundUsageApplicationItemVO>> listItemsByApplication(@PathVariable Long id) {
        try {
            return Result.success(fundUsageApplicationService.listItemsByApplicationId(id));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/items/{id}")
    public Result<FundUsageApplicationItemVO> getItemDetail(@PathVariable Long id) {
        try {
            return Result.success(fundUsageApplicationService.getItemDetail(id));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public Result<FundUsageApplicationVO> getApplicationDetail(@PathVariable Long id) {
        try {
            return Result.success(fundUsageApplicationService.getApplicationDetail(id));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/reparse")
    public Result<Integer> reparseAll() {
        return Result.success(fundUsageApplicationService.reparseAllFromApprovalForms());
    }

    @PostMapping("/items/{id}/push-kingdee-voucher")
    public Result<KingdeeVoucherSaveResultVO> pushItemKingdeeVoucher(@PathVariable Long id,
                                                                     @RequestParam(required = false) Long accountId) {
        try {
            KingdeeVoucherSaveResultVO result = fundUsageApplicationKingdeeVoucherService.pushToKingdee(id, accountId);
            return Result.success(result);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/applications/{id}/push-kingdee-voucher")
    public Result<KingdeeVoucherSaveResultVO> pushApplicationKingdeeVoucher(@PathVariable Long id,
                                                                              @RequestParam(required = false) Long accountId) {
        try {
            KingdeeVoucherSaveResultVO result = fundUsageApplicationKingdeeVoucherService.pushApplicationToKingdee(id, accountId);
            return Result.success(result);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/items/batch-push-kingdee-voucher")
    public Result<KingdeeVoucherSaveResultVO> batchPushItemKingdeeVoucher(
            @RequestBody FundUsageApplicationBatchPushRequest request,
            @RequestParam(required = false) Long accountId) {
        try {
            KingdeeVoucherSaveResultVO result = fundUsageApplicationKingdeeVoucherService.pushBatchToKingdee(
                    request != null ? request.getIds() : null, accountId);
            return Result.success(result);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }
}
