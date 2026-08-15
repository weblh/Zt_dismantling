package com.zuantan.dismantling.config;

import cn.hutool.crypto.digest.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zuantan.dismantling.entity.DingtalkFormConfig;
import com.zuantan.dismantling.entity.SysUser;
import com.zuantan.dismantling.mapper.DingtalkFormConfigMapper;
import com.zuantan.dismantling.mapper.SysUserMapper;
import com.zuantan.dismantling.service.DingtalkStreamService;
import com.zuantan.dismantling.util.AppPermissionUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private static final String DEFAULT_FORM_ID = "PROC-0489BF13-C81F-475C-A9AD-5DA75723C2BD";
    private static final String FUND_USAGE_FORM_ID = "PROC-7CE13F4F-CCE0-4D21-9288-907C82977140";

    private final SysUserMapper userMapper;
    private final DingtalkFormConfigMapper formConfigMapper;
    private final DingtalkStreamService dingtalkStreamService;

    @Value("${dingtalk.stream.auto-start:false}")
    private boolean autoStart;

    public DataInitializer(SysUserMapper userMapper, DingtalkFormConfigMapper formConfigMapper, DingtalkStreamService dingtalkStreamService) {
        this.userMapper = userMapper;
        this.formConfigMapper = formConfigMapper;
        this.dingtalkStreamService = dingtalkStreamService;
    }

    @Override
    public void run(String... args) {
        LambdaQueryWrapper<SysUser> userWrapper = new LambdaQueryWrapper<>();
        userWrapper.eq(SysUser::getUsername, "admin");
        SysUser admin = userMapper.selectOne(userWrapper);
        if (admin == null) {
            admin = new SysUser();
            admin.setUsername("admin");
            admin.setPassword(BCrypt.hashpw("admin123"));
            admin.setNickname("管理员");
            admin.setRole(AppPermissionUtil.ROLE_SUPER_ADMIN);
            admin.setAppPermissions(AppPermissionUtil.joinPermissions(AppPermissionUtil.ALL_APPS));
            admin.setStatus(1);
            userMapper.insert(admin);
            log.info("默认管理员已创建: admin / admin123");
        } else if (!AppPermissionUtil.ROLE_SUPER_ADMIN.equals(admin.getRole())) {
            admin.setRole(AppPermissionUtil.ROLE_SUPER_ADMIN);
            admin.setAppPermissions(AppPermissionUtil.joinPermissions(AppPermissionUtil.ALL_APPS));
            userMapper.updateById(admin);
            log.info("已将 admin 提升为 SUPER_ADMIN");
        }

        LambdaQueryWrapper<DingtalkFormConfig> formWrapper = new LambdaQueryWrapper<>();
        formWrapper.eq(DingtalkFormConfig::getFormId, DEFAULT_FORM_ID);
        DingtalkFormConfig formConfig = formConfigMapper.selectOne(formWrapper);
        if (formConfig == null) {
            formConfig = new DingtalkFormConfig();
            formConfig.setFormId(DEFAULT_FORM_ID);
            formConfig.setFormName("费用报销流程（工商银行）");
            formConfig.setStatus(1);
            formConfig.setDescription("钉钉费用报销审批表单");
            formConfig.setCreatedAt(LocalDateTime.now());
            formConfig.setUpdatedAt(LocalDateTime.now());
            formConfigMapper.insert(formConfig);
            log.info("默认表单配置已创建: formId={}", DEFAULT_FORM_ID);
        }

        ensureFormConfig(FUND_USAGE_FORM_ID, "资金使用申请（工商银行）", "钉钉资金使用申请审批表单");

        if (autoStart) {
            try {
                dingtalkStreamService.start();
                log.info("钉钉 Stream 通道已自动启动");
            } catch (Exception e) {
                log.warn("钉钉 Stream 通道自动启动失败，可通过 API 手动启动: {}", e.getMessage());
            }
        }
    }

    private void ensureFormConfig(String formId, String formName, String description) {
        LambdaQueryWrapper<DingtalkFormConfig> formWrapper = new LambdaQueryWrapper<>();
        formWrapper.eq(DingtalkFormConfig::getFormId, formId);
        if (formConfigMapper.selectOne(formWrapper) != null) {
            return;
        }
        DingtalkFormConfig formConfig = new DingtalkFormConfig();
        formConfig.setFormId(formId);
        formConfig.setFormName(formName);
        formConfig.setStatus(1);
        formConfig.setDescription(description);
        formConfig.setCreatedAt(LocalDateTime.now());
        formConfig.setUpdatedAt(LocalDateTime.now());
        formConfigMapper.insert(formConfig);
        log.info("默认表单配置已创建: formId={}", formId);
    }
}
