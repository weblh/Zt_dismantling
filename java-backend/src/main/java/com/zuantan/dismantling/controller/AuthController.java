package com.zuantan.dismantling.controller;

import com.zuantan.dismantling.common.Result;
import com.zuantan.dismantling.dto.DashboardExchangeRequest;
import com.zuantan.dismantling.dto.LoginRequest;
import com.zuantan.dismantling.dto.LoginResponse;
import com.zuantan.dismantling.dto.PhoneActivateRequest;
import com.zuantan.dismantling.dto.PhoneLoginRequest;
import com.zuantan.dismantling.dto.WechatBindRequest;
import com.zuantan.dismantling.dto.WechatLoginRequest;
import com.zuantan.dismantling.service.AuthService;
import com.zuantan.dismantling.service.DingTalkAuthService;
import com.zuantan.dismantling.service.WeChatAuthService;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final DingTalkAuthService dingTalkAuthService;
    private final WeChatAuthService weChatAuthService;

    public AuthController(AuthService authService,
                          DingTalkAuthService dingTalkAuthService,
                          WeChatAuthService weChatAuthService) {
        this.authService = authService;
        this.dingTalkAuthService = dingTalkAuthService;
        this.weChatAuthService = weChatAuthService;
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

    /** 小程序：手机号密码登录 */
    @PostMapping("/phone-login")
    public Result<LoginResponse> phoneLogin(@Valid @RequestBody PhoneLoginRequest request) {
        try {
            return Result.success(authService.loginByPhone(request));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    /** 小程序：钉钉同步账号首次激活 / 自助设密 */
    @PostMapping("/phone-activate")
    public Result<LoginResponse> phoneActivate(@Valid @RequestBody PhoneActivateRequest request) {
        try {
            return Result.success(authService.activateByPhone(request));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    /** 微信小程序 code 登录（需已绑定 openid） */
    @PostMapping("/wechat/login")
    public Result<LoginResponse> wechatLogin(@Valid @RequestBody WechatLoginRequest request) {
        try {
            return Result.success(weChatAuthService.loginByCode(request.getCode()));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    /** 微信小程序绑定已有账号并登录 */
    @PostMapping("/wechat/bind")
    public Result<LoginResponse> wechatBind(@Valid @RequestBody WechatBindRequest request) {
        try {
            return Result.success(weChatAuthService.bindAndLogin(request));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    /** 已登录用户绑定当前微信（需 JWT） */
    @PostMapping("/wechat/bind-current")
    public Result<LoginResponse> wechatBindCurrent(@Valid @RequestBody WechatLoginRequest request,
                                                   HttpServletRequest httpRequest) {
        try {
            Long userId = (Long) httpRequest.getAttribute("userId");
            if (userId == null) {
                return Result.error(401, "未登录");
            }
            return Result.success(weChatAuthService.bindCurrentUser(userId, request.getCode()));
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
