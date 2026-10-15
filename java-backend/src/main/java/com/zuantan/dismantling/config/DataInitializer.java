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
    private static final String HUB_PHONE_ADMIN = "19803477000";
    private static final String HUB_PHONE_ADMIN_LEGACY = "15635707707";
    private static final String HUB_EMAIL_ADMIN = "hub-dashboard@zszy.cc";
    private static final String HUB_DEFAULT_PASSWORD = "123456";

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
        } else {
            boolean changed = false;
            if (!AppPermissionUtil.ROLE_SUPER_ADMIN.equals(admin.getRole())) {
                admin.setRole(AppPermissionUtil.ROLE_SUPER_ADMIN);
                admin.setAppPermissions(AppPermissionUtil.joinPermissions(AppPermissionUtil.ALL_APPS));
                changed = true;
                log.info("已将 admin 提升为 SUPER_ADMIN");
            }
            // 保证超管可用固定口令登录小程序/后台（与产品约定一致）
            if (admin.getPassword() == null || !BCrypt.checkpw("admin123", admin.getPassword())) {
                admin.setPassword(BCrypt.hashpw("admin123"));
                changed = true;
                log.info("已确保 admin 密码为 admin123");
            }
            if (admin.getStatus() == null || admin.getStatus() != 1) {
                admin.setStatus(1);
                changed = true;
            }
            if (changed) {
                userMapper.updateById(admin);
            }
        }

        ensureHubSuperAdmin(HUB_PHONE_ADMIN, "总大屏手机管理员");
        ensureHubSuperAdmin(HUB_EMAIL_ADMIN, "总大屏邮箱管理员");

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

    private void ensureHubSuperAdmin(String username, String nickname) {
        if (HUB_PHONE_ADMIN.equals(username)) {
            renameHubPhoneAdminIfNeeded();
        }
        LambdaQueryWrapper<SysUser> userWrapper = new LambdaQueryWrapper<>();
        userWrapper.eq(SysUser::getUsername, username);
        SysUser user = userMapper.selectOne(userWrapper);
        if (user == null) {
            user = new SysUser();
            user.setUsername(username);
            user.setPassword(BCrypt.hashpw(HUB_DEFAULT_PASSWORD));
            user.setNickname(nickname);
            user.setRole(AppPermissionUtil.ROLE_SUPER_ADMIN);
            user.setAppPermissions(AppPermissionUtil.joinPermissions(AppPermissionUtil.ALL_APPS));
            user.setStatus(1);
            userMapper.insert(user);
            log.info("总大屏超管已创建: {} / {}", username, HUB_DEFAULT_PASSWORD);
            return;
        }
        if (!AppPermissionUtil.ROLE_SUPER_ADMIN.equals(user.getRole())) {
            user.setRole(AppPermissionUtil.ROLE_SUPER_ADMIN);
            user.setAppPermissions(AppPermissionUtil.joinPermissions(AppPermissionUtil.ALL_APPS));
            user.setStatus(1);
            userMapper.updateById(user);
            log.info("总大屏超管已提升: {}", username);
        }
    }

    private void renameHubPhoneAdminIfNeeded() {
        if (HUB_PHONE_ADMIN_LEGACY.equals(HUB_PHONE_ADMIN)) {
            return;
        }
        LambdaQueryWrapper<SysUser> legacyWrapper = new LambdaQueryWrapper<>();
        legacyWrapper.eq(SysUser::getUsername, HUB_PHONE_ADMIN_LEGACY);
        SysUser legacy = userMapper.selectOne(legacyWrapper);
        if (legacy == null) {
            return;
        }
        LambdaQueryWrapper<SysUser> targetWrapper = new LambdaQueryWrapper<>();
        targetWrapper.eq(SysUser::getUsername, HUB_PHONE_ADMIN);
        if (userMapper.selectOne(targetWrapper) != null) {
            log.warn("Skip rename {} -> {}: target already exists", HUB_PHONE_ADMIN_LEGACY, HUB_PHONE_ADMIN);
            return;
        }
        legacy.setUsername(HUB_PHONE_ADMIN);
        userMapper.updateById(legacy);
        log.info("总大屏手机超管已改号: {} -> {}", HUB_PHONE_ADMIN_LEGACY, HUB_PHONE_ADMIN);
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
