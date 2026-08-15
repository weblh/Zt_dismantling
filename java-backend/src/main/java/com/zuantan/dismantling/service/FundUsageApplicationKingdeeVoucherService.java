package com.zuantan.dismantling.service;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.zuantan.dismantling.config.KingdeeFundUsageVoucherProperties;
import com.zuantan.dismantling.entity.FundUsageApplication;
import com.zuantan.dismantling.entity.FundUsageApplicationItem;
import com.zuantan.dismantling.entity.KingdeeAccountConfig;
import com.zuantan.dismantling.mapper.FundUsageApplicationItemMapper;
import com.zuantan.dismantling.mapper.FundUsageApplicationMapper;
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
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class FundUsageApplicationKingdeeVoucherService {

    private static final Logger log = LoggerFactory.getLogger(FundUsageApplicationKingdeeVoucherService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private enum PaymentVoucherType {
        REPAIR,
        TAX,
        MATERIAL,
        TRANSFER
    }

    private final FundUsageApplicationItemMapper itemMapper;
    private final FundUsageApplicationMapper applicationMapper;
    private final KingdeeAccountConfigService kingdeeAccountConfigService;
    private final KingdeeLoginService kingdeeLoginService;
    private final KingdeeVoucherSaveService kingdeeVoucherSaveService;
    private final KingdeeVoucherQueryService kingdeeVoucherQueryService;
    private final KingdeeSupplierQueryService kingdeeSupplierQueryService;
    private final KingdeeFundUsageVoucherProperties voucherProperties;

    public FundUsageApplicationKingdeeVoucherService(FundUsageApplicationItemMapper itemMapper,
                                                     FundUsageApplicationMapper applicationMapper,
                                                     KingdeeAccountConfigService kingdeeAccountConfigService,
                                                     KingdeeLoginService kingdeeLoginService,
                                                     KingdeeVoucherSaveService kingdeeVoucherSaveService,
                                                     KingdeeVoucherQueryService kingdeeVoucherQueryService,
                                                     KingdeeSupplierQueryService kingdeeSupplierQueryService,
                                                     KingdeeFundUsageVoucherProperties voucherProperties) {
        this.itemMapper = itemMapper;
        this.applicationMapper = applicationMapper;
        this.kingdeeAccountConfigService = kingdeeAccountConfigService;
        this.kingdeeLoginService = kingdeeLoginService;
        this.kingdeeVoucherSaveService = kingdeeVoucherSaveService;
        this.kingdeeVoucherQueryService = kingdeeVoucherQueryService;
        this.kingdeeSupplierQueryService = kingdeeSupplierQueryService;
        this.voucherProperties = voucherProperties;
    }

    public KingdeeVoucherSaveResultVO pushToKingdee(Long itemId, Long accountId) {
        return pushBatchToKingdee(Collections.singletonList(itemId), accountId);
    }

    public KingdeeVoucherSaveResultVO pushApplicationToKingdee(Long applicationId, Long accountId) {
        if (applicationId == null) {
            throw new RuntimeException("资金使用申请不存在");
        }
        List<FundUsageApplicationItem> items = itemMapper.selectList(
                new LambdaQueryWrapper<FundUsageApplicationItem>()
                        .eq(FundUsageApplicationItem::getApplicationId, applicationId)
                        .and(wrapper -> wrapper.isNull(FundUsageApplicationItem::getKingdeeVoucherId)
                                .or()
                                .eq(FundUsageApplicationItem::getKingdeeVoucherId, ""))
                        .orderByAsc(FundUsageApplicationItem::getRowIndex)
                        .orderByAsc(FundUsageApplicationItem::getId));
        if (items.isEmpty()) {
            throw new RuntimeException("该申请没有可写入金蝶的明细");
        }
        List<Long> itemIds = new ArrayList<>();
        for (FundUsageApplicationItem item : items) {
            itemIds.add(item.getId());
        }
        return pushBatchToKingdee(itemIds, accountId);
    }

    public KingdeeVoucherSaveResultVO pushBatchToKingdee(List<Long> itemIds, Long accountId) {
        if (itemIds == null || itemIds.isEmpty()) {
            throw new RuntimeException("请选择要写入的明细");
        }

        Set<Long> uniqueIds = new HashSet<>(itemIds);
        List<FundUsageApplicationItem> items = new ArrayList<>();
        for (Long itemId : uniqueIds) {
            FundUsageApplicationItem item = itemMapper.selectById(itemId);
            if (item == null) {
                throw new RuntimeException("资金使用申请明细不存在：" + itemId);
            }
            items.add(item);
        }
        items.sort((a, b) -> Long.compare(a.getId(), b.getId()));

        Map<Long, FundUsageApplication> headerMap = new HashMap<>();
        for (FundUsageApplicationItem item : items) {
            FundUsageApplication header = applicationMapper.selectById(item.getApplicationId());
            if (header == null) {
                throw new RuntimeException("资金使用申请不存在：" + item.getApplicationId());
            }
            validate(header, item);
            headerMap.put(item.getId(), header);
        }

        LocalDate voucherDate = null;
        for (FundUsageApplicationItem item : items) {
            LocalDate importDate = resolveVoucherDate(item, headerMap.get(item.getId()));
            if (voucherDate == null) {
                voucherDate = importDate;
            } else if (!voucherDate.equals(importDate)) {
                throw new RuntimeException("批量写入要求所选明细的入库日期相同");
            }
        }

        KingdeeAccountConfig account = resolveAccount(accountId);
        String orgCompanyCode = defaultIfBlank(account.getOrgCompanyCode(), "106");
        String useOrgCode = account.getUseOrgCode();

        try {
            String sessionId = kingdeeLoginService.login(
                    account.getKingdeeUrl(), account.getDbId(), account.getUsername(), account.getPassword());
            String formId = voucherProperties.getFormId();
            String voucherGroupNumber = resolveVoucherGroupNumber(account.getKingdeeUrl(), sessionId);

            KingdeeVoucherEntryBuildResult buildResult = buildVoucherEntries(items, headerMap,
                    account.getKingdeeUrl(), sessionId, useOrgCode);
            List<Long> succeededItemIds = buildResult.getSucceededItemIds();
            if (succeededItemIds.isEmpty()) {
                String message = buildResult.getLastErrorMessage();
                throw new RuntimeException(StringUtils.hasText(message) ? message : "所选明细均无法写入金蝶");
            }

            JSONArray entity = buildResult.getEntity();
            String firstExplanation = buildResult.getFirstExplanation();

            KingdeeVoucherHeaderVO existingHeader = resolveExistingVoucherForImportDate(
                    succeededItemIds, voucherDate, account.getKingdeeUrl(), sessionId, formId, orgCompanyCode);

            KingdeeVoucherSaveResultVO result;
            try {
                if (existingHeader != null && StringUtils.hasText(existingHeader.getVoucherId())) {
                    JSONObject appendModel = new JSONObject();
                    appendModel.put("FVOUCHERID", existingHeader.getVoucherId());
                    appendModel.put("FEntity", entity);
                    result = kingdeeVoucherSaveService.save(
                            account.getKingdeeUrl(), sessionId, formId, appendModel, firstExplanation,
                            voucherProperties.getVoucherGroup(), false);
                    result.setSavedMode("appended");
                    if (!StringUtils.hasText(result.getVoucherNumber()) && StringUtils.hasText(existingHeader.getVoucherNumber())) {
                        result.setVoucherNumber(existingHeader.getVoucherNumber());
                    }
                    if (!StringUtils.hasText(result.getVoucherId())) {
                        result.setVoucherId(existingHeader.getVoucherId());
                    }
                } else {
                    JSONObject model = buildNewVoucherModel(voucherDate, orgCompanyCode, voucherGroupNumber, entity);
                    result = kingdeeVoucherSaveService.save(
                            account.getKingdeeUrl(), sessionId, formId, model, firstExplanation,
                            voucherProperties.getVoucherGroup(), true);
                    result.setSavedMode("created");
                }
            } catch (RuntimeException e) {
                KingdeeVoucherSaveResultVO recovered = recoverIfVoucherAlreadyExists(
                        e, account.getKingdeeUrl(), sessionId, formId, voucherDate, orgCompanyCode, succeededItemIds);
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

    public KingdeeVoucherEntryBuildResult buildVoucherEntries(List<Long> itemIds,
                                                              String kingdeeUrl,
                                                              String sessionId,
                                                              String useOrgCode) {
        List<FundUsageApplicationItem> items = loadAndValidateItems(itemIds);
        Map<Long, FundUsageApplication> headerMap = new HashMap<>();
        for (FundUsageApplicationItem item : items) {
            FundUsageApplication header = applicationMapper.selectById(item.getApplicationId());
            if (header == null) {
                throw new RuntimeException("资金使用申请不存在：" + item.getApplicationId());
            }
            headerMap.put(item.getId(), header);
        }
        return buildVoucherEntries(items, headerMap, kingdeeUrl, sessionId, useOrgCode);
    }

    private KingdeeVoucherEntryBuildResult buildVoucherEntries(List<FundUsageApplicationItem> items,
                                                               Map<Long, FundUsageApplication> headerMap,
                                                               String kingdeeUrl,
                                                               String sessionId,
                                                               String useOrgCode) {
        String icbcBankNumber = resolveIcbcBankNumber();
        Map<String, String> supplierCache = new HashMap<>();
        Map<String, String> bankCache = new HashMap<>();
        JSONArray entity = new JSONArray();
        String firstExplanation = null;
        List<Long> succeededItemIds = new ArrayList<>();
        String lastErrorMessage = null;

        for (FundUsageApplicationItem item : items) {
            String explanation = buildExplanation(item);
            String amountText = formatAmount(item.getAmount());
            PaymentVoucherType type = resolvePaymentType(item.getPaymentType());
            try {
                entity.addAll(buildEntriesForItem(
                        kingdeeUrl, sessionId, useOrgCode, type, item,
                        explanation, amountText, icbcBankNumber, supplierCache, bankCache));
                clearItemPushError(item.getId());
                succeededItemIds.add(item.getId());
                if (firstExplanation == null) {
                    firstExplanation = explanation;
                }
            } catch (RuntimeException e) {
                markItemPushError(item.getId(), e.getMessage());
                lastErrorMessage = e.getMessage();
                log.warn("资金使用申请明细写入金蝶跳过：itemId={}, reason={}", item.getId(), e.getMessage());
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

    public void markItemsPushed(List<Long> itemIds, KingdeeVoucherSaveResultVO result) {
        for (Long itemId : itemIds) {
            itemMapper.update(null, new LambdaUpdateWrapper<FundUsageApplicationItem>()
                    .eq(FundUsageApplicationItem::getId, itemId)
                    .set(FundUsageApplicationItem::getKingdeeVoucherId, result.getVoucherId())
                    .set(FundUsageApplicationItem::getKingdeeVoucherNo, result.getVoucherNumber())
                    .set(FundUsageApplicationItem::getKingdeePushError, null));
        }
    }

    public void markItemPushError(Long itemId, String errorMessage) {
        if (itemId == null || !StringUtils.hasText(errorMessage)) {
            return;
        }
        FundUsageApplicationItem update = new FundUsageApplicationItem();
        update.setId(itemId);
        update.setKingdeePushError(truncateError(errorMessage));
        itemMapper.updateById(update);
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
        if (itemId == null) {
            return;
        }
        FundUsageApplicationItem existing = itemMapper.selectById(itemId);
        if (existing != null && StringUtils.hasText(existing.getKingdeePushError())) {
            itemMapper.update(null, new LambdaUpdateWrapper<FundUsageApplicationItem>()
                    .eq(FundUsageApplicationItem::getId, itemId)
                    .set(FundUsageApplicationItem::getKingdeePushError, null));
        }
    }

    private String truncateError(String errorMessage) {
        String trimmed = errorMessage.trim();
        return trimmed.length() > 500 ? trimmed.substring(0, 500) : trimmed;
    }

    public KingdeeVoucherHeaderVO findPushedVoucherForImportDate(List<Long> excludeItemIds, LocalDate importDate) {
        LambdaQueryWrapper<FundUsageApplicationItem> wrapper = new LambdaQueryWrapper<FundUsageApplicationItem>()
                .isNotNull(FundUsageApplicationItem::getKingdeeVoucherId)
                .ne(FundUsageApplicationItem::getKingdeeVoucherId, "")
                .apply("DATE(created_at) = {0}", importDate)
                .orderByAsc(FundUsageApplicationItem::getId)
                .last("LIMIT 1");
        if (excludeItemIds != null && !excludeItemIds.isEmpty()) {
            wrapper.notIn(FundUsageApplicationItem::getId, excludeItemIds);
        }
        FundUsageApplicationItem existingItem = itemMapper.selectOne(wrapper);
        if (existingItem == null || !StringUtils.hasText(existingItem.getKingdeeVoucherId())) {
            return null;
        }
        KingdeeVoucherHeaderVO header = new KingdeeVoucherHeaderVO();
        header.setVoucherId(existingItem.getKingdeeVoucherId());
        header.setVoucherNumber(existingItem.getKingdeeVoucherNo());
        return header;
    }

    private KingdeeVoucherHeaderVO resolveExistingVoucherForImportDate(List<Long> excludeItemIds,
                                                                     LocalDate importDate,
                                                                     String kingdeeUrl,
                                                                     String sessionId,
                                                                     String formId,
                                                                     String orgCompanyCode) {
        KingdeeVoucherHeaderVO localHeader = findPushedVoucherForImportDate(excludeItemIds, importDate);
        return kingdeeVoucherQueryService.resolveVoucherHeaderFromLocalOrKingdee(
                localHeader, kingdeeUrl, sessionId, formId,
                importDate.format(DATE_FORMATTER),
                voucherProperties.getVoucherGroup(),
                orgCompanyCode);
    }

    private KingdeeVoucherSaveResultVO recoverIfVoucherAlreadyExists(RuntimeException error,
                                                                   String kingdeeUrl,
                                                                   String sessionId,
                                                                   String formId,
                                                                   LocalDate voucherDate,
                                                                   String orgCompanyCode,
                                                                   List<Long> itemIds) {
        if (!kingdeeVoucherQueryService.isDataConflictError(error.getMessage())) {
            return null;
        }
        KingdeeVoucherHeaderVO header = kingdeeVoucherQueryService.findVoucherHeaderForRecovery(
                kingdeeUrl, sessionId, formId,
                voucherDate.format(DATE_FORMATTER),
                voucherProperties.getVoucherGroup(),
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
        log.info("金蝶凭证已存在，已同步本地写入状态：date={}, voucherNo={}, count={}",
                voucherDate, header.getVoucherNumber(), itemIds.size());
        return result;
    }

    public String resolveVoucherGroupNumberForAccount(String kingdeeUrl, String sessionId) {
        return resolveVoucherGroupNumber(kingdeeUrl, sessionId);
    }

    public JSONObject buildNewVoucherModel(LocalDate voucherDate, String orgCompanyCode,
                                           String voucherGroupNumber, JSONArray entity) {
        return buildNewVoucherModelInternal(voucherDate, orgCompanyCode, voucherGroupNumber, entity);
    }

    private List<FundUsageApplicationItem> loadAndValidateItems(List<Long> itemIds) {
        if (itemIds == null || itemIds.isEmpty()) {
            return Collections.emptyList();
        }
        Set<Long> uniqueIds = new HashSet<>(itemIds);
        List<FundUsageApplicationItem> items = new ArrayList<>();
        for (Long itemId : uniqueIds) {
            FundUsageApplicationItem item = itemMapper.selectById(itemId);
            if (item == null) {
                throw new RuntimeException("资金使用申请明细不存在：" + itemId);
            }
            FundUsageApplication header = applicationMapper.selectById(item.getApplicationId());
            if (header == null) {
                throw new RuntimeException("资金使用申请不存在：" + item.getApplicationId());
            }
            validate(header, item);
            items.add(item);
        }
        items.sort((a, b) -> Long.compare(a.getId(), b.getId()));
        return items;
    }

    private JSONArray buildEntriesForItem(String kingdeeUrl, String sessionId, String useOrgCode,
                                          PaymentVoucherType type, FundUsageApplicationItem item,
                                          String explanation, String amountText, String icbcBankNumber,
                                          Map<String, String> supplierCache, Map<String, String> bankCache) {
        JSONArray entries = new JSONArray();
        switch (type) {
            case REPAIR:
                entries.add(buildSupplierDebitEntry(
                        explanation, amountText, voucherProperties.getRepairDebitAccount(),
                        resolveSupplierNumber(kingdeeUrl, sessionId, useOrgCode, item.getPayeeName(), supplierCache)));
                entries.add(buildBankCreditEntry(explanation, amountText, icbcBankNumber));
                break;
            case MATERIAL:
                entries.add(buildSupplierDebitEntry(
                        explanation, amountText, voucherProperties.getMaterialDebitAccount(),
                        resolveSupplierNumber(kingdeeUrl, sessionId, useOrgCode, item.getPayeeName(), supplierCache)));
                entries.add(buildBankCreditEntry(explanation, amountText, icbcBankNumber));
                break;
            case TAX:
                entries.add(buildPlainDebitEntry(explanation, amountText, voucherProperties.getTaxDebitAccount()));
                entries.add(buildBankCreditEntry(explanation, amountText, icbcBankNumber));
                break;
            case TRANSFER:
                String bankName = item.getBankName();
                if (!StringUtils.hasText(bankName)) {
                    throw new RuntimeException("倒户明细未填写开户行，无法匹配转入方银行存款科目");
                }
                String transferBankNumber = bankCache.computeIfAbsent(bankName.trim(),
                        key -> resolveBankNumber(kingdeeUrl, sessionId, key));
                String debitAccount = voucherProperties.resolveTransferDebitAccount(bankName);
                entries.add(buildBankDebitEntry(explanation, amountText, debitAccount, transferBankNumber));
                entries.add(buildBankCreditEntry(explanation, amountText, icbcBankNumber));
                break;
            default:
                throw new RuntimeException("不支持的付款类型：" + item.getPaymentType());
        }
        return entries;
    }

    private PaymentVoucherType resolvePaymentType(String paymentType) {
        if (!StringUtils.hasText(paymentType)) {
            throw new RuntimeException("付款类型不能为空");
        }
        String normalized = paymentType.trim();
        if (normalized.contains("修理费备品备件")) {
            return PaymentVoucherType.REPAIR;
        }
        if (normalized.contains("缴纳税") || normalized.contains("税费")) {
            return PaymentVoucherType.TAX;
        }
        if (normalized.contains("采购材料")) {
            return PaymentVoucherType.MATERIAL;
        }
        if (normalized.contains("倒户")) {
            return PaymentVoucherType.TRANSFER;
        }
        throw new RuntimeException("不支持的付款类型「" + paymentType + "」，当前仅支持：修理费备品备件、缴纳税费、采购材料、倒户");
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

    private String resolveIcbcBankNumber() {
        String resolved = voucherProperties.resolveBankDimensionNumber();
        if (!StringUtils.hasText(resolved)) {
            throw new RuntimeException("未配置工商银行核算维度编码，请在 kingdee.voucher.fund-usage.bank-dimension-number 中设置");
        }
        return resolved;
    }

    private String resolveVoucherGroupNumber(String kingdeeUrl, String sessionId) {
        if (StringUtils.hasText(voucherProperties.getVoucherGroupNumber())) {
            return voucherProperties.getVoucherGroupNumber().trim();
        }
        String queried = kingdeeVoucherQueryService.findVoucherGroupNumberByName(
                kingdeeUrl, sessionId, voucherProperties.getVoucherGroup());
        return voucherProperties.resolveVoucherGroupNumber(queried);
    }

    private void validate(FundUsageApplication header, FundUsageApplicationItem item) {
        if (item.getAmount() == null || item.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("付款金额必须大于0");
        }
        if (!"agree".equalsIgnoreCase(header.getApprovalResult())) {
            throw new RuntimeException("仅审批同意的资金使用申请可写入金蝶凭证");
        }
        if (StringUtils.hasText(item.getKingdeeVoucherId())) {
            String voucherNo = StringUtils.hasText(item.getKingdeeVoucherNo())
                    ? item.getKingdeeVoucherNo()
                    : item.getKingdeeVoucherId();
            throw new RuntimeException("该明细已写入金蝶，凭证号：" + voucherNo);
        }
        resolvePaymentType(item.getPaymentType());
    }

    private LocalDate resolveVoucherDate(FundUsageApplicationItem item, FundUsageApplication header) {
        if (item.getCreatedAt() != null) {
            return item.getCreatedAt().toLocalDate();
        }
        if (header.getFinishTime() != null) {
            return header.getFinishTime().toLocalDate();
        }
        if (header.getSubmitTime() != null) {
            return header.getSubmitTime().toLocalDate();
        }
        return LocalDate.now();
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

    private String buildExplanation(FundUsageApplicationItem item) {
        PaymentVoucherType type = resolvePaymentType(item.getPaymentType());
        String amountText = formatAmount(item.getAmount());
        if (type == PaymentVoucherType.TAX) {
            if (StringUtils.hasText(item.getPaymentReason())) {
                String reason = item.getPaymentReason().trim();
                if (reason.endsWith("。") || reason.endsWith(".")) {
                    return reason;
                }
                return reason + "。";
            }
            return "缴纳税款" + amountText + "元。";
        }
        if (type == PaymentVoucherType.TRANSFER) {
            String bankShortName = extractBankShortName(item.getBankName());
            return "转入" + bankShortName + amountText + "元。";
        }
        String payeeName = StringUtils.hasText(item.getPayeeName()) ? item.getPayeeName().trim() : "收款方";
        return "支付" + payeeName + amountText + "元。";
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

    private JSONObject buildNewVoucherModelInternal(LocalDate voucherDate, String orgCompanyCode,
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

    private JSONObject buildSupplierDebitEntry(String explanation, String amountText,
                                               String accountCode, String supplierNumber) {
        JSONObject entry = buildBaseEntry(explanation, accountCode);
        entry.put("FDEBIT", amountText);
        entry.put("FCREDIT", 0);

        JSONObject detailId = new JSONObject();
        detailId.put(voucherProperties.getSupplierDimensionKey(), buildNumberObject(supplierNumber));
        entry.put("FDetailID", detailId);
        return entry;
    }

    private JSONObject buildPlainDebitEntry(String explanation, String amountText, String accountCode) {
        JSONObject entry = buildBaseEntry(explanation, accountCode);
        entry.put("FDEBIT", amountText);
        entry.put("FCREDIT", 0);
        return entry;
    }

    private JSONObject buildBankDebitEntry(String explanation, String amountText,
                                           String accountCode, String bankNumber) {
        JSONObject entry = buildBaseEntry(explanation, accountCode);
        entry.put("FDEBIT", amountText);
        entry.put("FCREDIT", 0);

        JSONObject detailId = new JSONObject();
        detailId.put(voucherProperties.getBankDimensionKey(), buildNumberObject(bankNumber));
        entry.put("FDetailID", detailId);
        return entry;
    }

    private JSONObject buildBankCreditEntry(String explanation, String amountText, String bankNumber) {
        JSONObject entry = buildBaseEntry(explanation, voucherProperties.getCreditAccount());
        entry.put("FDEBIT", 0);
        entry.put("FCREDIT", amountText);

        JSONObject detailId = new JSONObject();
        detailId.put(voucherProperties.getBankDimensionKey(), buildNumberObject(bankNumber));
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
        entry.put("FCURRENCYID", buildNumberObject(voucherProperties.getCurrencyId()));
        entry.put("FEXCHANGERATETYPE", buildNumberObject(voucherProperties.getExchangeRateType()));
        entry.put("FEXCHANGERATE", voucherProperties.getExchangeRate());
    }

    private JSONObject buildNumberObject(String number) {
        JSONObject obj = new JSONObject();
        obj.put("FNumber", number);
        return obj;
    }

    private String defaultIfBlank(String value, String fallback) {
        return StringUtils.hasText(value) ? value : fallback;
    }
}
