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
    private static final String GET_BY_UNIONID_URL = "https://oapi.dingtalk.com/topapi/user/getbyunionid";

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

        // 网页扫码登录使用 scope=openid（官方「登录第三方网站」推荐）。
        // 若使用 openid corpid，须同时传 org_type 与 corpId，否则会授权失败。
        String authUrl = "https://login.dingtalk.com/oauth2/auth"
                + "?client_id=" + urlEncode(clientId)
                + "&response_type=code"
                + "&scope=" + urlEncode("openid")
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
        return issueLoginFromOauthProfile(me);
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
            String phone = normalizePhone(detail != null ? detail.getString("mobile") : null);
            String deptIds = null;
            if (detail != null && detail.getJSONArray("dept_id_list") != null) {
                deptIds = detail.getJSONArray("dept_id_list").toJSONString();
            }
            return issueLogin(userid, unionId, name, avatar, deptIds, phone);
        } catch (Exception e) {
            log.warn("企业内部免登失败，尝试 OAuth userToken: {}", e.getMessage());
            JSONObject userToken = exchangeUserAccessToken(authCode);
            String accessToken = userToken.getString("accessToken");
            JSONObject me = fetchUserMe(accessToken);
            return issueLoginFromOauthProfile(me);
        }
    }

    /**
     * OAuth 个人资料 → 尽量补齐企业通讯录手机号后签发 JWT。
     * contact/users/me 可能直接带 mobile；否则用 unionId 换企业内部 userid 再拉详情。
     */
    private LoginResponse issueLoginFromOauthProfile(JSONObject me) {
        String openId = me.getString("openId");
        String unionId = me.getString("unionId");
        String nickname = me.getString("nick");
        String avatar = me.getString("avatarUrl");
        String phone = normalizePhone(firstNonBlank(me.getString("mobile"), me.getString("phone")));
        String dingtalkUserId = openId;
        String deptIds = null;

        if (StringUtils.hasText(unionId)) {
            try {
                String corpUserId = getUserIdByUnionId(unionId);
                if (StringUtils.hasText(corpUserId)) {
                    dingtalkUserId = corpUserId;
                    JSONObject detail = getUserDetail(corpUserId);
                    if (detail != null) {
                        if (!StringUtils.hasText(phone)) {
                            phone = normalizePhone(detail.getString("mobile"));
                        }
                        if (!StringUtils.hasText(nickname)) {
                            nickname = detail.getString("name");
                        }
                        if (!StringUtils.hasText(avatar)) {
                            avatar = detail.getString("avatar");
                        }
                        if (detail.getJSONArray("dept_id_list") != null) {
                            deptIds = detail.getJSONArray("dept_id_list").toJSONString();
                        }
                    }
                }
            } catch (Exception ex) {
                log.warn("OAuth 后补拉企业通讯录失败(不影响登录): {}", ex.getMessage());
            }
        }
        return issueLogin(dingtalkUserId, unionId, nickname, avatar, deptIds, phone);
    }

    private LoginResponse issueLogin(String dingtalkUserId, String unionId, String nickname,
                                     String avatar, String deptIds, String phone) {
        if (!StringUtils.hasText(dingtalkUserId)) {
            throw new RuntimeException("钉钉用户标识为空");
        }
        SysUser user = findOrCreateByDingTalk(dingtalkUserId, unionId, nickname, avatar, deptIds, phone);
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

    /**
     * 钉钉身份落库：优先钉钉 userid / unionid，其次按手机号合并已有本地账号，避免 ding_* 与手工账号割裂。
     * 钉钉不会同步密码；小程序需使用后台为该用户设置的本地密码。
     */
    private SysUser findOrCreateByDingTalk(String dingtalkUserId, String unionId, String nickname,
                                           String avatar, String deptIds, String phone) {
        SysUser user = findByDingTalkUserId(dingtalkUserId);
        if (user == null && StringUtils.hasText(unionId)) {
            user = findByDingTalkUnionId(unionId);
        }
        if (user == null && StringUtils.hasText(phone)) {
            user = findByPhone(phone);
            if (user != null) {
                log.info("钉钉登录按手机号合并本地账号: phone={}, userId={}, username={}",
                        phone, user.getId(), user.getUsername());
            }
        }

        LocalDateTime now = LocalDateTime.now();
        if (user == null) {
            user = new SysUser();
            String username = resolveNewUsername(dingtalkUserId, phone);
            user.setUsername(username);
            user.setPassword(BCrypt.hashpw(UUID.randomUUID().toString(), BCrypt.gensalt()));
            user.setNickname(StringUtils.hasText(nickname) ? nickname : username);
            user.setRole(AppPermissionUtil.ROLE_USER);
            user.setAppPermissions("receipt");
            user.setStatus(1);
            user.setDingtalkUserid(dingtalkUserId);
            user.setDingtalkUnionid(unionId);
            user.setPhone(phone);
            user.setAvatar(avatar);
            user.setDeptIds(deptIds);
            user.setCreatedAt(now);
            user.setUpdatedAt(now);
            userMapper.insert(user);
            log.info("钉钉用户自动建档: userid={}, username={}, phone={}", dingtalkUserId, username, phone);
            return user;
        }

        boolean changed = false;
        if (!StringUtils.hasText(user.getDingtalkUserid())) {
            user.setDingtalkUserid(dingtalkUserId);
            changed = true;
        } else if (!dingtalkUserId.equals(user.getDingtalkUserid()) && looksLikeCorpUserId(dingtalkUserId)) {
            // 已有绑定：仅在拿到更可靠的企业 userid 时覆盖（避免 OAuth openId 覆盖企业 userid）
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
        if (StringUtils.hasText(phone) && !phone.equals(normalizePhone(user.getPhone()))) {
            SysUser phoneOwner = findByPhone(phone);
            if (phoneOwner == null || phoneOwner.getId().equals(user.getId())) {
                user.setPhone(phone);
                changed = true;
            } else {
                log.warn("钉钉手机号已被其他账号占用，跳过写入: phone={}, dingUserId={}, ownerUserId={}",
                        phone, user.getId(), phoneOwner.getId());
            }
        }
        if (changed) {
            user.setUpdatedAt(now);
            userMapper.updateById(user);
        }
        return user;
    }

    private SysUser findByDingTalkUserId(String dingtalkUserId) {
        LambdaQueryWrapper<SysUser> byDing = new LambdaQueryWrapper<>();
        byDing.eq(SysUser::getDingtalkUserid, dingtalkUserId).last("LIMIT 1");
        return userMapper.selectOne(byDing);
    }

    private SysUser findByDingTalkUnionId(String unionId) {
        LambdaQueryWrapper<SysUser> byUnion = new LambdaQueryWrapper<>();
        byUnion.eq(SysUser::getDingtalkUnionid, unionId).last("LIMIT 1");
        return userMapper.selectOne(byUnion);
    }

    private SysUser findByPhone(String phone) {
        if (!StringUtils.hasText(phone)) {
            return null;
        }
        LambdaQueryWrapper<SysUser> byPhone = new LambdaQueryWrapper<>();
        byPhone.eq(SysUser::getPhone, phone).last("LIMIT 1");
        return userMapper.selectOne(byPhone);
    }

    private String resolveNewUsername(String dingtalkUserId, String phone) {
        if (StringUtils.hasText(phone) && findByUsername(phone) == null) {
            return phone;
        }
        String username = "ding_" + dingtalkUserId;
        if (username.length() > 60) {
            username = username.substring(0, 60);
        }
        return username;
    }

    private SysUser findByUsername(String username) {
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysUser::getUsername, username).last("LIMIT 1");
        return userMapper.selectOne(wrapper);
    }

    /** 企业 userid 通常较短且不含特殊 OAuth openId 特征；有 corp 详情时优先写入 */
    private static boolean looksLikeCorpUserId(String id) {
        return StringUtils.hasText(id) && !id.contains("@") && id.length() <= 64;
    }

    static String normalizePhone(String raw) {
        return com.zuantan.dismantling.util.PhoneUtil.normalize(raw);
    }

    private static String firstNonBlank(String a, String b) {
        if (StringUtils.hasText(a)) {
            return a;
        }
        if (StringUtils.hasText(b)) {
            return b;
        }
        return null;
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

    private String getUserIdByUnionId(String unionId) throws IOException {
        String accessToken = getAppAccessToken();
        JSONObject body = new JSONObject();
        body.put("unionid", unionId);
        String url = GET_BY_UNIONID_URL + "?access_token=" + urlEncode(accessToken);
        Request request = new Request.Builder()
                .url(url)
                .post(RequestBody.create(body.toJSONString(), JSON_TYPE))
                .addHeader("Content-Type", "application/json")
                .build();
        try (Response response = httpClient.newCall(request).execute()) {
            String resp = response.body() != null ? response.body().string() : "";
            JSONObject json = JSON.parseObject(resp);
            if (json == null || json.getIntValue("errcode") != 0) {
                throw new IOException("getbyunionid 失败: " + resp);
            }
            JSONObject result = json.getJSONObject("result");
            return result != null ? result.getString("userid") : null;
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
