package com.zuantan.dismantling.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zuantan.dismantling.dto.RoleSaveRequest;
import com.zuantan.dismantling.dto.RoleVO;
import com.zuantan.dismantling.entity.SysRole;
import com.zuantan.dismantling.entity.SysRoleMenu;
import com.zuantan.dismantling.entity.SysUser;
import com.zuantan.dismantling.mapper.SysRoleMapper;
import com.zuantan.dismantling.mapper.SysRoleMenuMapper;
import com.zuantan.dismantling.mapper.SysUserMapper;
import com.zuantan.dismantling.util.AppPermissionUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RoleService {

    private final SysRoleMapper roleMapper;
    private final SysRoleMenuMapper roleMenuMapper;
    private final SysUserMapper userMapper;
    private final AuthService authService;

    public RoleService(SysRoleMapper roleMapper,
                       SysRoleMenuMapper roleMenuMapper,
                       SysUserMapper userMapper,
                       AuthService authService) {
        this.roleMapper = roleMapper;
        this.roleMenuMapper = roleMenuMapper;
        this.userMapper = userMapper;
        this.authService = authService;
    }

    public List<RoleVO> list(Long operatorId) {
        authService.requireSuperAdmin(operatorId);
        return roleMapper.selectList(new LambdaQueryWrapper<SysRole>().orderByAsc(SysRole::getId))
                .stream()
                .map(this::toVoWithMenus)
                .collect(Collectors.toList());
    }

    /** 给用户表单用的角色下拉（非超管角色） */
    public List<RoleVO> listAssignable(Long operatorId) {
        authService.requireSuperAdmin(operatorId);
        return roleMapper.selectList(new LambdaQueryWrapper<SysRole>()
                        .eq(SysRole::getStatus, 1)
                        .ne(SysRole::getCode, AppPermissionUtil.ROLE_SUPER_ADMIN)
                        .orderByAsc(SysRole::getId))
                .stream()
                .map(this::toVo)
                .collect(Collectors.toList());
    }

    public RoleVO get(Long operatorId, Long id) {
        authService.requireSuperAdmin(operatorId);
        SysRole role = roleMapper.selectById(id);
        if (role == null) {
            throw new RuntimeException("角色不存在");
        }
        return toVoWithMenus(role);
    }

    @Transactional
    public RoleVO create(Long operatorId, RoleSaveRequest req) {
        authService.requireSuperAdmin(operatorId);
        String code = req.getCode().trim().toUpperCase();
        if (AppPermissionUtil.ROLE_SUPER_ADMIN.equals(code)) {
            throw new RuntimeException("不可创建超管角色编码");
        }
        if (findByCode(code) != null) {
            throw new RuntimeException("角色编码已存在");
        }
        SysRole role = new SysRole();
        role.setCode(code);
        role.setName(req.getName().trim());
        role.setRemark(req.getRemark());
        role.setStatus(req.getStatus() != null ? req.getStatus() : 1);
        role.setCreatedAt(LocalDateTime.now());
        role.setUpdatedAt(LocalDateTime.now());
        roleMapper.insert(role);
        replaceMenus(role.getId(), req.getMenuIds());
        return toVoWithMenus(role);
    }

    @Transactional
    public RoleVO update(Long operatorId, Long id, RoleSaveRequest req) {
        authService.requireSuperAdmin(operatorId);
        SysRole role = roleMapper.selectById(id);
        if (role == null) {
            throw new RuntimeException("角色不存在");
        }
        if (AppPermissionUtil.ROLE_SUPER_ADMIN.equals(role.getCode())) {
            // 超管固定拥有全部菜单，仅允许改名称备注
            if (StringUtils.hasText(req.getName())) {
                role.setName(req.getName().trim());
            }
            role.setRemark(req.getRemark());
            role.setUpdatedAt(LocalDateTime.now());
            roleMapper.updateById(role);
            return toVoWithMenus(role);
        }
        if (StringUtils.hasText(req.getName())) {
            role.setName(req.getName().trim());
        }
        role.setRemark(req.getRemark());
        if (req.getStatus() != null) {
            role.setStatus(req.getStatus());
        }
        role.setUpdatedAt(LocalDateTime.now());
        roleMapper.updateById(role);
        if (req.getMenuIds() != null) {
            replaceMenus(role.getId(), req.getMenuIds());
        }
        return toVoWithMenus(role);
    }

    @Transactional
    public void delete(Long operatorId, Long id) {
        authService.requireSuperAdmin(operatorId);
        SysRole role = roleMapper.selectById(id);
        if (role == null) {
            throw new RuntimeException("角色不存在");
        }
        if (AppPermissionUtil.ROLE_SUPER_ADMIN.equals(role.getCode())
                || AppPermissionUtil.ROLE_USER.equals(role.getCode())
                || AppPermissionUtil.ROLE_INSPECTOR.equals(role.getCode())) {
            throw new RuntimeException("系统内置角色不可删除");
        }
        Long used = userMapper.selectCount(new LambdaQueryWrapper<SysUser>().eq(SysUser::getRole, role.getCode()));
        if (used != null && used > 0) {
            throw new RuntimeException("仍有用户使用该角色，无法删除");
        }
        roleMenuMapper.delete(new LambdaQueryWrapper<SysRoleMenu>().eq(SysRoleMenu::getRoleId, id));
        roleMapper.deleteById(id);
    }

    public boolean isKnownRoleCode(String code) {
        if (!StringUtils.hasText(code)) {
            return false;
        }
        if (AppPermissionUtil.isValidRole(code)) {
            return true;
        }
        return findByCode(code.trim()) != null;
    }

    private void replaceMenus(Long roleId, List<Long> menuIds) {
        roleMenuMapper.delete(new LambdaQueryWrapper<SysRoleMenu>().eq(SysRoleMenu::getRoleId, roleId));
        if (menuIds == null || menuIds.isEmpty()) {
            return;
        }
        for (Long menuId : menuIds) {
            if (menuId == null) {
                continue;
            }
            SysRoleMenu rm = new SysRoleMenu();
            rm.setRoleId(roleId);
            rm.setMenuId(menuId);
            roleMenuMapper.insert(rm);
        }
    }

    private SysRole findByCode(String code) {
        return roleMapper.selectOne(new LambdaQueryWrapper<SysRole>()
                .eq(SysRole::getCode, code).last("LIMIT 1"));
    }

    private RoleVO toVoWithMenus(SysRole role) {
        RoleVO vo = toVo(role);
        List<Long> menuIds = roleMenuMapper.selectList(new LambdaQueryWrapper<SysRoleMenu>()
                        .eq(SysRoleMenu::getRoleId, role.getId()))
                .stream()
                .map(SysRoleMenu::getMenuId)
                .collect(Collectors.toList());
        vo.setMenuIds(menuIds);
        return vo;
    }

    private RoleVO toVo(SysRole role) {
        RoleVO vo = new RoleVO();
        vo.setId(role.getId());
        vo.setCode(role.getCode());
        vo.setName(role.getName());
        vo.setRemark(role.getRemark());
        vo.setStatus(role.getStatus());
        vo.setMenuIds(new ArrayList<>());
        return vo;
    }
}
