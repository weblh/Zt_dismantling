package com.zuantan.dismantling.service;

import cn.hutool.crypto.digest.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zuantan.dismantling.dto.LoginResponse;
import com.zuantan.dismantling.dto.UserCreateRequest;
import com.zuantan.dismantling.dto.UserUpdateRequest;
import com.zuantan.dismantling.entity.SysUser;
import com.zuantan.dismantling.mapper.SysUserMapper;
import com.zuantan.dismantling.util.AppPermissionUtil;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final SysUserMapper userMapper;
    private final AuthService authService;

    public UserService(SysUserMapper userMapper, AuthService authService) {
        this.userMapper = userMapper;
        this.authService = authService;
    }

    public List<LoginResponse.UserInfo> listUsers(Long operatorId) {
        authService.requireSuperAdmin(operatorId);
        return userMapper.selectList(new LambdaQueryWrapper<SysUser>().orderByAsc(SysUser::getId))
                .stream()
                .map(authService::toUserInfo)
                .collect(Collectors.toList());
    }

    public LoginResponse.UserInfo createUser(Long operatorId, UserCreateRequest request) {
        authService.requireSuperAdmin(operatorId);

        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysUser::getUsername, request.getUsername());
        if (userMapper.selectOne(wrapper) != null) {
            throw new RuntimeException("用户名已存在");
        }

        SysUser user = new SysUser();
        user.setUsername(request.getUsername().trim());
        user.setPassword(BCrypt.hashpw(request.getPassword()));
        user.setNickname(StringUtils.hasText(request.getNickname()) ? request.getNickname().trim() : request.getUsername());
        user.setRole(AppPermissionUtil.ROLE_USER);
        user.setAppPermissions(AppPermissionUtil.joinPermissions(request.getAppPermissions()));
        user.setStatus(1);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.insert(user);
        return authService.toUserInfo(user);
    }

    public LoginResponse.UserInfo updateUser(Long operatorId, Long userId, UserUpdateRequest request) {
        authService.requireSuperAdmin(operatorId);

        SysUser user = userMapper.selectById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }

        if (request.getNickname() != null) {
            user.setNickname(request.getNickname().trim());
        }
        if (request.getStatus() != null) {
            if (AppPermissionUtil.isSuperAdmin(user.getRole()) && request.getStatus() != 1) {
                throw new RuntimeException("不能禁用超管账号");
            }
            user.setStatus(request.getStatus());
        }
        if (request.getAppPermissions() != null) {
            if (AppPermissionUtil.isSuperAdmin(user.getRole())) {
                user.setAppPermissions(AppPermissionUtil.joinPermissions(AppPermissionUtil.ALL_APPS));
            } else {
                user.setAppPermissions(AppPermissionUtil.joinPermissions(request.getAppPermissions()));
            }
        }
        if (StringUtils.hasText(request.getPassword())) {
            user.setPassword(BCrypt.hashpw(request.getPassword()));
        }
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(user);
        return authService.toUserInfo(user);
    }
}
