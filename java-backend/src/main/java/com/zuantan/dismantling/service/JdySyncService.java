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
import com.zuantan.dismantling.mapper.JdyFormDataMapper;
import com.zuantan.dismantling.mapper.JdyFormMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class JdySyncService {

    private static final Logger log = LoggerFactory.getLogger(JdySyncService.class);

    private final JdyApiService jdyApiService;
    private final JdyFormMapper jdyFormMapper;
    private final JdyFormDataMapper jdyFormDataMapper;

    @Value("${jiandaoyun.corp-id:}")
    private String defaultCorpId;

    @Value("${jiandaoyun.agent-id:}")
    private String defaultAgentId;

    @Value("${jiandaoyun.scheduled.enabled:false}")
    private boolean defaultScheduledEnabled;

    private volatile String runtimeCorpId;
    private volatile String runtimeAgentId;
    private volatile Boolean runtimeScheduledEnabled;

    public JdySyncService(JdyApiService jdyApiService,
                          JdyFormMapper jdyFormMapper,
                          JdyFormDataMapper jdyFormDataMapper) {
        this.jdyApiService = jdyApiService;
        this.jdyFormMapper = jdyFormMapper;
        this.jdyFormDataMapper = jdyFormDataMapper;
    }

    public void updateConfig(JdyConfigRequest request) {
        jdyApiService.updateCredentials(request.getApiKey(), request.getAppId());
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
        JdyStatusResponse status = new JdyStatusResponse();
        status.setConfigured(jdyApiService.isConfigured());
        status.setAppId(jdyApiService.getEffectiveAppId());
        status.setCorpId(StringUtils.hasText(runtimeCorpId) ? runtimeCorpId : defaultCorpId);
        status.setAgentId(StringUtils.hasText(runtimeAgentId) ? runtimeAgentId : defaultAgentId);
        status.setApiKeyMasked(maskSecret(jdyApiService.getEffectiveApiKey()));
        status.setScheduledEnabled(isScheduledEnabled());
        status.setFormCount(jdyFormMapper.selectCount(null));
        status.setDataCount(jdyFormDataMapper.selectCount(null));
        if (!status.isConfigured()) {
            status.setMessage("未配置简道云 API Key。请到开放平台「密钥管理」创建后填写");
        } else {
            status.setMessage("已配置，可同步「汽车拆解-收车」全部表单数据");
        }
        return status;
    }

    public List<JdyForm> refreshForms() {
        String appId = requireAppId();
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
            log.info("简道云表单列表已刷新: appId={}, count={}", appId, remoteForms.size());
            return listForms();
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage(), e);
        }
    }

    public JdySyncResult syncAllForms() {
        List<JdyForm> forms = refreshForms();
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
                upserted += syncOneForm(form.getEntryId());
                success++;
            } catch (Exception e) {
                failed++;
                log.warn("同步简道云表单失败: entryId={}, name={}, err={}",
                        form.getEntryId(), form.getFormName(), e.getMessage());
                markFormSyncFailed(form, e.getMessage());
            }
        }
        result.setSuccessForms(success);
        result.setFailedForms(failed);
        result.setUpsertedRows(upserted);
        result.setMessage(String.format("同步完成：表单 %d，成功 %d，失败 %d，写入/更新 %d 条",
                result.getFormCount(), success, failed, upserted));
        return result;
    }

    public int syncOneForm(String entryId) {
        String appId = requireAppId();
        if (!StringUtils.hasText(entryId)) {
            throw new RuntimeException("entryId 不能为空");
        }
        JdyForm form = findForm(appId, entryId);
        String formName = form != null ? form.getFormName() : entryId;
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
            log.info("简道云表单同步完成: entryId={}, name={}, remote={}, upserted={}",
                    entryId, formName, rows.size(), upserted);
            return upserted;
        } catch (Exception e) {
            markFormSyncFailed(form != null ? form : buildTempForm(appId, entryId, formName), e.getMessage());
            throw new RuntimeException(e.getMessage(), e);
        }
    }

    public List<JdyForm> listForms() {
        LambdaQueryWrapper<JdyForm> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByAsc(JdyForm::getFormName);
        return jdyFormMapper.selectList(wrapper);
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
        LambdaQueryWrapper<JdyFormData> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(JdyFormData::getAppId, appId)
                .eq(JdyFormData::getEntryId, entryId)
                .eq(JdyFormData::getDataId, dataId);
        JdyFormData existing = jdyFormDataMapper.selectOne(wrapper);

        JSONObject creator = row.getJSONObject("creator");
        String creatorName = creator != null ? creator.getString("name") : null;
        String creatorUsername = creator != null ? creator.getString("username") : null;

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
        existing.setRawData(row.toJSONString());
        existing.setSyncedAt(now);
        existing.setUpdatedAt(now);
        jdyFormDataMapper.updateById(existing);
        return true;
    }

    private void upsertFormMeta(String appId, String entryId, String formName,
                                LocalDateTime now, String message) {
        JdyForm existing = findForm(appId, entryId);
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
        JdyForm form = findForm(appId, entryId);
        if (form == null) {
            return;
        }
        form.setDataCount(count);
        form.setLastSyncAt(now);
        form.setUpdatedAt(now);
        jdyFormMapper.updateById(form);
    }

    private void markFormSyncFailed(JdyForm form, String message) {
        if (form == null || form.getId() == null) {
            return;
        }
        form.setLastSyncAt(LocalDateTime.now());
        form.setLastSyncMessage(truncate("失败: " + message, 500));
        form.setUpdatedAt(LocalDateTime.now());
        jdyFormMapper.updateById(form);
    }

    private JdyForm findForm(String appId, String entryId) {
        LambdaQueryWrapper<JdyForm> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(JdyForm::getAppId, appId).eq(JdyForm::getEntryId, entryId);
        return jdyFormMapper.selectOne(wrapper);
    }

    private JdyForm buildTempForm(String appId, String entryId, String formName) {
        JdyForm form = new JdyForm();
        form.setAppId(appId);
        form.setEntryId(entryId);
        form.setFormName(formName);
        return form;
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
