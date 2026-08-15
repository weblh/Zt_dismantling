package com.zuantan.dismantling.service;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zuantan.dismantling.config.KingdeeExpenseReimbursementVoucherProperties;
import com.zuantan.dismantling.entity.ExpenseReimbursement;
import com.zuantan.dismantling.entity.ExpenseReimbursementItem;
import com.zuantan.dismantling.entity.FundUsageApplication;
import com.zuantan.dismantling.entity.FundUsageApplicationItem;
import com.zuantan.dismantling.entity.KingdeeAccountConfig;
import com.zuantan.dismantling.mapper.ExpenseReimbursementItemMapper;
import com.zuantan.dismantling.mapper.ExpenseReimbursementMapper;
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
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class KingdeeCombinedVoucherPushService {

    private static final Logger log = LoggerFactory.getLogger(KingdeeCombinedVoucherPushService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final ExpenseReimbursementItemMapper expenseItemMapper;
    private final ExpenseReimbursementMapper expenseMapper;
    private final FundUsageApplicationItemMapper fundUsageItemMapper;
    private final FundUsageApplicationMapper fundUsageMapper;
    private final KingdeeAccountConfigService kingdeeAccountConfigService;
    private final KingdeeLoginService kingdeeLoginService;
    private final KingdeeVoucherSaveService kingdeeVoucherSaveService;
    private final ExpenseReimbursementKingdeeVoucherService expenseKingdeeVoucherService;
    private final FundUsageApplicationKingdeeVoucherService fundUsageKingdeeVoucherService;
    private final KingdeeVoucherQueryService kingdeeVoucherQueryService;
    private final KingdeeExpenseReimbursementVoucherProperties voucherProperties;

    public KingdeeCombinedVoucherPushService(ExpenseReimbursementItemMapper expenseItemMapper,
                                             ExpenseReimbursementMapper expenseMapper,
                                             FundUsageApplicationItemMapper fundUsageItemMapper,
                                             FundUsageApplicationMapper fundUsageMapper,
                                             KingdeeAccountConfigService kingdeeAccountConfigService,
                                             KingdeeLoginService kingdeeLoginService,
                                             KingdeeVoucherSaveService kingdeeVoucherSaveService,
                                             ExpenseReimbursementKingdeeVoucherService expenseKingdeeVoucherService,
                                             FundUsageApplicationKingdeeVoucherService fundUsageKingdeeVoucherService,
                                             KingdeeVoucherQueryService kingdeeVoucherQueryService,
                                             KingdeeExpenseReimbursementVoucherProperties voucherProperties) {
        this.expenseItemMapper = expenseItemMapper;
        this.expenseMapper = expenseMapper;
        this.fundUsageItemMapper = fundUsageItemMapper;
        this.fundUsageMapper = fundUsageMapper;
        this.kingdeeAccountConfigService = kingdeeAccountConfigService;
        this.kingdeeLoginService = kingdeeLoginService;
        this.kingdeeVoucherSaveService = kingdeeVoucherSaveService;
        this.expenseKingdeeVoucherService = expenseKingdeeVoucherService;
        this.fundUsageKingdeeVoucherService = fundUsageKingdeeVoucherService;
        this.kingdeeVoucherQueryService = kingdeeVoucherQueryService;
        this.voucherProperties = voucherProperties;
    }

    public void pushAllPendingUpTo(LocalDate endDateInclusive, Long accountId) {
        List<LocalDate> pendingDates = listUnpushedImportDates(endDateInclusive);
        if (pendingDates.isEmpty()) {
            log.info("金蝶合并凭证推送：截至 {} 无待写入明细", endDateInclusive);
            return;
        }

        log.info("金蝶合并凭证推送：截至 {} 发现 {} 个入库日期有待写入明细：{}",
                endDateInclusive, pendingDates.size(), pendingDates);
        for (LocalDate importDate : pendingDates) {
            try {
                pushDailyCombined(importDate, accountId);
            } catch (Exception e) {
                log.error("金蝶合并凭证推送失败：date={}", importDate, e);
            }
        }
    }

    public KingdeeVoucherSaveResultVO pushDailyCombined(LocalDate voucherDate, Long accountId) {
        List<Long> expenseItemIds = listUnpushedExpenseItemIds(voucherDate);
        List<Long> fundUsageItemIds = listUnpushedFundUsageItemIds(voucherDate);

        if (expenseItemIds.isEmpty() && fundUsageItemIds.isEmpty()) {
            log.info("金蝶合并凭证推送：{} 无待写入明细，跳过", voucherDate);
            return null;
        }

        KingdeeAccountConfig account = resolveAccount(accountId);
        String orgCompanyCode = defaultIfBlank(account.getOrgCompanyCode(), "106");
        String useOrgCode = account.getUseOrgCode();

        try {
            String sessionId = kingdeeLoginService.login(
                    account.getKingdeeUrl(), account.getDbId(), account.getUsername(), account.getPassword());
            String formId = voucherProperties.getFormId();
            String voucherGroupNumber = expenseKingdeeVoucherService.resolveVoucherGroupNumberForAccount(
                    account.getKingdeeUrl(), sessionId);

            JSONArray entity = new JSONArray();
            String firstExplanation = null;
            int totalItemCount = 0;
            List<Long> succeededExpenseItemIds = new ArrayList<>();
            List<Long> succeededFundUsageItemIds = new ArrayList<>();

            if (!expenseItemIds.isEmpty()) {
                KingdeeVoucherEntryBuildResult expenseBuild = expenseKingdeeVoucherService.buildVoucherEntries(
                        expenseItemIds, account.getKingdeeUrl(), sessionId);
                entity.addAll(expenseBuild.getEntity());
                if (firstExplanation == null) {
                    firstExplanation = expenseBuild.getFirstExplanation();
                }
                succeededExpenseItemIds.addAll(expenseBuild.getSucceededItemIds());
                totalItemCount += expenseBuild.getItemCount();
            }

            if (!fundUsageItemIds.isEmpty()) {
                KingdeeVoucherEntryBuildResult fundBuild = fundUsageKingdeeVoucherService.buildVoucherEntries(
                        fundUsageItemIds, account.getKingdeeUrl(), sessionId, useOrgCode);
                entity.addAll(fundBuild.getEntity());
                if (firstExplanation == null) {
                    firstExplanation = fundBuild.getFirstExplanation();
                }
                succeededFundUsageItemIds.addAll(fundBuild.getSucceededItemIds());
                totalItemCount += fundBuild.getItemCount();
            }

            if (entity.isEmpty()) {
                log.info("金蝶合并凭证推送：{} 所有明细均无法写入，跳过", voucherDate);
                return null;
            }

            KingdeeVoucherHeaderVO existingHeader = findExistingVoucherForDate(
                    voucherDate, succeededExpenseItemIds, succeededFundUsageItemIds,
                    account.getKingdeeUrl(), sessionId, formId, orgCompanyCode);

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
                    if (!StringUtils.hasText(result.getVoucherNumber())
                            && StringUtils.hasText(existingHeader.getVoucherNumber())) {
                        result.setVoucherNumber(existingHeader.getVoucherNumber());
                    }
                    if (!StringUtils.hasText(result.getVoucherId())) {
                        result.setVoucherId(existingHeader.getVoucherId());
                    }
                } else {
                    JSONObject model = expenseKingdeeVoucherService.buildNewVoucherModel(
                            voucherDate, orgCompanyCode, voucherGroupNumber, entity);
                    result = kingdeeVoucherSaveService.save(
                            account.getKingdeeUrl(), sessionId, formId, model, firstExplanation,
                            voucherProperties.getVoucherGroup(), true);
                    result.setSavedMode("created");
                }
            } catch (RuntimeException e) {
                KingdeeVoucherSaveResultVO recovered = recoverIfVoucherAlreadyExists(
                        e, account.getKingdeeUrl(), sessionId, formId, voucherDate, orgCompanyCode,
                        succeededExpenseItemIds, succeededFundUsageItemIds, totalItemCount);
                if (recovered != null) {
                    return recovered;
                }
                if (!succeededFundUsageItemIds.isEmpty()) {
                    fundUsageKingdeeVoucherService.markItemsPushError(succeededFundUsageItemIds, e.getMessage());
                }
                if (!succeededExpenseItemIds.isEmpty()) {
                    expenseKingdeeVoucherService.markItemsPushError(succeededExpenseItemIds, e.getMessage());
                }
                throw e;
            }

            if (!succeededExpenseItemIds.isEmpty()) {
                expenseKingdeeVoucherService.markItemsPushed(succeededExpenseItemIds, result);
            }
            if (!succeededFundUsageItemIds.isEmpty()) {
                fundUsageKingdeeVoucherService.markItemsPushed(succeededFundUsageItemIds, result);
            }

            result.setItemCount(totalItemCount);
            log.info("金蝶合并凭证推送完成：date={}, mode={}, voucherNo={}, expenseCount={}, fundUsageCount={}",
                    voucherDate, result.getSavedMode(), result.getVoucherNumber(),
                    succeededExpenseItemIds.size(), succeededFundUsageItemIds.size());
            return result;
        } catch (IOException e) {
            throw new RuntimeException("金蝶登录失败：" + e.getMessage(), e);
        }
    }

    private List<LocalDate> listUnpushedImportDates(LocalDate endDateInclusive) {
        Set<LocalDate> dates = new LinkedHashSet<>();
        collectUnpushedExpenseImportDates(endDateInclusive, dates);
        collectUnpushedFundUsageImportDates(endDateInclusive, dates);
        return new ArrayList<>(dates);
    }

    private List<Long> listUnpushedExpenseItemIds(LocalDate voucherDate) {
        List<Long> ids = new ArrayList<>();
        collectUnpushedExpenseItemIds(voucherDate, voucherDate, ids);
        return ids;
    }

    private List<Long> listUnpushedFundUsageItemIds(LocalDate voucherDate) {
        List<Long> ids = new ArrayList<>();
        collectUnpushedFundUsageItemIds(voucherDate, voucherDate, ids);
        return ids;
    }

    private void collectUnpushedExpenseImportDates(LocalDate endDateInclusive, Set<LocalDate> dates) {
        List<ExpenseReimbursementItem> items = expenseItemMapper.selectList(
                new LambdaQueryWrapper<ExpenseReimbursementItem>()
                        .and(wrapper -> wrapper.isNull(ExpenseReimbursementItem::getKingdeeVoucherId)
                                .or()
                                .eq(ExpenseReimbursementItem::getKingdeeVoucherId, ""))
                        .apply("DATE(created_at) <= {0}", endDateInclusive)
                        .orderByAsc(ExpenseReimbursementItem::getCreatedAt)
                        .orderByAsc(ExpenseReimbursementItem::getId));

        for (ExpenseReimbursementItem item : items) {
            ExpenseReimbursement header = expenseMapper.selectById(item.getReimbursementId());
            if (isEligibleExpenseItem(header, item) && item.getCreatedAt() != null) {
                dates.add(item.getCreatedAt().toLocalDate());
            }
        }
    }

    private void collectUnpushedFundUsageImportDates(LocalDate endDateInclusive, Set<LocalDate> dates) {
        List<FundUsageApplicationItem> items = fundUsageItemMapper.selectList(
                new LambdaQueryWrapper<FundUsageApplicationItem>()
                        .and(wrapper -> wrapper.isNull(FundUsageApplicationItem::getKingdeeVoucherId)
                                .or()
                                .eq(FundUsageApplicationItem::getKingdeeVoucherId, ""))
                        .apply("DATE(created_at) <= {0}", endDateInclusive)
                        .orderByAsc(FundUsageApplicationItem::getCreatedAt)
                        .orderByAsc(FundUsageApplicationItem::getId));

        for (FundUsageApplicationItem item : items) {
            FundUsageApplication header = fundUsageMapper.selectById(item.getApplicationId());
            if (isEligibleFundUsageItem(header, item) && item.getCreatedAt() != null) {
                dates.add(item.getCreatedAt().toLocalDate());
            }
        }
    }

    private void collectUnpushedExpenseItemIds(LocalDate startDateInclusive,
                                               LocalDate endDateInclusive,
                                               List<Long> ids) {
        List<ExpenseReimbursementItem> items = expenseItemMapper.selectList(
                new LambdaQueryWrapper<ExpenseReimbursementItem>()
                        .and(wrapper -> wrapper.isNull(ExpenseReimbursementItem::getKingdeeVoucherId)
                                .or()
                                .eq(ExpenseReimbursementItem::getKingdeeVoucherId, ""))
                        .apply("DATE(created_at) >= {0}", startDateInclusive)
                        .apply("DATE(created_at) <= {0}", endDateInclusive)
                        .orderByAsc(ExpenseReimbursementItem::getId));

        for (ExpenseReimbursementItem item : items) {
            ExpenseReimbursement header = expenseMapper.selectById(item.getReimbursementId());
            if (isEligibleExpenseItem(header, item)) {
                ids.add(item.getId());
            }
        }
    }

    private void collectUnpushedFundUsageItemIds(LocalDate startDateInclusive,
                                                 LocalDate endDateInclusive,
                                                 List<Long> ids) {
        List<FundUsageApplicationItem> items = fundUsageItemMapper.selectList(
                new LambdaQueryWrapper<FundUsageApplicationItem>()
                        .and(wrapper -> wrapper.isNull(FundUsageApplicationItem::getKingdeeVoucherId)
                                .or()
                                .eq(FundUsageApplicationItem::getKingdeeVoucherId, ""))
                        .apply("DATE(created_at) >= {0}", startDateInclusive)
                        .apply("DATE(created_at) <= {0}", endDateInclusive)
                        .orderByAsc(FundUsageApplicationItem::getId));

        for (FundUsageApplicationItem item : items) {
            FundUsageApplication header = fundUsageMapper.selectById(item.getApplicationId());
            if (isEligibleFundUsageItem(header, item)) {
                ids.add(item.getId());
            }
        }
    }

    private boolean isEligibleExpenseItem(ExpenseReimbursement header, ExpenseReimbursementItem item) {
        return header != null
                && "agree".equalsIgnoreCase(header.getApprovalResult())
                && item.getAmount() != null
                && item.getAmount().compareTo(BigDecimal.ZERO) > 0;
    }

    private boolean isEligibleFundUsageItem(FundUsageApplication header, FundUsageApplicationItem item) {
        if (header == null
                || !"agree".equalsIgnoreCase(header.getApprovalResult())
                || item.getAmount() == null
                || item.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return false;
        }
        return isSupportedFundUsagePaymentType(item.getPaymentType());
    }

    private boolean isSupportedFundUsagePaymentType(String paymentType) {
        if (!StringUtils.hasText(paymentType)) {
            return false;
        }
        String normalized = paymentType.trim();
        return normalized.contains("修理费备品备件")
                || normalized.contains("缴纳税")
                || normalized.contains("税费")
                || normalized.contains("采购材料")
                || normalized.contains("倒户");
    }

    private KingdeeVoucherHeaderVO findExistingVoucherForDate(LocalDate importDate,
                                                              List<Long> excludeExpenseIds,
                                                              List<Long> excludeFundIds,
                                                              String kingdeeUrl,
                                                              String sessionId,
                                                              String formId,
                                                              String orgCompanyCode) {
        KingdeeVoucherHeaderVO fromExpense = expenseKingdeeVoucherService.findPushedVoucherForImportDate(
                excludeExpenseIds, importDate);
        if (fromExpense != null && StringUtils.hasText(fromExpense.getVoucherId())) {
            return fromExpense;
        }
        KingdeeVoucherHeaderVO fromFund = fundUsageKingdeeVoucherService.findPushedVoucherForImportDate(
                excludeFundIds, importDate);
        return kingdeeVoucherQueryService.resolveVoucherHeaderFromLocalOrKingdee(
                fromFund, kingdeeUrl, sessionId, formId,
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
                                                                    List<Long> expenseItemIds,
                                                                    List<Long> fundUsageItemIds,
                                                                    int totalItemCount) {
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
        if (!expenseItemIds.isEmpty()) {
            expenseKingdeeVoucherService.markItemsPushed(expenseItemIds, result);
        }
        if (!fundUsageItemIds.isEmpty()) {
            fundUsageKingdeeVoucherService.markItemsPushed(fundUsageItemIds, result);
        }
        result.setItemCount(totalItemCount);
        log.info("金蝶凭证已存在，已同步本地写入状态：date={}, voucherNo={}, expenseCount={}, fundUsageCount={}",
                voucherDate, header.getVoucherNumber(), expenseItemIds.size(), fundUsageItemIds.size());
        return result;
    }

    private KingdeeAccountConfig resolveAccount(Long accountId) {
        if (accountId != null) {
            return kingdeeAccountConfigService.resolveForLogin(accountId);
        }
        KingdeeAccountConfig defaultAccount = kingdeeAccountConfigService.getDefaultAccount();
        if (defaultAccount == null) {
            throw new RuntimeException("未配置默认金蝶账号，请先设置默认账号");
        }
        return defaultAccount;
    }

    private String defaultIfBlank(String value, String fallback) {
        return StringUtils.hasText(value) ? value : fallback;
    }
}
