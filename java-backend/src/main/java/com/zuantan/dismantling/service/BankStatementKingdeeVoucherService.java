package com.zuantan.dismantling.service;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.zuantan.dismantling.config.KingdeeExpenseReimbursementVoucherProperties;
import com.zuantan.dismantling.config.KingdeeFundUsageVoucherProperties;
import com.zuantan.dismantling.entity.BankStatement;
import com.zuantan.dismantling.entity.KingdeeAccountConfig;
import com.zuantan.dismantling.mapper.BankStatementMapper;
import com.zuantan.dismantling.vo.KingdeeVoucherEntryBuildResult;
import com.zuantan.dismantling.vo.KingdeeVoucherHeaderVO;
import com.zuantan.dismantling.vo.KingdeeVoucherSaveResultVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class BankStatementKingdeeVoucherService {

    private static final Logger log = LoggerFactory.getLogger(BankStatementKingdeeVoucherService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final BankStatementMapper bankStatementMapper;
    private final BankStatementService bankStatementService;
    private final KingdeeAccountConfigService kingdeeAccountConfigService;
    private final KingdeeLoginService kingdeeLoginService;
    private final KingdeeVoucherSaveService kingdeeVoucherSaveService;
    private final KingdeeVoucherQueryService kingdeeVoucherQueryService;
    private final KingdeeSupplierQueryService kingdeeSupplierQueryService;
    private final KingdeeExpenseReimbursementVoucherProperties expenseProperties;
    private final KingdeeFundUsageVoucherProperties fundUsageProperties;

    public BankStatementKingdeeVoucherService(BankStatementMapper bankStatementMapper,
                                              BankStatementService bankStatementService,
                                              KingdeeAccountConfigService kingdeeAccountConfigService,
                                              KingdeeLoginService kingdeeLoginService,
                                              KingdeeVoucherSaveService kingdeeVoucherSaveService,
                                              KingdeeVoucherQueryService kingdeeVoucherQueryService,
                                              KingdeeSupplierQueryService kingdeeSupplierQueryService,
                                              KingdeeExpenseReimbursementVoucherProperties expenseProperties,
                                              KingdeeFundUsageVoucherProperties fundUsageProperties) {
        this.bankStatementMapper = bankStatementMapper;
        this.bankStatementService = bankStatementService;
        this.kingdeeAccountConfigService = kingdeeAccountConfigService;
        this.kingdeeLoginService = kingdeeLoginService;
        this.kingdeeVoucherSaveService = kingdeeVoucherSaveService;
        this.kingdeeVoucherQueryService = kingdeeVoucherQueryService;
        this.kingdeeSupplierQueryService = kingdeeSupplierQueryService;
        this.expenseProperties = expenseProperties;
        this.fundUsageProperties = fundUsageProperties;
    }

    public void pushAllPendingUpTo(LocalDate endDateInclusive, Long accountId) {
        List<PendingGroup> groups = listPendingGroups(endDateInclusive);
        if (groups.isEmpty()) {
            log.info("银行流水金蝶推送：截至 {} 无待写入明细", endDateInclusive);
            return;
        }
        log.info("银行流水金蝶推送：截至 {} 发现 {} 组待写入", endDateInclusive, groups.size());
        for (PendingGroup group : groups) {
            try {
                pushBatchToKingdee(group.itemIds, accountId);
            } catch (Exception e) {
                log.error("银行流水金蝶推送失败：date={}, bankSource={}", group.voucherDate, group.bankSource, e);
            }
        }
    }

    public KingdeeVoucherSaveResultVO pushToKingdee(Long itemId, Long accountId) {
        return pushBatchToKingdee(Collections.singletonList(itemId), accountId);
    }

    public KingdeeVoucherSaveResultVO pushBatchToKingdee(List<Long> itemIds, Long accountId) {
        if (itemIds == null || itemIds.isEmpty()) {
            throw new RuntimeException("请选择要写入的流水");
        }
        List<BankStatement> items = bankStatementService.listByIds(itemIds);
        for (BankStatement item : items) {
            validatePushable(item);
        }

        LocalDate voucherDate = null;
        String bankSource = null;
        for (BankStatement item : items) {
            LocalDate date = resolveVoucherDate(item);
            if (voucherDate == null) {
                voucherDate = date;
            } else if (!voucherDate.equals(date)) {
                throw new RuntimeException("批量写入要求所选流水的交易日期相同");
            }
            if (bankSource == null) {
                bankSource = item.getBankSource();
            } else if (!bankSource.equals(item.getBankSource())) {
                throw new RuntimeException("批量写入要求所选流水属于同一银行（工商/晋商分两个银字号）");
            }
        }

        KingdeeAccountConfig account = resolveAccount(accountId);
        String orgCompanyCode = defaultIfBlank(account.getOrgCompanyCode(), "106");
        String useOrgCode = account.getUseOrgCode();

        try {
            String sessionId = kingdeeLoginService.login(
                    account.getKingdeeUrl(), account.getDbId(), account.getUsername(), account.getPassword());
            String formId = fundUsageProperties.getFormId();
            boolean residualFee = isResidualFeeBatch(items);
            String voucherGroupName = residualFee
                    ? defaultIfBlank(fundUsageProperties.getResidualFeeVoucherGroup(), "转")
                    : fundUsageProperties.getVoucherGroup();
            String voucherGroupNumber = resolveVoucherGroupNumber(
                    account.getKingdeeUrl(), sessionId, residualFee);

            KingdeeVoucherEntryBuildResult buildResult = buildVoucherEntries(
                    items, account.getKingdeeUrl(), sessionId, useOrgCode);
            List<Long> succeededItemIds = buildResult.getSucceededItemIds();
            if (succeededItemIds.isEmpty()) {
                String message = buildResult.getLastErrorMessage();
                throw new RuntimeException(StringUtils.hasText(message) ? message : "所选流水均无法写入金蝶");
            }

            JSONArray entity = buildResult.getEntity();
            String firstExplanation = buildResult.getFirstExplanation();
            KingdeeVoucherHeaderVO existingHeader = resolveExistingVoucher(
                    succeededItemIds, voucherDate, bankSource, residualFee,
                    account.getKingdeeUrl(), sessionId, formId, orgCompanyCode);

            KingdeeVoucherSaveResultVO result;
            try {
                if (existingHeader != null && StringUtils.hasText(existingHeader.getVoucherId())) {
                    JSONObject appendModel = new JSONObject();
                    appendModel.put("FVOUCHERID", existingHeader.getVoucherId());
                    appendModel.put("FEntity", entity);
                    result = kingdeeVoucherSaveService.save(
                            account.getKingdeeUrl(), sessionId, formId, appendModel, firstExplanation,
                            voucherGroupName, false);
                    result.setSavedMode("appended");
                    if (!StringUtils.hasText(result.getVoucherNumber())
                            && StringUtils.hasText(existingHeader.getVoucherNumber())) {
                        result.setVoucherNumber(existingHeader.getVoucherNumber());
                    }
                    if (!StringUtils.hasText(result.getVoucherId())) {
                        result.setVoucherId(existingHeader.getVoucherId());
                    }
                } else {
                    JSONObject model = buildNewVoucherModel(voucherDate, orgCompanyCode, voucherGroupNumber, entity);
                    result = kingdeeVoucherSaveService.save(
                            account.getKingdeeUrl(), sessionId, formId, model, firstExplanation,
                            voucherGroupName, true);
                    result.setSavedMode("created");
                }
            } catch (RuntimeException e) {
                KingdeeVoucherSaveResultVO recovered = recoverIfVoucherAlreadyExists(
                        e, account.getKingdeeUrl(), sessionId, formId, voucherDate, bankSource,
                        orgCompanyCode, succeededItemIds, residualFee);
                if (recovered != null) {
                    return recovered;
                }
                markItemsPushError(succeededItemIds, e.getMessage());
                throw e;
            }

            markItemsPushed(succeededItemIds, result);
            result.setItemCount(succeededItemIds.size());
            return result;
        } catch (IOException e) {
            throw new RuntimeException("金蝶登录失败：" + e.getMessage(), e);
        }
    }

    private KingdeeVoucherEntryBuildResult buildVoucherEntries(List<BankStatement> items,
                                                               String kingdeeUrl,
                                                               String sessionId,
                                                               String useOrgCode) {
        Map<String, String> employeeCache = new HashMap<>();
        Map<String, String> supplierCache = new HashMap<>();
        Map<String, String> bankCache = new HashMap<>();
        Map<String, CreditBank> creditBankCache = new HashMap<>();
        JSONArray entity = new JSONArray();
        String firstExplanation = null;
        List<Long> succeededItemIds = new ArrayList<>();
        String lastErrorMessage = null;

        for (BankStatement item : items) {
            try {
                String explanation = buildExplanation(item);
                String amountText = formatAmount(item.getAmount());
                CreditBank creditBank = creditBankCache.computeIfAbsent(item.getBankSource(),
                        source -> resolveCreditBank(kingdeeUrl, sessionId, source, bankCache));
                entity.addAll(buildEntriesForItem(
                        kingdeeUrl, sessionId, useOrgCode, item, explanation, amountText,
                        creditBank, employeeCache, supplierCache, bankCache));
                clearItemPushError(item.getId());
                succeededItemIds.add(item.getId());
                if (firstExplanation == null) {
                    firstExplanation = explanation;
                }
            } catch (RuntimeException e) {
                markItemPushError(item.getId(), e.getMessage());
                lastErrorMessage = e.getMessage();
                log.warn("银行流水写入金蝶跳过：itemId={}, reason={}", item.getId(), e.getMessage());
            }
        }

        KingdeeVoucherEntryBuildResult result = new KingdeeVoucherEntryBuildResult();
        result.setEntity(entity);
        result.setFirstExplanation(firstExplanation);
        result.setItemCount(succeededItemIds.size());
        result.setSucceededItemIds(succeededItemIds);
        result.setLastErrorMessage(lastErrorMessage);
        return result;
    }

    private JSONArray buildEntriesForItem(String kingdeeUrl, String sessionId, String useOrgCode,
                                          BankStatement item, String explanation, String amountText,
                                          CreditBank creditBank,
                                          Map<String, String> employeeCache,
                                          Map<String, String> supplierCache,
                                          Map<String, String> bankCache) {
        JSONArray entries = new JSONArray();
        String type = item.getVoucherType();
        if (BankStatement.TYPE_EXPENSE.equals(type)) {
            String employeeName = resolveEmployeeName(item);
            String employeeNumber = employeeCache.computeIfAbsent(employeeName,
                    name -> resolveEmployeeNumber(kingdeeUrl, sessionId, name));
            entries.add(buildEmployeeDebitEntry(explanation, amountText, employeeNumber));
            entries.add(buildBankCreditEntry(explanation, amountText,
                    creditBank.accountCode, creditBank.bankNumber));
            return entries;
        }
        if (BankStatement.TYPE_REPAIR.equals(type)) {
            String payee = resolvePayeeName(item);
            entries.add(buildSupplierDebitEntry(explanation, amountText,
                    fundUsageProperties.getRepairDebitAccount(),
                    resolveSupplierNumber(kingdeeUrl, sessionId, useOrgCode, payee, supplierCache)));
            entries.add(buildBankCreditEntry(explanation, amountText,
                    creditBank.accountCode, creditBank.bankNumber));
            return entries;
        }
        if (BankStatement.TYPE_MATERIAL.equals(type)) {
            String payee = resolvePayeeName(item);
            entries.add(buildSupplierDebitEntry(explanation, amountText,
                    fundUsageProperties.getMaterialDebitAccount(),
                    resolveSupplierNumber(kingdeeUrl, sessionId, useOrgCode, payee, supplierCache)));
            entries.add(buildBankCreditEntry(explanation, amountText,
                    creditBank.accountCode, creditBank.bankNumber));
            return entries;
        }
        if (BankStatement.TYPE_TAX.equals(type)) {
            entries.add(buildPlainDebitEntry(explanation, amountText, fundUsageProperties.getTaxDebitAccount()));
            entries.add(buildBankCreditEntry(explanation, amountText,
                    creditBank.accountCode, creditBank.bankNumber));
            return entries;
        }
        if (BankStatement.TYPE_TRANSFER.equals(type)) {
            String targetBankName = resolveTargetBankName(item);
            String transferBankNumber = bankCache.computeIfAbsent(targetBankName,
                    key -> resolveBankNumber(kingdeeUrl, sessionId, key));
            String debitAccount = fundUsageProperties.resolveTransferDebitAccount(targetBankName);
            entries.add(buildBankDebitEntry(explanation, amountText, debitAccount, transferBankNumber));
            entries.add(buildBankCreditEntry(explanation, amountText,
                    creditBank.accountCode, creditBank.bankNumber));
            return entries;
        }
        if (BankStatement.TYPE_PART_INCOME.equals(type)) {
            String creditAccount = fundUsageProperties.getPartIncomeCreditAccount();
            if (!StringUtils.hasText(creditAccount)) {
                throw new RuntimeException("未配置配件收入科目");
            }
            entries.add(buildBankDebitEntry(explanation, amountText,
                    creditBank.accountCode, creditBank.bankNumber));
            entries.add(buildPlainCreditEntry(explanation, amountText, creditAccount.trim()));
            return entries;
        }
        if (BankStatement.TYPE_RESIDUAL_FEE.equals(type)) {
            String debitAccount = fundUsageProperties.getResidualFeeDebitAccount();
            if (!StringUtils.hasText(debitAccount)) {
                throw new RuntimeException("未配置残值费科目");
            }
            entries.add(buildPlainDebitEntry(explanation, amountText, debitAccount.trim()));
            entries.add(buildBankCreditEntry(explanation, amountText,
                    creditBank.accountCode, creditBank.bankNumber));
            return entries;
        }
        throw new RuntimeException("不支持的业务类型：" + type);
    }

    private String buildExplanation(BankStatement item) {
        String amountText = formatAmount(item.getAmount());
        String type = item.getVoucherType();
        if (BankStatement.TYPE_EXPENSE.equals(type)) {
            return "支付" + resolveEmployeeName(item) + amountText + "元。";
        }
        if (BankStatement.TYPE_TAX.equals(type)) {
            String reason = firstNonBlank(item.getPurpose(), item.getSummary(), item.getRemark());
            if (StringUtils.hasText(reason)) {
                String trimmed = reason.trim();
                if (trimmed.endsWith("。") || trimmed.endsWith(".")) {
                    return trimmed;
                }
                return trimmed + "。";
            }
            return "缴纳税款" + amountText + "元。";
        }
        if (BankStatement.TYPE_TRANSFER.equals(type)) {
            return "转入" + extractBankShortName(resolveTargetBankName(item)) + amountText + "元。";
        }
        if (BankStatement.TYPE_PART_INCOME.equals(type)) {
            return "收配件款" + amountText + "元。";
        }
        if (BankStatement.TYPE_RESIDUAL_FEE.equals(type)) {
            String reason = firstNonBlank(item.getPurpose(), item.getSummary(), item.getRemark());
            if (StringUtils.hasText(reason) && reason.contains("残值费")) {
                String trimmed = reason.trim();
                if (trimmed.endsWith("。") || trimmed.endsWith(".")) {
                    return trimmed;
                }
                return trimmed + "。";
            }
            return "支付" + resolvePayeeName(item) + "车辆残值费" + amountText + "元。";
        }
        return "支付" + resolvePayeeName(item) + amountText + "元。";
    }

    private String resolveEmployeeName(BankStatement item) {
        if (StringUtils.hasText(item.getEmployeeName())) {
            return item.getEmployeeName().trim();
        }
        if (StringUtils.hasText(item.getSuggestedEmployeeName())) {
            return item.getSuggestedEmployeeName().trim();
        }
        if (StringUtils.hasText(item.getCounterpartyName())) {
            return item.getCounterpartyName().trim();
        }
        throw new RuntimeException("费用报销类型需要员工姓名");
    }

    private String resolvePayeeName(BankStatement item) {
        if (StringUtils.hasText(item.getPayeeOverride())) {
            return item.getPayeeOverride().trim();
        }
        if (StringUtils.hasText(item.getCounterpartyName())) {
            return item.getCounterpartyName().trim();
        }
        return "收款方";
    }

    private String resolveTargetBankName(BankStatement item) {
        if (StringUtils.hasText(item.getTargetBankName())) {
            return item.getTargetBankName().trim();
        }
        if (StringUtils.hasText(item.getCounterpartyBankName())) {
            return item.getCounterpartyBankName().trim();
        }
        String text = firstNonBlank(item.getRemark(), item.getSummary(), item.getPurpose(), item.getReceiptInfo());
        if (StringUtils.hasText(text)) {
            if (text.contains("晋商")) {
                return "晋商银行";
            }
            if (text.contains("工商")) {
                return "工商银行";
            }
        }
        return BankStatement.SOURCE_ICBC.equals(item.getBankSource()) ? "晋商银行" : "工商银行";
    }

    private CreditBank resolveCreditBank(String kingdeeUrl, String sessionId, String bankSource,
                                         Map<String, String> bankCache) {
        CreditBank creditBank = new CreditBank();
        if (BankStatement.SOURCE_JINSHANG.equals(bankSource)) {
            creditBank.accountCode = fundUsageProperties.resolveTransferDebitAccount("晋商银行");
            creditBank.bankNumber = bankCache.computeIfAbsent("晋商银行",
                    key -> resolveBankNumber(kingdeeUrl, sessionId, key));
            return creditBank;
        }
        creditBank.accountCode = fundUsageProperties.getCreditAccount();
        String resolved = fundUsageProperties.resolveBankDimensionNumber();
        if (!StringUtils.hasText(resolved)) {
            resolved = expenseProperties.resolveBankDimensionNumber(null);
        }
        if (!StringUtils.hasText(resolved)) {
            throw new RuntimeException("未配置工商银行核算维度编码");
        }
        creditBank.bankNumber = resolved.trim();
        return creditBank;
    }

    private String resolveEmployeeNumber(String kingdeeUrl, String sessionId, String employeeName) {
        String queried = kingdeeVoucherQueryService.findEmployeeNumberByName(kingdeeUrl, sessionId, employeeName);
        if (!StringUtils.hasText(queried)) {
            throw new RuntimeException("未在金蝶员工档案中找到「" + employeeName + "」对应的员工编码");
        }
        return queried.trim();
    }

    private String resolveSupplierNumber(String kingdeeUrl, String sessionId, String useOrgCode,
                                         String payeeName, Map<String, String> supplierCache) {
        if (!StringUtils.hasText(payeeName)) {
            throw new RuntimeException("收款单位不能为空，无法匹配供应商核算维度");
        }
        String trimmed = payeeName.trim();
        return supplierCache.computeIfAbsent(trimmed, name -> {
            String queried = kingdeeSupplierQueryService.findSupplierNumberByName(
                    kingdeeUrl, sessionId, name, useOrgCode);
            if (!StringUtils.hasText(queried)) {
                throw new RuntimeException("未在金蝶供应商档案中找到与「" + name + "」匹配的供应商编码");
            }
            return queried.trim();
        });
    }

    private String resolveBankNumber(String kingdeeUrl, String sessionId, String bankName) {
        String queried = kingdeeVoucherQueryService.findBankNumberByName(kingdeeUrl, sessionId, bankName);
        if (!StringUtils.hasText(queried)) {
            throw new RuntimeException("未在金蝶银行档案中找到与「" + bankName + "」匹配的核算维度编码");
        }
        return queried.trim();
    }

    private void validatePushable(BankStatement item) {
        boolean partIncome = BankStatement.TYPE_PART_INCOME.equals(item.getVoucherType());
        if (partIncome) {
            if (!BankStatement.DIRECTION_IN.equals(item.getDirection())) {
                throw new RuntimeException("配件收入须为收入流水");
            }
        } else if (!BankStatement.DIRECTION_OUT.equals(item.getDirection())) {
            throw new RuntimeException("仅支出流水或配件收入可写入金蝶");
        }
        if (item.getAmount() == null || item.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("金额必须大于0");
        }
        if (!StringUtils.hasText(item.getVoucherType())) {
            throw new RuntimeException("请先选择业务类型后再写入金蝶");
        }
        if (item.getKingdeeExistStatus() != null && item.getKingdeeExistStatus() == 1) {
            String word = StringUtils.hasText(item.getKingdeeExistVoucherWord())
                    ? item.getKingdeeExistVoucherWord() : "银";
            String no = StringUtils.hasText(item.getKingdeeExistVoucherNo())
                    ? item.getKingdeeExistVoucherNo() : "";
            throw new RuntimeException("金蝶已存在该流水，凭证：" + word + no + "，无需重复写入");
        }
        if (StringUtils.hasText(item.getKingdeeVoucherId())) {
            String voucherNo = StringUtils.hasText(item.getKingdeeVoucherNo())
                    ? item.getKingdeeVoucherNo() : item.getKingdeeVoucherId();
            throw new RuntimeException("该流水已写入金蝶，凭证号：" + voucherNo);
        }
    }

    private LocalDate resolveVoucherDate(BankStatement item) {
        if (item.getTradeTime() != null) {
            return item.getTradeTime().toLocalDate();
        }
        return LocalDate.now();
    }

    private boolean isResidualFeeBatch(List<BankStatement> items) {
        boolean residual = false;
        boolean other = false;
        for (BankStatement item : items) {
            if (BankStatement.TYPE_RESIDUAL_FEE.equals(item.getVoucherType())) {
                residual = true;
            } else {
                other = true;
            }
        }
        if (residual && other) {
            throw new RuntimeException("残值费记转字凭证，请与银字业务分开写入");
        }
        return residual;
    }

    private KingdeeVoucherHeaderVO resolveExistingVoucher(List<Long> excludeItemIds,
                                                          LocalDate importDate,
                                                          String bankSource,
                                                          boolean residualFee,
                                                          String kingdeeUrl,
                                                          String sessionId,
                                                          String formId,
                                                          String orgCompanyCode) {
        KingdeeVoucherHeaderVO localHeader = findPushedVoucherForDateAndBank(
                excludeItemIds, importDate, bankSource, residualFee);
        // 工商/晋商分两个银字号：仅使用本地同源记录，避免跨银行合并到金蝶同日银字凭证
        if (localHeader != null && StringUtils.hasText(localHeader.getVoucherId())) {
            return localHeader;
        }
        return null;
    }

    public KingdeeVoucherHeaderVO findPushedVoucherForDateAndBank(List<Long> excludeItemIds,
                                                                  LocalDate importDate,
                                                                  String bankSource,
                                                                  boolean residualFee) {
        LambdaQueryWrapper<BankStatement> wrapper = new LambdaQueryWrapper<BankStatement>()
                .eq(BankStatement::getBankSource, bankSource)
                .isNotNull(BankStatement::getKingdeeVoucherId)
                .ne(BankStatement::getKingdeeVoucherId, "")
                .notLike(BankStatement::getKingdeeVoucherId, "EXIST-%")
                .apply("DATE(trade_time) = {0}", importDate)
                .orderByAsc(BankStatement::getId)
                .last("LIMIT 1");
        if (residualFee) {
            wrapper.eq(BankStatement::getVoucherType, BankStatement.TYPE_RESIDUAL_FEE);
        } else {
            wrapper.and(w -> w.isNull(BankStatement::getVoucherType)
                    .or().ne(BankStatement::getVoucherType, BankStatement.TYPE_RESIDUAL_FEE));
        }
        if (excludeItemIds != null && !excludeItemIds.isEmpty()) {
            wrapper.notIn(BankStatement::getId, excludeItemIds);
        }
        BankStatement existing = bankStatementMapper.selectOne(wrapper);
        if (existing == null || !StringUtils.hasText(existing.getKingdeeVoucherId())) {
            return null;
        }
        KingdeeVoucherHeaderVO header = new KingdeeVoucherHeaderVO();
        header.setVoucherId(existing.getKingdeeVoucherId());
        header.setVoucherNumber(existing.getKingdeeVoucherNo());
        return header;
    }

    private KingdeeVoucherSaveResultVO recoverIfVoucherAlreadyExists(RuntimeException error,
                                                                     String kingdeeUrl,
                                                                     String sessionId,
                                                                     String formId,
                                                                     LocalDate voucherDate,
                                                                     String bankSource,
                                                                     String orgCompanyCode,
                                                                     List<Long> itemIds,
                                                                     boolean residualFee) {
        if (!kingdeeVoucherQueryService.isDataConflictError(error.getMessage())) {
            return null;
        }
        KingdeeVoucherHeaderVO localHeader = findPushedVoucherForDateAndBank(
                itemIds, voucherDate, bankSource, residualFee);
        if (localHeader != null && StringUtils.hasText(localHeader.getVoucherId())) {
            KingdeeVoucherSaveResultVO result = new KingdeeVoucherSaveResultVO();
            result.setVoucherId(localHeader.getVoucherId());
            result.setVoucherNumber(localHeader.getVoucherNumber());
            result.setSavedMode("synced");
            markItemsPushed(itemIds, result);
            result.setItemCount(itemIds.size());
            return result;
        }
        KingdeeVoucherHeaderVO header = kingdeeVoucherQueryService.findVoucherHeaderForRecovery(
                kingdeeUrl, sessionId, formId,
                voucherDate.format(DATE_FORMATTER),
                fundUsageProperties.getVoucherGroup(),
                orgCompanyCode,
                error.getMessage());
        if (header == null || !StringUtils.hasText(header.getVoucherId())) {
            return null;
        }
        KingdeeVoucherSaveResultVO result = new KingdeeVoucherSaveResultVO();
        result.setVoucherId(header.getVoucherId());
        result.setVoucherNumber(header.getVoucherNumber());
        result.setSavedMode("synced");
        markItemsPushed(itemIds, result);
        result.setItemCount(itemIds.size());
        log.info("金蝶凭证已存在，已同步本地写入状态：date={}, bank={}, voucherNo={}, count={}",
                voucherDate, bankSource, header.getVoucherNumber(), itemIds.size());
        return result;
    }

    public void markItemsPushed(List<Long> itemIds, KingdeeVoucherSaveResultVO result) {
        for (Long itemId : itemIds) {
            bankStatementMapper.update(null, new LambdaUpdateWrapper<BankStatement>()
                    .eq(BankStatement::getId, itemId)
                    .set(BankStatement::getKingdeeVoucherId, result.getVoucherId())
                    .set(BankStatement::getKingdeeVoucherNo, result.getVoucherNumber())
                    .set(BankStatement::getKingdeePushError, null));
        }
    }

    public void markItemPushError(Long itemId, String errorMessage) {
        if (itemId == null || !StringUtils.hasText(errorMessage)) {
            return;
        }
        BankStatement update = new BankStatement();
        update.setId(itemId);
        update.setKingdeePushError(truncateError(errorMessage));
        bankStatementMapper.updateById(update);
    }

    public void markItemsPushError(List<Long> itemIds, String errorMessage) {
        if (itemIds == null || itemIds.isEmpty() || !StringUtils.hasText(errorMessage)) {
            return;
        }
        String truncated = truncateError(errorMessage);
        for (Long itemId : itemIds) {
            markItemPushError(itemId, truncated);
        }
    }

    private void clearItemPushError(Long itemId) {
        BankStatement existing = bankStatementMapper.selectById(itemId);
        if (existing != null && StringUtils.hasText(existing.getKingdeePushError())) {
            bankStatementMapper.update(null, new LambdaUpdateWrapper<BankStatement>()
                    .eq(BankStatement::getId, itemId)
                    .set(BankStatement::getKingdeePushError, null));
        }
    }

    private List<PendingGroup> listPendingGroups(LocalDate endDateInclusive) {
        List<BankStatement> items = bankStatementMapper.selectList(
                new LambdaQueryWrapper<BankStatement>()
                        .and(w -> w.eq(BankStatement::getDirection, BankStatement.DIRECTION_OUT)
                                .or()
                                .eq(BankStatement::getVoucherType, BankStatement.TYPE_PART_INCOME))
                        .isNotNull(BankStatement::getVoucherType)
                        .ne(BankStatement::getVoucherType, "")
                        .and(w -> w.isNull(BankStatement::getKingdeeVoucherId)
                                .or().eq(BankStatement::getKingdeeVoucherId, ""))
                        .and(w -> w.isNull(BankStatement::getKingdeeExistStatus)
                                .or().ne(BankStatement::getKingdeeExistStatus, 1))
                        .apply("DATE(trade_time) <= {0}", endDateInclusive)
                        .orderByAsc(BankStatement::getTradeTime)
                        .orderByAsc(BankStatement::getId));

        Map<String, PendingGroup> groupMap = new HashMap<>();
        Set<String> order = new LinkedHashSet<>();
        for (BankStatement item : items) {
            if (item.getAmount() == null || item.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            LocalDate date = resolveVoucherDate(item);
            String key = date + "|" + item.getBankSource() + "|"
                    + (BankStatement.TYPE_RESIDUAL_FEE.equals(item.getVoucherType()) ? "RESIDUAL" : "BANK");
            order.add(key);
            PendingGroup group = groupMap.computeIfAbsent(key, k -> {
                PendingGroup g = new PendingGroup();
                g.voucherDate = date;
                g.bankSource = item.getBankSource();
                g.itemIds = new ArrayList<>();
                return g;
            });
            group.itemIds.add(item.getId());
        }
        List<PendingGroup> result = new ArrayList<>();
        for (String key : order) {
            result.add(groupMap.get(key));
        }
        return result;
    }

    private String resolveVoucherGroupNumber(String kingdeeUrl, String sessionId, boolean residualFee) {
        if (residualFee) {
            String groupName = defaultIfBlank(fundUsageProperties.getResidualFeeVoucherGroup(), "转");
            String queried = kingdeeVoucherQueryService.findVoucherGroupNumberByName(
                    kingdeeUrl, sessionId, groupName);
            if (!StringUtils.hasText(queried)) {
                throw new RuntimeException("未在金蝶凭证字中找到「" + groupName + "」");
            }
            return queried.trim();
        }
        if (StringUtils.hasText(fundUsageProperties.getVoucherGroupNumber())) {
            return fundUsageProperties.getVoucherGroupNumber().trim();
        }
        String queried = kingdeeVoucherQueryService.findVoucherGroupNumberByName(
                kingdeeUrl, sessionId, fundUsageProperties.getVoucherGroup());
        return fundUsageProperties.resolveVoucherGroupNumber(queried);
    }

    private JSONObject buildNewVoucherModel(LocalDate voucherDate, String orgCompanyCode,
                                            String voucherGroupNumber, JSONArray entity) {
        JSONObject model = new JSONObject();
        model.put("FVOUCHERID", 0);
        model.put("FAccountBookID", buildNumberObject(orgCompanyCode));
        model.put("FDate", voucherDate.format(DATE_FORMATTER));
        model.put("FYEAR", String.valueOf(voucherDate.getYear()));
        model.put("FPERIOD", String.valueOf(voucherDate.getMonthValue()));
        model.put("FVOUCHERGROUPID", buildNumberObject(voucherGroupNumber));
        model.put("FEntity", entity);
        return model;
    }

    private JSONObject buildEmployeeDebitEntry(String explanation, String amountText, String employeeNumber) {
        JSONObject entry = new JSONObject();
        entry.put("FEntryID", 0);
        entry.put("FEXPLANATION", explanation);
        entry.put("FACCOUNTID", buildNumberObject(expenseProperties.getDebitAccount()));
        applyCurrencyFields(entry);
        entry.put("FDEBIT", amountText);
        entry.put("FCREDIT", 0);
        JSONObject detailId = new JSONObject();
        detailId.put(expenseProperties.getEmployeeDimensionKey(), buildNumberObject(employeeNumber));
        entry.put("FDetailID", detailId);
        return entry;
    }

    private JSONObject buildSupplierDebitEntry(String explanation, String amountText,
                                               String accountCode, String supplierNumber) {
        JSONObject entry = buildBaseEntry(explanation, accountCode);
        entry.put("FDEBIT", amountText);
        entry.put("FCREDIT", 0);
        JSONObject detailId = new JSONObject();
        detailId.put(fundUsageProperties.getSupplierDimensionKey(), buildNumberObject(supplierNumber));
        entry.put("FDetailID", detailId);
        return entry;
    }

    private JSONObject buildPlainDebitEntry(String explanation, String amountText, String accountCode) {
        JSONObject entry = buildBaseEntry(explanation, accountCode);
        entry.put("FDEBIT", amountText);
        entry.put("FCREDIT", 0);
        return entry;
    }

    private JSONObject buildPlainCreditEntry(String explanation, String amountText, String accountCode) {
        JSONObject entry = buildBaseEntry(explanation, accountCode);
        entry.put("FDEBIT", 0);
        entry.put("FCREDIT", amountText);
        return entry;
    }

    private JSONObject buildBankDebitEntry(String explanation, String amountText,
                                           String accountCode, String bankNumber) {
        JSONObject entry = buildBaseEntry(explanation, accountCode);
        entry.put("FDEBIT", amountText);
        entry.put("FCREDIT", 0);
        JSONObject detailId = new JSONObject();
        detailId.put(fundUsageProperties.getBankDimensionKey(), buildNumberObject(bankNumber));
        entry.put("FDetailID", detailId);
        return entry;
    }

    private JSONObject buildBankCreditEntry(String explanation, String amountText,
                                            String accountCode, String bankNumber) {
        JSONObject entry = buildBaseEntry(explanation, accountCode);
        entry.put("FDEBIT", 0);
        entry.put("FCREDIT", amountText);
        JSONObject detailId = new JSONObject();
        detailId.put(fundUsageProperties.getBankDimensionKey(), buildNumberObject(bankNumber));
        entry.put("FDetailID", detailId);
        return entry;
    }

    private JSONObject buildBaseEntry(String explanation, String accountCode) {
        JSONObject entry = new JSONObject();
        entry.put("FEntryID", 0);
        entry.put("FEXPLANATION", explanation);
        entry.put("FACCOUNTID", buildNumberObject(accountCode));
        applyCurrencyFields(entry);
        return entry;
    }

    private void applyCurrencyFields(JSONObject entry) {
        entry.put("FCURRENCYID", buildNumberObject(fundUsageProperties.getCurrencyId()));
        entry.put("FEXCHANGERATETYPE", buildNumberObject(fundUsageProperties.getExchangeRateType()));
        entry.put("FEXCHANGERATE", fundUsageProperties.getExchangeRate());
    }

    private JSONObject buildNumberObject(String number) {
        JSONObject obj = new JSONObject();
        obj.put("FNumber", number);
        return obj;
    }

    private String extractBankShortName(String bankName) {
        if (!StringUtils.hasText(bankName)) {
            return "目标银行";
        }
        String trimmed = bankName.trim();
        if (trimmed.contains("晋商")) {
            return "晋商银行";
        }
        if (trimmed.contains("工商")) {
            return "工商银行";
        }
        if (trimmed.length() > 8) {
            return trimmed.substring(0, 8);
        }
        return trimmed;
    }

    private String formatAmount(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private String truncateError(String errorMessage) {
        String trimmed = errorMessage.trim();
        return trimmed.length() > 500 ? trimmed.substring(0, 500) : trimmed;
    }

    private KingdeeAccountConfig resolveAccount(Long accountId) {
        if (accountId != null) {
            return kingdeeAccountConfigService.resolveForLogin(accountId);
        }
        KingdeeAccountConfig defaultAccount = kingdeeAccountConfigService.getDefaultAccount();
        if (defaultAccount == null) {
            throw new RuntimeException("未配置默认金蝶账号，请先设置默认账号或指定 accountId");
        }
        return defaultAccount;
    }

    private String defaultIfBlank(String value, String fallback) {
        return StringUtils.hasText(value) ? value : fallback;
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value.trim();
            }
        }
        return null;
    }

    private static class CreditBank {
        private String accountCode;
        private String bankNumber;
    }

    private static class PendingGroup {
        private LocalDate voucherDate;
        private String bankSource;
        private List<Long> itemIds;
    }
}
