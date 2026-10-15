package com.zuantan.dismantling.service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zuantan.dismantling.entity.BizApp;
import com.zuantan.dismantling.entity.BizForm;
import com.zuantan.dismantling.entity.BizFormData;
import com.zuantan.dismantling.entity.BizFormVersion;
import com.zuantan.dismantling.entity.JdyForm;
import com.zuantan.dismantling.entity.JdyFormData;
import com.zuantan.dismantling.entity.SysUser;
import com.zuantan.dismantling.mapper.BizAppMapper;
import com.zuantan.dismantling.mapper.BizFormDataMapper;
import com.zuantan.dismantling.mapper.BizFormMapper;
import com.zuantan.dismantling.mapper.BizFormVersionMapper;
import com.zuantan.dismantling.mapper.JdyFormDataMapper;
import com.zuantan.dismantling.mapper.JdyFormMapper;
import com.zuantan.dismantling.util.JdySchemaConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class BizPlatformService {

    private final BizAppMapper appMapper;
    private final BizFormMapper formMapper;
    private final BizFormDataMapper dataMapper;
    private final BizFormVersionMapper versionMapper;
    private final JdyFormMapper jdyFormMapper;
    private final JdyFormDataMapper jdyFormDataMapper;
    private final AuthService authService;
    private final BizAclService aclService;

    @Value("${platform.default-app-name:汽车拆解-收车}")
    private String defaultAppName;

    public BizPlatformService(BizAppMapper appMapper, BizFormMapper formMapper,
                              BizFormDataMapper dataMapper, BizFormVersionMapper versionMapper,
                              JdyFormMapper jdyFormMapper, JdyFormDataMapper jdyFormDataMapper,
                              AuthService authService, BizAclService aclService) {
        this.appMapper = appMapper;
        this.formMapper = formMapper;
        this.dataMapper = dataMapper;
        this.versionMapper = versionMapper;
        this.jdyFormMapper = jdyFormMapper;
        this.jdyFormDataMapper = jdyFormDataMapper;
        this.authService = authService;
        this.aclService = aclService;
    }

    public BizApp ensureDefaultApp() {
        LambdaQueryWrapper<BizApp> q = new LambdaQueryWrapper<>();
        q.eq(BizApp::getCode, "receipt");
        BizApp app = appMapper.selectOne(q);
        if (app != null) {
            return app;
        }
        app = new BizApp();
        app.setCode("receipt");
        app.setName(defaultAppName);
        app.setDescription("自研替代简道云「汽车拆解-收车」");
        app.setStatus(1);
        LocalDateTime now = LocalDateTime.now();
        app.setCreatedAt(now);
        app.setUpdatedAt(now);
        appMapper.insert(app);
        return app;
    }

    public List<BizApp> listApps() {
        return appMapper.selectList(new LambdaQueryWrapper<BizApp>().eq(BizApp::getStatus, 1));
    }

    public List<BizForm> listForms(Long appId) {
        LambdaQueryWrapper<BizForm> q = new LambdaQueryWrapper<>();
        if (appId != null) {
            q.eq(BizForm::getAppId, appId);
        }
        q.eq(BizForm::getStatus, 1).orderByAsc(BizForm::getSortOrder).orderByAsc(BizForm::getId);
        return formMapper.selectList(q);
    }

    public BizForm getForm(Long id) {
        BizForm form = formMapper.selectById(id);
        if (form == null) {
            throw new RuntimeException("表单不存在");
        }
        return form;
    }

    public BizForm getFormByCode(String code) {
        LambdaQueryWrapper<BizForm> q = new LambdaQueryWrapper<>();
        q.eq(BizForm::getCode, code).last("LIMIT 1");
        BizForm form = formMapper.selectOne(q);
        if (form == null) {
            throw new RuntimeException("表单不存在: " + code);
        }
        return form;
    }

    public BizForm saveFormMeta(BizForm form) {
        LocalDateTime now = LocalDateTime.now();
        if (form.getId() == null) {
            form.setCreatedAt(now);
            form.setUpdatedAt(now);
            if (form.getVersion() == null) {
                form.setVersion(1);
            }
            if (form.getStatus() == null) {
                form.setStatus(1);
            }
            formMapper.insert(form);
        } else {
            form.setUpdatedAt(now);
            formMapper.updateById(form);
        }
        return form;
    }

    /** 保存草稿 schema（设计器） */
    public BizForm saveDraftSchema(Long formId, String schemaJson) {
        BizForm form = getForm(formId);
        form.setDraftSchemaJson(schemaJson);
        form.setUpdatedAt(LocalDateTime.now());
        formMapper.updateById(form);
        return form;
    }

    /** 发布草稿为正式版本 */
    @Transactional
    public BizForm publishForm(Long formId, String publishedBy) {
        BizForm form = getForm(formId);
        String schema = StringUtils.hasText(form.getDraftSchemaJson())
                ? form.getDraftSchemaJson()
                : form.getSchemaJson();
        if (!StringUtils.hasText(schema)) {
            throw new RuntimeException("无可发布的 schema");
        }
        int next = form.getVersion() == null ? 1 : form.getVersion() + 1;
        form.setSchemaJson(schema);
        form.setVersion(next);
        form.setUpdatedAt(LocalDateTime.now());
        formMapper.updateById(form);

        BizFormVersion ver = new BizFormVersion();
        ver.setFormId(formId);
        ver.setVersion(next);
        ver.setSchemaJson(schema);
        ver.setPublishedBy(publishedBy);
        ver.setPublishedAt(LocalDateTime.now());
        versionMapper.insert(ver);
        return form;
    }

    public Page<BizFormData> pageData(Long formId, int page, int size, Long userId) {
        BizForm form = getForm(formId);
        SysUser user = authService.requireUser(userId);
        LambdaQueryWrapper<BizFormData> q = new LambdaQueryWrapper<>();
        q.eq(BizFormData::getFormId, formId);
        aclService.applyDataScope(q, form.getId(), user);
        q.orderByDesc(BizFormData::getId);
        return dataMapper.selectPage(new Page<>(page, size), q);
    }

    public BizFormData getData(Long id) {
        BizFormData data = dataMapper.selectById(id);
        if (data == null) {
            throw new RuntimeException("数据不存在");
        }
        return data;
    }

    public BizFormData createData(Long formId, String dataJson, Long userId, boolean startFlow) {
        BizForm form = getForm(formId);
        SysUser user = authService.requireUser(userId);
        aclService.requirePerm(formId, user, "create");

        BizFormData row = new BizFormData();
        row.setFormId(formId);
        row.setDataUuid(UUID.randomUUID().toString().replace("-", ""));
        row.setDataJson(dataJson);
        row.setFlowState(form.getFlowEnabled() != null && form.getFlowEnabled() == 1 ? "draft" : "none");
        row.setCreatorUserId(user.getId());
        row.setCreatorDingId(user.getDingtalkUserid());
        row.setCreatorName(user.getNickname());
        row.setDeptIds(user.getDeptIds());
        LocalDateTime now = LocalDateTime.now();
        row.setCreatedAt(now);
        row.setUpdatedAt(now);
        dataMapper.insert(row);
        return row;
    }

    public BizFormData updateData(Long id, String dataJson, Long userId) {
        BizFormData row = getData(id);
        SysUser user = authService.requireUser(userId);
        aclService.requirePerm(row.getFormId(), user, "update");
        row.setDataJson(dataJson);
        row.setUpdatedAt(LocalDateTime.now());
        dataMapper.updateById(row);
        return row;
    }

    public void deleteData(Long id, Long userId) {
        BizFormData row = getData(id);
        SysUser user = authService.requireUser(userId);
        aclService.requirePerm(row.getFormId(), user, "delete");
        dataMapper.deleteById(id);
    }

    /**
     * 从 jdy_form / jdy_form_data 导入到自研表。
     * @param includeData 是否导入数据行
     * @param dataLimitPerForm 每表最多导入条数，0=全部
     */
    @Transactional
    public Map<String, Object> migrateFromJdy(boolean includeData, int dataLimitPerForm) {
        BizApp app = ensureDefaultApp();
        List<JdyForm> jdyForms = jdyFormMapper.selectList(new LambdaQueryWrapper<>());
        int formCount = 0;
        int dataCount = 0;
        int sort = 0;
        for (JdyForm jf : jdyForms) {
            LambdaQueryWrapper<BizForm> existQ = new LambdaQueryWrapper<>();
            existQ.eq(BizForm::getSourceEntryId, jf.getEntryId());
            BizForm form = formMapper.selectOne(existQ);
            String schema = JdySchemaConverter.toPlatformSchema(jf.getWidgetSchema());
            LocalDateTime now = LocalDateTime.now();
            if (form == null) {
                form = new BizForm();
                form.setAppId(app.getId());
                form.setCode(jf.getEntryId());
                form.setName(jf.getFormName() != null ? jf.getFormName() : jf.getEntryId());
                form.setSchemaJson(schema);
                form.setDraftSchemaJson(schema);
                form.setVersion(1);
                form.setStatus(1);
                form.setSourceEntryId(jf.getEntryId());
                form.setFlowEnabled(0);
                form.setMenuGroup(guessMenuGroup(jf.getFormName()));
                form.setSortOrder(sort++);
                form.setCreatedAt(now);
                form.setUpdatedAt(now);
                formMapper.insert(form);
                formCount++;
            } else {
                form.setSchemaJson(schema);
                form.setDraftSchemaJson(schema);
                form.setName(jf.getFormName() != null ? jf.getFormName() : form.getName());
                form.setMenuGroup(guessMenuGroup(form.getName()));
                form.setUpdatedAt(now);
                formMapper.updateById(form);
                formCount++;
            }

            if (!includeData) {
                continue;
            }
            LambdaQueryWrapper<JdyFormData> dq = new LambdaQueryWrapper<>();
            dq.eq(JdyFormData::getEntryId, jf.getEntryId()).orderByAsc(JdyFormData::getId);
            if (dataLimitPerForm > 0) {
                dq.last("LIMIT " + dataLimitPerForm);
            }
            List<JdyFormData> rows = jdyFormDataMapper.selectList(dq);
            for (JdyFormData jd : rows) {
                LambdaQueryWrapper<BizFormData> already = new LambdaQueryWrapper<>();
                already.eq(BizFormData::getFormId, form.getId())
                        .eq(BizFormData::getSourceJdyDataId, jd.getDataId());
                if (dataMapper.selectCount(already) > 0) {
                    continue;
                }
                BizFormData bd = new BizFormData();
                bd.setFormId(form.getId());
                bd.setDataUuid(jd.getDataId() != null ? jd.getDataId() : UUID.randomUUID().toString());
                bd.setDataJson(normalizeJdyRaw(jd.getRawData()));
                bd.setFlowState("none");
                bd.setCreatorName(jd.getCreatorName());
                bd.setSourceJdyDataId(jd.getDataId());
                bd.setCreatedAt(now);
                bd.setUpdatedAt(now);
                dataMapper.insert(bd);
                dataCount++;
            }
        }
        Map<String, Object> result = new HashMap<>();
        result.put("appId", app.getId());
        result.put("forms", formCount);
        result.put("dataRows", dataCount);
        return result;
    }

    private String normalizeJdyRaw(String raw) {
        if (!StringUtils.hasText(raw)) {
            return "{}";
        }
        try {
            JSONObject obj = JSON.parseObject(raw);
            return obj != null ? obj.toJSONString() : raw;
        } catch (Exception e) {
            return raw;
        }
    }

    /**
     * 按后台侧栏目录归类，便于小程序「应用」页按目录展示提交入口。
     */
    private String guessMenuGroup(String name) {
        if (name == null) {
            return "其他";
        }
        if (name.contains("VIN") || name.contains("档案") || name.contains("识别")) {
            return "识别";
        }
        if (name.contains("业务员") || name.contains("供应商") || name.contains("车辆型号")
                || name.contains("仓库") || name.contains("产品名称") || name.contains("收款人")
                || name.contains("生产人员")) {
            return "基础";
        }
        if (name.contains("农机")) {
            return "农机业务";
        }
        if (name.contains("回收证明") || name.contains("欧海手续") || name.contains("手续")) {
            return "手续";
        }
        if (name.contains("销售") || name.contains("出货价格") || name.contains("配件信息客资")) {
            return "销售";
        }
        if (name.contains("配件库存") || name.contains("配件车库存") || name.contains("配件客户")) {
            return "议价-库存台账";
        }
        if (name.contains("收货") || name.contains("结账") || name.contains("付款")
                || name.contains("修改价格") || name.contains("异地车")) {
            return "业务";
        }
        if (name.contains("过磅") || name.contains("查验") || name.contains("拆解")
                || name.contains("报废") || name.contains("挑顶") || name.contains("维修")
                || name.contains("成品入库")) {
            return "生产";
        }
        if (name.contains("台账") || name.contains("库存")) {
            return "议价-库存台账";
        }
        return "其他";
    }

    /** 按当前规则刷新已有表单的菜单分组（对齐后台目录） */
    public int realignMenuGroups() {
        List<BizForm> forms = formMapper.selectList(null);
        int updated = 0;
        for (BizForm form : forms) {
            String group = guessMenuGroup(form.getName());
            if (group != null && !group.equals(form.getMenuGroup())) {
                form.setMenuGroup(group);
                form.setUpdatedAt(LocalDateTime.now());
                formMapper.updateById(form);
                updated++;
            }
        }
        return updated;
    }
}
