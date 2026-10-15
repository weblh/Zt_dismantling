package com.zuantan.dismantling.controller;

import com.zuantan.dismantling.common.Result;
import com.zuantan.dismantling.dto.MenuAccessPaths;
import com.zuantan.dismantling.dto.MenuSaveRequest;
import com.zuantan.dismantling.dto.MenuVO;
import com.zuantan.dismantling.service.MenuService;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/menus")
public class MenuController {

    private final MenuService menuService;

    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    /** 当前用户侧栏菜单 */
    @GetMapping("/my")
    public Result<List<MenuVO>> my(HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            return Result.success(menuService.listMyMenus(userId));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    /** 路由守卫用的路径白名单 */
    @GetMapping("/access-paths")
    public Result<MenuAccessPaths> accessPaths(HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            return Result.success(menuService.getAccessPaths(userId));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    /** 全量菜单树（管理用） */
    @GetMapping("/tree")
    public Result<List<MenuVO>> tree(@RequestParam(defaultValue = "false") boolean onlyEnabled) {
        return Result.success(menuService.listTree(onlyEnabled));
    }

    @PostMapping
    public Result<MenuVO> create(@Valid @RequestBody MenuSaveRequest body, HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            return Result.success(menuService.create(userId, body));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public Result<MenuVO> update(@PathVariable Long id,
                                 @Valid @RequestBody MenuSaveRequest body,
                                 HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            return Result.success(menuService.update(userId, id, body));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id, HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            menuService.delete(userId, id);
            return Result.success("已删除", null);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }
}
