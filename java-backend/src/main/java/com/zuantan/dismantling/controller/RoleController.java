package com.zuantan.dismantling.controller;

import com.zuantan.dismantling.common.Result;
import com.zuantan.dismantling.dto.RoleSaveRequest;
import com.zuantan.dismantling.dto.RoleVO;
import com.zuantan.dismantling.service.RoleService;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    @GetMapping
    public Result<List<RoleVO>> list(HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            return Result.success(roleService.list(userId));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/assignable")
    public Result<List<RoleVO>> assignable(HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            return Result.success(roleService.listAssignable(userId));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public Result<RoleVO> get(@PathVariable Long id, HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            return Result.success(roleService.get(userId, id));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping
    public Result<RoleVO> create(@Valid @RequestBody RoleSaveRequest body, HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            return Result.success(roleService.create(userId, body));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public Result<RoleVO> update(@PathVariable Long id,
                                 @RequestBody RoleSaveRequest body,
                                 HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            return Result.success(roleService.update(userId, id, body));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id, HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            roleService.delete(userId, id);
            return Result.success("已删除", null);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }
}
