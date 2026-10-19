package com.zuantan.dismantling.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zuantan.dismantling.config.KingdeeFundUsageVoucherProperties;
import com.zuantan.dismantling.entity.BankStatement;
import com.zuantan.dismantling.entity.KingdeeAccountConfig;
import com.zuantan.dismantling.mapper.BankStatementMapper;
import com.zuantan.dismantling.vo.BankStatementKingdeeExistResultVO;
import com.zuantan.dismantling.vo.VoucherDetailVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * 对齐租赁项目：按「银行科目 + 核算维度 + 日期±1 + 借贷方向 + 金额」
 * 检查金蝶银行存款(1002)银字分录是否已存在；对方户名不参与匹配。
 */
@Service
public class BankStatementKingdeeExistService {

    private static final Logger log = LoggerFactory.getLogger(BankStatementKingdeeExistService.class);
    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final BankStatementMapper bankStatementMapper;
    private final KingdeeAccountConfigService kingdeeAccountConfigService;
    private final KingdeeLoginService kingdeeLoginService;
    private final KingdeeVoucherQueryService kingdeeVoucherQueryService;
    private final KingdeeFundUsageVoucherProperties fundUsageProperties;

    public BankStatementKingdeeExistService(BankStatementMapper bankStatementMapper,
                                            KingdeeAccountConfigService kingdeeAccountConfigService,
                                            KingdeeLoginService kingdeeLoginService,
                                            KingdeeVoucherQueryService kingdeeVoucherQueryService,
                                            KingdeeFundUsageVoucherProperties fundUsageProperties) {
        this.bankStatementMapper = bankStatementMapper;
        this.kingdeeAccountConfigService = kingdeeAccountConfigService;
        this.kingdeeLoginService = kingdeeLoginService;
        this.kingdeeVoucherQueryService = kingdeeVoucherQueryService;
        this.fundUsageProperties = fundUsageProperties;
    }

    @Transactional
    public BankStatementKingdeeExistResultVO checkExists(List<Long> ids, Long accountId,
                                                         String bankSource, List<String> accountingPeriods) {
        List<BankStatement> details = loadDetails(ids, bankSource);
        if (details.isEmpty()) {
            throw new RuntimeException("没有可检查的银行流水（请先导入或缩小筛选范围）");
        }

        KingdeeAccountConfig account = resolveAccount(accountId);
        String orgCompanyCode = StringUtils.hasText(account.getOrgCompanyCode())
                ? account.getOrgCompanyCode().trim() : "106";
        String formId = StringUtils.hasText(fundUsageProperties.getFormId())
                ? fundUsageProperties.getFormId() : "GL_VOUCHER";

        Set<String> periods = collectPeriods(details, accountingPeriods);
        String sessionId;
        try {
            sessionId = kingdeeLoginService.login(
                    account.getKingdeeUrl(), account.getDbId(), account.getUsername(), account.getPassword());
        } catch (IOException e) {
            throw new RuntimeException("登录金蝶失败：" + e.getMessage(), e);
        }

        Map<String, String> bankDimCache = new HashMap<>();
        List<VoucherDetailVO> allEntries = queryKingdeeEntries(
                account, sessionId, formId, orgCompanyCode, periods);
        Map<String, List<VoucherDetailVO>> bankIndex = buildBankIndex(allEntries);
        Map<String, List<VoucherDetailVO>> looseIndex = buildLooseBankIndex(allEntries);

        int yinCount = 0;
        int bank1002Count = 0;
        for (VoucherDetailVO e : allEntries) {
            if (StringUtils.hasText(e.getFaccountID()) && e.getFaccountID().trim().startsWith("1002.")) {
                bank1002Count++;
            }
            if (isYinVoucher(e)) {
                yinCount++;
            }
        }
        log.info("银行流水查重：期间={} 金蝶分录={} 银字={} 1002分录={}",
                periods, allEntries.size(), yinCount, bank1002Count);
        if (allEntries.isEmpty()) {
            throw new RuntimeException("期间 " + periods + " 未查到金蝶凭证分录（组织 "
                    + orgCompanyCode + "）。1–9 月须按整数期间查询，请重启后端后再检查");
        }

        BankStatementKingdeeExistResultVO result = new BankStatementKingdeeExistResultVO();
        result.setTotal(details.size());
        result.setPeriodsQueried(new ArrayList<>(periods));
        result.setKingdeeEntryCount(allEntries.size());

        for (BankStatement detail : details) {
            // 摘要/用途含「残值费」时先落库业务类型，查重按转字匹配，页面可直接看到类型
            ensureResidualFeeType(detail);

            BankStatementKingdeeExistResultVO.Item item = new BankStatementKingdeeExistResultVO.Item();
            item.setId(detail.getId());
            item.setBankSource(detail.getBankSource());
            item.setSerialNo(detail.getSerialNo());
            item.setCounterpartyName(detail.getCounterpartyName());
            item.setVoucherType(detail.getVoucherType());
            item.setTradeTime(detail.getTradeTime() != null ? detail.getTradeTime().format(DT) : null);

            BigDecimal amount = scale(detail.getAmount());
            List<String> primaryDates = resolvePrimaryDates(detail);
            if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0 || primaryDates.isEmpty()) {
                item.setKingdeeExistStatus(0);
                item.setMessage("缺少交易日期或金额，无法检查");
                result.setUncheckedCount(result.getUncheckedCount() + 1);
                result.getItems().add(item);
                continue;
            }

            boolean outflow = BankStatement.DIRECTION_OUT.equals(detail.getDirection());
            String side = outflow ? "OUT" : "IN";
            item.setAmountSide(outflow ? "支出" : "收入");
            item.setAmount(amount.toPlainString());

            String bankAccount = resolveBankAccount(detail.getBankSource());
            String bankDimension = resolveBankDimension(
                    account.getKingdeeUrl(), sessionId, detail.getBankSource(), bankDimCache);

            boolean residualFee = BankStatement.TYPE_RESIDUAL_FEE.equals(detail.getVoucherType())
                    || BankStatementService.isResidualFeeText(
                    detail.getPurpose(), detail.getSummary(), detail.getRemark(), detail.getReceiptInfo());
            VoucherDetailVO hit = consumeHit(bankIndex, looseIndex,
                    bankAccount, bankDimension, primaryDates,
                    resolveYearExpandedDates(primaryDates), side, amount, residualFee);

            if (hit != null) {
                String word = defaultText(hit.getFbillTypeID(), fundUsageProperties.getVoucherGroup());
                String no = defaultText(hit.getFvoucherNo(), "");
                String hitDate = defaultText(normalizeDateDigits(hit.getFdate()), "");
                String crossYearHint = "";
                if (StringUtils.hasText(hitDate) && !primaryDates.contains(hitDate)) {
                    if (expandAdjacentDates(primaryDates).contains(hitDate)) {
                        crossYearHint = "，邻日匹配 " + String.join("/", primaryDates) + "↔" + hitDate;
                    } else if (sameMonth(primaryDates, hitDate)) {
                        crossYearHint = "，同月记账日匹配 " + String.join("/", primaryDates) + "↔" + hitDate;
                    } else {
                        crossYearHint = "，跨年匹配 " + String.join("/", primaryDates) + "↔" + hitDate;
                    }
                }
                item.setKingdeeExistStatus(1);
                item.setKingdeeExistVoucherWord(word);
                item.setKingdeeExistVoucherNo(no);
                item.setMessage("金蝶已存在 " + word + no
                        + "（" + defaultText(hit.getFaccountID(), bankAccount)
                        + "/" + defaultText(hit.getFbankDimension(), defaultText(bankDimension, "-"))
                        + " 日期" + defaultText(hitDate, "-")
                        + " 同金额" + crossYearHint + "）");
                markExist(detail, word, no);
                result.setExistsCount(result.getExistsCount() + 1);
            } else {
                String nearMiss = findNearMissMessage(allEntries, primaryDates, amount, side, residualFee);
                item.setKingdeeExistStatus(2);
                item.setMessage("金蝶未找到银行存款(1002)同金额分录（已查流水日 "
                        + String.join(",", primaryDates) + " 前后3天，以及同月 "
                        + bankAccount + " 同方向同额）"
                        + (StringUtils.hasText(nearMiss) ? "；" + nearMiss : ""));
                clearExist(detail);
                result.setNotExistsCount(result.getNotExistsCount() + 1);
            }
            result.getItems().add(item);
        }
        return result;
    }

    /**
     * 用途/摘要含「残值费」且尚未分类的支出，查重前自动记为残值费（转字），便于页面展示与匹配。
     */
    private void ensureResidualFeeType(BankStatement detail) {
        if (detail == null || StringUtils.hasText(detail.getVoucherType())) {
            return;
        }
        if (!BankStatement.DIRECTION_OUT.equals(detail.getDirection())) {
            return;
        }
        if (!BankStatementService.isResidualFeeText(
                detail.getPurpose(), detail.getSummary(), detail.getRemark(), detail.getReceiptInfo())) {
            return;
        }
        detail.setVoucherType(BankStatement.TYPE_RESIDUAL_FEE);
        detail.setSuggestedVoucherType(BankStatement.TYPE_RESIDUAL_FEE);
        detail.setUpdatedAt(LocalDateTime.now());
        bankStatementMapper.updateById(detail);
    }

    private List<BankStatement> loadDetails(List<Long> ids, String bankSource) {
        List<BankStatement> details;
        if (ids != null && !ids.isEmpty()) {
            details = bankStatementMapper.selectBatchIds(ids);
        } else {
            LambdaQueryWrapper<BankStatement> wrapper = new LambdaQueryWrapper<BankStatement>()
                    .orderByAsc(BankStatement::getTradeTime)
                    .last("LIMIT 2000");
            if (StringUtils.hasText(bankSource) && !"ALL".equalsIgnoreCase(bankSource.trim())) {
                wrapper.eq(BankStatement::getBankSource, bankSource.trim().toUpperCase(Locale.ROOT));
            }
            details = bankStatementMapper.selectList(wrapper);
        }
        // 先匹配较早流水，避免月末凭证被后日流水抢先一对一消耗
        details.sort((a, b) -> {
            if (a.getTradeTime() == null && b.getTradeTime() == null) {
                return Long.compare(a.getId() != null ? a.getId() : 0L, b.getId() != null ? b.getId() : 0L);
            }
            if (a.getTradeTime() == null) {
                return 1;
            }
            if (b.getTradeTime() == null) {
                return -1;
            }
            int cmp = a.getTradeTime().compareTo(b.getTradeTime());
            if (cmp != 0) {
                return cmp;
            }
            return Long.compare(a.getId() != null ? a.getId() : 0L, b.getId() != null ? b.getId() : 0L);
        });
        return details;
    }

    private void markExist(BankStatement detail, String word, String no) {
        detail.setKingdeeExistStatus(1);
        detail.setKingdeeExistVoucherWord(word);
        detail.setKingdeeExistVoucherNo(no);
        detail.setKingdeeExistCheckedAt(LocalDateTime.now());
        // 查重命中视为已写入，避免重复推送
        if (!StringUtils.hasText(detail.getKingdeeVoucherId())
                || detail.getKingdeeVoucherId().startsWith("EXIST-")) {
            detail.setKingdeeVoucherId("EXIST-" + defaultText(word, "银") + "-" + defaultText(no, ""));
            detail.setKingdeeVoucherNo(no);
            detail.setKingdeePushError(null);
        }
        detail.setUpdatedAt(LocalDateTime.now());
        bankStatementMapper.updateById(detail);
    }

    private void clearExist(BankStatement detail) {
        detail.setKingdeeExistStatus(2);
        detail.setKingdeeExistVoucherWord(null);
        detail.setKingdeeExistVoucherNo(null);
        detail.setKingdeeExistCheckedAt(LocalDateTime.now());
        // 仅清理查重占位写入，保留本平台真实写入
        if (StringUtils.hasText(detail.getKingdeeVoucherId())
                && detail.getKingdeeVoucherId().startsWith("EXIST-")) {
            detail.setKingdeeVoucherId(null);
            detail.setKingdeeVoucherNo(null);
        }
        detail.setUpdatedAt(LocalDateTime.now());
        bankStatementMapper.updateById(detail);
    }

    private String resolveBankAccount(String bankSource) {
        if (BankStatement.SOURCE_JINSHANG.equals(bankSource)) {
            return fundUsageProperties.resolveTransferDebitAccount("晋商银行");
        }
        return fundUsageProperties.getCreditAccount();
    }

    private String resolveBankDimension(String kingdeeUrl, String sessionId, String bankSource,
                                        Map<String, String> cache) {
        if (BankStatement.SOURCE_JINSHANG.equals(bankSource)) {
            return cache.computeIfAbsent("晋商银行", key -> {
                String n = kingdeeVoucherQueryService.findBankNumberByName(kingdeeUrl, sessionId, key);
                return StringUtils.hasText(n) ? n.trim() : "";
            });
        }
        String fixed = fundUsageProperties.resolveBankDimensionNumber();
        return StringUtils.hasText(fixed) ? fixed.trim() : "YH01";
    }

    private VoucherDetailVO consumeHit(Map<String, List<VoucherDetailVO>> bankIndex,
                                       Map<String, List<VoucherDetailVO>> looseIndex,
                                       String bankAccount, String bankDimension,
                                       List<String> primaryDates, List<String> yearExpandedDates,
                                       String side, BigDecimal amount, boolean residualFee) {
        for (String dateKey : expandAdjacentDates(primaryDates)) {
            VoucherDetailVO hit = takePreferred(bankIndex.get(
                    indexKey(bankAccount, bankDimension, dateKey, side, amount)), false, residualFee);
            if (hit == null && StringUtils.hasText(bankDimension)) {
                hit = takePreferred(bankIndex.get(
                        indexKey(bankAccount, "", dateKey, side, amount)), !residualFee, residualFee);
            }
            if (hit == null) {
                hit = takePreferred(looseIndex.get(
                        looseKey(bankAccount, dateKey, side, amount)), !residualFee, residualFee);
            }
            if (hit == null) {
                hit = takeAny1002Hit(bankIndex, bankDimension, dateKey, side, amount, !residualFee, residualFee);
            }
            if (hit == null && StringUtils.hasText(bankDimension)) {
                hit = takeAny1002Hit(bankIndex, "", dateKey, side, amount, !residualFee, residualFee);
            }
            if (hit != null) {
                removeFromAllIndexes(bankIndex, looseIndex, hit);
                return hit;
            }
        }
        // 关账月常把前几天流水记到月末银字（如 28 日流水记在 30 日银41），同科目同金额再认一次
        VoucherDetailVO sameMonthHit = consumeSameMonthHit(
                bankIndex, looseIndex, bankAccount, bankDimension, primaryDates, side, amount, residualFee);
        if (sameMonthHit != null) {
            return sameMonthHit;
        }
        if (StringUtils.hasText(bankAccount) && StringUtils.hasText(bankDimension)
                && yearExpandedDates != null) {
            for (String dateKey : yearExpandedDates) {
                VoucherDetailVO hit = takePreferred(bankIndex.get(
                        indexKey(bankAccount, bankDimension, dateKey, side, amount)), !residualFee, residualFee);
                if (hit != null) {
                    removeFromAllIndexes(bankIndex, looseIndex, hit);
                    return hit;
                }
            }
        }
        return null;
    }

    /**
     * 同一会计月、同方向金额。优先本银行科目+相同维度+银字，再任意 1002 银字。
     * 用于关账月把 28 日流水记到 30 日银字这类场景。
     */
    private VoucherDetailVO consumeSameMonthHit(Map<String, List<VoucherDetailVO>> bankIndex,
                                                Map<String, List<VoucherDetailVO>> looseIndex,
                                                String bankAccount, String bankDimension,
                                                List<String> primaryDates, String side, BigDecimal amount,
                                                boolean residualFee) {
        if (bankIndex == null || amount == null
                || primaryDates == null || primaryDates.isEmpty() || primaryDates.get(0).length() < 6) {
            return null;
        }
        String month = primaryDates.get(0).substring(0, 6);
        String dim = defaultText(bankDimension, "");
        String suffix = "|" + side + "|" + amount.toPlainString();
        VoucherDetailVO best = null;
        int bestRank = Integer.MAX_VALUE;
        for (Map.Entry<String, List<VoucherDetailVO>> entry : bankIndex.entrySet()) {
            String key = entry.getKey();
            // 键：科目|维度|yyyyMMdd|方向|金额
            if (key == null || !key.startsWith("1002.") || !key.contains("|" + month)
                    || !key.endsWith(suffix)) {
                continue;
            }
            List<VoucherDetailVO> hits = entry.getValue();
            if (hits == null || hits.isEmpty()) {
                continue;
            }
            boolean preferredAccount = StringUtils.hasText(bankAccount) && key.startsWith(bankAccount + "|");
            for (VoucherDetailVO candidate : hits) {
                if (residualFee) {
                    if (!isTransferVoucher(candidate)) {
                        continue;
                    }
                } else if (!isYinVoucher(candidate)) {
                    continue;
                }
                String dateKey = normalizeDateDigits(candidate.getFdate());
                if (!StringUtils.hasText(dateKey) || !dateKey.startsWith(month)) {
                    continue;
                }
                boolean sameDim = dim.isEmpty() || dim.equals(defaultText(candidate.getFbankDimension(), ""));
                int rank = Math.abs(dayDistance(primaryDates.get(0), dateKey));
                if (!preferredAccount) {
                    rank += 20;
                }
                if (!sameDim) {
                    rank += 10;
                }
                if (rank < bestRank) {
                    bestRank = rank;
                    best = candidate;
                }
            }
        }
        if (best == null) {
            return null;
        }
        removeFromAllIndexes(bankIndex, looseIndex, best);
        return best;
    }

    /** 未命中时提示同月是否有接近金额的 1002 银字，便于核对关账凭证 */
    private String findNearMissMessage(List<VoucherDetailVO> entries, List<String> primaryDates,
                                       BigDecimal amount, String side, boolean residualFee) {
        if (entries == null || primaryDates == null || primaryDates.isEmpty() || amount == null) {
            return null;
        }
        String month = primaryDates.get(0).substring(0, Math.min(6, primaryDates.get(0).length()));
        VoucherDetailVO closest = null;
        BigDecimal closestDiff = null;
        for (VoucherDetailVO e : entries) {
            boolean wordOk = residualFee ? isTransferVoucher(e) : isYinVoucher(e);
            if (!wordOk || !StringUtils.hasText(e.getFaccountID())
                    || !e.getFaccountID().trim().startsWith("1002.")) {
                continue;
            }
            String dateKey = normalizeDateDigits(e.getFdate());
            if (!StringUtils.hasText(dateKey) || !dateKey.startsWith(month)) {
                continue;
            }
            BigDecimal value = "OUT".equals(side) ? scale(e.getFcredit()) : scale(e.getFdebit());
            if (value == null || value.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            BigDecimal diff = value.subtract(amount).abs();
            if (closestDiff == null || diff.compareTo(closestDiff) < 0) {
                closestDiff = diff;
                closest = e;
            }
        }
        if (closest == null) {
            String wordLabel = residualFee ? "转字" : "银字";
            return "同月亦无任何 1002 " + wordLabel + ("OUT".equals(side) ? "贷方" : "借方") + "分录可对照";
        }
        BigDecimal value = "OUT".equals(side) ? scale(closest.getFcredit()) : scale(closest.getFdebit());
        return "同月最近一笔："
                + defaultText(closest.getFbillTypeID(), "银")
                + defaultText(closest.getFvoucherNo(), "")
                + "/" + defaultText(closest.getFaccountID(), "")
                + " 日期" + defaultText(normalizeDateDigits(closest.getFdate()), "")
                + " 金额" + (value != null ? value.toPlainString() : "-")
                + "（差额 " + (closestDiff != null ? closestDiff.toPlainString() : "-") + "）";
    }

    private boolean sameMonth(List<String> primaryDates, String hitDate) {
        if (primaryDates == null || primaryDates.isEmpty() || !StringUtils.hasText(hitDate) || hitDate.length() < 6) {
            return false;
        }
        return primaryDates.get(0).length() >= 6 && hitDate.startsWith(primaryDates.get(0).substring(0, 6));
    }

    private int dayDistance(String a, String b) {
        try {
            java.time.LocalDate da = java.time.LocalDate.parse(a, java.time.format.DateTimeFormatter.BASIC_ISO_DATE);
            java.time.LocalDate db = java.time.LocalDate.parse(b, java.time.format.DateTimeFormatter.BASIC_ISO_DATE);
            return (int) java.time.temporal.ChronoUnit.DAYS.between(da, db);
        } catch (Exception e) {
            return 99;
        }
    }

    private VoucherDetailVO takeAny1002Hit(Map<String, List<VoucherDetailVO>> bankIndex,
                                           String bankDimension, String dateKey,
                                           String side, BigDecimal amount, boolean requireYin,
                                           boolean preferTransfer) {
        if (bankIndex == null || !StringUtils.hasText(dateKey) || amount == null) {
            return null;
        }
        String dim = defaultText(bankDimension, "");
        String suffix = "|" + dim + "|" + dateKey + "|" + side + "|" + amount.toPlainString();
        VoucherDetailVO fallback = null;
        for (Map.Entry<String, List<VoucherDetailVO>> e : bankIndex.entrySet()) {
            String key = e.getKey();
            if (key == null || !key.startsWith("1002.") || !key.endsWith(suffix)) {
                continue;
            }
            VoucherDetailVO hit = takePreferred(e.getValue(), requireYin, preferTransfer);
            if (hit == null) {
                continue;
            }
            if (preferTransfer ? isTransferVoucher(hit) : isYinVoucher(hit)) {
                return hit;
            }
            if (fallback == null) {
                fallback = hit;
            }
        }
        return requireYin ? null : fallback;
    }

    private List<String> expandAdjacentDates(List<String> primaryDates) {
        LinkedHashSet<String> dates = new LinkedHashSet<>();
        if (primaryDates == null) {
            return new ArrayList<>();
        }
        for (String d : primaryDates) {
            if (!StringUtils.hasText(d) || d.length() < 8) {
                continue;
            }
            String day = d.substring(0, 8);
            dates.add(day);
            // 银行交易日与金蝶记账日常差 1～3 天（周末/关账汇总）
            for (int delta = 1; delta <= 3; delta++) {
                dates.add(shiftDateDigits(day, -delta));
                dates.add(shiftDateDigits(day, delta));
            }
        }
        dates.remove(null);
        dates.remove("");
        return new ArrayList<>(dates);
    }

    private String shiftDateDigits(String yyyymmdd, int dayDelta) {
        try {
            int y = Integer.parseInt(yyyymmdd.substring(0, 4));
            int m = Integer.parseInt(yyyymmdd.substring(4, 6));
            int d = Integer.parseInt(yyyymmdd.substring(6, 8));
            java.time.LocalDate date = java.time.LocalDate.of(y, m, d).plusDays(dayDelta);
            return String.format("%04d%02d%02d", date.getYear(), date.getMonthValue(), date.getDayOfMonth());
        } catch (Exception e) {
            return null;
        }
    }

    private void removeFromAllIndexes(Map<String, List<VoucherDetailVO>> bankIndex,
                                      Map<String, List<VoucherDetailVO>> looseIndex,
                                      VoucherDetailVO hit) {
        for (List<VoucherDetailVO> list : bankIndex.values()) {
            list.removeIf(e -> e == hit);
        }
        for (List<VoucherDetailVO> list : looseIndex.values()) {
            list.removeIf(e -> e == hit);
        }
    }

    private VoucherDetailVO takePreferred(List<VoucherDetailVO> hits, boolean requireYin, boolean preferTransfer) {
        if (hits == null || hits.isEmpty()) {
            return null;
        }
        if (preferTransfer) {
            for (int i = 0; i < hits.size(); i++) {
                if (isTransferVoucher(hits.get(i))) {
                    return hits.remove(i);
                }
            }
            return null;
        }
        for (int i = 0; i < hits.size(); i++) {
            if (isYinVoucher(hits.get(i))) {
                return hits.remove(i);
            }
        }
        if (requireYin) {
            return null;
        }
        return hits.remove(0);
    }

    private boolean isTransferVoucher(VoucherDetailVO e) {
        if (e == null) {
            return false;
        }
        String word = defaultText(e.getFbillTypeID(), "");
        return "转".equals(word) || word.contains("转");
    }

    private boolean isYinVoucher(VoucherDetailVO e) {
        if (e == null) {
            return false;
        }
        String word = defaultText(e.getFbillTypeID(), "");
        String expected = defaultText(fundUsageProperties.getVoucherGroup(), "银");
        return word.contains(expected) || "银".equals(word);
    }

    private Set<String> collectPeriods(List<BankStatement> details, List<String> accountingPeriods) {
        Set<String> periods = new LinkedHashSet<>();
        if (accountingPeriods != null) {
            for (String p : accountingPeriods) {
                if (StringUtils.hasText(p)) {
                    String digits = p.trim().replaceAll("\\D", "");
                    if (digits.length() >= 6) {
                        periods.add(digits.substring(0, 6));
                    }
                }
            }
        }
        for (BankStatement d : details) {
            List<String> primary = resolvePrimaryDates(d);
            for (String dateKey : primary) {
                String period = toAccountingPeriod(dateKey);
                if (period != null) {
                    periods.add(period);
                    periods.add(shiftPeriod(period, -1));
                    periods.add(shiftPeriod(period, 1));
                }
            }
            for (String dateKey : resolveYearExpandedDates(primary)) {
                String period = toAccountingPeriod(dateKey);
                if (period != null) {
                    periods.add(period);
                }
            }
        }
        if (periods.isEmpty()) {
            throw new RuntimeException("明细缺少交易日期，无法确定会计期间");
        }
        return periods;
    }

    private List<VoucherDetailVO> queryKingdeeEntries(KingdeeAccountConfig account, String sessionId,
                                                      String formId, String orgCompanyCode,
                                                      Set<String> periods) {
        List<VoucherDetailVO> allEntries = new ArrayList<>();
        StringBuilder errors = new StringBuilder();
        for (String period : periods) {
            try {
                List<VoucherDetailVO> rows = kingdeeVoucherQueryService.queryVoucherDetails(
                        account.getKingdeeUrl(), sessionId, formId, period,
                        null, null, orgCompanyCode, KingdeeVoucherQueryService.ORG_FIELD_KEY,
                        true);
                if (rows != null) {
                    allEntries.addAll(rows);
                }
            } catch (Exception e) {
                log.warn("查询金蝶凭证失败 period={}：{}", period, e.getMessage());
                if (errors.length() > 0) {
                    errors.append("；");
                }
                errors.append(period).append("：").append(e.getMessage());
            }
        }
        if (allEntries.isEmpty() && errors.length() > 0) {
            throw new RuntimeException("查询金蝶凭证失败：" + errors);
        }
        return allEntries;
    }

    private Map<String, List<VoucherDetailVO>> buildBankIndex(List<VoucherDetailVO> entries) {
        Map<String, List<VoucherDetailVO>> index = new HashMap<>();
        for (VoucherDetailVO e : entries) {
            if (!StringUtils.hasText(e.getFaccountID())) {
                continue;
            }
            String account = e.getFaccountID().trim();
            if (!account.startsWith("1002.")) {
                continue;
            }
            String dimension = StringUtils.hasText(e.getFbankDimension())
                    ? e.getFbankDimension().trim() : "";
            String dateKey = normalizeDateDigits(e.getFdate());
            if (!StringUtils.hasText(dateKey)) {
                continue;
            }
            BigDecimal debit = scale(e.getFdebit());
            BigDecimal credit = scale(e.getFcredit());
            // 金蝶银行借方=流入，贷方=流出
            if (debit != null && debit.compareTo(BigDecimal.ZERO) > 0) {
                index.computeIfAbsent(indexKey(account, dimension, dateKey, "IN", debit),
                        k -> new ArrayList<>()).add(e);
            }
            if (credit != null && credit.compareTo(BigDecimal.ZERO) > 0) {
                index.computeIfAbsent(indexKey(account, dimension, dateKey, "OUT", credit),
                        k -> new ArrayList<>()).add(e);
            }
        }
        return index;
    }

    private Map<String, List<VoucherDetailVO>> buildLooseBankIndex(List<VoucherDetailVO> entries) {
        Map<String, List<VoucherDetailVO>> index = new HashMap<>();
        for (VoucherDetailVO e : entries) {
            if (!StringUtils.hasText(e.getFaccountID()) || !e.getFaccountID().trim().startsWith("1002.")) {
                continue;
            }
            String account = e.getFaccountID().trim();
            String dateKey = normalizeDateDigits(e.getFdate());
            if (!StringUtils.hasText(dateKey)) {
                continue;
            }
            BigDecimal debit = scale(e.getFdebit());
            BigDecimal credit = scale(e.getFcredit());
            if (debit != null && debit.compareTo(BigDecimal.ZERO) > 0) {
                index.computeIfAbsent(looseKey(account, dateKey, "IN", debit),
                        k -> new ArrayList<>()).add(e);
            }
            if (credit != null && credit.compareTo(BigDecimal.ZERO) > 0) {
                index.computeIfAbsent(looseKey(account, dateKey, "OUT", credit),
                        k -> new ArrayList<>()).add(e);
            }
        }
        return index;
    }

    private String indexKey(String bankAccount, String bankDimension, String dateKey,
                            String side, BigDecimal amount) {
        return bankAccount + "|" + defaultText(bankDimension, "") + "|"
                + dateKey + "|" + side + "|" + amount.toPlainString();
    }

    private String looseKey(String bankAccount, String dateKey, String side, BigDecimal amount) {
        return bankAccount + "|" + dateKey + "|" + side + "|" + amount.toPlainString();
    }

    private List<String> resolvePrimaryDates(BankStatement detail) {
        LinkedHashSet<String> dates = new LinkedHashSet<>();
        if (detail.getTradeTime() != null) {
            String digits = detail.getTradeTime().format(DateTimeFormatter.BASIC_ISO_DATE);
            if (digits.length() >= 8) {
                dates.add(digits.substring(0, 8));
            }
        }
        return new ArrayList<>(dates);
    }

    private List<String> resolveYearExpandedDates(List<String> primaryDates) {
        LinkedHashSet<String> dates = new LinkedHashSet<>();
        if (primaryDates == null) {
            return new ArrayList<>();
        }
        for (String d : primaryDates) {
            if (!StringUtils.hasText(d) || d.length() < 8) {
                continue;
            }
            String md = d.substring(4);
            int year;
            try {
                year = Integer.parseInt(d.substring(0, 4));
            } catch (NumberFormatException e) {
                continue;
            }
            for (int delta = -2; delta <= 2; delta++) {
                if (delta == 0) {
                    continue;
                }
                dates.add((year + delta) + md);
            }
        }
        return new ArrayList<>(dates);
    }

    private String toAccountingPeriod(String dateDigits) {
        if (!StringUtils.hasText(dateDigits) || dateDigits.length() < 6) {
            return null;
        }
        return dateDigits.substring(0, 6);
    }

    private String normalizeDateDigits(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        String digits = raw.replaceAll("\\D", "");
        if (digits.length() >= 8) {
            return digits.substring(0, 8);
        }
        return digits.isEmpty() ? null : digits;
    }

    private String shiftPeriod(String yyyymm, int deltaMonths) {
        int year = Integer.parseInt(yyyymm.substring(0, 4));
        int month = Integer.parseInt(yyyymm.substring(4, 6));
        month += deltaMonths;
        while (month <= 0) {
            month += 12;
            year--;
        }
        while (month > 12) {
            month -= 12;
            year++;
        }
        return year + String.format("%02d", month);
    }

    private BigDecimal scale(BigDecimal value) {
        if (value == null) {
            return null;
        }
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private KingdeeAccountConfig resolveAccount(Long accountId) {
        if (accountId != null) {
            return kingdeeAccountConfigService.resolveForLogin(accountId);
        }
        KingdeeAccountConfig defaultAccount = kingdeeAccountConfigService.getDefaultAccount();
        if (defaultAccount == null) {
            throw new RuntimeException("未配置默认金蝶账号");
        }
        return defaultAccount;
    }

    private String defaultText(String value, String fallback) {
        return StringUtils.hasText(value) ? value : fallback;
    }
}
