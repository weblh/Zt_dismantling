package com.zuantan.dismantling.service;

import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zuantan.dismantling.common.PageResult;
import com.zuantan.dismantling.dto.JdyConfigRequest;
import com.zuantan.dismantling.dto.JdyStatusResponse;
import com.zuantan.dismantling.dto.JdySyncResult;
import com.zuantan.dismantling.entity.JdyForm;
import com.zuantan.dismantling.entity.JdyFormData;
import com.zuantan.dismantling.entity.JdyPricingForm;
import com.zuantan.dismantling.entity.JdyPricingFormData;
import com.zuantan.dismantling.mapper.JdyFormDataMapper;
import com.zuantan.dismantling.mapper.JdyFormMapper;
import com.zuantan.dismantling.mapper.JdyPricingFormDataMapper;
import com.zuantan.dismantling.mapper.JdyPricingFormMapper;
import com.zuantan.dismantling.util.JdyBusinessForms;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class JdySyncService {

    private static final Logger log = LoggerFactory.getLogger(JdySyncService.class);

    private final JdyApiService jdyApiService;
    private final JdyFormMapper jdyFormMapper;
    private final JdyFormDataMapper jdyFormDataMapper;
    private final JdyPricingFormMapper jdyPricingFormMapper;
    private final JdyPricingFormDataMapper jdyPricingFormDataMapper;
    private final JdyMirrorStoreService jdyMirrorStoreService;

    @Value("${jiandaoyun.corp-id:}")
    private String defaultCorpId;

    @Value("${jiandaoyun.agent-id:}")
    private String defaultAgentId;

    @Value("${jiandaoyun.scheduled.enabled:false}")
    private boolean defaultScheduledEnabled;

    @Value("${jiandaoyun.pricing-app-id:67ff16f5714711e0b87f173b}")
    private String pricingAppId;

    private volatile String runtimeCorpId;
    private volatile String runtimeAgentId;
    private volatile Boolean runtimeScheduledEnabled;

    private final AtomicBoolean syncInProgress = new AtomicBoolean(false);

    public JdySyncService(JdyApiService jdyApiService,
                          JdyFormMapper jdyFormMapper,
                          JdyFormDataMapper jdyFormDataMapper,
                          JdyPricingFormMapper jdyPricingFormMapper,
                          JdyPricingFormDataMapper jdyPricingFormDataMapper,
                          JdyMirrorStoreService jdyMirrorStoreService) {
        this.jdyApiService = jdyApiService;
        this.jdyFormMapper = jdyFormMapper;
        this.jdyFormDataMapper = jdyFormDataMapper;
        this.jdyPricingFormMapper = jdyPricingFormMapper;
        this.jdyPricingFormDataMapper = jdyPricingFormDataMapper;
        this.jdyMirrorStoreService = jdyMirrorStoreService;
    }

    public void updateConfig(JdyConfigRequest request) {
        if (StringUtils.hasText(request.getApiKey())) {
            jdyApiService.updateCredentials(request.getApiKey(), request.getAppId());
        } else if (StringUtils.hasText(request.getAppId())) {
            jdyApiService.updateCredentials(null, request.getAppId());
        }
        if (StringUtils.hasText(request.getCorpId())) {
            this.runtimeCorpId = request.getCorpId().trim();
        }
        if (StringUtils.hasText(request.getAgentId())) {
            this.runtimeAgentId = request.getAgentId().trim();
        }
        if (request.getScheduledEnabled() != null) {
            this.runtimeScheduledEnabled = request.getScheduledEnabled();
        }
    }

    public boolean isScheduledEnabled() {
        return runtimeScheduledEnabled != null ? runtimeScheduledEnabled : defaultScheduledEnabled;
    }

    public JdyStatusResponse getStatus() {
        return getStatus(null);
    }

    /**
     * @param source null/空=双应用合计；receipt=仅收车；pricing=仅议价
     */
    public JdyStatusResponse getStatus(String source) {
        String normalized = normalizeSource(source);
        JdyStatusResponse status = new JdyStatusResponse();
        status.setConfigured(jdyApiService.isConfigured());
        status.setCorpId(StringUtils.hasText(runtimeCorpId) ? runtimeCorpId : defaultCorpId);
        status.setAgentId(StringUtils.hasText(runtimeAgentId) ? runtimeAgentId : defaultAgentId);
        status.setApiKeyMasked(maskSecret(jdyApiService.getEffectiveApiKey()));
        status.setScheduledEnabled(isScheduledEnabled());

        if ("pricing".equals(normalized)) {
            String pricingId = resolvePricingAppId();
            status.setAppId(pricingId);
            status.setFormCount(jdyPricingFormMapper.selectCount(
                    new LambdaQueryWrapper<JdyPricingForm>().eq(JdyPricingForm::getAppId, pricingId)));
            status.setDataCount(jdyPricingFormDataMapper.selectCount(
                    new LambdaQueryWrapper<JdyPricingFormData>().eq(JdyPricingFormData::getAppId, pricingId)));
            status.setMessage(status.isConfigured()
                    ? "议价应用 → jdy_pricing_form_data"
                    : "未配置简道云 API Key。请到开放平台「密钥管理」创建后填写");
            return status;
        }

        if ("receipt".equals(normalized)) {
            String receiptId = resolveReceiptAppId();
            status.setAppId(receiptId);
            status.setFormCount(jdyFormMapper.selectCount(
                    new LambdaQueryWrapper<JdyForm>().eq(JdyForm::getAppId, receiptId)));
            status.setDataCount(jdyFormDataMapper.selectCount(
                    new LambdaQueryWrapper<JdyFormData>().eq(JdyFormData::getAppId, receiptId)));
            status.setMessage(status.isConfigured()
                    ? "收车应用 → jdy_form_data"
                    : "未配置简道云 API Key。请到开放平台「密钥管理」创建后填写");
            return status;
        }

        status.setAppId(jdyApiService.getEffectiveAppId());
        status.setFormCount(jdyFormMapper.selectCount(null) + jdyPricingFormMapper.selectCount(null));
        status.setDataCount(jdyFormDataMapper.selectCount(null) + jdyPricingFormDataMapper.selectCount(null));
        if (!status.isConfigured()) {
            status.setMessage("未配置简道云 API Key。请到开放平台「密钥管理」创建后填写");
        } else {
            status.setMessage("已配置：收车→jdy_form_data，议价→jdy_pricing_form_data（分表）");
        }
        return status;
    }

    public List<JdyForm> refreshForms() {
        for (String appId : syncAppIds()) {
            refreshFormsForApp(appId);
        }
        return listForms();
    }

    public List<JdyForm> refreshFormsForApp(String appId) {
        if (!StringUtils.hasText(appId)) {
            throw new RuntimeException("简道云 appId 未配置");
        }
        try {
            List<JSONObject> remoteForms = jdyApiService.listAllForms(appId);
            LocalDateTime now = LocalDateTime.now();
            for (JSONObject item : remoteForms) {
                String entryId = firstNonBlank(item.getString("entry_id"), item.getString("entryId"));
                String name = firstNonBlank(item.getString("name"), item.getString("form_name"));
                if (!StringUtils.hasText(entryId)) {
                    continue;
                }
                upsertFormMeta(appId, entryId, name, now, null);
            }
            log.info("简道云表单列表已刷新: appId={}, count={}, store={}",
                    appId, remoteForms.size(), isPricingApp(appId) ? "jdy_pricing_form" : "jdy_form");
            return listFormsByApp(appId);
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage(), e);
        }
    }

    public JdySyncResult syncAllForms() {
        return syncAllForms(null);
    }

    /**
     * @param source null/空=双应用；receipt=仅收车；pricing=仅议价
     */
    public JdySyncResult syncAllForms(String source) {
        if (!syncInProgress.compareAndSet(false, true)) {
            throw new RuntimeException("同步正在进行中，请稍后再试");
        }
        try {
            return doSyncAllForms(normalizeSource(source));
        } finally {
            syncInProgress.set(false);
        }
    }

    private JdySyncResult doSyncAllForms(String source) {
        LocalDateTime startedAt = LocalDateTime.now();
        List<String> appIds = resolveSyncAppIds(source);
        for (String appId : appIds) {
            refreshFormsForApp(appId);
        }
        List<JdyForm> forms = new ArrayList<>();
        for (String appId : appIds) {
            forms.addAll(listFormsByApp(appId));
        }
        JdySyncResult result = new JdySyncResult();
        result.setFormCount(forms.size());
        int success = 0;
        int failed = 0;
        int upserted = 0;
        for (JdyForm form : forms) {
            if (form.getStatus() != null && form.getStatus() == 0) {
                continue;
            }
            try {
                upserted += doSyncOneForm(form.getAppId(), form.getEntryId());
                success++;
            } catch (Exception e) {
                failed++;
                log.warn("同步简道云表单失败: appId={}, entryId={}, name={}, err={}",
                        form.getAppId(), form.getEntryId(), form.getFormName(), e.getMessage());
                markFormSyncFailed(form.getAppId(), form.getEntryId(), form.getFormName(), e.getMessage());
            }
        }
        result.setSuccessForms(success);
        result.setFailedForms(failed);
        result.setUpsertedRows(upserted);
        String scopeLabel = "pricing".equals(source)
                ? "议价→jdy_pricing_form_data"
                : "receipt".equals(source)
                ? "收车→jdy_form_data"
                : "收车→jdy_form_data，议价→jdy_pricing_form_data";
        result.setMessage(String.format(
                "同步完成（%s）：表单 %d，成功 %d，失败 %d，写入/更新 %d 条",
                scopeLabel, result.getFormCount(), success, failed, upserted));
        jdyMirrorStoreService.logFullSync(result, startedAt);
        return result;
    }

    public int syncOneForm(String entryId) {
        if (syncInProgress.get()) {
            throw new RuntimeException("全量同步正在进行中，请等待完成后再单独同步");
        }
        int total = 0;
        boolean any = false;
        for (String appId : syncAppIds()) {
            if (findFormMeta(appId, entryId) == null) {
                continue;
            }
            any = true;
            total += doSyncOneForm(appId, entryId);
        }
        if (!any) {
            return doSyncOneForm(requireAppId(), entryId);
        }
        return total;
    }

    private int doSyncOneForm(String appId, String entryId) {
        LocalDateTime startedAt = LocalDateTime.now();
        if (!StringUtils.hasText(appId)) {
            throw new RuntimeException("简道云 appId 未配置");
        }
        if (!StringUtils.hasText(entryId)) {
            throw new RuntimeException("entryId 不能为空");
        }
        FormMeta meta = findFormMeta(appId, entryId);
        String formName = meta != null && StringUtils.hasText(meta.formName) ? meta.formName : entryId;
        try {
            List<JSONObject> rows = jdyApiService.listAllFormData(appId, entryId);
            int upserted = 0;
            LocalDateTime now = LocalDateTime.now();
            for (JSONObject row : rows) {
                if (upsertFormData(appId, entryId, formName, row, now)) {
                    upserted++;
                }
            }
            upsertFormMeta(appId, entryId, formName, now,
                    "同步成功，共 " + rows.size() + " 条，写入/更新 " + upserted + " 条");
            updateFormDataCount(appId, entryId, rows.size(), now);
            log.info("简道云表单同步完成: appId={}, entryId={}, name={}, remote={}, upserted={}, table={}",
                    appId, entryId, formName, rows.size(), upserted,
                    isPricingApp(appId) ? "jdy_pricing_form_data" : "jdy_form_data");
            jdyMirrorStoreService.logSingleSync(entryId, formName, upserted, startedAt, "success",
                    "同步成功，共 " + rows.size() + " 条");
            return upserted;
        } catch (Exception e) {
            jdyMirrorStoreService.logSingleSync(entryId, formName, 0, startedAt, "failed", e.getMessage());
            markFormSyncFailed(appId, entryId, formName, e.getMessage());
            throw new RuntimeException(e.getMessage(), e);
        }
    }

    private List<String> syncAppIds() {
        return resolveSyncAppIds(null);
    }

    private List<String> resolveSyncAppIds(String source) {
        if ("pricing".equals(source)) {
            return Collections.singletonList(resolvePricingAppId());
        }
        if ("receipt".equals(source)) {
            return Collections.singletonList(resolveReceiptAppId());
        }
        List<String> ids = new ArrayList<>();
        String receipt = resolveReceiptAppId();
        if (StringUtils.hasText(receipt)) {
            ids.add(receipt);
        }
        String pricing = resolvePricingAppId();
        if (StringUtils.hasText(pricing) && !ids.contains(pricing)) {
            ids.add(pricing);
        }
        return ids;
    }

    private String resolveReceiptAppId() {
        String primary = jdyApiService.getEffectiveAppId();
        return StringUtils.hasText(primary) ? primary.trim() : JdyBusinessForms.APP_ID;
    }

    private String resolvePricingAppId() {
        return StringUtils.hasText(pricingAppId) ? pricingAppId.trim() : JdyBusinessForms.PRICING_APP_ID;
    }

    /** receipt / pricing / null（双应用） */
    private String normalizeSource(String source) {
        if (!StringUtils.hasText(source)) {
            return null;
        }
        String s = source.trim().toLowerCase();
        if ("pricing".equals(s) || "议价".equals(source.trim())) {
            return "pricing";
        }
        if ("receipt".equals(s) || "收车".equals(source.trim())) {
            return "receipt";
        }
        throw new RuntimeException("source 仅支持 receipt 或 pricing");
    }

    private boolean isPricingApp(String appId) {
        String pricing = resolvePricingAppId();
        return StringUtils.hasText(appId) && appId.equals(pricing);
    }

    public List<JdyForm> listForms() {
        List<JdyForm> all = new ArrayList<>(jdyFormMapper.selectList(
                new LambdaQueryWrapper<JdyForm>().orderByAsc(JdyForm::getFormName)));
        List<JdyPricingForm> pricingForms = jdyPricingFormMapper.selectList(
                new LambdaQueryWrapper<JdyPricingForm>().orderByAsc(JdyPricingForm::getFormName));
        for (JdyPricingForm pf : pricingForms) {
            all.add(toJdyFormView(pf));
        }
        return all;
    }

    private List<JdyForm> listFormsByApp(String appId) {
        if (isPricingApp(appId)) {
            List<JdyForm> views = new ArrayList<>();
            for (JdyPricingForm pf : jdyPricingFormMapper.selectList(
                    new LambdaQueryWrapper<JdyPricingForm>().eq(JdyPricingForm::getAppId, appId)
                            .orderByAsc(JdyPricingForm::getFormName))) {
                views.add(toJdyFormView(pf));
            }
            return views;
        }
        return jdyFormMapper.selectList(new LambdaQueryWrapper<JdyForm>()
                .eq(JdyForm::getAppId, appId).orderByAsc(JdyForm::getFormName));
    }

    private JdyForm toJdyFormView(JdyPricingForm pf) {
        JdyForm form = new JdyForm();
        form.setId(pf.getId());
        form.setAppId(pf.getAppId());
        form.setEntryId(pf.getEntryId());
        form.setFormName(pf.getFormName());
        form.setStatus(pf.getStatus());
        form.setDataCount(pf.getDataCount());
        form.setLastSyncAt(pf.getLastSyncAt());
        form.setLastSyncMessage(pf.getLastSyncMessage());
        form.setWidgetSchema(pf.getWidgetSchema());
        form.setCreatedAt(pf.getCreatedAt());
        form.setUpdatedAt(pf.getUpdatedAt());
        return form;
    }

    public PageResult<List<JdyFormData>> listData(String entryId, int pageNo, int pageSize) {
        LambdaQueryWrapper<JdyFormData> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(entryId)) {
            wrapper.eq(JdyFormData::getEntryId, entryId);
        }
        wrapper.orderByDesc(JdyFormData::getSyncedAt);
        Page<JdyFormData> page = jdyFormDataMapper.selectPage(new Page<>(pageNo, pageSize), wrapper);
        return new PageResult<>(page.getTotal(), page.getRecords());
    }

    public JdyFormData getDataDetail(Long id) {
        JdyFormData data = jdyFormDataMapper.selectById(id);
        if (data == null) {
            throw new RuntimeException("数据不存在");
        }
        return data;
    }

    private boolean upsertFormData(String appId, String entryId, String formName,
                                   JSONObject row, LocalDateTime now) {
        String dataId = firstNonBlank(row.getString("_id"), row.getString("data_id"));
        if (!StringUtils.hasText(dataId)) {
            return false;
        }
        JSONObject creator = row.getJSONObject("creator");
        String creatorName = creator != null ? creator.getString("name") : null;
        String creatorUsername = creator != null ? creator.getString("username") : null;
        String submitDate = extractSubmitDate(row);

        if (isPricingApp(appId)) {
            LambdaQueryWrapper<JdyPricingFormData> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(JdyPricingFormData::getAppId, appId)
                    .eq(JdyPricingFormData::getEntryId, entryId)
                    .eq(JdyPricingFormData::getDataId, dataId);
            JdyPricingFormData existing = jdyPricingFormDataMapper.selectOne(wrapper);
            if (existing == null) {
                JdyPricingFormData entity = new JdyPricingFormData();
                entity.setAppId(appId);
                entity.setEntryId(entryId);
                entity.setDataId(dataId);
                entity.setFormName(formName);
                entity.setCreatorName(creatorName);
                entity.setCreatorUsername(creatorUsername);
                entity.setJdyCreateTime(row.getString("createTime"));
                entity.setJdyUpdateTime(row.getString("updateTime"));
                entity.setSubmitDate(submitDate);
                entity.setRawData(row.toJSONString());
                entity.setSyncedAt(now);
                entity.setUpdatedAt(now);
                jdyPricingFormDataMapper.insert(entity);
                return true;
            }
            existing.setFormName(formName);
            existing.setCreatorName(creatorName);
            existing.setCreatorUsername(creatorUsername);
            existing.setJdyCreateTime(row.getString("createTime"));
            existing.setJdyUpdateTime(row.getString("updateTime"));
            existing.setSubmitDate(submitDate);
            existing.setRawData(row.toJSONString());
            existing.setSyncedAt(now);
            existing.setUpdatedAt(now);
            jdyPricingFormDataMapper.updateById(existing);
            return true;
        }

        LambdaQueryWrapper<JdyFormData> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(JdyFormData::getAppId, appId)
                .eq(JdyFormData::getEntryId, entryId)
                .eq(JdyFormData::getDataId, dataId);
        JdyFormData existing = jdyFormDataMapper.selectOne(wrapper);
        if (existing == null) {
            JdyFormData entity = new JdyFormData();
            entity.setAppId(appId);
            entity.setEntryId(entryId);
            entity.setDataId(dataId);
            entity.setFormName(formName);
            entity.setCreatorName(creatorName);
            entity.setCreatorUsername(creatorUsername);
            entity.setJdyCreateTime(row.getString("createTime"));
            entity.setJdyUpdateTime(row.getString("updateTime"));
            entity.setSubmitDate(submitDate);
            entity.setRawData(row.toJSONString());
            entity.setSyncedAt(now);
            entity.setUpdatedAt(now);
            jdyFormDataMapper.insert(entity);
            return true;
        }
        existing.setFormName(formName);
        existing.setCreatorName(creatorName);
        existing.setCreatorUsername(creatorUsername);
        existing.setJdyCreateTime(row.getString("createTime"));
        existing.setJdyUpdateTime(row.getString("updateTime"));
        existing.setSubmitDate(submitDate);
        existing.setRawData(row.toJSONString());
        existing.setSyncedAt(now);
        existing.setUpdatedAt(now);
        jdyFormDataMapper.updateById(existing);
        return true;
    }

    private void upsertFormMeta(String appId, String entryId, String formName,
                                LocalDateTime now, String message) {
        if (isPricingApp(appId)) {
            LambdaQueryWrapper<JdyPricingForm> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(JdyPricingForm::getAppId, appId).eq(JdyPricingForm::getEntryId, entryId);
            JdyPricingForm existing = jdyPricingFormMapper.selectOne(wrapper);
            if (existing == null) {
                JdyPricingForm form = new JdyPricingForm();
                form.setAppId(appId);
                form.setEntryId(entryId);
                form.setFormName(formName);
                form.setStatus(1);
                form.setDataCount(0);
                form.setLastSyncAt(message != null ? now : null);
                form.setLastSyncMessage(message);
                form.setCreatedAt(now);
                form.setUpdatedAt(now);
                jdyPricingFormMapper.insert(form);
                return;
            }
            if (StringUtils.hasText(formName)) {
                existing.setFormName(formName);
            }
            if (message != null) {
                existing.setLastSyncAt(now);
                existing.setLastSyncMessage(truncate(message, 500));
            }
            existing.setUpdatedAt(now);
            jdyPricingFormMapper.updateById(existing);
            return;
        }

        JdyForm existing = findReceiptForm(appId, entryId);
        if (existing == null) {
            JdyForm form = new JdyForm();
            form.setAppId(appId);
            form.setEntryId(entryId);
            form.setFormName(formName);
            form.setStatus(1);
            form.setDataCount(0);
            form.setLastSyncAt(message != null ? now : null);
            form.setLastSyncMessage(message);
            form.setCreatedAt(now);
            form.setUpdatedAt(now);
            jdyFormMapper.insert(form);
            return;
        }
        if (StringUtils.hasText(formName)) {
            existing.setFormName(formName);
        }
        if (message != null) {
            existing.setLastSyncAt(now);
            existing.setLastSyncMessage(truncate(message, 500));
        }
        existing.setUpdatedAt(now);
        jdyFormMapper.updateById(existing);
    }

    private void updateFormDataCount(String appId, String entryId, int count, LocalDateTime now) {
        if (isPricingApp(appId)) {
            LambdaQueryWrapper<JdyPricingForm> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(JdyPricingForm::getAppId, appId).eq(JdyPricingForm::getEntryId, entryId);
            JdyPricingForm form = jdyPricingFormMapper.selectOne(wrapper);
            if (form == null) {
                return;
            }
            form.setDataCount(count);
            form.setLastSyncAt(now);
            form.setUpdatedAt(now);
            jdyPricingFormMapper.updateById(form);
            return;
        }
        JdyForm form = findReceiptForm(appId, entryId);
        if (form == null) {
            return;
        }
        form.setDataCount(count);
        form.setLastSyncAt(now);
        form.setUpdatedAt(now);
        jdyFormMapper.updateById(form);
    }

    private void markFormSyncFailed(String appId, String entryId, String formName, String message) {
        LocalDateTime now = LocalDateTime.now();
        String msg = truncate("失败: " + message, 500);
        if (isPricingApp(appId)) {
            LambdaQueryWrapper<JdyPricingForm> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(JdyPricingForm::getAppId, appId).eq(JdyPricingForm::getEntryId, entryId);
            JdyPricingForm form = jdyPricingFormMapper.selectOne(wrapper);
            if (form == null) {
                return;
            }
            form.setLastSyncAt(now);
            form.setLastSyncMessage(msg);
            form.setUpdatedAt(now);
            jdyPricingFormMapper.updateById(form);
            return;
        }
        JdyForm form = findReceiptForm(appId, entryId);
        if (form == null || form.getId() == null) {
            return;
        }
        form.setLastSyncAt(now);
        form.setLastSyncMessage(msg);
        form.setUpdatedAt(now);
        jdyFormMapper.updateById(form);
    }

    private FormMeta findFormMeta(String appId, String entryId) {
        if (isPricingApp(appId)) {
            LambdaQueryWrapper<JdyPricingForm> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(JdyPricingForm::getAppId, appId).eq(JdyPricingForm::getEntryId, entryId);
            JdyPricingForm form = jdyPricingFormMapper.selectOne(wrapper);
            return form == null ? null : new FormMeta(form.getFormName());
        }
        JdyForm form = findReceiptForm(appId, entryId);
        return form == null ? null : new FormMeta(form.getFormName());
    }

    private JdyForm findReceiptForm(String appId, String entryId) {
        LambdaQueryWrapper<JdyForm> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(JdyForm::getAppId, appId).eq(JdyForm::getEntryId, entryId);
        return jdyFormMapper.selectOne(wrapper);
    }

    private static final class FormMeta {
        private final String formName;

        private FormMeta(String formName) {
            this.formName = formName;
        }
    }

    private String requireAppId() {
        String appId = jdyApiService.getEffectiveAppId();
        if (!StringUtils.hasText(appId)) {
            throw new RuntimeException("简道云 appId 未配置");
        }
        if (!jdyApiService.isConfigured()) {
            throw new RuntimeException("简道云 API Key 未配置");
        }
        return appId;
    }

    private String maskSecret(String secret) {
        if (!StringUtils.hasText(secret)) {
            return "";
        }
        if (secret.length() <= 8) {
            return "****";
        }
        return secret.substring(0, 4) + "****" + secret.substring(secret.length() - 4);
    }

    private String extractSubmitDate(JSONObject row) {
        String createTime = row.getString("createTime");
        if (StringUtils.hasText(createTime) && createTime.length() >= 10) {
            return createTime.substring(0, 10);
        }
        return null;
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value;
            }
        }
        return null;
    }

    private String truncate(String text, int max) {
        if (text == null) {
            return null;
        }
        return text.length() <= max ? text : text.substring(0, max);
    }
}
