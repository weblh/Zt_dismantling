package com.zuantan.dismantling.controller;

import com.zuantan.dismantling.common.Result;
import com.zuantan.dismantling.dto.DashboardExchangeRequest;
import com.zuantan.dismantling.dto.LoginRequest;
import com.zuantan.dismantling.dto.LoginResponse;
import com.zuantan.dismantling.service.AuthService;
import com.zuantan.dismantling.service.DingTalkAuthService;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final DingTalkAuthService dingTalkAuthService;

    public AuthController(AuthService authService, DingTalkAuthService dingTalkAuthService) {
        this.authService = authService;
        this.dingTalkAuthService = dingTalkAuthService;
    }

    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            return Result.success(authService.login(request));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/dashboard-exchange")
    public Result<LoginResponse> dashboardExchange(@Valid @RequestBody DashboardExchangeRequest request) {
        try {
            return Result.success(authService.dashboardExchange(request));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/logout")
    public Result<Void> logout() {
        return Result.success("退出成功", null);
    }

    /** 扫码登录配置（authUrl + state） */
    @GetMapping("/dingtalk/qr-config")
    public Result<Map<String, Object>> dingtalkQrConfig() {
        try {
            return Result.success(dingTalkAuthService.buildQrConfig());
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    /** 扫码 / OAuth 回调换票 */
    @PostMapping("/dingtalk/qr-callback")
    public Result<LoginResponse> dingtalkQrCallback(@RequestBody Map<String, String> body) {
        try {
            return Result.success(dingTalkAuthService.loginByOauthCode(
                    body.get("code"), body.get("state")));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    /** 钉钉工作台免登 */
    @PostMapping("/dingtalk/free-login")
    public Result<LoginResponse> dingtalkFreeLogin(@RequestBody Map<String, String> body) {
        try {
            return Result.success(dingTalkAuthService.loginByFreeCode(body.get("authCode")));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }
}
