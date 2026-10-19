package com.zuantan.dismantling.controller;

import com.zuantan.dismantling.common.PageResult;
import com.zuantan.dismantling.common.Result;
import com.zuantan.dismantling.service.KingdeeAccountConfigService;
import com.zuantan.dismantling.service.BankStatementKingdeeVoucherService;
import com.zuantan.dismantling.service.KingdeeLoginService;
import com.zuantan.dismantling.service.KingdeeSupplierQueryService;
import com.zuantan.dismantling.service.KingdeeVoucherQueryService;
import com.zuantan.dismantling.entity.KingdeeAccountConfig;
import com.zuantan.dismantling.vo.SupplierDetailVO;
import com.zuantan.dismantling.vo.VoucherDetailVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/kingdee")
public class KingdeeController {

    private final KingdeeVoucherQueryService kingdeeVoucherQueryService;
    private final KingdeeSupplierQueryService kingdeeSupplierQueryService;
    private final KingdeeLoginService kingdeeLoginService;
    private final KingdeeAccountConfigService kingdeeAccountConfigService;
    private final BankStatementKingdeeVoucherService bankStatementKingdeeVoucherService;

    public KingdeeController(KingdeeVoucherQueryService kingdeeVoucherQueryService,
                               KingdeeSupplierQueryService kingdeeSupplierQueryService,
                               KingdeeLoginService kingdeeLoginService,
                               KingdeeAccountConfigService kingdeeAccountConfigService,
                               BankStatementKingdeeVoucherService bankStatementKingdeeVoucherService) {
        this.kingdeeVoucherQueryService = kingdeeVoucherQueryService;
        this.kingdeeSupplierQueryService = kingdeeSupplierQueryService;
        this.kingdeeLoginService = kingdeeLoginService;
        this.kingdeeAccountConfigService = kingdeeAccountConfigService;
        this.bankStatementKingdeeVoucherService = bankStatementKingdeeVoucherService;
    }

    @PostMapping("/voucher/push-pending")
    public Result<String> pushPendingVouchers(@RequestParam(required = false) Long accountId) {
        try {
            LocalDate today = LocalDate.now();
            bankStatementKingdeeVoucherService.pushAllPendingUpTo(today, accountId);
            return Result.success("已触发银行流水待写入补推，请稍后刷新列表查看结果");
        } catch (Exception e) {
            return Result.error("补推失败：" + e.getMessage());
        }
    }

    @GetMapping("/voucher/probe")
    public Result<Map<String, Object>> probeOrgField(
            @RequestParam(required = false) String kingdeeUrl,
            @RequestParam(required = false) String dbId,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String password,
            @RequestParam(defaultValue = "GL_VOUCHER") String formId,
            @RequestParam(defaultValue = "2025") String year,
            @RequestParam(defaultValue = "11") String period,
            @RequestParam(defaultValue = "106") String orgCompanyCode) {
        try {
            String effectiveUrl = kingdeeUrl != null ? kingdeeUrl : "https://dichanerp.huaxianggroup.cn/k3cloud/";
            String effectiveDbId = dbId != null ? dbId : "61cbb7b2d5e132";
            String sessionId = kingdeeLoginService.login(effectiveUrl, effectiveDbId, username, password);
            Map<String, Object> probeResult = kingdeeVoucherQueryService.probeOrgField(
                    effectiveUrl, sessionId, formId, year, period, orgCompanyCode);
            return Result.success(probeResult);
        } catch (Exception e) {
            return Result.error("字段探测失败：" + e.getMessage());
        }
    }

    @PostMapping("/voucher/query")
    public Result<List<VoucherDetailVO>> queryVoucher(
            @RequestParam String formId,
            @RequestBody KingdeeQueryRequest request) {
        try {
            List<VoucherDetailVO> result = kingdeeVoucherQueryService.queryVoucherDetails(
                    request.getKingdeeUrl(),
                    request.getCookie(),
                    formId,
                    request.getAccountingPeriod(),
                    request.getVoucherNumberStart(),
                    request.getVoucherNumberEnd(),
                    request.getOrgCompanyCode() != null ? request.getOrgCompanyCode() : "106",
                    KingdeeVoucherQueryService.ORG_FIELD_KEY);
            return Result.success(result);
        } catch (Exception e) {
            return Result.error("查询失败：" + e.getMessage());
        }
    }

    @GetMapping("/supplier/page")
    public Result<PageResult<List<SupplierDetailVO>>> getSupplierPage(
            @RequestParam(defaultValue = "1") Integer pageNo,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) String kingdeeUrl,
            @RequestParam(required = false) String dbId,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String password,
            @RequestParam(required = false) String supplierNumber,
            @RequestParam(required = false) String supplierName,
            @RequestParam(required = false) String useOrgCode) {
        try {
            KingdeeAccountConfig account = resolveAccount(accountId, kingdeeUrl, dbId, username, password);
            String effectiveUseOrgCode = useOrgCode != null && !useOrgCode.isEmpty()
                    ? useOrgCode : account.getUseOrgCode();

            String sessionId = kingdeeLoginService.login(
                    account.getKingdeeUrl(), account.getDbId(), account.getUsername(), account.getPassword());

            List<SupplierDetailVO> allData = kingdeeSupplierQueryService.querySuppliers(
                    account.getKingdeeUrl(), sessionId, supplierNumber, supplierName, effectiveUseOrgCode);

            int start = (pageNo - 1) * pageSize;
            int end = Math.min(start + pageSize, allData.size());
            List<SupplierDetailVO> pageData = start < allData.size()
                    ? allData.subList(start, end) : Collections.emptyList();

            PageResult<List<SupplierDetailVO>> pageResult = new PageResult<>();
            pageResult.setTotal((long) allData.size());
            pageResult.setRecords(pageData);
            return Result.success(pageResult);
        } catch (Exception e) {
            return Result.error("查询失败：" + e.getMessage());
        }
    }

    @GetMapping("/voucher/page")
    public Result<PageResult<List<VoucherDetailVO>>> getVoucherPage(
            @RequestParam(defaultValue = "1") Integer pageNo,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) String kingdeeUrl,
            @RequestParam(required = false) String dbId,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String password,
            @RequestParam(required = false) String formId,
            @RequestParam(required = false) String accountingPeriod,
            @RequestParam(required = false) String voucherNumberStart,
            @RequestParam(required = false) String voucherNumberEnd,
            @RequestParam(required = false) String orgCompanyCode) {
        try {
            KingdeeAccountConfig account = resolveAccount(accountId, kingdeeUrl, dbId, username, password);
            String effectiveFormId = formId != null && !formId.isEmpty()
                    ? formId : defaultIfBlank(account.getDefaultFormId(), "GL_VOUCHER");
            String effectiveAccountingPeriod = accountingPeriod != null && !accountingPeriod.isEmpty()
                    ? accountingPeriod : defaultIfBlank(account.getDefaultAccountingPeriod(), "202401");
            String effectiveOrgCompanyCode = orgCompanyCode != null && !orgCompanyCode.isEmpty()
                    ? orgCompanyCode : defaultIfBlank(account.getOrgCompanyCode(), "106");

            String sessionId = kingdeeLoginService.login(
                    account.getKingdeeUrl(), account.getDbId(), account.getUsername(), account.getPassword());

            List<VoucherDetailVO> allData = kingdeeVoucherQueryService.queryVoucherDetails(
                    account.getKingdeeUrl(),
                    sessionId,
                    effectiveFormId,
                    effectiveAccountingPeriod,
                    voucherNumberStart,
                    voucherNumberEnd,
                    effectiveOrgCompanyCode,
                    KingdeeVoucherQueryService.ORG_FIELD_KEY);

            int start = (pageNo - 1) * pageSize;
            int end = Math.min(start + pageSize, allData.size());
            List<VoucherDetailVO> pageData = start < allData.size()
                    ? allData.subList(start, end) : Collections.emptyList();

            PageResult<List<VoucherDetailVO>> pageResult = new PageResult<>();
            pageResult.setTotal((long) allData.size());
            pageResult.setRecords(pageData);
            return Result.success(pageResult);
        } catch (Exception e) {
            return Result.error("查询失败：" + e.getMessage());
        }
    }

    private KingdeeAccountConfig resolveAccount(Long accountId, String kingdeeUrl, String dbId,
                                                String username, String password) {
        if (accountId != null) {
            return kingdeeAccountConfigService.resolveForLogin(accountId);
        }
        KingdeeAccountConfig account = new KingdeeAccountConfig();
        account.setKingdeeUrl(kingdeeUrl != null ? kingdeeUrl : "https://dichanerp.huaxianggroup.cn/k3cloud/");
        account.setDbId(dbId != null ? dbId : "61cbb7b2d5e132");
        account.setUsername(username != null ? username : "");
        account.setPassword(password != null ? password : "");
        return account;
    }

    private String defaultIfBlank(String value, String fallback) {
        return value != null && !value.isEmpty() ? value : fallback;
    }

    public static class KingdeeQueryRequest {
        private String cookie;
        private String kingdeeUrl;
        private String accountingPeriod;
        private String voucherNumberStart;
        private String voucherNumberEnd;
        private String orgCompanyCode;

        public String getCookie() {
            return cookie;
        }

        public void setCookie(String cookie) {
            this.cookie = cookie;
        }

        public String getKingdeeUrl() {
            return kingdeeUrl;
        }

        public void setKingdeeUrl(String kingdeeUrl) {
            this.kingdeeUrl = kingdeeUrl;
        }

        public String getAccountingPeriod() {
            return accountingPeriod;
        }

        public void setAccountingPeriod(String accountingPeriod) {
            this.accountingPeriod = accountingPeriod;
        }

        public String getVoucherNumberStart() {
            return voucherNumberStart;
        }

        public void setVoucherNumberStart(String voucherNumberStart) {
            this.voucherNumberStart = voucherNumberStart;
        }

        public String getVoucherNumberEnd() {
            return voucherNumberEnd;
        }

        public void setVoucherNumberEnd(String voucherNumberEnd) {
            this.voucherNumberEnd = voucherNumberEnd;
        }

        public String getOrgCompanyCode() {
            return orgCompanyCode;
        }

        public void setOrgCompanyCode(String orgCompanyCode) {
            this.orgCompanyCode = orgCompanyCode;
        }
    }
}
