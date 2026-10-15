package com.zuantan.dismantling.service;

import com.zuantan.dismantling.common.PageResult;
import com.zuantan.dismantling.dto.JdyStatusResponse;
import com.zuantan.dismantling.mapper.JdyFormDataMapper;
import com.zuantan.dismantling.mapper.JdyPricingFormDataMapper;
import com.zuantan.dismantling.util.JdyBusinessForms;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * 简道云镜像数据大屏统计，对齐简道云 ERP 业务看板口径。
 */
@Service
public class JdyDashboardService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Shanghai");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    private static final String[] PRODUCT_NAMES = {
            "撕碎料", "废钢", "底盘料", "铜线", "铝件", "塑料", "小件", "橡胶", "其他"
    };
    private static final String[] PRODUCT_FIELDS = {
            "shredding", "scrapSteel", "chassis", "copper", "aluminum", "plastic", "smallParts", "rubber", "other"
    };

    private static final String[][] BUSINESS_STAGES = {
            {"receipt", "收货", "false"},
            {"weighing-inspection", "查验", "true"},
            {"scrapped-vehicle", "入库", "false"},
            {"pick-top-photo", "放油", "true"},
            {"disassembly", "拆解", "false"},
            {"comprehensive-disassembly", "综合拆解", "true"},
    };

    /** 大屏「提交时间」筛选与各业务环节对齐的日期字段（优先 submitTime） */
    private static final Map<String, String[]> BIZ_DATE_FIELDS = new LinkedHashMap<>();

    static {
        BIZ_DATE_FIELDS.put("receipt", new String[]{"submitTime", "datetime"});
        BIZ_DATE_FIELDS.put("weighing-inspection", new String[]{"submitTime", "weighDate", "returnDate"});
        BIZ_DATE_FIELDS.put("scrapped-vehicle", new String[]{"submitTime", "weighDate"});
        BIZ_DATE_FIELDS.put("pick-top-photo", new String[]{"submitTime"});
        BIZ_DATE_FIELDS.put("disassembly", new String[]{"submitTime", "disassemblyDate", "weighDate"});
        BIZ_DATE_FIELDS.put("comprehensive-disassembly", new String[]{"submitTime", "disassemblyDate", "weighDate"});
        BIZ_DATE_FIELDS.put("product-inbound", new String[]{"submitTime", "inboundDate"});
        BIZ_DATE_FIELDS.put("finished-product-ledger", new String[]{"submitTime", "deliveryDate", "syncDate"});
        BIZ_DATE_FIELDS.put("part-ledger", new String[]{"submitTime", "deliveryDate", "syncDate"});
        BIZ_DATE_FIELDS.put("settlement", new String[]{"submitTime", "weighDate", "returnDate"});
    }

    private final JdyFormDataMapper jdyFormDataMapper;
    private final JdyPricingFormDataMapper jdyPricingFormDataMapper;
    private final JdyBusinessDataService jdyBusinessDataService;
    private final JdySyncService jdySyncService;
    private final JdyMirrorStoreService jdyMirrorStoreService;

    private static final long DASHBOARD_CACHE_TTL_MS = 120_000L;
    private final ConcurrentHashMap<String, CachedDashboard> dashboardCache = new ConcurrentHashMap<>();
    /** 单次请求内复用已加载的业务行，避免重复全表扫描 */
    private final ThreadLocal<Map<String, List<Map<String, Object>>>> requestRowCache = new ThreadLocal<>();

    public JdyDashboardService(JdyFormDataMapper jdyFormDataMapper,
                               JdyPricingFormDataMapper jdyPricingFormDataMapper,
                               JdyBusinessDataService jdyBusinessDataService,
                               JdySyncService jdySyncService,
                               JdyMirrorStoreService jdyMirrorStoreService) {
        this.jdyFormDataMapper = jdyFormDataMapper;
        this.jdyPricingFormDataMapper = jdyPricingFormDataMapper;
        this.jdyBusinessDataService = jdyBusinessDataService;
        this.jdySyncService = jdySyncService;
        this.jdyMirrorStoreService = jdyMirrorStoreService;
    }

    /**
     * 业务一览看板（简道云 dash/662dfd89c7af268679c89b52 对齐）。
     */
    public Map<String, Object> getBusinessOverview(Integer year, String startDate, String endDate) {
        DateRange range = resolveDashboardRange(year, startDate, endDate);
        String cacheKey = dashboardCacheKey("business-overview", range);
        Map<String, Object> cached = getCachedDashboard(cacheKey);
        if (cached != null) {
            return cached;
        }

        LocalDate monthStart = LocalDate.now(ZONE).withDayOfMonth(1);
        LocalDate monthEnd = monthStart.plusMonths(1);
        LocalDate today = LocalDate.now(ZONE);
        LocalDate tomorrow = today.plusDays(1);

        LocalDate cumulativeStart = range.start;
        LocalDate cumulativeEnd = range.endExclusive;
        LocalDate monthlyStart = intersectStart(monthStart, cumulativeStart);
        LocalDate monthlyEnd = intersectEnd(monthEnd, cumulativeEnd);
        LocalDate dailyStart = intersectStart(today, cumulativeStart);
        LocalDate dailyEnd = intersectEnd(tomorrow, cumulativeEnd);

        List<Map<String, Object>> rows = new ArrayList<>();
        rows.add(buildOverviewRow("累计", cumulativeStart, cumulativeEnd, "累计"));
        rows.add(buildOverviewRow("月度", monthlyStart, monthlyEnd, "月度"));
        rows.add(buildOverviewRow("今日", dailyStart, dailyEnd, "今日"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("title", "华成攒碳汽车拆解有限公司业务一览（收车+议价）");
        result.put("year", range.year);
        result.put("rangeLabel", range.label);
        result.put("rows", rows);
        result.put("dataSource", "jdy");
        result.put("sources", JdyBusinessForms.dashboardSources().stream().map(s -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("source", s.getLabel());
            m.put("code", s.getCode());
            m.put("appId", s.getAppId());
            return m;
        }).collect(Collectors.toList()));
        result.put("jdyStatus", jdySyncService.getStatus());
        persistSnapshot("business-overview", range.year, result);
        putCachedDashboard(cacheKey, result);
        return result;
    }

    public void clearDashboardCache() {
        dashboardCache.clear();
    }

    private LocalDate intersectStart(LocalDate a, LocalDate rangeStart) {
        if (rangeStart == null) {
            return a;
        }
        return a.isBefore(rangeStart) ? rangeStart : a;
    }

    private LocalDate intersectEnd(LocalDate a, LocalDate rangeEndExclusive) {
        if (rangeEndExclusive == null) {
            return a;
        }
        return a.isAfter(rangeEndExclusive) ? rangeEndExclusive : a;
    }

    /**
     * 数字化可视大屏核心指标（基于简道云镜像聚合）。
     */
    public Map<String, Object> getDigitalDashboard(Integer year, String startDate, String endDate) {
        DateRange range = resolveDashboardRange(year, startDate, endDate);
        String cacheKey = dashboardCacheKey("digital", range);
        Map<String, Object> cached = getCachedDashboard(cacheKey);
        if (cached != null) {
            return cached;
        }

        requestRowCache.set(new HashMap<>());
        try {
            return buildDigitalDashboardUncached(range, cacheKey);
        } finally {
            requestRowCache.remove();
        }
    }

    private Map<String, Object> buildDigitalDashboardUncached(DateRange range, String cacheKey) {
        int y = range.year;
        LocalDate today = LocalDate.now(ZONE);
        LocalDate yearStart = LocalDate.of(y, 1, 1);
        LocalDate yearEnd = yearStart.plusYears(1);
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate monthEnd = monthStart.plusMonths(1);

        List<Map<String, Object>> kpiCards = new ArrayList<>();
        CountWithSources receiptCs = countBizDetailed("receipt", range.start, range.endExclusive);
        CountWithSources inboundCs = countBizDetailed("scrapped-vehicle", range.start, range.endExclusive);
        CountWithSources disassemblyCs = countBizDetailed("disassembly", range.start, range.endExclusive);
        long totalReceipt = receiptCs.total;
        long totalInbound = inboundCs.total;
        long totalDisassembly = disassemblyCs.total;
        double totalTonnage = sumTonnage(range.start, range.endExclusive);
        // 成品销售台账：收车 + 议价双应用合计
        AmountWithSources salesCs = sumLedgerAmountDetailed(range.start, range.endExclusive);
        double totalSales = salesCs.total;

        LocalDate monthSalesStart = intersectStart(monthStart, range.start);
        LocalDate monthSalesEnd = intersectEnd(monthEnd, range.endExclusive);
        LocalDate yearSalesStart = intersectStart(yearStart, range.start);
        LocalDate yearSalesEnd = intersectEnd(yearEnd, range.endExclusive);
        double monthSales = sumLedgerAmount(monthSalesStart, monthSalesEnd);
        double yearSales = sumLedgerAmount(yearSalesStart, yearSalesEnd);

        // KPI：累计入库左第一；已去掉库存总价；销售金额暂按双源合计（议价数据不完整时先维持现状）
        kpiCards.add(kpiWithSources("累计入库车辆", totalInbound, "辆",
                "过磅 " + round1(totalTonnage) + " 吨", "#00b894", "scrapped-vehicle", inboundCs.bySource));
        kpiCards.add(kpiWithSources("累计收货车辆", totalReceipt, "辆",
                range.label + " " + totalReceipt + " 辆", "#00d9ff", "receipt", receiptCs.bySource));
        kpiCards.add(kpiWithSources("累计拆解车辆", totalDisassembly, "辆",
                range.label + " " + totalDisassembly + " 辆", "#6c5ce7", "disassembly", disassemblyCs.bySource));
        Map<String, Object> salesKpi = kpiWithSources("累计销售金额", roundWan(totalSales), "万元",
                "本月 " + roundWan(monthSales) + " 万 · 本年 " + roundWan(yearSales) + " 万",
                "#fdcb6e", "finished-product-ledger", salesCs.bySource);
        salesKpi.put("monthValue", roundWan(monthSales));
        salesKpi.put("yearValue", roundWan(yearSales));
        kpiCards.add(salesKpi);

        List<Map<String, Object>> productionTrend = buildProductionTrend(range, 8);
        Map<String, Object> productionSummary = buildProductionSummary(productionTrend, totalTonnage);
        List<Map<String, Object>> staffRankingMonth = buildStaffRanking(monthStart, monthEnd);
        List<Map<String, Object>> staffRankingYear = buildStaffRanking(yearStart, yearEnd);
        Map<String, Object> negotiationStats = buildNegotiationStats(range.start, range.endExclusive);
        Map<String, Object> sourcePeriodStats = buildSourcePeriodStats(yearStart, yearEnd, monthStart, monthEnd);
        Map<String, Object> salesSummary = buildSalesSummary(monthSales, yearSales, monthSalesStart, monthSalesEnd,
                yearSalesStart, yearSalesEnd);
        Map<String, Object> partStats = buildPartSalesStats(yearStart, yearEnd, monthStart, monthEnd);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("kpiCards", kpiCards);
        result.put("productionTrend", productionTrend);
        result.put("productionSummary", productionSummary);
        result.put("staffRanking", staffRankingMonth);
        result.put("staffRankingMonth", staffRankingMonth);
        result.put("staffRankingYear", staffRankingYear);
        result.put("negotiationStats", negotiationStats);
        result.put("sourcePeriodStats", sourcePeriodStats);
        result.put("salesSummary", salesSummary);
        result.put("partStats", partStats);
        // 产品入库分析 / 出入库对比 / 库存总价 / 仓库库存：按需求下线，不再返回
        result.put("salesTrend", buildSalesTrendFromLedger(range, 8));
        result.put("activities", buildActivities(range.start, range.endExclusive));
        result.put("year", y);
        result.put("rangeLabel", range.label);
        result.put("startDate", range.start == null ? null : DATE_FMT.format(range.start));
        result.put("endDate", range.endExclusive == null ? null : DATE_FMT.format(range.endExclusive.minusDays(1)));
        result.put("dataSource", "jdy");
        result.put("jdyStatus", jdySyncService.getStatus());
        persistSnapshot("digital", y, result);
        putCachedDashboard(cacheKey, result);
        return result;
    }

    private String dashboardCacheKey(String type, DateRange range) {
        String start = range.start == null ? "all" : DATE_FMT.format(range.start);
        String end = range.endExclusive == null ? "all" : DATE_FMT.format(range.endExclusive);
        return type + ":" + start + ":" + end;
    }

    private Map<String, Object> getCachedDashboard(String key) {
        CachedDashboard entry = dashboardCache.get(key);
        if (entry == null) {
            return null;
        }
        if (entry.expiresAtMs < System.currentTimeMillis()) {
            dashboardCache.remove(key);
            return null;
        }
        return entry.payload;
    }

    private void putCachedDashboard(String key, Map<String, Object> payload) {
        dashboardCache.put(key, new CachedDashboard(payload, System.currentTimeMillis() + DASHBOARD_CACHE_TTL_MS));
    }

    private static final class CachedDashboard {
        private final Map<String, Object> payload;
        private final long expiresAtMs;

        private CachedDashboard(Map<String, Object> payload, long expiresAtMs) {
            this.payload = payload;
            this.expiresAtMs = expiresAtMs;
        }
    }

    private DateRange resolveDashboardRange(Integer year, String startDate, String endDate) {
        if (StringUtils.hasText(startDate) && StringUtils.hasText(endDate)) {
            LocalDate start = parseDate(startDate);
            LocalDate endInclusive = parseDate(endDate);
            if (start != null && endInclusive != null) {
                LocalDate endExclusive = endInclusive.plusDays(1);
                return new DateRange(start, endExclusive, endInclusive.getYear(), formatRangeLabel(start, endInclusive));
            }
        }
        int y = year == null ? LocalDate.now(ZONE).getYear() : year;
        LocalDate yearStart = LocalDate.of(y, 1, 1);
        LocalDate yearEnd = yearStart.plusYears(1);
        return new DateRange(yearStart, yearEnd, y, y + "年");
    }

    private String formatRangeLabel(LocalDate start, LocalDate endInclusive) {
        if (start.equals(endInclusive)) {
            return DATE_FMT.format(start);
        }
        return DATE_FMT.format(start) + " ~ " + DATE_FMT.format(endInclusive);
    }

    private void persistSnapshot(String key, int year, Map<String, Object> payload) {
        try {
            JdyStatusResponse status = jdySyncService.getStatus();
            jdyMirrorStoreService.saveDashboardSnapshot(key, year, payload,
                    status.getFormCount(), status.getDataCount());
        } catch (Exception ignored) {
            // 快照失败不影响接口返回
        }
    }

    private Map<String, Object> buildOverviewRow(String rowTitle,
                                                 LocalDate start,
                                                 LocalDate end,
                                                 String labelPrefix) {
        List<Map<String, Object>> stats = new ArrayList<>();
        for (String[] stage : BUSINESS_STAGES) {
            String bizKey = stage[0];
            String name = stage[1];
            boolean isCircle = Boolean.parseBoolean(stage[2]);
            CountWithSources cs = countBizDetailed(bizKey, start, end);
            Map<String, Object> stat = new LinkedHashMap<>();
            stat.put("label", labelPrefix + name);
            stat.put("value", cs.total);
            stat.put("isCircle", isCircle);
            stat.put("bizKey", bizKey);
            stat.put("bySource", cs.bySource);
            stats.add(stat);
        }
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("title", rowTitle);
        row.put("stats", stats);
        return row;
    }

    private long countBiz(String bizKey, LocalDate start, LocalDate end) {
        return countBizDetailed(bizKey, start, end).total;
    }

    private CountWithSources countBizDetailed(String bizKey, LocalDate start, LocalDate end) {
        String entryId = JdyBusinessForms.entryIdOf(bizKey);
        List<Map<String, Object>> bySource = new ArrayList<>();
        long total = 0L;
        if (!StringUtils.hasText(entryId)) {
            return new CountWithSources(0L, bySource);
        }
        for (JdyBusinessForms.AppSource source : JdyBusinessForms.dashboardSources()) {
            long value;
            boolean pricing = JdyBusinessForms.SOURCE_PRICING.equals(source.getLabel())
                    || "pricing".equals(source.getCode());
            if (start == null || end == null) {
                value = pricing
                        ? jdyPricingFormDataMapper.countByEntryId(entryId)
                        : jdyFormDataMapper.countByAppIdAndEntryId(source.getAppId(), entryId);
            } else {
                String startStr = DATE_FMT.format(start);
                String endStr = DATE_FMT.format(end);
                value = pricing
                        ? jdyPricingFormDataMapper.countByEntryIdBizDateRange(entryId, startStr, endStr)
                        : jdyFormDataMapper.countByAppIdAndEntryIdBizDateRange(
                        source.getAppId(), entryId, startStr, endStr);
            }
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("source", source.getLabel());
            item.put("code", source.getCode());
            item.put("appId", source.getAppId());
            item.put("table", pricing ? "jdy_pricing_form_data" : "jdy_form_data");
            item.put("value", value);
            bySource.add(item);
            total += value;
        }
        return new CountWithSources(total, bySource);
    }

    private Map<String, Object> kpiWithSources(String title, Number value, String unit, String sub,
                                               String color, String bizKey,
                                               List<Map<String, Object>> bySource) {
        Map<String, Object> card = kpi(title, value, unit, sub, color);
        card.put("bizKey", bizKey);
        card.put("bySource", bySource);
        return card;
    }

    private static final class CountWithSources {
        private final long total;
        private final List<Map<String, Object>> bySource;

        private CountWithSources(long total, List<Map<String, Object>> bySource) {
            this.total = total;
            this.bySource = bySource;
        }
    }

    private double sumTonnage(LocalDate start, LocalDate end) {
        return sumNumericField("weighing-inspection", "tonnage", start, end);
    }

    private double sumSettlementAmount(LocalDate start, LocalDate end) {
        return sumNumericField("settlement", "totalPrice", start, end);
    }

    private double sumNumericField(String bizKey, String field, LocalDate start, LocalDate end) {
        List<Map<String, Object>> rows = loadAllRows(bizKey);
        String[] dateFields = BIZ_DATE_FIELDS.getOrDefault(bizKey, new String[]{"submitTime"});
        double sum = 0;
        for (Map<String, Object> row : rows) {
            if (!inDateRange(row, start, end, dateFields)) {
                continue;
            }
            Object val = row.get(field);
            if (val instanceof Number) {
                sum += ((Number) val).doubleValue();
            } else if (val != null) {
                try {
                    sum += Double.parseDouble(String.valueOf(val));
                } catch (NumberFormatException ignored) {
                    // skip invalid
                }
            }
        }
        return sum;
    }

    private List<Map<String, Object>> buildProductionTrend(DateRange range, int maxMonths) {
        List<Map<String, Object>> trend = new ArrayList<>();
        YearMonth endMonth = range.endExclusive == null
                ? YearMonth.now(ZONE)
                : YearMonth.from(range.endExclusive.minusDays(1));
        YearMonth startMonth = range.start == null
                ? endMonth.minusMonths(maxMonths - 1L)
                : YearMonth.from(range.start);
        if (range.start != null && YearMonth.from(range.start).isAfter(startMonth)) {
            startMonth = YearMonth.from(range.start);
        }
        int monthCount = 0;
        YearMonth cursor = startMonth;
        while (!cursor.isAfter(endMonth) && monthCount < maxMonths) {
            LocalDate start = cursor.atDay(1);
            LocalDate end = cursor.plusMonths(1).atDay(1);
            if (range.start != null && start.isBefore(range.start)) {
                start = range.start;
            }
            if (range.endExclusive != null && end.isAfter(range.endExclusive)) {
                end = range.endExclusive;
            }
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("month", cursor.getMonthValue() + "月");
            item.put("receipt", countBiz("receipt", start, end));
            item.put("disassembly", countBiz("disassembly", start, end));
            item.put("weight", round1(sumTonnage(start, end)));
            trend.add(item);
            cursor = cursor.plusMonths(1);
            monthCount++;
        }
        if (trend.isEmpty()) {
            return buildProductionTrendMonths(maxMonths);
        }
        return trend;
    }

    private List<Map<String, Object>> buildProductionTrendMonths(int months) {
        List<Map<String, Object>> trend = new ArrayList<>();
        YearMonth current = YearMonth.now(ZONE);
        for (int i = months - 1; i >= 0; i--) {
            YearMonth ym = current.minusMonths(i);
            LocalDate start = ym.atDay(1);
            LocalDate end = ym.plusMonths(1).atDay(1);
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("month", ym.getMonthValue() + "月");
            item.put("receipt", countBiz("receipt", start, end));
            item.put("disassembly", countBiz("disassembly", start, end));
            item.put("weight", round1(sumTonnage(start, end)));
            trend.add(item);
        }
        return trend;
    }

    private Map<String, Object> buildProductionSummary(List<Map<String, Object>> trend, double totalTonnage) {
        long totalReceipt = trend.stream()
                .mapToLong(m -> ((Number) m.get("receipt")).longValue())
                .sum();
        long totalDisassembly = trend.stream()
                .mapToLong(m -> ((Number) m.get("disassembly")).longValue())
                .sum();
        double avgPrice = totalTonnage > 0 ? sumSettlementAmount(null, null) / totalTonnage : 0;
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalReceipt", totalReceipt);
        summary.put("totalDisassembly", totalDisassembly);
        summary.put("totalWeight", round1(totalTonnage));
        summary.put("avgPrice", Math.round(avgPrice));
        return summary;
    }

    private List<Map<String, Object>> buildSalesTrend(int months) {
        return buildSalesTrendFromLedgerMonths(months);
    }

    private List<Map<String, Object>> buildSalesTrendFromLedger(DateRange range, int maxMonths) {
        List<Map<String, Object>> trend = new ArrayList<>();
        YearMonth endMonth = range.endExclusive == null
                ? YearMonth.now(ZONE)
                : YearMonth.from(range.endExclusive.minusDays(1));
        YearMonth startMonth = range.start == null
                ? endMonth.minusMonths(maxMonths - 1L)
                : YearMonth.from(range.start);
        if (range.start != null && YearMonth.from(range.start).isAfter(startMonth)) {
            startMonth = YearMonth.from(range.start);
        }
        int monthCount = 0;
        YearMonth cursor = startMonth;
        while (!cursor.isAfter(endMonth) && monthCount < maxMonths) {
            LocalDate start = cursor.atDay(1);
            LocalDate end = cursor.plusMonths(1).atDay(1);
            if (range.start != null && start.isBefore(range.start)) {
                start = range.start;
            }
            if (range.endExclusive != null && end.isAfter(range.endExclusive)) {
                end = range.endExclusive;
            }
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("month", cursor.getMonthValue() + "月");
            item.put("amount", Math.round(sumLedgerAmount(start, end)));
            item.put("count", countLedgerInRange(start, end));
            trend.add(item);
            cursor = cursor.plusMonths(1);
            monthCount++;
        }
        if (trend.isEmpty()) {
            return buildSalesTrendFromLedgerMonths(maxMonths);
        }
        return trend;
    }

    private List<Map<String, Object>> buildSalesTrendFromLedgerMonths(int months) {
        List<Map<String, Object>> trend = new ArrayList<>();
        YearMonth current = YearMonth.now(ZONE);
        for (int i = months - 1; i >= 0; i--) {
            YearMonth ym = current.minusMonths(i);
            LocalDate start = ym.atDay(1);
            LocalDate end = ym.plusMonths(1).atDay(1);
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("month", ym.getMonthValue() + "月");
            item.put("amount", Math.round(sumLedgerAmount(start, end)));
            item.put("count", countLedgerInRange(start, end));
            trend.add(item);
        }
        return trend;
    }

    private double sumProductInboundTonnage(LocalDate start, LocalDate end) {
        double sum = 0;
        String[] dateFields = BIZ_DATE_FIELDS.get("product-inbound");
        for (Map<String, Object> row : loadAllRows("product-inbound")) {
            if (!inDateRange(row, start, end, dateFields)) {
                continue;
            }
            sum += sumProductFields(row);
        }
        return sum;
    }

    private double sumLedgerAmount(LocalDate start, LocalDate end) {
        return sumLedgerAmountDetailed(start, end).total;
    }

    private AmountWithSources sumLedgerAmountDetailed(LocalDate start, LocalDate end) {
        String[] dateFields = BIZ_DATE_FIELDS.get("finished-product-ledger");
        List<Map<String, Object>> bySource = new ArrayList<>();
        double total = 0;
        for (JdyBusinessForms.AppSource source : JdyBusinessForms.dashboardSources()) {
            boolean pricing = "pricing".equals(source.getCode())
                    || JdyBusinessForms.SOURCE_PRICING.equals(source.getLabel());
            double sum = 0;
            for (Map<String, Object> row : loadAllRows("finished-product-ledger", pricing)) {
                if (!inDateRange(row, start, end, dateFields)) {
                    continue;
                }
                Object val = row.get("totalPrice");
                if (val == null) {
                    val = row.get("actualAmount");
                }
                sum += toDouble(val);
            }
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("source", source.getLabel());
            item.put("code", source.getCode());
            item.put("appId", source.getAppId());
            item.put("value", roundWan(sum));
            item.put("rawValue", Math.round(sum));
            bySource.add(item);
            total += sum;
        }
        return new AmountWithSources(total, bySource);
    }

    private long countLedgerInRange(LocalDate start, LocalDate end) {
        String[] dateFields = BIZ_DATE_FIELDS.get("finished-product-ledger");
        return loadAllRows("finished-product-ledger").stream()
                .filter(row -> inDateRange(row, start, end, dateFields))
                .count();
    }

    private Map<String, Object> buildSourcePeriodStats(LocalDate yearStart, LocalDate yearEnd,
                                                       LocalDate monthStart, LocalDate monthEnd) {
        CountWithSources receiptYear = countBizDetailed("receipt", yearStart, yearEnd);
        CountWithSources receiptMonth = countBizDetailed("receipt", monthStart, monthEnd);
        CountWithSources inboundYear = countBizDetailed("scrapped-vehicle", yearStart, yearEnd);
        CountWithSources inboundMonth = countBizDetailed("scrapped-vehicle", monthStart, monthEnd);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("receipt", periodBySource(receiptYear, receiptMonth));
        result.put("inbound", periodBySource(inboundYear, inboundMonth));
        return result;
    }

    private Map<String, Object> periodBySource(CountWithSources yearCs, CountWithSources monthCs) {
        Map<String, Object> out = new LinkedHashMap<>();
        for (JdyBusinessForms.AppSource source : JdyBusinessForms.dashboardSources()) {
            long yearVal = findSourceValue(yearCs.bySource, source.getCode());
            long monthVal = findSourceValue(monthCs.bySource, source.getCode());
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("source", source.getLabel());
            item.put("code", source.getCode());
            item.put("year", yearVal);
            item.put("month", monthVal);
            out.put(source.getCode(), item);
        }
        Map<String, Object> total = new LinkedHashMap<>();
        total.put("year", yearCs.total);
        total.put("month", monthCs.total);
        out.put("total", total);
        return out;
    }

    private long findSourceValue(List<Map<String, Object>> bySource, String code) {
        if (bySource == null) {
            return 0L;
        }
        for (Map<String, Object> item : bySource) {
            if (code.equals(String.valueOf(item.get("code")))) {
                Object v = item.get("value");
                return v instanceof Number ? ((Number) v).longValue() : 0L;
            }
        }
        return 0L;
    }

    private Map<String, Object> buildSalesSummary(double monthSales, double yearSales,
                                                  LocalDate monthStart, LocalDate monthEnd,
                                                  LocalDate yearStart, LocalDate yearEnd) {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("monthAmount", Math.round(monthSales));
        summary.put("yearAmount", Math.round(yearSales));
        summary.put("monthWan", roundWan(monthSales));
        summary.put("yearWan", roundWan(yearSales));
        summary.put("monthCount", countLedgerInRange(monthStart, monthEnd));
        summary.put("yearCount", countLedgerInRange(yearStart, yearEnd));
        AmountWithSources monthBySource = sumLedgerAmountDetailed(monthStart, monthEnd);
        AmountWithSources yearBySource = sumLedgerAmountDetailed(yearStart, yearEnd);
        summary.put("monthBySource", monthBySource.bySource);
        summary.put("yearBySource", yearBySource.bySource);
        return summary;
    }

    private Map<String, Object> buildPartSalesStats(LocalDate yearStart, LocalDate yearEnd,
                                                    LocalDate monthStart, LocalDate monthEnd) {
        String[] dateFields = BIZ_DATE_FIELDS.get("part-ledger");
        List<Map<String, Object>> rows = loadAllRows("part-ledger");

        double yearAmount = 0;
        double monthAmount = 0;
        double yearWeight = 0;
        double monthWeight = 0;
        long yearCount = 0;
        long monthCount = 0;
        Map<String, Double> categoryYear = new LinkedHashMap<>();
        Map<String, Double> categoryMonth = new LinkedHashMap<>();

        for (Map<String, Object> row : rows) {
            double amount = toDouble(row.get("totalPrice"));
            if (amount <= 0) {
                amount = toDouble(row.get("actualAmount"));
            }
            double weight = toDouble(row.get("netWeight"));
            if (weight <= 0) {
                weight = toDouble(row.get("outWeight"));
            }
            String category = stringify(row.get("productName"));
            if (!StringUtils.hasText(category)) {
                category = "其他";
            }

            boolean inYear = inDateRange(row, yearStart, yearEnd, dateFields);
            boolean inMonth = inDateRange(row, monthStart, monthEnd, dateFields);
            if (inYear) {
                yearAmount += amount;
                yearWeight += weight;
                yearCount++;
                categoryYear.merge(category, amount, Double::sum);
            }
            if (inMonth) {
                monthAmount += amount;
                monthWeight += weight;
                monthCount++;
                categoryMonth.merge(category, amount, Double::sum);
            }
        }

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("yearAmount", Math.round(yearAmount));
        stats.put("monthAmount", Math.round(monthAmount));
        stats.put("yearWan", roundWan(yearAmount));
        stats.put("monthWan", roundWan(monthAmount));
        stats.put("yearWeight", round1(yearWeight));
        stats.put("monthWeight", round1(monthWeight));
        stats.put("yearCount", yearCount);
        stats.put("monthCount", monthCount);
        stats.put("categoryYear", toNamedAmountList(categoryYear, 8));
        stats.put("categoryMonth", toNamedAmountList(categoryMonth, 8));
        return stats;
    }

    private List<Map<String, Object>> toNamedAmountList(Map<String, Double> amounts, int limit) {
        return amounts.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue(Comparator.reverseOrder()))
                .limit(limit)
                .map(e -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("name", e.getKey());
                    item.put("amount", Math.round(e.getValue()));
                    item.put("wan", roundWan(e.getValue()));
                    return item;
                })
                .collect(Collectors.toList());
    }

    private static final class AmountWithSources {
        private final double total;
        private final List<Map<String, Object>> bySource;

        private AmountWithSources(double total, List<Map<String, Object>> bySource) {
            this.total = total;
            this.bySource = bySource;
        }
    }

    private List<Map<String, Object>> buildActivities(LocalDate start, LocalDate end) {
        List<Map<String, Object>> items = new ArrayList<>();

        for (Map<String, Object> row : loadAllRows("product-inbound")) {
            if (!inDateRange(row, start, end, BIZ_DATE_FIELDS.get("product-inbound"))) {
                continue;
            }
            ActivityCandidate c = buildInboundActivity(row);
            if (c != null) {
                items.add(c.toMap());
            }
        }
        for (Map<String, Object> row : loadAllRows("finished-product-ledger")) {
            if (!inDateRange(row, start, end, BIZ_DATE_FIELDS.get("finished-product-ledger"))) {
                continue;
            }
            ActivityCandidate c = buildSalesActivity(row);
            if (c != null) {
                items.add(c.toMap());
            }
        }
        for (Map<String, Object> row : loadAllRows("comprehensive-disassembly")) {
            if (!inDateRange(row, start, end, BIZ_DATE_FIELDS.get("comprehensive-disassembly"))) {
                continue;
            }
            ActivityCandidate c = buildDisassemblyActivity(row, "综合拆解");
            if (c != null) {
                items.add(c.toMap());
            }
        }
        for (Map<String, Object> row : loadAllRows("disassembly")) {
            if (!inDateRange(row, start, end, BIZ_DATE_FIELDS.get("disassembly"))) {
                continue;
            }
            ActivityCandidate c = buildDisassemblyActivity(row, "拆解");
            if (c != null) {
                items.add(c.toMap());
            }
        }
        for (Map<String, Object> row : loadAllRows("receipt")) {
            if (!inDateRange(row, start, end, BIZ_DATE_FIELDS.get("receipt"))) {
                continue;
            }
            ActivityCandidate c = buildReceiptActivity(row);
            if (c != null) {
                items.add(c.toMap());
            }
        }

        return items.stream()
                .sorted(Comparator.comparing((Map<String, Object> m) -> stringify(m.get("_sortKey"))).reversed())
                .limit(6)
                .map(m -> {
                    Map<String, Object> out = new LinkedHashMap<>(m);
                    out.remove("_sortKey");
                    return out;
                })
                .collect(Collectors.toList());
    }

    private ActivityCandidate buildInboundActivity(Map<String, Object> row) {
        int maxIdx = -1;
        double maxVal = 0;
        for (int i = 0; i < PRODUCT_FIELDS.length; i++) {
            double val = toDouble(row.get(PRODUCT_FIELDS[i]));
            if (val > maxVal) {
                maxVal = val;
                maxIdx = i;
            }
        }
        if (maxIdx < 0 || maxVal <= 0) {
            return null;
        }
        String code = stringify(row.get("vehicleCode"));
        String text = (StringUtils.hasText(code) ? code + " " : "") + "入库 "
                + PRODUCT_NAMES[maxIdx] + " " + round1(maxVal) + "吨";
        return new ActivityCandidate(activitySortKey(row, "inboundDate"), formatActivityTime(row, "inboundDate"),
                "入库", text, "#00b894");
    }

    private ActivityCandidate buildSalesActivity(Map<String, Object> row) {
        String product = stringify(row.get("productName"));
        double weight = toDouble(row.get("netWeight"));
        double amount = toDouble(row.get("totalPrice"));
        if (!StringUtils.hasText(product) || weight <= 0) {
            return null;
        }
        String receiver = stringify(row.get("receiver"));
        String text = (StringUtils.hasText(receiver) ? receiver + " " : "")
                + "销售" + product + " " + round1(weight) + "吨";
        if (amount > 0) {
            text += " ¥" + String.format("%,.0f", amount);
        }
        return new ActivityCandidate(activitySortKey(row, "deliveryDate"), formatActivityTime(row, "deliveryDate"),
                "销售", text, "#00d9ff");
    }

    private ActivityCandidate buildDisassemblyActivity(Map<String, Object> row, String type) {
        String code = stringify(row.get("entryCode"));
        if (!StringUtils.hasText(code)) {
            return null;
        }
        String text = "车辆 " + code + " 完成" + type;
        return new ActivityCandidate(activitySortKey(row, "disassemblyDate"), formatActivityTime(row, "disassemblyDate"),
                type, text, "#6c5ce7");
    }

    private ActivityCandidate buildReceiptActivity(Map<String, Object> row) {
        String plate = stringify(row.get("plateNo"));
        String submitter = stringify(row.get("submitter"));
        if (!StringUtils.hasText(plate) && !StringUtils.hasText(submitter)) {
            return null;
        }
        String text = (StringUtils.hasText(submitter) ? submitter + " " : "") + "收货 "
                + (StringUtils.hasText(plate) ? plate : "车辆");
        return new ActivityCandidate(activitySortKey(row, "datetime"), formatActivityTime(row, "datetime"),
                "收货", text, "#fd79a8");
    }

    private String activitySortKey(Map<String, Object> row, String... dateFields) {
        for (String field : dateFields) {
            Object val = row.get(field);
            if (val != null && StringUtils.hasText(String.valueOf(val))) {
                return String.valueOf(val);
            }
        }
        Object submitTime = row.get("submitTime");
        return submitTime == null ? "" : String.valueOf(submitTime);
    }

    private String formatActivityTime(Map<String, Object> row, String... dateFields) {
        for (String field : dateFields) {
            Object val = row.get(field);
            if (val == null) {
                continue;
            }
            LocalDateTime dt = parseDateTime(String.valueOf(val));
            if (dt != null) {
                return TIME_FMT.format(dt);
            }
        }
        LocalDateTime dt = parseDateTime(stringify(row.get("submitTime")));
        return dt == null ? "--:--" : TIME_FMT.format(dt);
    }

    private LocalDateTime parseDateTime(String text) {
        if (!StringUtils.hasText(text)) {
            return null;
        }
        LocalDate date = parseDate(text);
        if (date == null) {
            return null;
        }
        try {
            if (text.contains("T") && text.length() >= 19) {
                return LocalDateTime.parse(text.substring(0, 19));
            }
        } catch (Exception ignored) {
            // ignore
        }
        return date.atTime(LocalTime.MIN);
    }

    private double sumProductFields(Map<String, Object> row) {
        double sum = 0;
        for (String field : PRODUCT_FIELDS) {
            sum += toDouble(row.get(field));
        }
        return sum;
    }

    private double toDouble(Object val) {
        if (val instanceof Number) {
            return ((Number) val).doubleValue();
        }
        if (val == null) {
            return 0;
        }
        try {
            return Double.parseDouble(String.valueOf(val).trim());
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private boolean inDateRange(Map<String, Object> row, LocalDate start, LocalDate end, String... dateFields) {
        if (start == null || end == null) {
            return true;
        }
        LocalDate date = dateFields.length == 0 ? parseRowDate(row) : parseRowDate(row, dateFields);
        return date != null && !date.isBefore(start) && date.isBefore(end);
    }

    private LocalDate parseRowDate(Map<String, Object> row, String... preferredFields) {
        if (preferredFields != null) {
            for (String key : preferredFields) {
                Object val = row.get(key);
                if (val != null) {
                    LocalDate parsed = parseDate(String.valueOf(val));
                    if (parsed != null) {
                        return parsed;
                    }
                }
            }
        }
        return parseRowDate(row);
    }

    private static final class ActivityCandidate {
        private final String sortKey;
        private final String time;
        private final String type;
        private final String text;
        private final String color;

        private ActivityCandidate(String sortKey, String time, String type, String text, String color) {
            this.sortKey = sortKey;
            this.time = time;
            this.type = type;
            this.text = text;
            this.color = color;
        }

        private Map<String, Object> toMap() {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("_sortKey", sortKey);
            map.put("time", time);
            map.put("type", type);
            map.put("text", text);
            map.put("color", color);
            return map;
        }
    }

    /**
     * 议价 / 销户统计：来自简道云镜像中收货、过磅查验、报废车入库的「销户/议价」字段。
     * 汇总口径以过磅查验为准（与业务页展示一致），并附各环节拆分。
     */
    private Map<String, Object> buildNegotiationStats(LocalDate start, LocalDate end) {
        long[] receipt = countNegotiationSplit("receipt", start, end);
        long[] inspection = countNegotiationSplit("weighing-inspection", start, end);
        long[] inbound = countNegotiationSplit("scrapped-vehicle", start, end);

        long negotiated = inspection[0];
        long cancelled = inspection[1];
        long total = negotiated + cancelled;
        double ratio = total > 0 ? (negotiated * 100.0 / total) : 0;

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("negotiated", negotiated);
        stats.put("cancelled", cancelled);
        stats.put("total", total);
        stats.put("negotiatedRatio", Math.round(ratio * 10.0) / 10.0);
        stats.put("receiptNegotiated", receipt[0]);
        stats.put("receiptCancelled", receipt[1]);
        stats.put("inspectionNegotiated", inspection[0]);
        stats.put("inspectionCancelled", inspection[1]);
        stats.put("inboundNegotiated", inbound[0]);
        stats.put("inboundCancelled", inbound[1]);
        stats.put("source", "jdy");
        return stats;
    }

    /** @return [议价数, 销户数] */
    private long[] countNegotiationSplit(String bizKey, LocalDate start, LocalDate end) {
        long negotiated = 0;
        long cancelled = 0;
        String[] dateFields = BIZ_DATE_FIELDS.getOrDefault(bizKey, new String[]{"submitTime"});
        for (Map<String, Object> row : loadAllRows(bizKey)) {
            if (!inDateRange(row, start, end, dateFields)) {
                continue;
            }
            if (isNegotiatedRow(row)) {
                negotiated++;
            } else {
                cancelled++;
            }
        }
        return new long[]{negotiated, cancelled};
    }

    private boolean isNegotiatedRow(Map<String, Object> row) {
        Object negotiatedFlag = row.get("isNegotiated");
        if (negotiatedFlag instanceof Boolean) {
            return (Boolean) negotiatedFlag;
        }
        if (negotiatedFlag != null) {
            String flag = String.valueOf(negotiatedFlag).trim();
            if ("true".equalsIgnoreCase(flag) || "是".equals(flag) || "1".equals(flag) || "议价".equals(flag) || "议".equals(flag)) {
                return true;
            }
            if ("false".equalsIgnoreCase(flag) || "否".equals(flag) || "0".equals(flag) || "销户".equals(flag) || "销".equals(flag)) {
                return false;
            }
        }
        String negotiation = stringify(row.get("negotiation"));
        if (!StringUtils.hasText(negotiation)) {
            return false;
        }
        String v = negotiation.trim();
        return "议价".equals(v) || "议".equals(v) || v.contains("议价");
    }

    private List<Map<String, Object>> buildStaffRanking(LocalDate start, LocalDate end) {
        List<Map<String, Object>> rows = loadAllRows("weighing-inspection");
        Map<String, Long> counts = new LinkedHashMap<>();
        for (Map<String, Object> row : rows) {
            if (!inDateRange(row, start, end, BIZ_DATE_FIELDS.get("weighing-inspection"))) {
                continue;
            }
            String name = stringify(row.get("salesperson"));
            if (!StringUtils.hasText(name)) {
                continue;
            }
            counts.merge(name.trim(), 1L, Long::sum);
        }

        Map<String, Double> amounts = new LinkedHashMap<>();
        for (Map<String, Object> row : loadAllRows("finished-product-ledger")) {
            if (!inDateRange(row, start, end, BIZ_DATE_FIELDS.get("finished-product-ledger"))) {
                continue;
            }
            String name = stringify(row.get("receiver"));
            if (!StringUtils.hasText(name)) {
                continue;
            }
            amounts.merge(name.trim(), toDouble(row.get("totalPrice")), Double::sum);
        }

        return counts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder()))
                .limit(6)
                .map(e -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("name", e.getKey());
                    item.put("monthly", e.getValue());
                    item.put("amount", Math.round(findAmount(amounts, e.getKey())));
                    return item;
                })
                .collect(Collectors.toList());
    }

    private double findAmount(Map<String, Double> amounts, String name) {
        if (amounts.containsKey(name)) {
            return amounts.get(name);
        }
        for (Map.Entry<String, Double> entry : amounts.entrySet()) {
            if (entry.getKey().contains(name) || name.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        return 0;
    }

    private List<Map<String, Object>> loadAllRows(String bizKey) {
        return loadAllRowsMerged(bizKey);
    }

    /** 收车 + 议价双表合并（大屏默认口径）。 */
    private List<Map<String, Object>> loadAllRowsMerged(String bizKey) {
        Map<String, List<Map<String, Object>>> cache = requestRowCache.get();
        String cacheKey = bizKey + ":merged";
        if (cache != null && cache.containsKey(cacheKey)) {
            return cache.get(cacheKey);
        }
        List<Map<String, Object>> all = new ArrayList<>();
        all.addAll(loadAllRows(bizKey, false));
        all.addAll(loadAllRows(bizKey, true));
        if (cache != null) {
            cache.put(cacheKey, all);
        }
        return all;
    }

    private List<Map<String, Object>> loadAllRows(String bizKey, boolean pricing) {
        Map<String, List<Map<String, Object>>> cache = requestRowCache.get();
        String cacheKey = bizKey + ":" + (pricing ? "pricing" : "receipt");
        if (cache != null && cache.containsKey(cacheKey)) {
            return cache.get(cacheKey);
        }
        List<Map<String, Object>> all = new ArrayList<>();
        int pageNo = 1;
        int pageSize = 5000;
        while (true) {
            PageResult<List<Map<String, Object>>> page = pricing
                    ? jdyBusinessDataService.listPricingBusinessData(bizKey, pageNo, pageSize, null)
                    : jdyBusinessDataService.listBusinessData(bizKey, pageNo, pageSize, null);
            if (page.getRecords() == null || page.getRecords().isEmpty()) {
                break;
            }
            all.addAll(page.getRecords());
            if (all.size() >= page.getTotal()) {
                break;
            }
            pageNo++;
        }
        if (cache != null) {
            cache.put(cacheKey, all);
        }
        return all;
    }

    private boolean inDateRange(Map<String, Object> row, LocalDate start, LocalDate end) {
        if (start == null || end == null) {
            return true;
        }
        LocalDate date = parseRowDate(row);
        return date != null && !date.isBefore(start) && date.isBefore(end);
    }

    private LocalDate parseRowDate(Map<String, Object> row) {
        for (String key : new String[]{"weighDate", "disassemblyDate", "datetime", "returnDate", "submitTime"}) {
            Object val = row.get(key);
            if (val == null) {
                continue;
            }
            LocalDate parsed = parseDate(String.valueOf(val));
            if (parsed != null) {
                return parsed;
            }
        }
        return null;
    }

    private LocalDate parseDate(String text) {
        if (!StringUtils.hasText(text)) {
            return null;
        }
        String s = text.trim();
        try {
            if (s.length() >= 10) {
                return LocalDate.parse(s.substring(0, 10), DATE_FMT);
            }
        } catch (Exception ignored) {
            // ignore
        }
        return null;
    }

    private Map<String, Object> kpi(String title, Number value, String unit, String sub, String color) {
        Map<String, Object> card = new LinkedHashMap<>();
        card.put("title", title);
        card.put("value", value);
        card.put("unit", unit);
        card.put("sub", sub);
        card.put("color", color);
        return card;
    }

    private double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    private long roundWan(double yuan) {
        return Math.round(yuan / 10000.0);
    }

    private String stringify(Object value) {
        return value == null ? null : String.valueOf(value).trim();
    }

    private static final class DateRange {
        private final LocalDate start;
        private final LocalDate endExclusive;
        private final int year;
        private final String label;

        private DateRange(LocalDate start, LocalDate endExclusive, int year, String label) {
            this.start = start;
            this.endExclusive = endExclusive;
            this.year = year;
            this.label = label;
        }
    }
}
