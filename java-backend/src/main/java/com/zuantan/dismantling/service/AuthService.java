package com.zuantan.dismantling.service;

import cn.hutool.crypto.digest.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zuantan.dismantling.dto.LoginRequest;
import com.zuantan.dismantling.dto.LoginResponse;
import com.zuantan.dismantling.entity.SysUser;
import com.zuantan.dismantling.mapper.SysUserMapper;
import com.zuantan.dismantling.util.AppPermissionUtil;
import com.zuantan.dismantling.util.JwtUtil;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final SysUserMapper userMapper;
    private final JwtUtil jwtUtil;

    public AuthService(SysUserMapper userMapper, JwtUtil jwtUtil) {
        this.userMapper = userMapper;
        this.jwtUtil = jwtUtil;
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
