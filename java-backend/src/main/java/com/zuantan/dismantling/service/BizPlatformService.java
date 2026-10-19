package com.zuantan.dismantling.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zuantan.dismantling.entity.BizApp;
import com.zuantan.dismantling.entity.BizForm;
import com.zuantan.dismantling.entity.BizFormData;
import com.zuantan.dismantling.entity.SysUser;
import com.zuantan.dismantling.mapper.BizAppMapper;
import com.zuantan.dismantling.mapper.BizFormDataMapper;
import com.zuantan.dismantling.mapper.BizFormMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * 精简平台服务：应用 / 表单 / 数据 CRUD。
 * 已移除：Flowable、ACL 表、打印模板、看板、简道云镜像迁移。
 */
@Service
public class BizPlatformService {

    private final BizAppMapper appMapper;
    private final BizFormMapper formMapper;
    private final BizFormDataMapper dataMapper;
    private final AuthService authService;

    @Value("${platform.default-app-name:汽车拆解-收车}")
    private String defaultAppName;

    public BizPlatformService(BizAppMapper appMapper, BizFormMapper formMapper,
                              BizFormDataMapper dataMapper, AuthService authService) {
        this.appMapper = appMapper;
        this.formMapper = formMapper;
        this.dataMapper = dataMapper;
        this.authService = authService;
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
        app.setDescription("自研业务应用");
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

    public BizApp saveApp(BizApp app) {
        LocalDateTime now = LocalDateTime.now();
        if (app.getId() == null) {
            app.setCreatedAt(now);
            app.setUpdatedAt(now);
            if (app.getStatus() == null) {
                app.setStatus(1);
            }
            appMapper.insert(app);
        } else {
            app.setUpdatedAt(now);
            appMapper.updateById(app);
        }
        return app;
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
            if (!StringUtils.hasText(form.getMenuGroup())) {
                form.setMenuGroup(guessMenuGroup(form.getName()));
            }
            formMapper.insert(form);
        } else {
            form.setUpdatedAt(now);
            formMapper.updateById(form);
        }
        return form;
    }

    public BizForm saveDraftSchema(Long formId, String schemaJson) {
        BizForm form = getForm(formId);
        form.setDraftSchemaJson(schemaJson);
        form.setUpdatedAt(LocalDateTime.now());
        formMapper.updateById(form);
        return form;
    }

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
        return form;
    }

    public Page<BizFormData> pageData(Long formId, int page, int size, Long userId) {
        authService.requireUser(userId);
        getForm(formId);
        LambdaQueryWrapper<BizFormData> q = new LambdaQueryWrapper<>();
        q.eq(BizFormData::getFormId, formId).orderByDesc(BizFormData::getId);
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

        BizFormData row = new BizFormData();
        row.setFormId(formId);
        row.setDataUuid(UUID.randomUUID().toString().replace("-", ""));
        row.setDataJson(dataJson);
        row.setFlowState("none");
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
        authService.requireUser(userId);
        row.setDataJson(dataJson);
        row.setUpdatedAt(LocalDateTime.now());
        dataMapper.updateById(row);
        return row;
    }

    public void deleteData(Long id, Long userId) {
        getData(id);
        authService.requireUser(userId);
        dataMapper.deleteById(id);
    }

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
