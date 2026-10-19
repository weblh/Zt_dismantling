package com.zuantan.dismantling.controller;

import com.zuantan.dismantling.common.PageResult;
import com.zuantan.dismantling.common.Result;
import com.zuantan.dismantling.dto.RetailTransferExistCheckRequest;
import com.zuantan.dismantling.entity.RetailTransferVoucher;
import com.zuantan.dismantling.service.RetailTransferKingdeeExistService;
import com.zuantan.dismantling.service.RetailTransferVoucherService;
import com.zuantan.dismantling.vo.RetailTransferExistResultVO;
import com.zuantan.dismantling.vo.RetailTransferImportResultVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/kingdee/retail-transfer")
public class RetailTransferVoucherController {

    private final RetailTransferVoucherService voucherService;
    private final RetailTransferKingdeeExistService existService;

    public RetailTransferVoucherController(RetailTransferVoucherService voucherService,
                                           RetailTransferKingdeeExistService existService) {
        this.voucherService = voucherService;
        this.existService = existService;
    }

    @PostMapping("/import")
    public Result<RetailTransferImportResultVO> importExcel(@RequestParam("file") MultipartFile file) {
        try {
            return Result.success(voucherService.importExcel(file));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    /** 清空散户转字导入数据，便于按结账台账重导 */
    @PostMapping("/clear-imported")
    public Result<Map<String, Object>> clearImported() {
        int deleted = voucherService.clearAll();
        Map<String, Object> data = new HashMap<>();
        data.put("deleted", deleted);
        return Result.success("已清空散户台账 " + deleted + " 条", data);
    }

    @GetMapping("/items")
    public Result<PageResult<List<RetailTransferVoucher>>> listItems(
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String counterpartyName,
            @RequestParam(required = false) String direction,
            @RequestParam(required = false) Boolean retailOnly,
            @RequestParam(required = false) String existStatus,
            @RequestParam(required = false) String tradeDateStart,
            @RequestParam(required = false) String tradeDateEnd) {
        return Result.success(voucherService.listItems(
                pageNo, pageSize, counterpartyName, direction, retailOnly, existStatus,
                tradeDateStart, tradeDateEnd));
    }

    @PostMapping("/check-kingdee-exists")
    public Result<RetailTransferExistResultVO> checkKingdeeExists(
            @RequestBody(required = false) RetailTransferExistCheckRequest request) {
        try {
            RetailTransferExistCheckRequest body =
                    request != null ? request : new RetailTransferExistCheckRequest();
            RetailTransferExistResultVO result = existService.checkExists(
                    body.getIds(), body.getAccountId(), body.getRetailOnly());
            return Result.success("反写完成：金蝶已有转字 " + result.getExistsCount()
                    + " 条，未找到 " + result.getNotExistsCount() + " 条", result);
        } catch (RuntimeException e) {
            return Result.error("反写失败：" + e.getMessage());
        }
    }
}
