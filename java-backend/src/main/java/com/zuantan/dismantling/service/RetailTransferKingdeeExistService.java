package com.zuantan.dismantling.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zuantan.dismantling.entity.KingdeeAccountConfig;
import com.zuantan.dismantling.entity.RetailTransferVoucher;
import com.zuantan.dismantling.mapper.RetailTransferVoucherMapper;
import com.zuantan.dismantling.vo.RetailTransferExistResultVO;
import com.zuantan.dismantling.vo.VoucherDetailVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 散户对照金蝶「转」字凭证反写。写入格式与历史凭证一致：
 * 凭证日期为结账日；借 1403.03.01「M月D日采购报废车N辆，T吨，金额元」；
 * 贷 2202.01 按供应商各一行「M月D日采购{供应商}{n}辆车，{吨}吨，{金额}元」。
 * 台账是单车总价，反写时按「采购日 + 供应商」合计去对贷方，不按单车拆凭证。
 */
@Service
public class RetailTransferKingdeeExistService {

    private static final Logger log = LoggerFactory.getLogger(RetailTransferKingdeeExistService.class);
    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final Pattern SHEET_TAG = Pattern.compile("\\[(\\d{1,2}\\.\\d{1,2}|\\d{1,2})]");
    private static final Pattern EXPLAIN_DAY = Pattern.compile("(\\d{1,2})月(\\d{1,2})日");
    private static final Pattern VEHICLE_COUNT = Pattern.compile("(\\d+)\\s*辆");

    private final RetailTransferVoucherMapper mapper;
    private final RetailTransferVoucherService voucherService;
    private final KingdeeAccountConfigService accountConfigService;
    private final KingdeeLoginService loginService;
    private final KingdeeVoucherQueryService voucherQueryService;

    public RetailTransferKingdeeExistService(RetailTransferVoucherMapper mapper,
                                             RetailTransferVoucherService voucherService,
                                             KingdeeAccountConfigService accountConfigService,
                                             KingdeeLoginService loginService,
                                             KingdeeVoucherQueryService voucherQueryService) {
        this.mapper = mapper;
        this.voucherService = voucherService;
        this.accountConfigService = accountConfigService;
        this.loginService = loginService;
        this.voucherQueryService = voucherQueryService;
    }

    @Transactional
    public RetailTransferExistResultVO checkExists(List<Long> ids, Long accountId, Boolean retailOnly) {
        List<RetailTransferVoucher> details = voucherService.listByIds(ids);
        if (retailOnly == null || retailOnly) {
            List<RetailTransferVoucher> filtered = new ArrayList<>();
            for (RetailTransferVoucher d : details) {
                if (d.getRetailFlag() != null && d.getRetailFlag() == 1) {
                    filtered.add(d);
                }
            }
            details = filtered;
        }
        if (details.isEmpty()) {
            throw new RuntimeException("没有可检查的散户流水（请先导入散户业务结账台账）");
        }
        details.sort(Comparator
                .comparing(RetailTransferVoucher::getTradeTime, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(RetailTransferVoucher::getId, Comparator.nullsLast(Comparator.naturalOrder())));

        KingdeeAccountConfig account = resolveAccount(accountId);
        String orgCompanyCode = StringUtils.hasText(account.getOrgCompanyCode())
                ? account.getOrgCompanyCode().trim() : "106";
        Set<String> periods = collectPeriods(details);
        String sessionId;
        try {
            sessionId = loginService.login(
                    account.getKingdeeUrl(), account.getDbId(), account.getUsername(), account.getPassword());
        } catch (IOException e) {
            throw new RuntimeException("登录金蝶失败：" + e.getMessage(), e);
        }

        List<VoucherDetailVO> allEntries = queryEntries(account, sessionId, orgCompanyCode, periods);
        List<IndexedEntry> pool = buildTransferPool(allEntries);
        List<IndexedEntry> catalog = new ArrayList<>(pool);
        log.info("散户转字反写：期间={} 金蝶分录={} 可匹配转字贷方={}", periods, allEntries.size(), pool.size());
        if (allEntries.isEmpty()) {
            throw new RuntimeException("期间 " + periods + " 未查到金蝶凭证分录，请核对账套组织 " + orgCompanyCode);
        }

        Map<Long, HitResult> hits = new LinkedHashMap<>();
        Set<Long> matchedIds = new HashSet<>();
        // 勾选行之外，把同一供应商、同一结账 sheet 的台账行一并参与合计
        List<RetailTransferVoucher> universe = expandSheetSiblings(details);

        // 1) 日合计优先：金蝶按「N辆车」汇总。台账「合计」列若是 SUM，会有一行金额等于整张凭证，不能当成单车先占掉
        Map<String, List<RetailTransferVoucher>> groups = new LinkedHashMap<>();
        for (RetailTransferVoucher detail : universe) {
            if (!StringUtils.hasText(detail.getCounterpartyName()) || detail.getAmount() == null) {
                continue;
            }
            groups.computeIfAbsent(groupKey(detail), k -> new ArrayList<>()).add(detail);
        }
        List<Map.Entry<String, List<RetailTransferVoucher>>> groupList = new ArrayList<>(groups.entrySet());
        groupList.sort((a, b) -> Integer.compare(b.getValue().size(), a.getValue().size()));
        for (Map.Entry<String, List<RetailTransferVoucher>> ge : groupList) {
            List<RetailTransferVoucher> group = new ArrayList<>();
            for (RetailTransferVoucher d : ge.getValue()) {
                if (!matchedIds.contains(d.getId())) {
                    group.add(d);
                }
            }
            if (group.size() < 2) {
                continue;
            }
            BigDecimal sum = BigDecimal.ZERO;
            for (RetailTransferVoucher d : group) {
                sum = sum.add(scale(d.getAmount()));
            }
            sum = scale(sum);
            String name = group.get(0).getCounterpartyName().trim();
            IndexedEntry hit = findGroupHit(pool, group, sum, name);
            String mode = "日合计" + sum.toPlainString() + "（" + group.size() + "笔）";
            if (hit == null) {
                hit = findSubtotalRowHit(pool, group, name);
                mode = "已入日合计（台账合计列含SUM，单车并入同一转字）";
            }
            if (hit == null) {
                continue;
            }
            pool.remove(hit);
            for (RetailTransferVoucher d : group) {
                hits.put(d.getId(), new HitResult(hit, mode));
                matchedIds.add(d.getId());
                if (!containsId(details, d.getId())) {
                    applyHit(d, hit, mode);
                }
            }
        }

        // 2) 单笔：同金额 + 摘要含供应商。多辆汇总行不再参与单笔，避免 3200 误对到别的供应商
        for (RetailTransferVoucher detail : details) {
            if (matchedIds.contains(detail.getId())) {
                continue;
            }
            BigDecimal amount = scale(detail.getAmount());
            String name = detail.getCounterpartyName();
            if (amount == null || !StringUtils.hasText(name)) {
                continue;
            }
            IndexedEntry hit = findSingleHit(pool, detail, amount, name.trim());
            if (hit != null) {
                hits.put(detail.getId(), new HitResult(hit, "单笔"));
                matchedIds.add(detail.getId());
                pool.remove(hit);
            }
        }

        RetailTransferExistResultVO result = new RetailTransferExistResultVO();
        result.setTotal(details.size());
        result.setPeriodsQueried(new ArrayList<>(periods));
        result.setKingdeeEntryCount(allEntries.size());

        for (RetailTransferVoucher detail : details) {
            RetailTransferExistResultVO.Item item = new RetailTransferExistResultVO.Item();
            item.setId(detail.getId());
            item.setTradeTime(detail.getTradeTime() != null ? detail.getTradeTime().format(DT) : null);
            item.setCounterpartyName(detail.getCounterpartyName());
            BigDecimal amount = scale(detail.getAmount());
            boolean outflow = RetailTransferVoucher.DIRECTION_OUT.equals(detail.getDirection());
            item.setAmountSide(outflow ? "付款(应付贷方)" : "收款(应收借方)");
            item.setAmount(amount != null ? amount.toPlainString() : null);

            if (amount == null || detail.getTradeTime() == null) {
                item.setKingdeeExistStatus(0);
                item.setMessage("缺少交易日期或金额，无法检查");
                result.setUncheckedCount(result.getUncheckedCount() + 1);
                result.getItems().add(item);
                continue;
            }

            HitResult hit = hits.get(detail.getId());
            if (hit != null) {
                VoucherDetailVO entry = hit.entry.entry;
                String word = defaultText(entry.getFbillTypeID(), "转");
                String no = defaultText(entry.getFvoucherNo(), "");
                String hitDate = defaultText(normalizeDateDigits(entry.getFdate()), "");
                item.setKingdeeExistStatus(1);
                item.setKingdeeExistVoucherWord(word);
                item.setKingdeeExistVoucherNo(no);
                String learned = StringUtils.hasText(hit.entry.explanation)
                        ? hit.entry.explanation.trim()
                        : hit.entry.role;
                item.setMessage("金蝶已按原格式入账 " + word + no + "：" + learned
                        + "（" + hit.mode + "，凭证日" + hitDate + "）");
                markExist(detail, word, no);
                result.setExistsCount(result.getExistsCount() + 1);
            } else {
                String near = findNearMiss(catalog, detail);
                item.setKingdeeExistStatus(2);
                item.setMessage("未写入金蝶「采购日+供应商」转字合计"
                        + (StringUtils.hasText(near) ? "；" + near : ""));
                clearExist(detail);
                result.setNotExistsCount(result.getNotExistsCount() + 1);
            }
            result.getItems().add(item);
        }
        return result;
    }

    private IndexedEntry findSingleHit(List<IndexedEntry> pool, RetailTransferVoucher detail,
                                       BigDecimal amount, String name) {
        List<String> dateKeys = expandAdjacentDates(primaryDate(detail));
        IndexedEntry best = null;
        int bestScore = -1;
        for (IndexedEntry e : pool) {
            if (e.amount.compareTo(amount) != 0) {
                continue;
            }
            // 「N辆车」是日合计，不能按其中某一辆的金额去撞别的凭证
            if (e.vehicleCount > 1) {
                continue;
            }
            if (!explanationHasName(e.explanation, name)) {
                continue;
            }
            int score = scoreDate(detail, e, dateKeys);
            if (score > bestScore) {
                bestScore = score;
                best = e;
            }
        }
        return bestScore >= 0 ? best : null;
    }

    private IndexedEntry findGroupHit(List<IndexedEntry> pool, List<RetailTransferVoucher> group,
                                      BigDecimal sum, String name) {
        IndexedEntry best = null;
        int bestScore = -1;
        for (IndexedEntry e : pool) {
            if (e.amount.compareTo(sum) != 0) {
                continue;
            }
            if (!explanationHasName(e.explanation, name)) {
                continue;
            }
            int score = 0;
            for (RetailTransferVoucher d : group) {
                score = Math.max(score, scoreDate(d, e, expandAdjacentDates(primaryDate(d))));
            }
            // 摘要中的采购日与结账 sheet 日一致时加分
            String sheetDay = extractSheetDay(group.get(0));
            if (StringUtils.hasText(sheetDay) && StringUtils.hasText(e.bizDay)
                    && sheetDay.equals(e.bizDay)) {
                score += 50;
            }
            if (e.vehicleCount > 0 && e.vehicleCount == group.size()) {
                score += 20;
            }
            if (score > bestScore) {
                bestScore = score;
                best = e;
            }
        }
        return bestScore >= 0 ? best : null;
    }

    /**
     * 台账第一行「合计」是 SUM，金额等于金蝶「N辆车」凭证，其余行才是单车总价。
     * 整组挂到这张转字上，而不是只认汇总行。
     */
    private IndexedEntry findSubtotalRowHit(List<IndexedEntry> pool, List<RetailTransferVoucher> group, String name) {
        String sheetDay = extractSheetDay(group.get(0));
        IndexedEntry best = null;
        int bestScore = -1;
        for (IndexedEntry e : pool) {
            if (e.vehicleCount <= 1 || e.vehicleCount != group.size()) {
                continue;
            }
            if (!explanationHasName(e.explanation, name)) {
                continue;
            }
            boolean hasSubtotalRow = false;
            for (RetailTransferVoucher d : group) {
                if (scale(d.getAmount()).compareTo(e.amount) == 0) {
                    hasSubtotalRow = true;
                    break;
                }
            }
            if (!hasSubtotalRow) {
                continue;
            }
            if (StringUtils.hasText(sheetDay) && StringUtils.hasText(e.bizDay) && !sheetDay.equals(e.bizDay)) {
                continue;
            }
            int score = 0;
            for (RetailTransferVoucher d : group) {
                score = Math.max(score, scoreDate(d, e, expandAdjacentDates(primaryDate(d))));
            }
            if (StringUtils.hasText(sheetDay) && sheetDay.equals(e.bizDay)) {
                score += 50;
            }
            if (score > bestScore) {
                bestScore = score;
                best = e;
            }
        }
        return bestScore >= 0 ? best : null;
    }

    private List<RetailTransferVoucher> expandSheetSiblings(List<RetailTransferVoucher> details) {
        Map<Long, RetailTransferVoucher> byId = new LinkedHashMap<>();
        for (RetailTransferVoucher d : details) {
            if (d.getId() != null) {
                byId.put(d.getId(), d);
            }
        }
        Set<String> seen = new HashSet<>();
        for (RetailTransferVoucher d : details) {
            String sheetDay = extractSheetDay(d);
            if (!StringUtils.hasText(sheetDay) || !StringUtils.hasText(d.getCounterpartyName())) {
                continue;
            }
            String key = d.getCounterpartyName().trim() + "|" + sheetDay;
            if (!seen.add(key)) {
                continue;
            }
            List<RetailTransferVoucher> siblings = mapper.selectList(new LambdaQueryWrapper<RetailTransferVoucher>()
                    .eq(RetailTransferVoucher::getCounterpartyName, d.getCounterpartyName().trim())
                    .like(RetailTransferVoucher::getRemark, "[" + sheetDay + "]"));
            if (siblings == null) {
                continue;
            }
            for (RetailTransferVoucher s : siblings) {
                if (s.getId() != null) {
                    byId.putIfAbsent(s.getId(), s);
                }
            }
        }
        return new ArrayList<>(byId.values());
    }

    private boolean containsId(List<RetailTransferVoucher> details, Long id) {
        for (RetailTransferVoucher d : details) {
            if (id != null && id.equals(d.getId())) {
                return true;
            }
        }
        return false;
    }

    private void applyHit(RetailTransferVoucher detail, IndexedEntry hit, String mode) {
        VoucherDetailVO entry = hit.entry;
        String word = defaultText(entry.getFbillTypeID(), "转");
        String no = defaultText(entry.getFvoucherNo(), "");
        log.info("散户转字并入同组 id={} {} {} {}", detail.getId(), detail.getCounterpartyName(), mode, word + no);
        markExist(detail, word, no);
    }

    private int scoreDate(RetailTransferVoucher detail, IndexedEntry e, List<String> adjacent) {
        String hitDate = normalizeDateDigits(e.entry.getFdate());
        if (!StringUtils.hasText(hitDate)) {
            return 0;
        }
        if (adjacent.contains(hitDate)) {
            return 30 - Math.min(3, Math.abs(dayDiff(primaryDate(detail), hitDate)));
        }
        String primary = primaryDate(detail);
        if (StringUtils.hasText(primary) && primary.length() >= 6
                && hitDate.length() >= 6 && primary.substring(0, 6).equals(hitDate.substring(0, 6))) {
            return 10;
        }
        if (StringUtils.hasText(e.bizDay) && StringUtils.hasText(primary) && primary.length() >= 8) {
            String biz = toYmd(primary.substring(0, 4), e.bizDay);
            if (biz != null && adjacent.contains(biz)) {
                return 20;
            }
        }
        return -1;
    }

    private String findNearMiss(List<IndexedEntry> pool, RetailTransferVoucher detail) {
        String name = detail.getCounterpartyName();
        BigDecimal amount = scale(detail.getAmount());
        if (!StringUtils.hasText(name) || amount == null) {
            return null;
        }
        List<IndexedEntry> named = new ArrayList<>();
        for (IndexedEntry e : pool) {
            if (explanationHasName(e.explanation, name.trim())) {
                named.add(e);
            }
        }
        if (named.isEmpty()) {
            return "报废车转字摘要中没有「" + name + "」，本金额也没有并进其他供应商合计";
        }
        named.sort(Comparator.comparing(e -> e.amount.subtract(amount).abs()));
        StringBuilder sb = new StringBuilder("同供应商已入账");
        int shown = 0;
        for (IndexedEntry n : named) {
            if (shown >= 3) {
                break;
            }
            if (shown > 0) {
                sb.append("；");
            }
            sb.append(defaultText(n.entry.getFbillTypeID(), "转"))
                    .append(defaultText(n.entry.getFvoucherNo(), ""))
                    .append(" ")
                    .append(truncate(n.explanation, 42));
            shown++;
        }
        sb.append("。本行 ").append(amount.toPlainString()).append(" 元不在上述合计内");
        return sb.toString();
    }

    private List<IndexedEntry> buildTransferPool(List<VoucherDetailVO> entries) {
        List<IndexedEntry> pool = new ArrayList<>();
        for (VoucherDetailVO e : entries) {
            if (!StringUtils.hasText(e.getFaccountID())) {
                continue;
            }
            String account = e.getFaccountID().trim();
            boolean transferWord = isTransferWord(e.getFbillTypeID());
            boolean payableLike = account.startsWith("2202") || account.startsWith("2241");
            BigDecimal credit = scale(e.getFcredit());
            BigDecimal debit = scale(e.getFdebit());
            String explanation = defaultText(e.getFexplanation(), "");

            // 只对照「转」字，避免银字付款金额误命中
            if (!transferWord) {
                continue;
            }
            if (credit != null && credit.compareTo(BigDecimal.ZERO) != 0
                    && (payableLike || !account.startsWith("1002"))) {
                String role = payableLike ? "应付贷方" : "转字贷方";
                pool.add(new IndexedEntry(e, role, credit.abs(), explanation,
                        extractBizDay(explanation), extractVehicleCount(explanation), true));
            }
            if (debit != null && debit.compareTo(BigDecimal.ZERO) != 0 && account.startsWith("1122")) {
                pool.add(new IndexedEntry(e, "应收借方", debit.abs(), explanation,
                        extractBizDay(explanation), extractVehicleCount(explanation), true));
            }
        }
        return pool;
    }

    private boolean explanationHasName(String explanation, String name) {
        if (!StringUtils.hasText(explanation) || !StringUtils.hasText(name)) {
            return false;
        }
        return explanation.contains(name.trim());
    }

    private String groupKey(RetailTransferVoucher detail) {
        String name = detail.getCounterpartyName().trim();
        String sheetDay = extractSheetDay(detail);
        if (StringUtils.hasText(sheetDay)) {
            return name + "|S|" + sheetDay;
        }
        String day = primaryDate(detail);
        return name + "|D|" + (day != null ? day : "NA");
    }

    private String extractSheetDay(RetailTransferVoucher detail) {
        String remark = detail.getRemark();
        if (!StringUtils.hasText(remark)) {
            return null;
        }
        Matcher m = SHEET_TAG.matcher(remark);
        String fallback = null;
        while (m.find()) {
            String tag = m.group(1);
            if ("1".equals(tag)) {
                continue;
            }
            // 优先 9.30 这类结账日 sheet
            if (tag.contains(".")) {
                return tag;
            }
            fallback = tag;
        }
        return fallback;
    }

    private String extractBizDay(String explanation) {
        if (!StringUtils.hasText(explanation)) {
            return null;
        }
        Matcher m = EXPLAIN_DAY.matcher(explanation);
        if (!m.find()) {
            return null;
        }
        return Integer.parseInt(m.group(1)) + "." + Integer.parseInt(m.group(2));
    }

    private int extractVehicleCount(String explanation) {
        if (!StringUtils.hasText(explanation)) {
            return 0;
        }
        Matcher m = VEHICLE_COUNT.matcher(explanation);
        if (!m.find()) {
            return 0;
        }
        try {
            return Integer.parseInt(m.group(1));
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private String toYmd(String year, String mDotD) {
        try {
            String[] p = mDotD.split("\\.");
            int m = Integer.parseInt(p[0]);
            int d = Integer.parseInt(p[1]);
            return String.format("%s%02d%02d", year, m, d);
        } catch (Exception e) {
            return null;
        }
    }

    private int dayDiff(String a, String b) {
        try {
            LocalDate da = LocalDate.parse(a, DateTimeFormatter.BASIC_ISO_DATE);
            LocalDate db = LocalDate.parse(b, DateTimeFormatter.BASIC_ISO_DATE);
            return (int) Math.abs(java.time.temporal.ChronoUnit.DAYS.between(da, db));
        } catch (Exception e) {
            return 99;
        }
    }

    private void markExist(RetailTransferVoucher detail, String word, String no) {
        detail.setKingdeeExistStatus(1);
        detail.setKingdeeExistVoucherWord(word);
        detail.setKingdeeExistVoucherNo(no);
        detail.setKingdeeExistCheckedAt(LocalDateTime.now());
        if (!StringUtils.hasText(detail.getKingdeeVoucherId())
                || detail.getKingdeeVoucherId().startsWith("EXIST-")) {
            detail.setKingdeeVoucherId("EXIST-" + word + "-" + no);
            detail.setKingdeeVoucherNo(no);
        }
        detail.setUpdatedAt(LocalDateTime.now());
        mapper.updateById(detail);
    }

    private void clearExist(RetailTransferVoucher detail) {
        detail.setKingdeeExistStatus(2);
        detail.setKingdeeExistVoucherWord(null);
        detail.setKingdeeExistVoucherNo(null);
        detail.setKingdeeExistCheckedAt(LocalDateTime.now());
        if (StringUtils.hasText(detail.getKingdeeVoucherId())
                && detail.getKingdeeVoucherId().startsWith("EXIST-")) {
            detail.setKingdeeVoucherId(null);
            detail.setKingdeeVoucherNo(null);
        }
        detail.setUpdatedAt(LocalDateTime.now());
        mapper.updateById(detail);
    }

    private List<VoucherDetailVO> queryEntries(KingdeeAccountConfig account, String sessionId,
                                               String orgCompanyCode, Set<String> periods) {
        List<VoucherDetailVO> all = new ArrayList<>();
        for (String period : periods) {
            try {
                List<VoucherDetailVO> rows = voucherQueryService.queryVoucherDetails(
                        account.getKingdeeUrl(), sessionId, "GL_VOUCHER", period,
                        null, null, orgCompanyCode, KingdeeVoucherQueryService.ORG_FIELD_KEY, true);
                if (rows != null) {
                    all.addAll(rows);
                }
            } catch (Exception e) {
                log.warn("查询金蝶转字失败 period={}：{}", period, e.getMessage());
            }
        }
        return all;
    }

    private Set<String> collectPeriods(List<RetailTransferVoucher> details) {
        Set<String> periods = new LinkedHashSet<>();
        for (RetailTransferVoucher d : details) {
            String date = primaryDate(d);
            if (!StringUtils.hasText(date) || date.length() < 6) {
                continue;
            }
            String period = date.substring(0, 6);
            periods.add(period);
            periods.add(shiftPeriod(period, -1));
            periods.add(shiftPeriod(period, 1));
        }
        if (periods.isEmpty()) {
            throw new RuntimeException("明细缺少交易日期，无法确定会计期间");
        }
        return periods;
    }

    private String primaryDate(RetailTransferVoucher detail) {
        if (detail.getTradeTime() == null) {
            return null;
        }
        return detail.getTradeTime().format(DateTimeFormatter.BASIC_ISO_DATE);
    }

    private List<String> expandAdjacentDates(String primary) {
        LinkedHashSet<String> dates = new LinkedHashSet<>();
        if (!StringUtils.hasText(primary) || primary.length() < 8) {
            return new ArrayList<>();
        }
        String day = primary.substring(0, 8);
        dates.add(day);
        for (int delta = 1; delta <= 3; delta++) {
            dates.add(shiftDate(day, -delta));
            dates.add(shiftDate(day, delta));
        }
        dates.remove(null);
        return new ArrayList<>(dates);
    }

    private String shiftDate(String yyyymmdd, int dayDelta) {
        try {
            int y = Integer.parseInt(yyyymmdd.substring(0, 4));
            int m = Integer.parseInt(yyyymmdd.substring(4, 6));
            int d = Integer.parseInt(yyyymmdd.substring(6, 8));
            LocalDate date = LocalDate.of(y, m, d).plusDays(dayDelta);
            return String.format("%04d%02d%02d", date.getYear(), date.getMonthValue(), date.getDayOfMonth());
        } catch (Exception e) {
            return null;
        }
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

    private boolean isTransferWord(String word) {
        if (!StringUtils.hasText(word)) {
            return false;
        }
        String w = word.trim();
        return "转".equals(w) || w.contains("转");
    }

    private String normalizeDateDigits(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        String digits = raw.replaceAll("\\D", "");
        return digits.length() >= 8 ? digits.substring(0, 8) : (digits.isEmpty() ? null : digits);
    }

    private BigDecimal scale(BigDecimal value) {
        return value == null ? null : value.setScale(2, RoundingMode.HALF_UP);
    }

    private KingdeeAccountConfig resolveAccount(Long accountId) {
        if (accountId != null) {
            return accountConfigService.resolveForLogin(accountId);
        }
        KingdeeAccountConfig defaultAccount = accountConfigService.getDefaultAccount();
        if (defaultAccount == null) {
            throw new RuntimeException("未配置默认金蝶账号");
        }
        return defaultAccount;
    }

    private String defaultText(String value, String fallback) {
        return StringUtils.hasText(value) ? value : fallback;
    }

    private String truncate(String value, int max) {
        if (value == null) {
            return "";
        }
        return value.length() <= max ? value : value.substring(0, max) + "…";
    }

    private static final class IndexedEntry {
        final VoucherDetailVO entry;
        final String role;
        final BigDecimal amount;
        final String explanation;
        final String bizDay;
        final int vehicleCount;
        final boolean transferWord;

        IndexedEntry(VoucherDetailVO entry, String role, BigDecimal amount,
                     String explanation, String bizDay, int vehicleCount, boolean transferWord) {
            this.entry = entry;
            this.role = role;
            this.amount = amount;
            this.explanation = explanation;
            this.bizDay = bizDay;
            this.vehicleCount = vehicleCount;
            this.transferWord = transferWord;
        }
    }

    private static final class HitResult {
        final IndexedEntry entry;
        final String mode;

        HitResult(IndexedEntry entry, String mode) {
            this.entry = entry;
            this.mode = mode;
        }
    }
}
