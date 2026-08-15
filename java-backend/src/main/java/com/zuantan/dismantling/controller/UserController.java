package com.zuantan.dismantling.controller;

import com.zuantan.dismantling.common.Result;
import com.zuantan.dismantling.dto.LoginResponse;
import com.zuantan.dismantling.dto.UserCreateRequest;
import com.zuantan.dismantling.dto.UserUpdateRequest;
import com.zuantan.dismantling.service.UserService;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public Result<List<LoginResponse.UserInfo>> list(HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            return Result.success(userService.listUsers(userId));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping
    public Result<LoginResponse.UserInfo> create(@Valid @RequestBody UserCreateRequest body,
                                                 HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            return Result.success(userService.createUser(userId, body));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public Result<LoginResponse.UserInfo> update(@PathVariable Long id,
                                                 @RequestBody UserUpdateRequest body,
                                                 HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            return Result.success(userService.updateUser(userId, id, body));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }
}
