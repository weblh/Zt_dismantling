package com.zuantan.dismantling.service;

import cn.hutool.crypto.digest.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zuantan.dismantling.config.HubDashboardProperties;
import com.zuantan.dismantling.dto.DashboardExchangeRequest;
import com.zuantan.dismantling.dto.LoginRequest;
import com.zuantan.dismantling.dto.LoginResponse;
import com.zuantan.dismantling.entity.SysUser;
import com.zuantan.dismantling.hub.FengchiIdentityClient;
import com.zuantan.dismantling.mapper.SysUserMapper;
import com.zuantan.dismantling.util.AppPermissionUtil;
import com.zuantan.dismantling.util.JwtUtil;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final SysUserMapper userMapper;
    private final JwtUtil jwtUtil;
    private final HubDashboardProperties hubDashboardProperties;
    private final FengchiIdentityClient fengchiIdentityClient;

    public AuthService(SysUserMapper userMapper,
                       JwtUtil jwtUtil,
                       HubDashboardProperties hubDashboardProperties,
                       FengchiIdentityClient fengchiIdentityClient) {
        this.userMapper = userMapper;
        this.jwtUtil = jwtUtil;
        this.hubDashboardProperties = hubDashboardProperties;
        this.fengchiIdentityClient = fengchiIdentityClient;
    }

    public LoginResponse login(LoginRequest request) {
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysUser::getUsername, request.getUsername());
        SysUser user = userMapper.selectOne(wrapper);

        if (user == null || user.getStatus() != 1) {
            throw new RuntimeException("用户不存在或已禁用");
        }

        if (!BCrypt.checkpw(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("用户名或密码错误");
        }

        LoginResponse response = new LoginResponse();
        response.setToken(jwtUtil.generateToken(user.getId(), user.getUsername()));
        response.setUser(toUserInfo(user));
        return response;
    }

    /**
     * 广州总大屏：校验丰驰登录身份后，为本系统展示账号签发 JWT。
     */
    public LoginResponse dashboardExchange(DashboardExchangeRequest request) {
        fengchiIdentityClient.assertHubAllowed(request.getFengchiToken());

        String displayUsername = hubDashboardProperties.getDisplayUsername();
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysUser::getUsername, displayUsername).last("LIMIT 1");
        SysUser user = userMapper.selectOne(wrapper);
        if (user == null || user.getStatus() == null || user.getStatus() != 1) {
            throw new RuntimeException("展示账号不存在或已禁用: " + displayUsername);
        }

        LoginResponse response = new LoginResponse();
        response.setToken(jwtUtil.generateToken(user.getId(), user.getUsername()));
        response.setUser(toUserInfo(user));
        return response;
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
        userInfo.setDeptIds(user.getDeptIds());
        String deptRaw = user.getDeptIds();
        if (deptRaw != null && !deptRaw.trim().isEmpty() && !deptRaw.trim().startsWith("[")) {
            userInfo.setDepartment(deptRaw.trim());
        }
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
