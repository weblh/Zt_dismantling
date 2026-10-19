package com.zuantan.dismantling.service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zuantan.dismantling.dto.DictItemVO;
import com.zuantan.dismantling.dto.DictTypeVO;
import com.zuantan.dismantling.entity.JdyForm;
import com.zuantan.dismantling.entity.JdyFormData;
import com.zuantan.dismantling.entity.JdyPricingForm;
import com.zuantan.dismantling.entity.JdyPricingFormData;
import com.zuantan.dismantling.entity.SysDictItem;
import com.zuantan.dismantling.entity.SysDictType;
import com.zuantan.dismantling.mapper.JdyFormDataMapper;
import com.zuantan.dismantling.mapper.JdyFormMapper;
import com.zuantan.dismantling.mapper.JdyPricingFormDataMapper;
import com.zuantan.dismantling.mapper.JdyPricingFormMapper;
import com.zuantan.dismantling.mapper.SysDictItemMapper;
import com.zuantan.dismantling.mapper.SysDictTypeMapper;
import com.zuantan.dismantling.util.JdyBusinessForms;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * 字典：从简道云「收车 / 议价」双应用拉取全部字典数据（基础资料表单行 + 全表单固定选项）。
 */
@Service
public class DictService {

    private static final Logger log = LoggerFactory.getLogger(DictService.class);

    /** 已知基础资料：entryId → 友好 code / 名称 */
    private static final Map<String, String[]> KNOWN_MASTER_BY_ENTRY;
    /** 业务过程表单 entryId：只抽固定选项，不当作基础资料字典表 */
    private static final Set<String> BUSINESS_PROCESS_ENTRY_IDS;

    private static final String[] DICT_NAME_KEYWORDS = {
            "基础", "资料", "字典", "业务员", "供应商", "车辆型号", "仓库", "产品名称",
            "收款人", "生产人员", "人员", "型号", "品名", "客户信息", "单位", "账户",
            "账号", "开户行", "车型", "司磅", "拆解员", "查验员"
    };

    private static final String[] BUSINESS_NAME_KEYWORDS = {
            "业务收货", "过磅查验", "查验照片", "报废车", "挑顶", "综合拆解", "业务结账",
            "付款申请", "修改价格", "过磅同步", "异地车", "VIN", "档案识别", "成品入库",
            "成品台账", "配件台账", "审批", "待办", "我发起", "我处理", "抄送",
            "入库", "出库", "维修工单", "收货议价"
    };

    private static final Set<String> SIMPLE_WIDGET_TYPES = new HashSet<>(Arrays.asList(
            "text", "textarea", "number", "combo", "radiogroup", "checkboxgroup",
            "datetime", "date", "time", "phone", "mobile", "sn", "address",
            "dept", "user", "company", "location", "formula", "ocr", "signature"
    ));

    static {
        Map<String, String[]> known = new LinkedHashMap<>();
        known.put("662df42caac7fa9673a158e7", new String[]{"salesman", "业务员"});
        known.put("6617543cbad6f2f89103bc62", new String[]{"supplier", "供应商"});
        known.put("663b1d28e70ddd5951d36e4b", new String[]{"vehicle-model", "车辆型号"});
        known.put("66f8b2fcb00b52e5eb7841ed", new String[]{"product-name", "产品名称"});
        known.put("672f20b05a9cca282dabcf68", new String[]{"payee-info", "收款人信息"});
        KNOWN_MASTER_BY_ENTRY = Collections.unmodifiableMap(known);

        Set<String> business = new HashSet<>();
        for (Map.Entry<String, String> e : JdyBusinessForms.allEntryIds().entrySet()) {
            if (KNOWN_MASTER_BY_ENTRY.containsKey(e.getValue())) {
                continue;
            }
            business.add(e.getValue());
        }
        // embed 中额外业务表单
        business.add("663b1e88ba845cf48827ee01"); // 查验照片
        business.add("663b2edc056afeba75ade772"); // 异地车回车照片
        business.add("662862b4b50583466d931c7a"); // VIN
        business.add("65fa3de0ece826d5a80f29f5"); // 车辆档案
        BUSINESS_PROCESS_ENTRY_IDS = Collections.unmodifiableSet(business);
    }

    private final SysDictTypeMapper dictTypeMapper;
    private final SysDictItemMapper dictItemMapper;
    private final JdyFormMapper jdyFormMapper;
    private final JdyFormDataMapper jdyFormDataMapper;
    private final JdyPricingFormMapper jdyPricingFormMapper;
    private final JdyPricingFormDataMapper jdyPricingFormDataMapper;
    private final JdyApiService jdyApiService;

    @Value("${jiandaoyun.pricing-app-id:67ff16f5714711e0b87f173b}")
    private String pricingAppId;

    public DictService(SysDictTypeMapper dictTypeMapper,
                       SysDictItemMapper dictItemMapper,
                       JdyFormMapper jdyFormMapper,
                       JdyFormDataMapper jdyFormDataMapper,
                       JdyPricingFormMapper jdyPricingFormMapper,
                       JdyPricingFormDataMapper jdyPricingFormDataMapper,
                       JdyApiService jdyApiService) {
        this.dictTypeMapper = dictTypeMapper;
        this.dictItemMapper = dictItemMapper;
        this.jdyFormMapper = jdyFormMapper;
        this.jdyFormDataMapper = jdyFormDataMapper;
        this.jdyPricingFormMapper = jdyPricingFormMapper;
        this.jdyPricingFormDataMapper = jdyPricingFormDataMapper;
        this.jdyApiService = jdyApiService;
    }

    public List<DictTypeVO> listTypes() {
        List<SysDictType> types = dictTypeMapper.selectList(new LambdaQueryWrapper<SysDictType>()
                .eq(SysDictType::getStatus, 1)
                .orderByAsc(SysDictType::getSortOrder)
                .orderByAsc(SysDictType::getId));
        List<DictTypeVO> result = new ArrayList<>();
        for (SysDictType t : types) {
            DictTypeVO vo = toTypeVO(t);
            Long count = dictItemMapper.selectCount(new LambdaQueryWrapper<SysDictItem>()
                    .eq(SysDictItem::getTypeCode, t.getCode())
                    .eq(SysDictItem::getStatus, 1));
            vo.setItemCount(count == null ? 0L : count);
            result.add(vo);
        }
        return result;
    }

    public List<DictItemVO> listItems(String typeCode, String keyword) {
        if (!StringUtils.hasText(typeCode)) {
            return Collections.emptyList();
        }
        if ("payee-info".equals(typeCode.trim())) {
            collapseDuplicatePayees();
        }
        LambdaQueryWrapper<SysDictItem> q = new LambdaQueryWrapper<SysDictItem>()
                .eq(SysDictItem::getTypeCode, typeCode.trim())
                .eq(SysDictItem::getStatus, 1)
                .orderByAsc(SysDictItem::getSortOrder)
                .orderByAsc(SysDictItem::getId);
        if (StringUtils.hasText(keyword)) {
            String k = keyword.trim();
            q.and(w -> w.like(SysDictItem::getItemLabel, k)
                    .or().like(SysDictItem::getItemValue, k)
                    .or().like(SysDictItem::getExtraJson, k));
        }
        List<SysDictItem> rows = dictItemMapper.selectList(q);
        List<DictItemVO> result = new ArrayList<>(rows.size());
        for (SysDictItem row : rows) {
            result.add(toItemVO(row));
        }
        return result;
    }

    /**
     * 从简道云直接拉取基础资料（业务员、供应商等）写入 sys_dict，不依赖全量镜像。
     */
    public Map<String, Object> syncFromJdy() {
        if (!jdyApiService.isConfigured()) {
            throw new RuntimeException("简道云 API 未配置");
        }
        String receiptApp = jdyApiService.getEffectiveAppId();
        String pricingApp = StringUtils.hasText(pricingAppId) ? pricingAppId.trim() : JdyBusinessForms.PRICING_APP_ID;

        List<MasterTarget> targets = new ArrayList<>();
        int sort = 1;
        for (Map.Entry<String, String[]> e : KNOWN_MASTER_BY_ENTRY.entrySet()) {
            targets.add(new MasterTarget(e.getValue()[0], e.getValue()[1], e.getKey(), e.getValue()[1], sort++));
        }
        targets.addAll(discoverStaffTargets(receiptApp, pricingApp, sort));

        int masterUpserted = 0;
        int remoteSynced = 0;
        int removed = 0;
        Map<String, Integer> byType = new LinkedHashMap<>();
        List<String> errors = new ArrayList<>();
        for (MasterTarget target : targets) {
            try {
                PullStat stat = pullMaster(target, receiptApp, pricingApp);
                byType.put(target.typeCode, stat.upserted);
                masterUpserted += stat.upserted;
                remoteSynced += stat.remote;
                removed += stat.removed;
            } catch (Exception ex) {
                errors.add(target.typeName + ": " + ex.getMessage());
                log.warn("同步基础资料失败: type={}, entryId={}, err={}",
                        target.typeCode, target.entryId, ex.getMessage());
            }
        }
        int stalePayees = cleanupStalePayeeRows() + collapseDuplicatePayees();
        if (masterUpserted == 0 && !errors.isEmpty()) {
            throw new RuntimeException("简道云基础资料同步失败：" + String.join("；", errors));
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", errors.isEmpty()
                ? "已从简道云同步基础资料 " + masterUpserted + " 条"
                : "已同步 " + masterUpserted + " 条，部分失败：" + String.join("；", errors));
        result.put("schemasRefreshed", 0);
        result.put("formCount", targets.size());
        result.put("masterFormCount", targets.size());
        result.put("remoteSynced", remoteSynced);
        result.put("masterUpserted", masterUpserted);
        result.put("enumUpserted", 0);
        result.put("removed", removed);
        result.put("byType", byType);
        result.put("stalePayeeRemoved", stalePayees);
        result.put("typeCount", dictTypeMapper.selectCount(null));
        result.put("itemCount", dictItemMapper.selectCount(new LambdaQueryWrapper<SysDictItem>()
                .eq(SysDictItem::getStatus, 1)));
        return result;
    }

    /**
     * 与字典同步同一条直连路径。
     */
    public Map<String, Object> projectFromMirror() {
        return syncFromJdy();
    }

    private List<MasterTarget> discoverStaffTargets(String receiptApp, String pricingApp, int sortBase) {
        List<MasterTarget> found = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        discoverStaffInApp(receiptApp, "receipt", sortBase, seen, found);
        if (StringUtils.hasText(pricingApp) && !pricingApp.equals(receiptApp)) {
            discoverStaffInApp(pricingApp, "pricing", sortBase, seen, found);
        }
        return found;
    }

    private void discoverStaffInApp(String appId, String sourceApp, int sortBase,
                                    Set<String> seen, List<MasterTarget> found) {
        if (!StringUtils.hasText(appId)) {
            return;
        }
        try {
            for (JSONObject form : jdyApiService.listAllForms(appId)) {
                String entryId = firstNonBlank(form.getString("entry_id"), form.getString("_id"));
                String name = firstNonBlank(form.getString("name"), form.getString("form_name"));
                if (!StringUtils.hasText(entryId) || !StringUtils.hasText(name)) {
                    continue;
                }
                if (KNOWN_MASTER_BY_ENTRY.containsKey(entryId)) {
                    continue;
                }
                if (!(name.contains("生产人员") || name.contains("司磅员") || name.contains("司磅"))) {
                    continue;
                }
                if (!seen.add(entryId)) {
                    continue;
                }
                found.add(new MasterTarget("staff", "生产人员", entryId, name.trim(), sortBase));
                log.info("发现生产人员表单: source={}, entryId={}, name={}", sourceApp, entryId, name);
            }
        } catch (Exception e) {
            log.warn("列举简道云表单失败，跳过生产人员发现: appId={}, err={}", appId, e.getMessage());
        }
    }

    private PullStat pullMaster(MasterTarget target, String receiptApp, String pricingApp) throws Exception {
        ensureType(target.typeCode, target.typeName, target.entryId, "jdy",
                "简道云基础资料", target.sortOrder);
        migrateLegacyFormType("form:" + target.entryId, target.typeCode);

        PullStat total = new PullStat();
        Exception last = null;
        boolean any = false;
        if (StringUtils.hasText(receiptApp)) {
            try {
                total.add(pullMasterFromApp(target, receiptApp, "receipt"));
                any = true;
            } catch (Exception e) {
                last = e;
                log.warn("收车应用基础资料拉取失败: type={}, err={}", target.typeCode, e.getMessage());
            }
        }
        if (StringUtils.hasText(pricingApp) && !pricingApp.equals(receiptApp)) {
            try {
                total.add(pullMasterFromApp(target, pricingApp, "pricing"));
                any = true;
            } catch (Exception e) {
                last = e;
                log.info("议价应用无此基础资料或拉取失败: type={}, err={}", target.typeCode, e.getMessage());
            }
        }
        if (!any) {
            throw last == null ? new RuntimeException("未配置简道云应用") : last;
        }
        return total;
    }

    private PullStat pullMasterFromApp(MasterTarget target, String appId, String sourceApp) throws Exception {
        JSONObject schema = jdyApiService.getWidgetSchema(appId, target.entryId);
        String schemaJson = schema == null ? null : schema.toJSONString();
        Map<String, String> labelToWidget = buildLabelToWidgetFromSchema(schemaJson);
        List<String> primaryLabels = resolvePrimaryLabels(schemaJson, target.formName);
        List<JSONObject> rows = jdyApiService.listAllFormData(appId, target.entryId);
        PullStat stat = new PullStat();
        stat.remote = rows.size();
        Set<String> seen = new HashSet<>();
        int sortOrder = 0;
        for (JSONObject row : rows) {
            String dataId = firstNonBlank(row.getString("_id"), row.getString("data_id"));
            if (upsertFormRow(target.typeCode, labelToWidget, primaryLabels, appId, sourceApp,
                    dataId, row.toJSONString(), sortOrder++)) {
                stat.upserted++;
            }
            if (StringUtils.hasText(dataId)) {
                seen.add(dataId);
            }
        }
        if (!rows.isEmpty()) {
            stat.removed = deactivateMissing(target.typeCode, sourceApp, seen);
        }
        return stat;
    }

    private int deactivateMissing(String typeCode, String sourceApp, Set<String> seenDataIds) {
        List<SysDictItem> existing = dictItemMapper.selectList(new LambdaQueryWrapper<SysDictItem>()
                .eq(SysDictItem::getTypeCode, typeCode)
                .eq(SysDictItem::getSourceApp, sourceApp)
                .eq(SysDictItem::getStatus, 1)
                .isNotNull(SysDictItem::getJdyDataId));
        int removed = 0;
        LocalDateTime now = LocalDateTime.now();
        for (SysDictItem row : existing) {
            if (!StringUtils.hasText(row.getJdyDataId()) || seenDataIds.contains(row.getJdyDataId())) {
                continue;
            }
            row.setStatus(0);
            row.setUpdatedAt(now);
            dictItemMapper.updateById(row);
            removed++;
        }
        return removed;
    }

    private List<FormMeta> discoverMasterForms(List<FormMeta> allForms) {
        List<FormMeta> masterForms = new ArrayList<>();
        Set<String> seenMasterEntry = new HashSet<>();
        for (FormMeta form : allForms) {
            if (!isDictMasterForm(form)) {
                continue;
            }
            if (!seenMasterEntry.add(form.entryId)) {
                continue;
            }
            masterForms.add(form);
        }
        return masterForms;
    }

    private Map<String, Object> projectDiscovered(List<FormMeta> masterForms) {
        int masterUpserted = 0;
        Map<String, Integer> byType = new LinkedHashMap<>();
        int sortBase = 1;
        for (FormMeta form : masterForms) {
            FormMeta latest = reloadFormMeta(form.entryId, form.sourceApp);
            if (latest != null) {
                form = latest;
            }
            String[] known = resolveMasterType(form);
            String typeCode = known[0];
            String typeName = known[1];
            ensureType(typeCode, typeName, form.entryId, "jdy",
                    "简道云基础资料（收车/议价全量）", sortBase++);
            // 旧版 form:{entryId} 迁到友好 code（如 staff），避免前端按 staff 读不到
            migrateLegacyFormType("form:" + form.entryId, typeCode);

            Map<String, String> labelToWidget = buildLabelToWidgetFromSchema(form.widgetSchema);
            List<String> primaryLabels = resolvePrimaryLabels(form.widgetSchema, typeName);
            int n = 0;
            n += syncFormRowsFromReceipt(typeCode, form.entryId, labelToWidget, primaryLabels);
            n += syncFormRowsFromPricing(typeCode, form.entryId, labelToWidget, primaryLabels);
            byType.put(typeCode, n);
            masterUpserted += n;
        }
        int stalePayees = cleanupStalePayeeRows();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("masterFormCount", masterForms.size());
        result.put("masterUpserted", masterUpserted);
        result.put("byType", byType);
        result.put("stalePayeeRemoved", stalePayees);
        return result;
    }

    /** entryId 或表单名 → 友好 typeCode / 显示名（与前端 DictSelect 对齐） */
    private String[] resolveMasterType(FormMeta form) {
        String[] known = KNOWN_MASTER_BY_ENTRY.get(form.entryId);
        if (known != null) {
            return known;
        }
        String name = form.formName == null ? "" : form.formName.trim();
        if (name.contains("生产人员") || "人员".equals(name) || name.contains("司磅员")) {
            return new String[]{"staff", "生产人员"};
        }
        if (name.contains("业务员")) {
            return new String[]{"salesman", "业务员"};
        }
        if (name.contains("供应商")) {
            return new String[]{"supplier", "供应商"};
        }
        if (name.contains("车辆型号") || "型号".equals(name)) {
            return new String[]{"vehicle-model", "车辆型号"};
        }
        if (name.contains("产品名称") || name.contains("品名")) {
            return new String[]{"product-name", "产品名称"};
        }
        if (name.contains("收款人") || name.contains("收款单位")) {
            return new String[]{"payee-info", "收款人信息"};
        }
        return new String[]{
                "form:" + form.entryId,
                StringUtils.hasText(name) ? name : form.entryId
        };
    }

    /** 将旧 form:{entryId} 字典项并入友好 typeCode */
    private void migrateLegacyFormType(String legacyCode, String targetCode) {
        if (!StringUtils.hasText(legacyCode) || !StringUtils.hasText(targetCode)
                || legacyCode.equals(targetCode) || !legacyCode.startsWith("form:")) {
            return;
        }
        List<SysDictItem> legacy = dictItemMapper.selectList(new LambdaQueryWrapper<SysDictItem>()
                .eq(SysDictItem::getTypeCode, legacyCode)
                .eq(SysDictItem::getStatus, 1));
        if (legacy.isEmpty()) {
            return;
        }
        int moved = 0;
        for (SysDictItem row : legacy) {
            if (upsertItem(targetCode, row.getItemValue(), row.getItemLabel(),
                    row.getSortOrder() == null ? 0 : row.getSortOrder(),
                    row.getAppId(), row.getSourceApp(), row.getJdyDataId(), row.getExtraJson())) {
                moved++;
            }
            row.setStatus(0);
            row.setUpdatedAt(LocalDateTime.now());
            dictItemMapper.updateById(row);
        }
        SysDictType legacyType = dictTypeMapper.selectOne(new LambdaQueryWrapper<SysDictType>()
                .eq(SysDictType::getCode, legacyCode).last("LIMIT 1"));
        if (legacyType != null) {
            legacyType.setStatus(0);
            legacyType.setUpdatedAt(LocalDateTime.now());
            dictTypeMapper.updateById(legacyType);
        }
        log.info("字典类型迁移: {} → {}（{} 条）", legacyCode, targetCode, moved);
    }

    /**
     * 清理收款人旧版「仅按名称」脏数据：无 jdyDataId、且同来源下已有带账号/带 dataId 的新行。
     */
    private int cleanupStalePayeeRows() {
        List<SysDictItem> payees = dictItemMapper.selectList(new LambdaQueryWrapper<SysDictItem>()
                .eq(SysDictItem::getTypeCode, "payee-info")
                .eq(SysDictItem::getStatus, 1));
        if (payees.isEmpty()) {
            return 0;
        }
        Set<String> richKeys = new HashSet<>();
        for (SysDictItem row : payees) {
            boolean hasId = StringUtils.hasText(row.getJdyDataId());
            boolean hasAccountSuffix = StringUtils.hasText(row.getItemValue())
                    && row.getItemValue().contains("|");
            if ((hasId || hasAccountSuffix) && StringUtils.hasText(row.getItemLabel())) {
                richKeys.add((row.getSourceApp() == null ? "receipt" : row.getSourceApp())
                        + "|" + row.getItemLabel().trim());
            }
        }
        int removed = 0;
        LocalDateTime now = LocalDateTime.now();
        for (SysDictItem row : payees) {
            boolean stale = !StringUtils.hasText(row.getJdyDataId())
                    && StringUtils.hasText(row.getItemValue())
                    && !row.getItemValue().contains("|")
                    && StringUtils.hasText(row.getItemLabel());
            if (!stale) {
                continue;
            }
            String key = (row.getSourceApp() == null ? "receipt" : row.getSourceApp())
                    + "|" + row.getItemLabel().trim();
            if (!richKeys.contains(key)) {
                continue;
            }
            row.setStatus(0);
            row.setUpdatedAt(now);
            dictItemMapper.updateById(row);
            removed++;
        }
        if (removed > 0) {
            log.info("已停用收款人旧同名脏数据 {} 条", removed);
        }
        return removed;
    }

    private FormMeta reloadFormMeta(String entryId, String preferSource) {
        if ("pricing".equals(preferSource)) {
            JdyPricingForm pf = jdyPricingFormMapper.selectOne(new LambdaQueryWrapper<JdyPricingForm>()
                    .eq(JdyPricingForm::getEntryId, entryId).last("LIMIT 1"));
            if (pf != null) {
                return new FormMeta(pf.getAppId(), pf.getEntryId(), pf.getFormName(),
                        "pricing", pf.getWidgetSchema());
            }
        }
        JdyForm f = jdyFormMapper.selectOne(new LambdaQueryWrapper<JdyForm>()
                .eq(JdyForm::getEntryId, entryId).last("LIMIT 1"));
        if (f != null) {
            return new FormMeta(f.getAppId(), f.getEntryId(), f.getFormName(),
                    "receipt", f.getWidgetSchema());
        }
        JdyPricingForm pf = jdyPricingFormMapper.selectOne(new LambdaQueryWrapper<JdyPricingForm>()
                .eq(JdyPricingForm::getEntryId, entryId).last("LIMIT 1"));
        if (pf != null) {
            return new FormMeta(pf.getAppId(), pf.getEntryId(), pf.getFormName(),
                    "pricing", pf.getWidgetSchema());
        }
        return null;
    }

    private List<FormMeta> collectAllForms() {
        Map<String, FormMeta> byKey = new LinkedHashMap<>();
        for (JdyForm f : jdyFormMapper.selectList(null)) {
            if (f == null || !StringUtils.hasText(f.getEntryId())) {
                continue;
            }
            String key = "receipt:" + f.getEntryId();
            byKey.put(key, new FormMeta(f.getAppId(), f.getEntryId(), f.getFormName(),
                    "receipt", f.getWidgetSchema()));
        }
        for (JdyPricingForm f : jdyPricingFormMapper.selectList(null)) {
            if (f == null || !StringUtils.hasText(f.getEntryId())) {
                continue;
            }
            String key = "pricing:" + f.getEntryId();
            byKey.put(key, new FormMeta(f.getAppId(), f.getEntryId(), f.getFormName(),
                    "pricing", f.getWidgetSchema()));
        }
        return new ArrayList<>(byKey.values());
    }

    private boolean isDictMasterForm(FormMeta form) {
        if ("66f8b152abee705881eec3a5".equals(form.entryId)) {
            return false;
        }
        if (KNOWN_MASTER_BY_ENTRY.containsKey(form.entryId)) {
            return true;
        }
        if (BUSINESS_PROCESS_ENTRY_IDS.contains(form.entryId)) {
            return false;
        }
        String name = form.formName == null ? "" : form.formName;
        if (containsAny(name, BUSINESS_NAME_KEYWORDS)) {
            return false;
        }
        if (containsAny(name, DICT_NAME_KEYWORDS)) {
            return true;
        }
        // 小表单且结构简单 → 视作资料字典
        return isSimpleMasterSchema(form.widgetSchema);
    }

    private boolean isSimpleMasterSchema(String schemaJson) {
        if (!StringUtils.hasText(schemaJson)) {
            return false;
        }
        try {
            JSONObject schema = JSON.parseObject(schemaJson);
            JSONArray widgets = schema.getJSONArray("widgets");
            if (widgets == null || widgets.isEmpty() || widgets.size() > 8) {
                return false;
            }
            int complex = 0;
            for (int i = 0; i < widgets.size(); i++) {
                JSONObject w = widgets.getJSONObject(i);
                String type = w.getString("type");
                if (!StringUtils.hasText(type)) {
                    continue;
                }
                String t = type.toLowerCase(Locale.ROOT);
                if (!SIMPLE_WIDGET_TYPES.contains(t)
                        && !"textfield".equals(t)
                        && !"select".equals(t)) {
                    complex++;
                }
            }
            return complex == 0;
        } catch (Exception e) {
            return false;
        }
    }

    private int refreshAllSchemas() {
        int n = 0;
        for (JdyForm form : jdyFormMapper.selectList(null)) {
            if (refreshAndSaveReceiptSchema(form)) {
                n++;
            }
        }
        for (JdyPricingForm form : jdyPricingFormMapper.selectList(null)) {
            if (refreshAndSavePricingSchema(form)) {
                n++;
            }
        }
        return n;
    }

    private boolean refreshAndSaveReceiptSchema(JdyForm form) {
        if (form == null || !StringUtils.hasText(form.getAppId()) || !StringUtils.hasText(form.getEntryId())) {
            return false;
        }
        try {
            JSONObject schema = jdyApiService.getWidgetSchema(form.getAppId(), form.getEntryId());
            if (schema == null || schema.isEmpty()) {
                return false;
            }
            form.setWidgetSchema(schema.toJSONString());
            form.setUpdatedAt(LocalDateTime.now());
            jdyFormMapper.updateById(form);
            return true;
        } catch (Exception e) {
            log.warn("刷新收车表单结构失败: entryId={}, err={}", form.getEntryId(), e.getMessage());
            return false;
        }
    }

    private boolean refreshAndSavePricingSchema(JdyPricingForm form) {
        if (form == null || !StringUtils.hasText(form.getAppId()) || !StringUtils.hasText(form.getEntryId())) {
            return false;
        }
        try {
            JSONObject schema = jdyApiService.getWidgetSchema(form.getAppId(), form.getEntryId());
            if (schema == null || schema.isEmpty()) {
                return false;
            }
            form.setWidgetSchema(schema.toJSONString());
            form.setUpdatedAt(LocalDateTime.now());
            jdyPricingFormMapper.updateById(form);
            return true;
        } catch (Exception e) {
            log.warn("刷新议价表单结构失败: entryId={}, err={}", form.getEntryId(), e.getMessage());
            return false;
        }
    }

    private int syncFormRowsFromReceipt(String typeCode, String entryId,
                                        Map<String, String> labelToWidget,
                                        List<String> primaryLabels) {
        List<JdyFormData> rows = jdyFormDataMapper.selectList(new LambdaQueryWrapper<JdyFormData>()
                .eq(JdyFormData::getEntryId, entryId));
        int n = 0;
        int sort = 0;
        for (JdyFormData row : rows) {
            if (upsertFormRow(typeCode, labelToWidget, primaryLabels, row.getAppId(), "receipt",
                    row.getDataId(), row.getRawData(), sort++)) {
                n++;
            }
        }
        return n;
    }

    private int syncFormRowsFromPricing(String typeCode, String entryId,
                                        Map<String, String> labelToWidget,
                                        List<String> primaryLabels) {
        List<JdyPricingFormData> rows = jdyPricingFormDataMapper.selectList(
                new LambdaQueryWrapper<JdyPricingFormData>().eq(JdyPricingFormData::getEntryId, entryId));
        int n = 0;
        int sort = 0;
        for (JdyPricingFormData row : rows) {
            if (upsertFormRow(typeCode, labelToWidget, primaryLabels, row.getAppId(), "pricing",
                    row.getDataId(), row.getRawData(), sort++)) {
                n++;
            }
        }
        return n;
    }

    private boolean upsertFormRow(String typeCode,
                                  Map<String, String> labelToWidget,
                                  List<String> primaryLabels,
                                  String appId,
                                  String sourceApp,
                                  String dataId,
                                  String rawData,
                                  int sortOrder) {
        JSONObject raw = parseRaw(rawData);
        String label = extractPrimaryLabel(primaryLabels, labelToWidget, raw);
        if (!StringUtils.hasText(label)) {
            return false;
        }
        label = label.trim();
        JSONObject extra = new JSONObject();
        for (Map.Entry<String, String> e : labelToWidget.entrySet()) {
            String chinese = e.getKey();
            String widget = e.getValue();
            if (primaryLabels.contains(chinese)) {
                continue;
            }
            Object v = stringifyValue(raw.get(widget));
            if (v != null && StringUtils.hasText(String.valueOf(v))) {
                extra.put(chinese, v);
            }
        }
        JSONObject creator = raw.getJSONObject("creator");
        if (creator != null && StringUtils.hasText(creator.getString("name"))) {
            extra.put("_submitter", creator.getString("name").trim());
        }
        String createTime = firstNonBlank(raw.getString("createTime"), raw.getString("create_time"));
        String updateTime = firstNonBlank(raw.getString("updateTime"), raw.getString("update_time"));
        if (StringUtils.hasText(createTime)) {
            extra.put("_createTime", createTime);
        }
        if (StringUtils.hasText(updateTime)) {
            extra.put("_updateTime", updateTime);
        }
        // 收款人等同名多账号：用「名称|账号」作唯一值，显示名仍用名称
        String value = resolveMasterItemValue(typeCode, label, extra, dataId);
        return upsertItem(typeCode, value, label, sortOrder, appId, sourceApp, dataId,
                extra.isEmpty() ? null : extra.toJSONString());
    }

    /** 基础资料唯一值：收款人优先「名称|账号」，避免同名覆盖 */
    private String resolveMasterItemValue(String typeCode, String label, JSONObject extra, String dataId) {
        if (!"payee-info".equals(typeCode)) {
            return label;
        }
        String account = normalizeAccount(firstExtraText(extra, "收款账号", "payeeAccount", "账号"));
        if (StringUtils.hasText(account)) {
            return label + "|" + account;
        }
        if (StringUtils.hasText(dataId)) {
            return label + "|#" + dataId.trim();
        }
        return label;
    }

    private String firstExtraText(JSONObject extra, String... keys) {
        if (extra == null || extra.isEmpty()) {
            return null;
        }
        for (String key : keys) {
            Object v = extra.get(key);
            if (v != null && StringUtils.hasText(String.valueOf(v))) {
                return String.valueOf(v).trim();
            }
        }
        return null;
    }

    private List<String> resolvePrimaryLabels(String schemaJson, String formName) {
        List<String> labels = new ArrayList<>();
        // 表单名本身常是字段名（如「业务员」「车辆型号」）
        if (StringUtils.hasText(formName)) {
            labels.add(formName.trim());
            for (String part : formName.split("[-_·/\\s]+")) {
                if (StringUtils.hasText(part) && part.length() <= 20) {
                    labels.add(part.trim());
                }
            }
        }
        labels.addAll(Arrays.asList(
                "名称", "姓名", "业务员", "供应商名称", "供应商", "车辆型号", "型号",
                "仓库名称", "仓库", "产品名称", "品名", "收款单位", "收款人", "单位名称",
                "生产人员", "人员", "司磅员", "拆解员"
        ));
        if (StringUtils.hasText(schemaJson)) {
            try {
                JSONObject schema = JSON.parseObject(schemaJson);
                JSONArray widgets = schema.getJSONArray("widgets");
                if (widgets != null) {
                    for (int i = 0; i < widgets.size(); i++) {
                        JSONObject w = widgets.getJSONObject(i);
                        String type = w.getString("type");
                        String label = w.getString("label");
                        if (!StringUtils.hasText(label)) {
                            continue;
                        }
                        if ("text".equals(type) || "textarea".equals(type) || "combo".equals(type)
                                || "textfield".equals(type) || "select".equals(type)) {
                            labels.add(0, label);
                            break;
                        }
                    }
                }
            } catch (Exception ignored) {
                // ignore
            }
        }
        // 去重保序
        return new ArrayList<>(new LinkedHashSet<>(labels));
    }

    private String extractPrimaryLabel(List<String> primaryLabels,
                                       Map<String, String> labelToWidget,
                                       JSONObject raw) {
        for (String chineseLabel : primaryLabels) {
            Object v = extractByLabel(labelToWidget, raw, chineseLabel);
            if (v != null && StringUtils.hasText(String.valueOf(v))) {
                return String.valueOf(v).trim();
            }
        }
        // 按 schema 顺序取第一个短文本字段
        for (Map.Entry<String, String> e : labelToWidget.entrySet()) {
            Object v = stringifyValue(raw.get(e.getValue()));
            if (v != null) {
                String text = String.valueOf(v).trim();
                if (StringUtils.hasText(text) && text.length() <= 128) {
                    return text;
                }
            }
        }
        for (String key : raw.keySet()) {
            if (key == null || "creator".equals(key)
                    || "createTime".equals(key) || "updateTime".equals(key)
                    || "appId".equals(key) || "entryId".equals(key) || "_id".equals(key)
                    || "flowState".equals(key)) {
                continue;
            }
            String text = stringifyValue(raw.get(key));
            if (StringUtils.hasText(text) && text.length() <= 128) {
                return text.trim();
            }
        }
        return null;
    }

    private Object extractByLabel(Map<String, String> labelToWidget, JSONObject raw, String label) {
        String widget = labelToWidget.get(label);
        if (widget != null && raw.containsKey(widget)) {
            return stringifyValue(raw.get(widget));
        }
        if (raw.containsKey(label)) {
            return stringifyValue(raw.get(label));
        }
        return null;
    }

    private int syncEnumOptionsFromSchemas(List<FormMeta> forms) {
        int n = 0;
        Set<String> seen = new HashSet<>();
        for (FormMeta form : forms) {
            String dedupe = form.entryId + "|" + form.sourceApp;
            if (!seen.add(dedupe)) {
                continue;
            }
            n += extractEnumsFromSchema(form.entryId, form.formName, form.appId,
                    form.sourceApp, form.widgetSchema);
        }
        return n;
    }

    private int extractEnumsFromSchema(String entryId, String formName, String appId,
                                       String sourceApp, String schemaJson) {
        if (!StringUtils.hasText(schemaJson)) {
            return 0;
        }
        JSONObject schema;
        try {
            schema = JSON.parseObject(schemaJson);
        } catch (Exception e) {
            return 0;
        }
        JSONArray widgets = schema.getJSONArray("widgets");
        if (widgets == null || widgets.isEmpty()) {
            return 0;
        }
        int n = 0;
        for (int i = 0; i < widgets.size(); i++) {
            JSONObject w = widgets.getJSONObject(i);
            String type = w.getString("type");
            if (!"combo".equals(type) && !"radiogroup".equals(type) && !"checkboxgroup".equals(type)) {
                continue;
            }
            JSONArray items = firstItemsArray(w);
            if (items == null || items.isEmpty()) {
                continue;
            }
            String widgetName = w.getString("name");
            String widgetLabel = w.getString("label");
            if (!StringUtils.hasText(widgetName) || !StringUtils.hasText(widgetLabel)) {
                continue;
            }
            // combo 挂数据联动时 items 可能很大，跳过
            if ("combo".equals(type) && items.size() > 80) {
                continue;
            }
            String typeCode = "opt:" + entryId + ":" + widgetName;
            String typeName = (StringUtils.hasText(formName) ? formName : entryId) + " · " + widgetLabel;
            ensureType(typeCode, typeName, entryId, "enum",
                    "表单固定选项（" + sourceApp + "）", 500 + i);
            for (int j = 0; j < items.size(); j++) {
                Object it = items.get(j);
                String value;
                String label;
                if (it instanceof JSONObject) {
                    JSONObject obj = (JSONObject) it;
                    value = firstNonBlank(obj.getString("value"), obj.getString("text"), obj.getString("label"));
                    label = firstNonBlank(obj.getString("text"), obj.getString("label"), obj.getString("value"));
                } else {
                    value = String.valueOf(it);
                    label = value;
                }
                if (!StringUtils.hasText(value)) {
                    continue;
                }
                if (upsertItem(typeCode, value.trim(), StringUtils.hasText(label) ? label.trim() : value.trim(),
                        j, appId, sourceApp, null, null)) {
                    n++;
                }
            }
        }
        return n;
    }

    private JSONArray firstItemsArray(JSONObject w) {
        JSONArray items = w.getJSONArray("items");
        if (items != null && !items.isEmpty()) {
            return items;
        }
        items = w.getJSONArray("options");
        if (items != null && !items.isEmpty()) {
            return items;
        }
        // 部分简道云结构把选项放在 items.value
        Object nested = w.get("items");
        if (nested instanceof JSONObject) {
            JSONObject obj = (JSONObject) nested;
            JSONArray arr = obj.getJSONArray("value");
            if (arr != null && !arr.isEmpty()) {
                return arr;
            }
        }
        return null;
    }

    /** 同一收款单位 + 账号只保留信息更全、提交时间更新的一条。 */
    private int collapseDuplicatePayees() {
        List<SysDictItem> rows = dictItemMapper.selectList(new LambdaQueryWrapper<SysDictItem>()
                .eq(SysDictItem::getTypeCode, "payee-info")
                .eq(SysDictItem::getStatus, 1));
        if (rows.size() < 2) {
            return 0;
        }
        rows.sort((a, b) -> {
            int score = payeeScore(b) - payeeScore(a);
            if (score != 0) {
                return score;
            }
            String tb = payeeTime(b);
            String ta = payeeTime(a);
            int time = tb.compareTo(ta);
            if (time != 0) {
                return time;
            }
            long ib = b.getId() == null ? 0L : b.getId();
            long ia = a.getId() == null ? 0L : a.getId();
            return Long.compare(ib, ia);
        });
        Map<String, SysDictItem> keep = new LinkedHashMap<>();
        List<SysDictItem> drop = new ArrayList<>();
        for (SysDictItem row : rows) {
            String key = payeeIdentity(row);
            if (!StringUtils.hasText(key) || keep.containsKey(key)) {
                drop.add(row);
                continue;
            }
            keep.put(key, row);
        }
        if (drop.isEmpty()) {
            return 0;
        }
        LocalDateTime now = LocalDateTime.now();
        for (SysDictItem row : drop) {
            row.setStatus(0);
            row.setUpdatedAt(now);
            dictItemMapper.updateById(row);
        }
        log.info("已合并收款人重复数据 {} 条", drop.size());
        return drop.size();
    }

    private String payeeIdentity(SysDictItem row) {
        String name = row.getItemLabel() == null ? "" : row.getItemLabel().trim();
        String account = normalizeAccount(firstExtraText(parseRaw(row.getExtraJson()), "收款账号", "payeeAccount", "账号"));
        if (!StringUtils.hasText(account) && StringUtils.hasText(row.getItemValue()) && row.getItemValue().contains("|")) {
            account = normalizeAccount(row.getItemValue().substring(row.getItemValue().lastIndexOf('|') + 1));
        }
        if (StringUtils.hasText(account)) {
            return name + "|" + account;
        }
        return name;
    }

    private int payeeScore(SysDictItem row) {
        JSONObject extra = parseRaw(row.getExtraJson());
        int score = 0;
        String submitter = extra.getString("_submitter");
        if (StringUtils.hasText(submitter) && !"简道云".equals(submitter.trim())) {
            score += 4;
        }
        if (StringUtils.hasText(extra.getString("_createTime")) || StringUtils.hasText(extra.getString("_updateTime"))) {
            score += 4;
        }
        if (StringUtils.hasText(firstExtraText(extra, "开户行", "openingBank"))) {
            score += 1;
        }
        if (StringUtils.hasText(firstExtraText(extra, "银行行号", "bankCode"))) {
            score += 1;
        }
        return score;
    }

    private String payeeTime(SysDictItem row) {
        JSONObject extra = parseRaw(row.getExtraJson());
        String time = firstNonBlank(extra.getString("_updateTime"), extra.getString("_createTime"));
        return time == null ? "" : time;
    }

    private String normalizeAccount(String account) {
        if (!StringUtils.hasText(account)) {
            return "";
        }
        StringBuilder digits = new StringBuilder();
        for (int i = 0; i < account.length(); i++) {
            char c = account.charAt(i);
            if (c >= '0' && c <= '9') {
                digits.append(c);
            }
        }
        return digits.toString();
    }

    private SysDictItem findActivePayee(String identity) {
        if (!StringUtils.hasText(identity)) {
            return null;
        }
        List<SysDictItem> rows = dictItemMapper.selectList(new LambdaQueryWrapper<SysDictItem>()
                .eq(SysDictItem::getTypeCode, "payee-info")
                .eq(SysDictItem::getStatus, 1));
        SysDictItem found = null;
        for (SysDictItem row : rows) {
            if (!identity.equals(payeeIdentity(row))) {
                continue;
            }
            if (found == null || payeeScore(row) > payeeScore(found)) {
                found = row;
            }
        }
        return found;
    }

    private boolean upsertItem(String typeCode, String value, String label, int sortOrder,
                               String appId, String sourceApp, String jdyDataId, String extraJson) {
        String src = StringUtils.hasText(sourceApp) ? sourceApp : "receipt";
        // 收款人按单位+账号合并；其他资料有简道云 dataId 时按行更新
        SysDictItem existing = null;
        if ("payee-info".equals(typeCode)) {
            String account = accountTail(value, label);
            existing = StringUtils.hasText(account)
                    ? findActivePayee(label + "|" + account)
                    : findActivePayee(label);
        }
        if (existing == null && StringUtils.hasText(jdyDataId)) {
            existing = dictItemMapper.selectOne(new LambdaQueryWrapper<SysDictItem>()
                    .eq(SysDictItem::getTypeCode, typeCode)
                    .eq(SysDictItem::getJdyDataId, jdyDataId)
                    .eq(SysDictItem::getSourceApp, src)
                    .last("LIMIT 1"));
        }
        if (existing == null) {
            existing = dictItemMapper.selectOne(new LambdaQueryWrapper<SysDictItem>()
                    .eq(SysDictItem::getTypeCode, typeCode)
                    .eq(SysDictItem::getItemValue, value)
                    .eq(SysDictItem::getSourceApp, src)
                    .last("LIMIT 1"));
        }
        LocalDateTime now = LocalDateTime.now();
        if (existing == null) {
            SysDictItem item = new SysDictItem();
            item.setTypeCode(typeCode);
            item.setItemValue(value);
            item.setItemLabel(label);
            item.setSortOrder(sortOrder);
            item.setStatus(1);
            item.setAppId(appId);
            item.setSourceApp(src);
            item.setJdyDataId(jdyDataId);
            item.setExtraJson(extraJson);
            item.setCreatedAt(now);
            item.setUpdatedAt(now);
            dictItemMapper.insert(item);
            return true;
        }
        existing.setItemValue(value);
        existing.setItemLabel(label);
        existing.setSortOrder(sortOrder);
        existing.setStatus(1);
        existing.setAppId(appId);
        existing.setJdyDataId(jdyDataId);
        if (StringUtils.hasText(extraJson)) {
            existing.setExtraJson(extraJson);
        }
        existing.setUpdatedAt(now);
        dictItemMapper.updateById(existing);
        return true;
    }

    private String accountTail(String value, String ignoredLabel) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        int split = value.lastIndexOf('|');
        if (split < 0 || split >= value.length() - 1) {
            return "";
        }
        String tail = value.substring(split + 1);
        if (tail.startsWith("#")) {
            return "";
        }
        return normalizeAccount(tail);
    }

    private void ensureType(String code, String name, String entryId, String source,
                            String remark, int sortOrder) {
        SysDictType existing = dictTypeMapper.selectOne(new LambdaQueryWrapper<SysDictType>()
                .eq(SysDictType::getCode, code).last("LIMIT 1"));
        LocalDateTime now = LocalDateTime.now();
        if (existing == null) {
            SysDictType t = new SysDictType();
            t.setCode(code);
            t.setName(name);
            t.setEntryId(entryId);
            t.setSource(source);
            t.setRemark(remark);
            t.setSortOrder(sortOrder);
            t.setStatus(1);
            t.setCreatedAt(now);
            t.setUpdatedAt(now);
            dictTypeMapper.insert(t);
            return;
        }
        boolean dirty = false;
        if (StringUtils.hasText(name) && !name.equals(existing.getName())) {
            existing.setName(name);
            dirty = true;
        }
        if (entryId != null && !entryId.equals(existing.getEntryId())) {
            existing.setEntryId(entryId);
            dirty = true;
        }
        if (dirty) {
            existing.setUpdatedAt(now);
            dictTypeMapper.updateById(existing);
        }
    }

    private Map<String, String> buildLabelToWidgetFromSchema(String schemaJson) {
        Map<String, String> map = new LinkedHashMap<>();
        if (!StringUtils.hasText(schemaJson)) {
            return map;
        }
        try {
            JSONObject schema = JSON.parseObject(schemaJson);
            JSONArray widgets = schema.getJSONArray("widgets");
            if (widgets != null) {
                for (int i = 0; i < widgets.size(); i++) {
                    JSONObject w = widgets.getJSONObject(i);
                    String label = w.getString("label");
                    String name = w.getString("name");
                    if (StringUtils.hasText(label) && StringUtils.hasText(name)) {
                        map.put(label, name);
                    }
                }
            }
        } catch (Exception ignored) {
            // ignore
        }
        return map;
    }

    private boolean containsAny(String text, String[] keywords) {
        if (!StringUtils.hasText(text) || keywords == null) {
            return false;
        }
        for (String k : keywords) {
            if (text.contains(k)) {
                return true;
            }
        }
        return false;
    }

    private JSONObject parseRaw(String raw) {
        if (!StringUtils.hasText(raw)) {
            return new JSONObject();
        }
        try {
            return JSON.parseObject(raw);
        } catch (Exception e) {
            return new JSONObject();
        }
    }

    private String stringifyValue(Object rawValue) {
        if (rawValue == null) {
            return null;
        }
        if (rawValue instanceof JSONObject) {
            JSONObject obj = (JSONObject) rawValue;
            if (obj.containsKey("name")) {
                return obj.getString("name");
            }
            if (obj.containsKey("text")) {
                return obj.getString("text");
            }
            return obj.toJSONString();
        }
        if (rawValue instanceof JSONArray) {
            JSONArray arr = (JSONArray) rawValue;
            if (arr.isEmpty()) {
                return null;
            }
            List<String> parts = new ArrayList<>();
            for (int i = 0; i < arr.size(); i++) {
                String s = stringifyValue(arr.get(i));
                if (StringUtils.hasText(s)) {
                    parts.add(s);
                }
            }
            return parts.isEmpty() ? null : String.join(",", parts);
        }
        String text = String.valueOf(rawValue).trim();
        return text.isEmpty() ? null : text;
    }

    private String firstNonBlank(String... vals) {
        if (vals == null) {
            return null;
        }
        for (String v : vals) {
            if (StringUtils.hasText(v)) {
                return v;
            }
        }
        return null;
    }

    private DictTypeVO toTypeVO(SysDictType t) {
        DictTypeVO vo = new DictTypeVO();
        vo.setId(t.getId());
        vo.setCode(t.getCode());
        vo.setName(t.getName());
        vo.setEntryId(t.getEntryId());
        vo.setSource(t.getSource());
        vo.setRemark(t.getRemark());
        vo.setSortOrder(t.getSortOrder());
        vo.setStatus(t.getStatus());
        return vo;
    }

    private DictItemVO toItemVO(SysDictItem row) {
        DictItemVO vo = new DictItemVO();
        vo.setId(row.getId());
        vo.setTypeCode(row.getTypeCode());
        vo.setItemValue(row.getItemValue());
        vo.setItemLabel(row.getItemLabel());
        vo.setSortOrder(row.getSortOrder());
        vo.setStatus(row.getStatus());
        vo.setAppId(row.getAppId());
        vo.setSourceApp(row.getSourceApp());
        vo.setJdyDataId(row.getJdyDataId());
        vo.setExtraJson(row.getExtraJson());
        return vo;
    }

    private static final class MasterTarget {
        final String typeCode;
        final String typeName;
        final String entryId;
        final String formName;
        final int sortOrder;

        MasterTarget(String typeCode, String typeName, String entryId, String formName, int sortOrder) {
            this.typeCode = typeCode;
            this.typeName = typeName;
            this.entryId = entryId;
            this.formName = formName;
            this.sortOrder = sortOrder;
        }
    }

    private static final class PullStat {
        int remote;
        int upserted;
        int removed;

        void add(PullStat other) {
            if (other == null) {
                return;
            }
            this.remote += other.remote;
            this.upserted += other.upserted;
            this.removed += other.removed;
        }
    }

    private static final class FormMeta {
        final String appId;
        final String entryId;
        final String formName;
        final String sourceApp;
        final String widgetSchema;

        FormMeta(String appId, String entryId, String formName, String sourceApp, String widgetSchema) {
            this.appId = appId;
            this.entryId = entryId;
            this.formName = formName;
            this.sourceApp = sourceApp;
            this.widgetSchema = widgetSchema;
        }
    }
}
