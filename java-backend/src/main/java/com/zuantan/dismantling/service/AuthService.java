package com.zuantan.dismantling.service;

import cn.hutool.crypto.digest.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zuantan.dismantling.config.HubDashboardProperties;
import com.zuantan.dismantling.dto.DashboardExchangeRequest;
import com.zuantan.dismantling.dto.LoginRequest;
import com.zuantan.dismantling.dto.LoginResponse;
import com.zuantan.dismantling.dto.PhoneActivateRequest;
import com.zuantan.dismantling.dto.PhoneLoginRequest;
import com.zuantan.dismantling.entity.SysUser;
import com.zuantan.dismantling.mapper.SysUserMapper;
import com.zuantan.dismantling.util.AppPermissionUtil;
import com.zuantan.dismantling.util.JwtUtil;
import com.zuantan.dismantling.util.PhoneUtil;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class AuthService {

    private final SysUserMapper userMapper;
    private final JwtUtil jwtUtil;
    private final HubDashboardProperties hubDashboardProperties;
    private final DeptService deptService;

    public AuthService(SysUserMapper userMapper,
                       JwtUtil jwtUtil,
                       HubDashboardProperties hubDashboardProperties,
                       @Lazy DeptService deptService) {
        this.userMapper = userMapper;
        this.jwtUtil = jwtUtil;
        this.hubDashboardProperties = hubDashboardProperties;
        this.deptService = deptService;
    }

    public LoginResponse login(LoginRequest request) {
        SysUser user = findByUsername(request.getUsername());
        return loginWithPassword(user, request.getPassword(), "用户名或密码错误");
    }

    /**
     * 小程序账号登录：支持用户名（如 admin）或手机号 + 本地密码。
     * 与后台 / 钉钉合并后的本地账号一致（钉钉企业密码无法同步）。
     */
    public LoginResponse loginByPhone(PhoneLoginRequest request) {
        SysUser user = findActiveUserByAccount(request.getPhone());
        return loginWithPassword(user, request.getPassword(), "账号或密码错误；若为钉钉同步账号首次使用，请先「激活账号」设置密码");
    }

    /**
     * 钉钉已同步用户：用手机号自助设置登录密码并登录（不新建用户）。
     */
    public LoginResponse activateByPhone(PhoneActivateRequest request) {
        String phone = PhoneUtil.normalize(request.getPhone());
        if (phone == null || !phone.matches("1\\d{10}")) {
            throw new RuntimeException("请输入正确的11位手机号");
        }
        String rawPassword = request.getPassword() == null ? "" : request.getPassword().trim();
        if (rawPassword.length() < 6) {
            throw new RuntimeException("密码至少 6 位");
        }

        SysUser user = findByPhone(phone);
        if (user == null) {
            throw new RuntimeException("该手机号不在组织通讯录中，请联系管理员在钉钉同步用户后再试");
        }
        if (user.getStatus() == null || user.getStatus() != 1) {
            throw new RuntimeException("账号已禁用，请联系管理员");
        }

        SysUser patch = new SysUser();
        patch.setId(user.getId());
        patch.setPassword(BCrypt.hashpw(rawPassword));
        // 确保登录账号可用手机号
        if (user.getPhone() == null || user.getPhone().trim().isEmpty()) {
            patch.setPhone(phone);
            user.setPhone(phone);
        }
        userMapper.updateById(patch);
        user.setPassword(patch.getPassword());
        return buildLoginResponse(user);
    }

    public LoginResponse buildLoginResponse(SysUser user) {
        LoginResponse response = new LoginResponse();
        response.setToken(jwtUtil.generateToken(user.getId(), user.getUsername()));
        response.setUser(toUserInfo(user));
        return response;
    }

    /** 校验账号（用户名或手机号）+ 密码，供微信绑定等复用 */
    public SysUser requireActiveUserByPhone(String account, String password) {
        SysUser user = findActiveUserByAccount(account);
        if (user == null || user.getStatus() == null || user.getStatus() != 1) {
            throw new RuntimeException("用户不存在或已禁用");
        }
        if (!BCrypt.checkpw(password, user.getPassword())) {
            throw new RuntimeException("账号或密码错误");
        }
        return user;
    }

    private SysUser findActiveUserByAccount(String rawAccount) {
        if (rawAccount == null || rawAccount.trim().isEmpty()) {
            return null;
        }
        String account = rawAccount.trim();
        String phone = PhoneUtil.normalize(account);
        SysUser user = null;
        if (phone != null && phone.matches("1\\d{10}")) {
            user = findByPhone(phone);
        }
        if (user == null) {
            user = findByUsername(account);
        }
        if (user == null && phone != null && !phone.equals(account)) {
            user = findByUsername(phone);
        }
        return user;
    }

    private LoginResponse loginWithPassword(SysUser user, String rawPassword, String wrongMsg) {
        if (user == null || user.getStatus() != 1) {
            throw new RuntimeException("用户不存在或已禁用");
        }
        if (!BCrypt.checkpw(rawPassword, user.getPassword())) {
            throw new RuntimeException(wrongMsg);
        }
        return buildLoginResponse(user);
    }

    private SysUser findByUsername(String username) {
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysUser::getUsername, username).last("LIMIT 1");
        return userMapper.selectOne(wrapper);
    }

    private SysUser findByPhone(String phone) {
        if (phone == null || phone.isEmpty()) {
            return null;
        }
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysUser::getPhone, phone).last("LIMIT 1");
        return userMapper.selectOne(wrapper);
    }

    /**
     * 广州总大屏：校验门户共享密钥后，为本系统展示账号签发 JWT。
     */
    public LoginResponse dashboardExchange(DashboardExchangeRequest request) {
        assertPortalHubAllowed(request);

        String displayUsername = hubDashboardProperties.getDisplayUsername();
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysUser::getUsername, displayUsername).last("LIMIT 1");
        SysUser user = userMapper.selectOne(wrapper);
        if (user == null || user.getStatus() == null || user.getStatus() != 1) {
            throw new RuntimeException("展示账号不存在或已禁用: " + displayUsername);
        }

        return buildLoginResponse(user);
    }

    private void assertPortalHubAllowed(DashboardExchangeRequest request) {
        if (!hubDashboardProperties.isEnabled()) {
            throw new RuntimeException("总大屏令牌换发未启用");
        }
        String expected = hubDashboardProperties.getExchangeSecret();
        String provided = request == null ? null : request.getHubSecret();
        if (!StringUtils.hasText(expected)
                || !StringUtils.hasText(provided)
                || !expected.equals(provided.trim())) {
            throw new RuntimeException("门户换发密钥无效");
        }
    }

    public LoginResponse.UserInfo toUserInfo(SysUser user) {
        LoginResponse.UserInfo userInfo = new LoginResponse.UserInfo();
        userInfo.setId(user.getId());
        userInfo.setUsername(user.getUsername());
        userInfo.setNickname(user.getNickname());
        String role = user.getRole() == null || user.getRole().isEmpty()
                ? AppPermissionUtil.ROLE_USER
                : user.getRole();
        userInfo.setRole(role);
        userInfo.setAppPermissions(AppPermissionUtil.resolveAccessibleApps(role, user.getAppPermissions()));
        userInfo.setDingtalkUserId(user.getDingtalkUserid());
        userInfo.setAvatar(user.getAvatar());
        userInfo.setPhone(user.getPhone());
        userInfo.setDeptIds(user.getDeptIds());
        String deptName = deptService.resolvePrimaryDeptName(user.getDeptIds());
        if (deptName != null) {
            userInfo.setDepartment(deptName);
        }
        userInfo.setWechatBound(user.getWechatOpenid() != null && !user.getWechatOpenid().trim().isEmpty());
        return userInfo;
    }

    public SysUser requireUser(Long userId) {
        SysUser user = userMapper.selectById(userId);
        if (user == null || user.getStatus() == null || user.getStatus() != 1) {
            throw new RuntimeException("用户不存在或已禁用");
        }
        return user;
    }

    public void requireSuperAdmin(Long userId) {
        SysUser user = requireUser(userId);
        if (!AppPermissionUtil.isSuperAdmin(user.getRole())) {
            throw new RuntimeException("无超管权限");
        }
    }
}
