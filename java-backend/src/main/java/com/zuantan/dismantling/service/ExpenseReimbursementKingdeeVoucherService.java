package com.zuantan.dismantling.service;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.zuantan.dismantling.config.KingdeeExpenseReimbursementVoucherProperties;
import com.zuantan.dismantling.entity.ExpenseReimbursement;
import com.zuantan.dismantling.entity.ExpenseReimbursementItem;
import com.zuantan.dismantling.entity.KingdeeAccountConfig;
import com.zuantan.dismantling.mapper.ExpenseReimbursementItemMapper;
import com.zuantan.dismantling.mapper.ExpenseReimbursementMapper;
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
public class ExpenseReimbursementKingdeeVoucherService {

    private static final Logger log = LoggerFactory.getLogger(ExpenseReimbursementKingdeeVoucherService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final ExpenseReimbursementItemMapper itemMapper;
    private final ExpenseReimbursementMapper reimbursementMapper;
    private final KingdeeAccountConfigService kingdeeAccountConfigService;
    private final KingdeeLoginService kingdeeLoginService;
    private final KingdeeVoucherSaveService kingdeeVoucherSaveService;
    private final KingdeeVoucherQueryService kingdeeVoucherQueryService;
    private final KingdeeExpenseReimbursementVoucherProperties voucherProperties;

    public ExpenseReimbursementKingdeeVoucherService(ExpenseReimbursementItemMapper itemMapper,
                                                       ExpenseReimbursementMapper reimbursementMapper,
                                                       KingdeeAccountConfigService kingdeeAccountConfigService,
                                                       KingdeeLoginService kingdeeLoginService,
                                                       KingdeeVoucherSaveService kingdeeVoucherSaveService,
                                                       KingdeeVoucherQueryService kingdeeVoucherQueryService,
                                                       KingdeeExpenseReimbursementVoucherProperties voucherProperties) {
        this.itemMapper = itemMapper;
        this.reimbursementMapper = reimbursementMapper;
        this.kingdeeAccountConfigService = kingdeeAccountConfigService;
        this.kingdeeLoginService = kingdeeLoginService;
        this.kingdeeVoucherSaveService = kingdeeVoucherSaveService;
        this.kingdeeVoucherQueryService = kingdeeVoucherQueryService;
        this.voucherProperties = voucherProperties;
    }

    public KingdeeVoucherSaveResultVO pushToKingdee(Long itemId, Long accountId) {
        return pushBatchToKingdee(Collections.singletonList(itemId), accountId);
    }

    public KingdeeVoucherSaveResultVO pushReimbursementToKingdee(Long reimbursementId, Long accountId) {
        if (reimbursementId == null) {
            throw new RuntimeException("\u8d39\u7528\u62a5\u9500\u4e3b\u8868\u4e0d\u5b58\u5728");
        }
        List<ExpenseReimbursementItem> items = itemMapper.selectList(
                new LambdaQueryWrapper<ExpenseReimbursementItem>()
                        .eq(ExpenseReimbursementItem::getReimbursementId, reimbursementId)
                        .and(wrapper -> wrapper.isNull(ExpenseReimbursementItem::getKingdeeVoucherId)
                                .or()
                                .eq(ExpenseReimbursementItem::getKingdeeVoucherId, ""))
                        .orderByAsc(ExpenseReimbursementItem::getRowIndex)
                        .orderByAsc(ExpenseReimbursementItem::getId));
        if (items.isEmpty()) {
            throw new RuntimeException("\u8be5\u5ba1\u6279\u6ca1\u6709\u53ef\u5199\u5165\u91d1\u8776\u7684\u660e\u7ec6");
        }
        List<Long> itemIds = new ArrayList<>();
        for (ExpenseReimbursementItem item : items) {
            itemIds.add(item.getId());
        }
        return pushBatchToKingdee(itemIds, accountId);
    }

    public KingdeeVoucherSaveResultVO pushBatchToKingdee(List<Long> itemIds, Long accountId) {
        if (itemIds == null || itemIds.isEmpty()) {
            throw new RuntimeException("\u8bf7\u9009\u62e9\u8981\u5199\u5165\u7684\u660e\u7ec6");
        }

        Set<Long> uniqueIds = new HashSet<>(itemIds);
        List<ExpenseReimbursementItem> items = new ArrayList<>();
        for (Long itemId : uniqueIds) {
            ExpenseReimbursementItem item = itemMapper.selectById(itemId);
            if (item == null) {
                throw new RuntimeException("\u8d39\u7528\u62a5\u9500\u660e\u7ec6\u4e0d\u5b58\u5728\uff1a" + itemId);
            }
            items.add(item);
        }
        items.sort((a, b) -> Long.compare(a.getId(), b.getId()));

        Map<Long, ExpenseReimbursement> headerMap = new HashMap<>();
        for (ExpenseReimbursementItem item : items) {
            ExpenseReimbursement header = reimbursementMapper.selectById(item.getReimbursementId());
            if (header == null) {
                throw new RuntimeException("\u8d39\u7528\u62a5\u9500\u4e3b\u8868\u4e0d\u5b58\u5728\uff1a" + item.getReimbursementId());
            }
            validate(header, item);
            headerMap.put(item.getId(), header);
        }

        LocalDate voucherDate = null;
        for (ExpenseReimbursementItem item : items) {
            LocalDate importDate = resolveVoucherDate(item);
            if (voucherDate == null) {
                voucherDate = importDate;
            } else if (!voucherDate.equals(importDate)) {
                throw new RuntimeException("\u6279\u91cf\u5199\u5165\u8981\u6c42\u6240\u9009\u660e\u7ec6\u7684\u5165\u5e93\u65e5\u671f\u76f8\u540c");
            }
        }

        KingdeeAccountConfig account = resolveAccount(accountId);
        String orgCompanyCode = defaultIfBlank(account.getOrgCompanyCode(), "106");

        try {
            String sessionId = kingdeeLoginService.login(
                    account.getKingdeeUrl(), account.getDbId(), account.getUsername(), account.getPassword());
            String formId = voucherProperties.getFormId();
            String voucherGroupNumber = resolveVoucherGroupNumber(account.getKingdeeUrl(), sessionId);

            KingdeeVoucherEntryBuildResult buildResult = buildVoucherEntries(items, headerMap,
                    account.getKingdeeUrl(), sessionId);
            JSONArray entity = buildResult.getEntity();
            String firstExplanation = buildResult.getFirstExplanation();

            List<Long> itemIdList = new ArrayList<>();
            for (ExpenseReimbursementItem item : items) {
                itemIdList.add(item.getId());
            }
            KingdeeVoucherHeaderVO existingHeader = resolveExistingVoucherForImportDate(
                    itemIdList, voucherDate, account.getKingdeeUrl(), sessionId, formId, orgCompanyCode);

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
                        e, account.getKingdeeUrl(), sessionId, formId, voucherDate, orgCompanyCode, itemIdList);
                if (recovered != null) {
                    return recovered;
                }
                markItemsPushError(itemIdList, e.getMessage());
                throw e;
            }

            markItemsPushed(itemIdList, result);
            result.setItemCount(items.size());
            return result;
        } catch (IOException e) {
            throw new RuntimeException("\u91d1\u8776\u767b\u5f55\u5931\u8d25\uff1a" + e.getMessage(), e);
        }
    }

    public KingdeeVoucherEntryBuildResult buildVoucherEntries(List<Long> itemIds,
                                                              String kingdeeUrl,
                                                              String sessionId) {
        List<ExpenseReimbursementItem> items = loadAndValidateItems(itemIds);
        Map<Long, ExpenseReimbursement> headerMap = new HashMap<>();
        for (ExpenseReimbursementItem item : items) {
            ExpenseReimbursement header = reimbursementMapper.selectById(item.getReimbursementId());
            if (header == null) {
                throw new RuntimeException("\u8d39\u7528\u62a5\u9500\u4e3b\u8868\u4e0d\u5b58\u5728\uff1a" + item.getReimbursementId());
            }
            headerMap.put(item.getId(), header);
        }
        return buildVoucherEntries(items, headerMap, kingdeeUrl, sessionId);
    }

    private KingdeeVoucherEntryBuildResult buildVoucherEntries(List<ExpenseReimbursementItem> items,
                                                               Map<Long, ExpenseReimbursement> headerMap,
                                                               String kingdeeUrl,
                                                               String sessionId) {
        Map<String, String> employeeCache = new HashMap<>();
        String icbcBankNumber = resolveIcbcBankNumber();
        JSONArray entity = new JSONArray();
        String firstExplanation = null;

        for (ExpenseReimbursementItem item : items) {
            ExpenseReimbursement header = headerMap.get(item.getId());
            String explanation = buildExplanation(header.getSubmitterName(), item.getAmount());
            if (firstExplanation == null) {
                firstExplanation = explanation;
            }
            String amountText = formatAmount(item.getAmount());
            String submitterName = header.getSubmitterName().trim();
            String employeeNumber = employeeCache.computeIfAbsent(submitterName,
                    name -> resolveEmployeeNumber(kingdeeUrl, sessionId, name));
            entity.add(buildDebitEntry(explanation, amountText, employeeNumber));
            entity.add(buildCreditEntry(explanation, amountText, icbcBankNumber));
        }

        KingdeeVoucherEntryBuildResult result = new KingdeeVoucherEntryBuildResult();
        result.setEntity(entity);
        result.setFirstExplanation(firstExplanation);
        result.setItemCount(items.size());
        List<Long> succeededItemIds = new ArrayList<>();
        for (ExpenseReimbursementItem item : items) {
            succeededItemIds.add(item.getId());
        }
        result.setSucceededItemIds(succeededItemIds);
        return result;
    }

    public void markItemsPushed(List<Long> itemIds, KingdeeVoucherSaveResultVO result) {
        for (Long itemId : itemIds) {
            itemMapper.update(null, new LambdaUpdateWrapper<ExpenseReimbursementItem>()
                    .eq(ExpenseReimbursementItem::getId, itemId)
                    .set(ExpenseReimbursementItem::getKingdeeVoucherId, result.getVoucherId())
                    .set(ExpenseReimbursementItem::getKingdeeVoucherNo, result.getVoucherNumber())
                    .set(ExpenseReimbursementItem::getKingdeePushError, null));
        }
    }

    public void markItemsPushError(List<Long> itemIds, String errorMessage) {
        if (itemIds == null || itemIds.isEmpty() || !StringUtils.hasText(errorMessage)) {
            return;
        }
        String truncated = truncateError(errorMessage);
        for (Long itemId : itemIds) {
            ExpenseReimbursementItem update = new ExpenseReimbursementItem();
            update.setId(itemId);
            update.setKingdeePushError(truncated);
            itemMapper.updateById(update);
        }
    }

    private String truncateError(String errorMessage) {
        String trimmed = errorMessage.trim();
        return trimmed.length() > 500 ? trimmed.substring(0, 500) : trimmed;
    }

    public KingdeeVoucherHeaderVO findPushedVoucherForImportDate(List<Long> excludeItemIds, LocalDate importDate) {
        LambdaQueryWrapper<ExpenseReimbursementItem> wrapper = new LambdaQueryWrapper<ExpenseReimbursementItem>()
                .isNotNull(ExpenseReimbursementItem::getKingdeeVoucherId)
                .ne(ExpenseReimbursementItem::getKingdeeVoucherId, "")
                .apply("DATE(created_at) = {0}", importDate)
                .orderByAsc(ExpenseReimbursementItem::getId)
                .last("LIMIT 1");
        if (excludeItemIds != null && !excludeItemIds.isEmpty()) {
            wrapper.notIn(ExpenseReimbursementItem::getId, excludeItemIds);
        }
        ExpenseReimbursementItem existingItem = itemMapper.selectOne(wrapper);
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

    private List<ExpenseReimbursementItem> loadAndValidateItems(List<Long> itemIds) {
        if (itemIds == null || itemIds.isEmpty()) {
            return Collections.emptyList();
        }
        Set<Long> uniqueIds = new HashSet<>(itemIds);
        List<ExpenseReimbursementItem> items = new ArrayList<>();
        for (Long itemId : uniqueIds) {
            ExpenseReimbursementItem item = itemMapper.selectById(itemId);
            if (item == null) {
                throw new RuntimeException("\u8d39\u7528\u62a5\u9500\u660e\u7ec6\u4e0d\u5b58\u5728\uff1a" + itemId);
            }
            ExpenseReimbursement header = reimbursementMapper.selectById(item.getReimbursementId());
            if (header == null) {
                throw new RuntimeException("\u8d39\u7528\u62a5\u9500\u4e3b\u8868\u4e0d\u5b58\u5728\uff1a" + item.getReimbursementId());
            }
            validate(header, item);
            items.add(item);
        }
        items.sort((a, b) -> Long.compare(a.getId(), b.getId()));
        return items;
    }

    private String resolveEmployeeNumber(String kingdeeUrl, String sessionId, String submitterName) {
        String queried = kingdeeVoucherQueryService.findEmployeeNumberByName(kingdeeUrl, sessionId, submitterName);
        if (!StringUtils.hasText(queried)) {
            throw new RuntimeException("未在金蝶员工档案中找到提交人「"
                    + submitterName + "」对应的员工编码，请确认员工档案已维护");
        }
        return queried.trim();
    }

    private String resolveIcbcBankNumber() {
        String resolved = voucherProperties.resolveBankDimensionNumber(null);
        if (!StringUtils.hasText(resolved)) {
            throw new RuntimeException("未配置工商银行核算维度编码，请在 kingdee.voucher.expense-reimbursement.bank-dimension-number 中设置");
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

    private void validate(ExpenseReimbursement header, ExpenseReimbursementItem item) {
        if (!StringUtils.hasText(header.getSubmitterName())) {
            throw new RuntimeException("\u63d0\u4ea4\u4eba\u4e0d\u80fd\u4e3a\u7a7a");
        }
        if (item.getAmount() == null || item.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("\u62a5\u9500\u91d1\u989d\u5fc5\u987b\u5927\u4e8e0");
        }
        if (!"agree".equalsIgnoreCase(header.getApprovalResult())) {
            throw new RuntimeException("\u4ec5\u5ba1\u6279\u540c\u610f\u7684\u8d39\u7528\u62a5\u9500\u53ef\u5199\u5165\u91d1\u8776\u51ed\u8bc1");
        }
        if (StringUtils.hasText(item.getKingdeeVoucherId())) {
            String voucherNo = StringUtils.hasText(item.getKingdeeVoucherNo())
                    ? item.getKingdeeVoucherNo()
                    : item.getKingdeeVoucherId();
            throw new RuntimeException("\u8be5\u660e\u7ec6\u5df2\u5199\u5165\u91d1\u8776\uff0c\u51ed\u8bc1\u53f7\uff1a" + voucherNo);
        }
    }

    private LocalDate resolveVoucherDate(ExpenseReimbursementItem item) {
        if (item.getCreatedAt() != null) {
            return item.getCreatedAt().toLocalDate();
        }
        if (item.getExpenseDate() != null) {
            return item.getExpenseDate();
        }
        return LocalDate.now();
    }

    private KingdeeAccountConfig resolveAccount(Long accountId) {
        if (accountId != null) {
            return kingdeeAccountConfigService.resolveForLogin(accountId);
        }
        KingdeeAccountConfig defaultAccount = kingdeeAccountConfigService.getDefaultAccount();
        if (defaultAccount == null) {
            throw new RuntimeException("\u672a\u914d\u7f6e\u9ed8\u8ba4\u91d1\u8776\u8d26\u53f7\uff0c\u8bf7\u5148\u8bbe\u7f6e\u9ed8\u8ba4\u8d26\u53f7\u6216\u6307\u5b9a accountId");
        }
        return defaultAccount;
    }

    private String buildExplanation(String submitterName, BigDecimal amount) {
        return "\u652f\u4ed8" + submitterName.trim() + formatAmount(amount) + "\u5143\u3002";
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

    private JSONObject buildDebitEntry(String explanation, String amountText, String employeeNumber) {
        JSONObject entry = new JSONObject();
        entry.put("FEntryID", 0);
        entry.put("FEXPLANATION", explanation);
        entry.put("FACCOUNTID", buildNumberObject(voucherProperties.getDebitAccount()));
        applyCurrencyFields(entry);
        entry.put("FDEBIT", amountText);
        entry.put("FCREDIT", 0);

        JSONObject detailId = new JSONObject();
        detailId.put(voucherProperties.getEmployeeDimensionKey(), buildNumberObject(employeeNumber));
        entry.put("FDetailID", detailId);
        return entry;
    }

    private JSONObject buildCreditEntry(String explanation, String amountText, String bankNumber) {
        JSONObject entry = new JSONObject();
        entry.put("FEntryID", 0);
        entry.put("FEXPLANATION", explanation);
        entry.put("FACCOUNTID", buildNumberObject(voucherProperties.getCreditAccount()));
        applyCurrencyFields(entry);
        entry.put("FDEBIT", 0);
        entry.put("FCREDIT", amountText);

        JSONObject detailId = new JSONObject();
        detailId.put(voucherProperties.getBankDimensionKey(), buildNumberObject(bankNumber));
        entry.put("FDetailID", detailId);
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