package com.zuantan.dismantling.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zuantan.dismantling.dto.MenuAccessPaths;
import com.zuantan.dismantling.dto.MenuSaveRequest;
import com.zuantan.dismantling.dto.MenuVO;
import com.zuantan.dismantling.entity.SysMenu;
import com.zuantan.dismantling.entity.SysRole;
import com.zuantan.dismantling.entity.SysRoleMenu;
import com.zuantan.dismantling.entity.SysUser;
import com.zuantan.dismantling.mapper.SysMenuMapper;
import com.zuantan.dismantling.mapper.SysRoleMapper;
import com.zuantan.dismantling.mapper.SysRoleMenuMapper;
import com.zuantan.dismantling.util.AppPermissionUtil;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class MenuService {

    private final SysMenuMapper menuMapper;
    private final SysRoleMapper roleMapper;
    private final SysRoleMenuMapper roleMenuMapper;
    private final AuthService authService;

    public MenuService(SysMenuMapper menuMapper,
                       SysRoleMapper roleMapper,
                       SysRoleMenuMapper roleMenuMapper,
                       AuthService authService) {
        this.menuMapper = menuMapper;
        this.roleMapper = roleMapper;
        this.roleMenuMapper = roleMenuMapper;
        this.authService = authService;
    }

    public List<MenuVO> listTree(boolean onlyEnabled) {
        ensureDictMenu();
        LambdaQueryWrapper<SysMenu> q = new LambdaQueryWrapper<SysMenu>()
                .orderByAsc(SysMenu::getSortOrder)
                .orderByAsc(SysMenu::getId);
        if (onlyEnabled) {
            q.eq(SysMenu::getStatus, 1);
        }
        return buildTree(menuMapper.selectList(q));
    }

    /** 当前登录用户可见菜单树（超管全部；其他角色按 sys_role_menu） */
    public List<MenuVO> listMyMenus(Long userId) {
        ensureDictMenu();
        SysUser user = authService.requireUser(userId);
        if (AppPermissionUtil.isSuperAdmin(user.getRole())) {
            return listTree(true).stream()
                    .map(this::filterVisible)
                    .filter(m -> m != null)
                    .collect(Collectors.toList());
        }
        Set<Long> allowed = resolveMenuIdsByRoleCode(user.getRole());
        if (allowed.isEmpty()) {
            return new ArrayList<>();
        }
        List<SysMenu> all = menuMapper.selectList(new LambdaQueryWrapper<SysMenu>()
                .eq(SysMenu::getStatus, 1)
                .orderByAsc(SysMenu::getSortOrder)
                .orderByAsc(SysMenu::getId));
        // 保留允许的节点及其祖先，否则树会断裂
        Set<Long> keep = new HashSet<>(allowed);
        Map<Long, SysMenu> byId = all.stream().collect(Collectors.toMap(SysMenu::getId, m -> m, (a, b) -> a));
        for (Long id : new HashSet<>(allowed)) {
            Long pid = byId.containsKey(id) ? byId.get(id).getParentId() : null;
            while (pid != null && pid > 0 && keep.add(pid)) {
                SysMenu parent = byId.get(pid);
                pid = parent != null ? parent.getParentId() : null;
            }
        }
        List<SysMenu> filtered = all.stream()
                .filter(m -> keep.contains(m.getId()))
                .collect(Collectors.toList());
        return buildTree(filtered).stream()
                .map(this::filterVisible)
                .filter(m -> m != null)
                .collect(Collectors.toList());
    }

    /** 路由守卫：allowed + 全库受保护 path */
    public MenuAccessPaths getAccessPaths(Long userId) {
        MenuAccessPaths result = new MenuAccessPaths();
        result.setProtectedPaths(collectRoutePaths(listTree(true)));
        result.setAllowedPaths(collectRoutePaths(listMyMenus(userId)));
        return result;
    }

    public MenuVO create(Long operatorId, MenuSaveRequest req) {
        authService.requireSuperAdmin(operatorId);
        SysMenu menu = fromRequest(req);
        menu.setCreatedAt(LocalDateTime.now());
        menu.setUpdatedAt(LocalDateTime.now());
        menuMapper.insert(menu);
        return toVo(menu);
    }

    public MenuVO update(Long operatorId, Long id, MenuSaveRequest req) {
        authService.requireSuperAdmin(operatorId);
        SysMenu menu = menuMapper.selectById(id);
        if (menu == null) {
            throw new RuntimeException("菜单不存在");
        }
        applyRequest(menu, req);
        menu.setUpdatedAt(LocalDateTime.now());
        menuMapper.updateById(menu);
        return toVo(menu);
    }

    public void delete(Long operatorId, Long id) {
        authService.requireSuperAdmin(operatorId);
        Long childCount = menuMapper.selectCount(new LambdaQueryWrapper<SysMenu>().eq(SysMenu::getParentId, id));
        if (childCount != null && childCount > 0) {
            throw new RuntimeException("请先删除子菜单");
        }
        roleMenuMapper.delete(new LambdaQueryWrapper<SysRoleMenu>().eq(SysRoleMenu::getMenuId, id));
        menuMapper.deleteById(id);
    }

    public Set<Long> resolveMenuIdsByRoleCode(String roleCode) {
        if (!StringUtils.hasText(roleCode)) {
            return new HashSet<>();
        }
        SysRole role = roleMapper.selectOne(new LambdaQueryWrapper<SysRole>()
                .eq(SysRole::getCode, roleCode)
                .eq(SysRole::getStatus, 1)
                .last("LIMIT 1"));
        if (role == null) {
            return new HashSet<>();
        }
        return roleMenuMapper.selectList(new LambdaQueryWrapper<SysRoleMenu>()
                        .eq(SysRoleMenu::getRoleId, role.getId()))
                .stream()
                .map(SysRoleMenu::getMenuId)
                .collect(Collectors.toSet());
    }

    private List<String> collectRoutePaths(List<MenuVO> tree) {
        List<String> paths = new ArrayList<>();
        collectRoutePathsRecursive(tree, paths);
        // 菜单 key 别名 → 真实路由
        if (paths.contains("recycle-certificate") || treeContainsPath(tree, "recycle-certificate")) {
            paths.add("/agriculture/recycle-certificate-ledger");
        }
        return paths.stream()
                .filter(p -> p != null && p.startsWith("/"))
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    private void collectRoutePathsRecursive(List<MenuVO> nodes, List<String> out) {
        if (nodes == null) {
            return;
        }
        for (MenuVO n : nodes) {
            if (StringUtils.hasText(n.getPath())) {
                out.add(n.getPath().trim());
            }
            collectRoutePathsRecursive(n.getChildren(), out);
        }
    }

    private boolean treeContainsPath(List<MenuVO> nodes, String path) {
        if (nodes == null) {
            return false;
        }
        for (MenuVO n : nodes) {
            if (path.equals(n.getPath())) {
                return true;
            }
            if (treeContainsPath(n.getChildren(), path)) {
                return true;
            }
        }
        return false;
    }

    private MenuVO filterVisible(MenuVO node) {
        if (node.getVisible() != null && node.getVisible() == 0) {
            return null;
        }
        if (node.getChildren() != null && !node.getChildren().isEmpty()) {
            List<MenuVO> kids = node.getChildren().stream()
                    .map(this::filterVisible)
                    .filter(m -> m != null)
                    .collect(Collectors.toList());
            node.setChildren(kids);
        }
        return node;
    }

    private List<MenuVO> buildTree(List<SysMenu> flat) {
        Map<Long, MenuVO> map = new HashMap<>();
        for (SysMenu m : flat) {
            map.put(m.getId(), toVo(m));
        }
        List<MenuVO> roots = new ArrayList<>();
        for (SysMenu m : flat) {
            MenuVO vo = map.get(m.getId());
            Long pid = m.getParentId() == null ? 0L : m.getParentId();
            if (pid > 0 && map.containsKey(pid)) {
                map.get(pid).getChildren().add(vo);
            } else {
                roots.add(vo);
            }
        }
        return roots;
    }

    private SysMenu fromRequest(MenuSaveRequest req) {
        SysMenu menu = new SysMenu();
        applyRequest(menu, req);
        return menu;
    }

    private void applyRequest(SysMenu menu, MenuSaveRequest req) {
        menu.setParentId(req.getParentId() == null ? 0L : req.getParentId());
        menu.setName(req.getName().trim());
        menu.setPath(StringUtils.hasText(req.getPath()) ? req.getPath().trim() : null);
        menu.setIcon(StringUtils.hasText(req.getIcon()) ? req.getIcon().trim() : null);
        String type = StringUtils.hasText(req.getMenuType()) ? req.getMenuType().trim().toUpperCase() : "M";
        menu.setMenuType("D".equals(type) ? "D" : "M");
        menu.setSortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0);
        menu.setVisible(req.getVisible() != null ? req.getVisible() : 1);
        menu.setStatus(req.getStatus() != null ? req.getStatus() : 1);
    }

    private MenuVO toVo(SysMenu m) {
        MenuVO vo = new MenuVO();
        vo.setId(m.getId());
        vo.setParentId(m.getParentId());
        vo.setName(m.getName());
        vo.setPath(m.getPath());
        vo.setIcon(m.getIcon());
        vo.setMenuType(m.getMenuType());
        vo.setSortOrder(m.getSortOrder());
        vo.setVisible(m.getVisible());
        vo.setStatus(m.getStatus());
        return vo;
    }

    /** 补齐「系统管理 → 字典管理」，避免仅代码更新未重启时侧栏缺失 */
    private void ensureDictMenu() {
        Long exists = menuMapper.selectCount(new LambdaQueryWrapper<SysMenu>()
                .eq(SysMenu::getPath, "/system/dicts"));
        if (exists != null && exists > 0) {
            return;
        }
        SysMenu system = menuMapper.selectOne(new LambdaQueryWrapper<SysMenu>()
                .eq(SysMenu::getPath, "system").last("LIMIT 1"));
        if (system == null) {
            return;
        }
        SysMenu m = new SysMenu();
        m.setParentId(system.getId());
        m.setName("字典管理");
        m.setPath("/system/dicts");
        m.setIcon("TagOutlined");
        m.setMenuType("M");
        m.setSortOrder(5);
        m.setVisible(1);
        m.setStatus(1);
        m.setCreatedAt(LocalDateTime.now());
        m.setUpdatedAt(LocalDateTime.now());
        menuMapper.insert(m);
    }
}
