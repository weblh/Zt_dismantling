package com.zuantan.dismantling.service;

import cn.hutool.crypto.digest.BCrypt;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zuantan.dismantling.dto.LoginResponse;
import com.zuantan.dismantling.entity.SysUser;
import com.zuantan.dismantling.mapper.SysUserMapper;
import com.zuantan.dismantling.util.AppPermissionUtil;
import com.zuantan.dismantling.util.JwtUtil;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * 钉钉扫码登录 + 工作台免登，统一签发本系统 JWT。
 */
@Service
public class DingTalkAuthService {

    private static final Logger log = LoggerFactory.getLogger(DingTalkAuthService.class);
    private static final MediaType JSON_TYPE = MediaType.parse("application/json; charset=utf-8");
    private static final String USER_TOKEN_URL = "https://api.dingtalk.com/v1.0/oauth2/userAccessToken";
    private static final String USER_ME_URL = "https://api.dingtalk.com/v1.0/contact/users/me";
    private static final String APP_TOKEN_URL = "https://api.dingtalk.com/v1.0/oauth2/accessToken";
    private static final String GET_USERINFO_URL = "https://oapi.dingtalk.com/topapi/v2/user/getuserinfo";
    private static final String GET_USER_URL = "https://oapi.dingtalk.com/topapi/v2/user/get";

    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build();

    private final SysUserMapper userMapper;
    private final JwtUtil jwtUtil;
    private final AuthService authService;

    /** state -> createdAtMs，防 CSRF，5 分钟有效 */
    private final ConcurrentHashMap<String, Long> qrStates = new ConcurrentHashMap<>();

    @Value("${dingtalk.stream.client-id:}")
    private String clientId;

    @Value("${dingtalk.stream.client-secret:}")
    private String clientSecret;

    @Value("${dingtalk.corp-id:${jiandaoyun.corp-id:}}")
    private String corpId;

    @Value("${dingtalk.login.redirect-uri:}")
    private String redirectUri;

    @Value("${dingtalk.login.frontend-callback:}")
    private String frontendCallback;

    public DingTalkAuthService(SysUserMapper userMapper, JwtUtil jwtUtil, AuthService authService) {
        this.userMapper = userMapper;
        this.jwtUtil = jwtUtil;
        this.authService = authService;
    }

    public Map<String, Object> buildQrConfig() {
        if (!StringUtils.hasText(clientId)) {
            throw new RuntimeException("未配置钉钉 Client ID（dingtalk.stream.client-id）");
        }
        cleanupStates();
        String state = UUID.randomUUID().toString().replace("-", "");
        qrStates.put(state, System.currentTimeMillis());

        String cb = StringUtils.hasText(redirectUri) ? redirectUri : frontendCallback;
        if (!StringUtils.hasText(cb)) {
            cb = "http://localhost:5173/login";
        }

        String authUrl = "https://login.dingtalk.com/oauth2/auth"
                + "?client_id=" + urlEncode(clientId)
                + "&response_type=code"
                + "&scope=" + urlEncode("openid corpid")
                + "&state=" + state
                + "&prompt=consent"
                + "&redirect_uri=" + urlEncode(cb);

        Map<String, Object> map = new HashMap<>();
        map.put("clientId", clientId);
        map.put("corpId", corpId);
        map.put("state", state);
        map.put("redirectUri", cb);
        map.put("authUrl", authUrl);
        return map;
    }

    /** 扫码/OAuth 回调：用 authorization code 换用户并签发 JWT */
    public LoginResponse loginByOauthCode(String code, String state) {
        if (!StringUtils.hasText(code)) {
            throw new RuntimeException("缺少授权码 code");
        }
        if (StringUtils.hasText(state)) {
            Long created = qrStates.remove(state);
            if (created == null || System.currentTimeMillis() - created > 5 * 60 * 1000L) {
                log.warn("钉钉扫码 state 无效或过期: {}", state);
            }
        }
        JSONObject userToken = exchangeUserAccessToken(code);
        String accessToken = userToken.getString("accessToken");
        JSONObject me = fetchUserMe(accessToken);
        return issueLogin(me.getString("openId"), me.getString("unionId"),
                me.getString("nick"), me.getString("avatarUrl"), null);
    }

    /**
     * 钉钉工作台免登：前端 JSAPI 拿到 authCode 后调用。
     * 优先用企业内部 getuserinfo（拿到 userid），失败再走 OAuth userAccessToken。
     */
    public LoginResponse loginByFreeCode(String authCode) {
        if (!StringUtils.hasText(authCode)) {
            throw new RuntimeException("缺少免登 authCode");
        }
        try {
            JSONObject info = getUserInfoByAuthCode(authCode);
            String userid = info.getString("userid");
            if (!StringUtils.hasText(userid)) {
                throw new RuntimeException("未获取到钉钉 userid");
            }
            JSONObject detail = getUserDetail(userid);
            String name = detail != null ? detail.getString("name") : userid;
            String avatar = detail != null ? detail.getString("avatar") : null;
            String unionId = detail != null ? detail.getString("unionid") : null;
            String deptIds = null;
            if (detail != null && detail.getJSONArray("dept_id_list") != null) {
                deptIds = detail.getJSONArray("dept_id_list").toJSONString();
            }
            return issueLogin(userid, unionId, name, avatar, deptIds);
        } catch (Exception e) {
            log.warn("企业内部免登失败，尝试 OAuth userToken: {}", e.getMessage());
            JSONObject userToken = exchangeUserAccessToken(authCode);
            String accessToken = userToken.getString("accessToken");
            JSONObject me = fetchUserMe(accessToken);
            return issueLogin(me.getString("openId"), me.getString("unionId"),
                    me.getString("nick"), me.getString("avatarUrl"), null);
        }
    }

    private LoginResponse issueLogin(String dingtalkUserId, String unionId, String nickname,
                                     String avatar, String deptIds) {
        if (!StringUtils.hasText(dingtalkUserId)) {
            throw new RuntimeException("钉钉用户标识为空");
        }
        SysUser user = findOrCreateByDingTalk(dingtalkUserId, unionId, nickname, avatar, deptIds);
        if (user.getStatus() == null || user.getStatus() != 1) {
            throw new RuntimeException("用户已禁用");
        }
        LoginResponse response = new LoginResponse();
        response.setToken(jwtUtil.generateToken(user.getId(), user.getUsername()));
        LoginResponse.UserInfo info = authService.toUserInfo(user);
        info.setDingtalkUserId(user.getDingtalkUserid());
        info.setAvatar(user.getAvatar());
        response.setUser(info);
        return response;
    }

    private SysUser findOrCreateByDingTalk(String dingtalkUserId, String unionId, String nickname,
                                           String avatar, String deptIds) {
        LambdaQueryWrapper<SysUser> byDing = new LambdaQueryWrapper<>();
        byDing.eq(SysUser::getDingtalkUserid, dingtalkUserId);
        SysUser user = userMapper.selectOne(byDing);
        if (user == null && StringUtils.hasText(unionId)) {
            LambdaQueryWrapper<SysUser> byUnion = new LambdaQueryWrapper<>();
            byUnion.eq(SysUser::getDingtalkUnionid, unionId);
            user = userMapper.selectOne(byUnion);
        }
        LocalDateTime now = LocalDateTime.now();
        if (user == null) {
            user = new SysUser();
            String username = "ding_" + dingtalkUserId;
            if (username.length() > 60) {
                username = username.substring(0, 60);
            }
            user.setUsername(username);
            user.setPassword(BCrypt.hashpw(UUID.randomUUID().toString(), BCrypt.gensalt()));
            user.setNickname(StringUtils.hasText(nickname) ? nickname : username);
            user.setRole(AppPermissionUtil.ROLE_USER);
            user.setAppPermissions("receipt");
            user.setStatus(1);
            user.setDingtalkUserid(dingtalkUserId);
            user.setDingtalkUnionid(unionId);
            user.setAvatar(avatar);
            user.setDeptIds(deptIds);
            user.setCreatedAt(now);
            user.setUpdatedAt(now);
            userMapper.insert(user);
            log.info("钉钉用户自动建档: userid={}, username={}", dingtalkUserId, username);
            return user;
        }
        boolean changed = false;
        if (!StringUtils.hasText(user.getDingtalkUserid())) {
            user.setDingtalkUserid(dingtalkUserId);
            changed = true;
        }
        if (StringUtils.hasText(unionId) && !unionId.equals(user.getDingtalkUnionid())) {
            user.setDingtalkUnionid(unionId);
            changed = true;
        }
        if (StringUtils.hasText(nickname) && !nickname.equals(user.getNickname())) {
            user.setNickname(nickname);
            changed = true;
        }
        if (StringUtils.hasText(avatar) && !avatar.equals(user.getAvatar())) {
            user.setAvatar(avatar);
            changed = true;
        }
        if (StringUtils.hasText(deptIds) && !deptIds.equals(user.getDeptIds())) {
            user.setDeptIds(deptIds);
            changed = true;
        }
        if (changed) {
            user.setUpdatedAt(now);
            userMapper.updateById(user);
        }
        return user;
    }

    private JSONObject exchangeUserAccessToken(String code) {
        if (!StringUtils.hasText(clientId) || !StringUtils.hasText(clientSecret)) {
            throw new RuntimeException("未配置钉钉 Client ID/Secret");
        }
        JSONObject body = new JSONObject();
        body.put("clientId", clientId);
        body.put("clientSecret", clientSecret);
        body.put("code", code);
        body.put("grantType", "authorization_code");
        try {
            Request request = new Request.Builder()
                    .url(USER_TOKEN_URL)
                    .post(RequestBody.create(body.toJSONString(), JSON_TYPE))
                    .addHeader("Content-Type", "application/json")
                    .build();
            try (Response response = httpClient.newCall(request).execute()) {
                String resp = response.body() != null ? response.body().string() : "";
                if (!response.isSuccessful()) {
                    throw new RuntimeException("换取钉钉用户Token失败: " + resp);
                }
                JSONObject json = JSON.parseObject(resp);
                if (json == null || !StringUtils.hasText(json.getString("accessToken"))) {
                    throw new RuntimeException("换取钉钉用户Token失败: " + resp);
                }
                return json;
            }
        } catch (IOException e) {
            throw new RuntimeException("换取钉钉用户Token异常: " + e.getMessage(), e);
        }
    }

    private JSONObject fetchUserMe(String userAccessToken) {
        try {
            Request request = new Request.Builder()
                    .url(USER_ME_URL)
                    .get()
                    .addHeader("x-acs-dingtalk-access-token", userAccessToken)
                    .build();
            try (Response response = httpClient.newCall(request).execute()) {
                String resp = response.body() != null ? response.body().string() : "";
                if (!response.isSuccessful()) {
                    throw new RuntimeException("获取钉钉用户信息失败: " + resp);
                }
                JSONObject json = JSON.parseObject(resp);
                if (json == null) {
                    throw new RuntimeException("获取钉钉用户信息为空");
                }
                return json;
            }
        } catch (IOException e) {
            throw new RuntimeException("获取钉钉用户信息异常: " + e.getMessage(), e);
        }
    }

    private String getAppAccessToken() throws IOException {
        JSONObject body = new JSONObject();
        body.put("appKey", clientId);
        body.put("appSecret", clientSecret);
        Request request = new Request.Builder()
                .url(APP_TOKEN_URL)
                .post(RequestBody.create(body.toJSONString(), JSON_TYPE))
                .addHeader("Content-Type", "application/json")
                .build();
        try (Response response = httpClient.newCall(request).execute()) {
            String resp = response.body() != null ? response.body().string() : "";
            if (!response.isSuccessful()) {
                throw new IOException("获取应用Token失败: " + resp);
            }
            JSONObject json = JSON.parseObject(resp);
            String token = json != null ? json.getString("accessToken") : null;
            if (!StringUtils.hasText(token)) {
                throw new IOException("应用Token为空: " + resp);
            }
            return token;
        }
    }

    private JSONObject getUserInfoByAuthCode(String authCode) throws IOException {
        String accessToken = getAppAccessToken();
        JSONObject body = new JSONObject();
        body.put("code", authCode);
        String url = GET_USERINFO_URL + "?access_token=" + urlEncode(accessToken);
        Request request = new Request.Builder()
                .url(url)
                .post(RequestBody.create(body.toJSONString(), JSON_TYPE))
                .addHeader("Content-Type", "application/json")
                .build();
        try (Response response = httpClient.newCall(request).execute()) {
            String resp = response.body() != null ? response.body().string() : "";
            JSONObject json = JSON.parseObject(resp);
            if (json == null || json.getIntValue("errcode") != 0) {
                throw new IOException("getuserinfo 失败: " + resp);
            }
            return json.getJSONObject("result");
        }
    }

    private JSONObject getUserDetail(String userid) throws IOException {
        String accessToken = getAppAccessToken();
        JSONObject body = new JSONObject();
        body.put("userid", userid);
        String url = GET_USER_URL + "?access_token=" + urlEncode(accessToken);
        Request request = new Request.Builder()
                .url(url)
                .post(RequestBody.create(body.toJSONString(), JSON_TYPE))
                .addHeader("Content-Type", "application/json")
                .build();
        try (Response response = httpClient.newCall(request).execute()) {
            String resp = response.body() != null ? response.body().string() : "";
            JSONObject json = JSON.parseObject(resp);
            if (json == null || json.getIntValue("errcode") != 0) {
                log.warn("获取钉钉用户详情失败: {}", resp);
                return null;
            }
            return json.getJSONObject("result");
        }
    }

    private void cleanupStates() {
        long now = System.currentTimeMillis();
        qrStates.entrySet().removeIf(e -> now - e.getValue() > 5 * 60 * 1000L);
    }

    private static String urlEncode(String s) {
        try {
            return URLEncoder.encode(s, StandardCharsets.UTF_8.name());
        } catch (Exception e) {
            return s;
        }
    }
}
