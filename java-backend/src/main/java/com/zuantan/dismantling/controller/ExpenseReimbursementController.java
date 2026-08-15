package com.zuantan.dismantling.controller;

import com.zuantan.dismantling.common.PageResult;
import com.zuantan.dismantling.common.Result;
import com.zuantan.dismantling.dto.ExpenseReimbursementBatchPushRequest;
import com.zuantan.dismantling.service.ExpenseReimbursementKingdeeVoucherService;
import com.zuantan.dismantling.service.ExpenseReimbursementService;
import com.zuantan.dismantling.vo.ExpenseReimbursementItemVO;
import com.zuantan.dismantling.vo.KingdeeVoucherSaveResultVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/business/expense-reimbursement")
public class ExpenseReimbursementController {

    private final ExpenseReimbursementService expenseReimbursementService;
    private final ExpenseReimbursementKingdeeVoucherService expenseReimbursementKingdeeVoucherService;

    public ExpenseReimbursementController(ExpenseReimbursementService expenseReimbursementService,
                                          ExpenseReimbursementKingdeeVoucherService expenseReimbursementKingdeeVoucherService) {
        this.expenseReimbursementService = expenseReimbursementService;
        this.expenseReimbursementKingdeeVoucherService = expenseReimbursementKingdeeVoucherService;
    }

    @GetMapping("/items")
    public Result<PageResult<List<ExpenseReimbursementItemVO>>> listItems(
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String businessId,
            @RequestParam(required = false) String submitterName,
            @RequestParam(required = false) String expenseType) {
        return Result.success(expenseReimbursementService.listItems(
                pageNo, pageSize, businessId, submitterName, expenseType));
    }

    @GetMapping("/reimbursements/{id}/items")
    public Result<List<ExpenseReimbursementItemVO>> listItemsByReimbursement(@PathVariable Long id) {
        try {
            return Result.success(expenseReimbursementService.listItemsByReimbursementId(id));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/items/{id}")
    public Result<ExpenseReimbursementItemVO> getItemDetail(@PathVariable Long id) {
        try {
            return Result.success(expenseReimbursementService.getItemDetail(id));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/items/{itemId}/attachments/{fileId}/preview")
    public void previewAttachment(@PathVariable Long itemId,
                                  @PathVariable String fileId,
                                  HttpServletResponse response) {
        try {
            expenseReimbursementService.writeAttachmentPreview(itemId, fileId, response);
        } catch (RuntimeException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            try {
                response.getWriter().write(e.getMessage());
            } catch (IOException ignored) {
                // ignore write error
            }
        } catch (IOException e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            try {
                response.getWriter().write("附件预览失败: " + e.getMessage());
            } catch (IOException ignored) {
                // ignore write error
            }
        }
    }

    @PostMapping("/items/{id}/push-kingdee-voucher")
    public Result<KingdeeVoucherSaveResultVO> pushKingdeeVoucher(@PathVariable Long id,
                                                                 @RequestParam(required = false) Long accountId) {
        try {
            KingdeeVoucherSaveResultVO result = expenseReimbursementKingdeeVoucherService.pushToKingdee(id, accountId);
            return Result.success(result);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/reimbursements/{id}/push-kingdee-voucher")
    public Result<KingdeeVoucherSaveResultVO> pushReimbursementKingdeeVoucher(@PathVariable Long id,
                                                                               @RequestParam(required = false) Long accountId) {
        try {
            KingdeeVoucherSaveResultVO result = expenseReimbursementKingdeeVoucherService.pushReimbursementToKingdee(id, accountId);
            return Result.success(result);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/items/batch-push-kingdee-voucher")
    public Result<KingdeeVoucherSaveResultVO> batchPushKingdeeVoucher(
            @RequestBody ExpenseReimbursementBatchPushRequest request,
            @RequestParam(required = false) Long accountId) {
        try {
            KingdeeVoucherSaveResultVO result = expenseReimbursementKingdeeVoucherService.pushBatchToKingdee(
                    request != null ? request.getIds() : null, accountId);
            return Result.success(result);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }
}
