package com.zuantan.dismantling.service;

import cn.hutool.crypto.digest.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zuantan.dismantling.dto.LoginResponse;
import com.zuantan.dismantling.dto.UserCreateRequest;
import com.zuantan.dismantling.dto.UserUpdateRequest;
import com.zuantan.dismantling.entity.SysUser;
import com.zuantan.dismantling.mapper.SysUserMapper;
import com.zuantan.dismantling.util.AppPermissionUtil;
import com.zuantan.dismantling.util.PhoneUtil;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final SysUserMapper userMapper;
    private final AuthService authService;
    private final DeptService deptService;
    private final RoleService roleService;

    public UserService(SysUserMapper userMapper,
                       AuthService authService,
                       @Lazy DeptService deptService,
                       @Lazy RoleService roleService) {
        this.userMapper = userMapper;
        this.authService = authService;
        this.deptService = deptService;
        this.roleService = roleService;
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

        String phone = PhoneUtil.normalize(request.getPhone());
        if (StringUtils.hasText(request.getPhone()) && phone == null) {
            phone = request.getPhone().trim();
        }
        assertPhoneAvailable(phone, null);

        SysUser user = new SysUser();
        user.setUsername(request.getUsername().trim());
        user.setPassword(BCrypt.hashpw(request.getPassword()));
        user.setNickname(StringUtils.hasText(request.getNickname()) ? request.getNickname().trim() : request.getUsername());
        String role = StringUtils.hasText(request.getRole()) ? request.getRole().trim() : AppPermissionUtil.ROLE_USER;
        if (AppPermissionUtil.ROLE_SUPER_ADMIN.equals(role) || !roleService.isKnownRoleCode(role)) {
            role = AppPermissionUtil.ROLE_USER;
        }
        user.setRole(role);
        user.setAppPermissions(AppPermissionUtil.joinPermissions(request.getAppPermissions()));
        if (StringUtils.hasText(request.getDepartment())) {
            user.setDeptIds(deptService.encodeDeptForStorage(request.getDepartment().trim()));
        }
        user.setPhone(phone);
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
        if (StringUtils.hasText(request.getRole()) && !AppPermissionUtil.isSuperAdmin(user.getRole())) {
            String role = request.getRole().trim();
            if (AppPermissionUtil.ROLE_SUPER_ADMIN.equals(role) || !roleService.isKnownRoleCode(role)) {
                throw new RuntimeException("角色无效");
            }
            user.setRole(role);
        }
        if (StringUtils.hasText(request.getPassword())) {
            user.setPassword(BCrypt.hashpw(request.getPassword()));
        }
        if (request.getDepartment() != null) {
            if (StringUtils.hasText(request.getDepartment())) {
                user.setDeptIds(deptService.encodeDeptForStorage(request.getDepartment().trim()));
            } else {
                user.setDeptIds(null);
            }
        }
        if (request.getPhone() != null) {
            String phone = PhoneUtil.normalize(request.getPhone());
            if (StringUtils.hasText(request.getPhone()) && phone == null) {
                phone = request.getPhone().trim();
            }
            if (!StringUtils.hasText(phone)) {
                user.setPhone(null);
            } else {
                assertPhoneAvailable(phone, userId);
                user.setPhone(phone);
            }
        }
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(user);
        return authService.toUserInfo(user);
    }

    private void assertPhoneAvailable(String phone, Long excludeUserId) {
        if (!StringUtils.hasText(phone)) {
            return;
        }
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysUser::getPhone, phone).last("LIMIT 1");
        SysUser existing = userMapper.selectOne(wrapper);
        if (existing != null && (excludeUserId == null || !existing.getId().equals(excludeUserId))) {
            throw new RuntimeException("手机号已被其他账号使用");
        }
    }
}
