package com.zuantan.dismantling.service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zuantan.dismantling.config.WeChatMiniProgramProperties;
import com.zuantan.dismantling.dto.LoginResponse;
import com.zuantan.dismantling.dto.WechatBindRequest;
import com.zuantan.dismantling.entity.SysUser;
import com.zuantan.dismantling.mapper.SysUserMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class WeChatAuthService {

    private static final Logger log = LoggerFactory.getLogger(WeChatAuthService.class);

    private final WeChatMiniProgramProperties properties;
    private final SysUserMapper userMapper;
    private final AuthService authService;
    private final RestTemplate restTemplate = new RestTemplate();

    public WeChatAuthService(WeChatMiniProgramProperties properties,
                             SysUserMapper userMapper,
                             AuthService authService) {
        this.properties = properties;
        this.userMapper = userMapper;
        this.authService = authService;
    }

    public LoginResponse loginByCode(String code) {
        String openid = resolveOpenId(code);
        SysUser user = findByOpenId(openid);
        if (user == null) {
            throw new RuntimeException("该微信尚未绑定系统账号，请先用账号密码登录并完成微信授权");
        }
        return authService.buildLoginResponse(user);
    }

    public LoginResponse bindAndLogin(WechatBindRequest request) {
        String openid = resolveOpenId(request.getCode());
        SysUser existing = findByOpenId(openid);
        if (existing != null) {
            return authService.buildLoginResponse(existing);
        }

        SysUser user = authService.requireActiveUserByPhone(request.getPhone(), request.getPassword());
        return bindOpenIdToUser(user, openid);
    }

    /** 已登录用户：用当前账号绑定微信 */
    public LoginResponse bindCurrentUser(Long userId, String code) {
        String openid = resolveOpenId(code);
        SysUser existing = findByOpenId(openid);
        if (existing != null) {
            if (existing.getId().equals(userId)) {
                return authService.buildLoginResponse(existing);
            }
            throw new RuntimeException("该微信已绑定其他系统账号");
        }
        SysUser user = authService.requireUser(userId);
        return bindOpenIdToUser(user, openid);
    }

    private LoginResponse bindOpenIdToUser(SysUser user, String openid) {
        if (user.getWechatOpenid() != null && !user.getWechatOpenid().trim().isEmpty()
                && !user.getWechatOpenid().equals(openid)) {
            throw new RuntimeException("该账号已绑定其他微信");
        }

        SysUser patch = new SysUser();
        patch.setId(user.getId());
        patch.setWechatOpenid(openid);
        userMapper.updateById(patch);

        user.setWechatOpenid(openid);
        return authService.buildLoginResponse(user);
    }

    private SysUser findByOpenId(String openid) {
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysUser::getWechatOpenid, openid).last("LIMIT 1");
        return userMapper.selectOne(wrapper);
    }

    private String resolveOpenId(String code) {
        if (!properties.isConfigured()) {
            throw new RuntimeException("微信小程序未配置，请在 application.yml 设置 wechat.mini-program.app-id 与 app-secret");
        }
        String url = String.format(
                "https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code",
                properties.getAppId(), properties.getAppSecret(), code);
        try {
            String body = restTemplate.getForObject(url, String.class);
            JSONObject json = JSON.parseObject(body);
            if (json == null) {
                throw new RuntimeException("微信登录失败：空响应");
            }
            if (json.getInteger("errcode") != null && json.getInteger("errcode") != 0) {
                String errmsg = json.getString("errmsg");
                if (errmsg != null && errmsg.toLowerCase().contains("invalid code")) {
                    throw new RuntimeException(
                            "微信登录失败：code 无效。请确认开发者工具非游客模式、AppID 为 "
                                    + properties.getAppId()
                                    + "，并重新编译后再试（或使用真机预览）");
                }
                throw new RuntimeException("微信登录失败：" + errmsg);
            }
            String openid = json.getString("openid");
            if (openid == null || openid.isEmpty()) {
                throw new RuntimeException("微信登录失败：未返回 openid");
            }
            return openid;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.warn("WeChat jscode2session failed", e);
            throw new RuntimeException("微信登录失败：" + e.getMessage());
        }
    }
}
