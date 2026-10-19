package com.zuantan.dismantling.controller;

import com.zuantan.dismantling.common.PageResult;
import com.zuantan.dismantling.common.Result;
import com.zuantan.dismantling.dto.BankStatementBatchPushRequest;
import com.zuantan.dismantling.dto.BankStatementClassifyRequest;
import com.zuantan.dismantling.dto.BankStatementExistCheckRequest;
import com.zuantan.dismantling.service.BankStatementKingdeeExistService;
import com.zuantan.dismantling.service.BankStatementKingdeeVoucherService;
import com.zuantan.dismantling.service.BankStatementService;
import com.zuantan.dismantling.vo.BankStatementDuplicateGroupVO;
import com.zuantan.dismantling.vo.BankStatementImportResultVO;
import com.zuantan.dismantling.vo.BankStatementKingdeeExistResultVO;
import com.zuantan.dismantling.vo.BankStatementVO;
import com.zuantan.dismantling.vo.KingdeeVoucherSaveResultVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/kingdee/bank-statement")
public class BankStatementController {

    private final BankStatementService bankStatementService;
    private final BankStatementKingdeeVoucherService bankStatementKingdeeVoucherService;
    private final BankStatementKingdeeExistService bankStatementKingdeeExistService;

    public BankStatementController(BankStatementService bankStatementService,
                                   BankStatementKingdeeVoucherService bankStatementKingdeeVoucherService,
                                   BankStatementKingdeeExistService bankStatementKingdeeExistService) {
        this.bankStatementService = bankStatementService;
        this.bankStatementKingdeeVoucherService = bankStatementKingdeeVoucherService;
        this.bankStatementKingdeeExistService = bankStatementKingdeeExistService;
    }

    @PostMapping("/import")
    public Result<BankStatementImportResultVO> importExcel(@RequestParam("file") MultipartFile file,
                                                           @RequestParam(required = false) String bankSource) {
        try {
            return Result.success(bankStatementService.importExcel(file, bankSource));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    /** 清空银行流水表，便于按正确文件重导 */
    @PostMapping("/clear-imported")
    public Result<Map<String, Object>> clearImported() {
        int deleted = bankStatementService.clearAll();
        Map<String, Object> data = new HashMap<>();
        data.put("deleted", deleted);
        return Result.success("已清空银行流水 " + deleted + " 条", data);
    }

    @GetMapping("/items")
    public Result<PageResult<List<BankStatementVO>>> listItems(
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String bankSource,
            @RequestParam(required = false) String direction,
            @RequestParam(required = false) String counterpartyName,
            @RequestParam(required = false) String voucherType,
            @RequestParam(required = false) String pushStatus,
            @RequestParam(required = false) Boolean onlyOut,
            @RequestParam(required = false) String tradeDateStart,
            @RequestParam(required = false) String tradeDateEnd,
            @RequestParam(required = false) Boolean duplicateSuspectOnly) {
        return Result.success(bankStatementService.listItems(
                pageNo, pageSize, bankSource, direction, counterpartyName, voucherType,
                pushStatus, onlyOut, tradeDateStart, tradeDateEnd, duplicateSuspectOnly));
    }

    @GetMapping("/items/{id}")
    public Result<BankStatementVO> getDetail(@PathVariable Long id) {
        try {
            return Result.success(bankStatementService.getDetail(id));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PutMapping("/items/{id}/classify")
    public Result<BankStatementVO> classify(@PathVariable Long id,
                                            @RequestBody BankStatementClassifyRequest request) {
        try {
            return Result.success(bankStatementService.classify(id, request));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/items/batch-classify")
    public Result<Map<String, Object>> batchClassify(@RequestBody BankStatementClassifyRequest request) {
        try {
            int count = bankStatementService.batchClassify(request);
            Map<String, Object> data = new HashMap<>();
            data.put("count", count);
            return Result.success(data);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/duplicates")
    public Result<List<BankStatementDuplicateGroupVO>> listDuplicates(
            @RequestParam(required = false) String bankSource) {
        return Result.success(bankStatementService.listDuplicates(bankSource));
    }

    /**
     * 对齐租赁：按银行科目+维度+日期±1+借贷方向+金额检查金蝶是否已有分录。
     */
    @PostMapping("/check-kingdee-exists")
    public Result<BankStatementKingdeeExistResultVO> checkKingdeeExists(
            @RequestBody(required = false) BankStatementExistCheckRequest request) {
        try {
            BankStatementExistCheckRequest body =
                    request != null ? request : new BankStatementExistCheckRequest();
            BankStatementKingdeeExistResultVO result = bankStatementKingdeeExistService.checkExists(
                    body.getIds(), body.getAccountId(), body.getBankSource(), body.getAccountingPeriods());
            return Result.success("检查完成：金蝶已存在 " + result.getExistsCount()
                    + " 条，不存在 " + result.getNotExistsCount() + " 条", result);
        } catch (RuntimeException e) {
            return Result.error("检查失败：" + e.getMessage());
        }
    }

    @PostMapping("/items/{id}/push-kingdee-voucher")
    public Result<KingdeeVoucherSaveResultVO> pushKingdeeVoucher(
            @PathVariable Long id,
            @RequestParam(required = false) Long accountId) {
        try {
            return Result.success(bankStatementKingdeeVoucherService.pushToKingdee(id, accountId));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/items/batch-push-kingdee-voucher")
    public Result<KingdeeVoucherSaveResultVO> batchPushKingdeeVoucher(
            @RequestBody BankStatementBatchPushRequest request,
            @RequestParam(required = false) Long accountId) {
        try {
            return Result.success(bankStatementKingdeeVoucherService.pushBatchToKingdee(
                    request != null ? request.getIds() : null, accountId));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }
}
