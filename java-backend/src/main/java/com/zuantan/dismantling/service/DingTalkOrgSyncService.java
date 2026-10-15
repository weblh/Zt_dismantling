package com.zuantan.dismantling.service;

import cn.hutool.crypto.digest.BCrypt;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.zuantan.dismantling.dto.OrgSyncResult;
import com.zuantan.dismantling.entity.SysDept;
import com.zuantan.dismantling.entity.SysUser;
import com.zuantan.dismantling.mapper.SysDeptMapper;
import com.zuantan.dismantling.mapper.SysUserMapper;
import com.zuantan.dismantling.util.AppPermissionUtil;
import com.zuantan.dismantling.util.PhoneUtil;
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
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * 从钉钉通讯录拉取部门树与人员，写入本地 sys_dept / sys_user。
 */
@Service
public class DingTalkOrgSyncService {

    private static final Logger log = LoggerFactory.getLogger(DingTalkOrgSyncService.class);
    private static final MediaType JSON_TYPE = MediaType.parse("application/json; charset=utf-8");
    private static final String APP_TOKEN_URL = "https://api.dingtalk.com/v1.0/oauth2/accessToken";
    private static final String LIST_SUB_URL = "https://oapi.dingtalk.com/topapi/v2/department/listsub";
    /** 获取部门用户完整信息（分页）；注意：不存在 topapi/v2/user/listid */
    private static final String USER_LIST_URL = "https://oapi.dingtalk.com/topapi/v2/user/list";
    private static final String USER_GET_URL = "https://oapi.dingtalk.com/topapi/v2/user/get";
    private static final long ROOT_DEPT_ID = 1L;
    private static final int USER_PAGE_SIZE = 100;

    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .build();

    private final SysDeptMapper deptMapper;
    private final SysUserMapper userMapper;

    @Value("${dingtalk.stream.client-id:}")
    private String clientId;

    @Value("${dingtalk.stream.client-secret:}")
    private String clientSecret;

    public DingTalkOrgSyncService(SysDeptMapper deptMapper, SysUserMapper userMapper) {
        this.deptMapper = deptMapper;
        this.userMapper = userMapper;
    }

    public OrgSyncResult syncAll(boolean syncUsers) {
        if (!StringUtils.hasText(clientId) || !StringUtils.hasText(clientSecret)) {
            throw new RuntimeException("未配置钉钉 Client ID/Secret（dingtalk.stream.client-id/secret）");
        }
        try {
            String token = getAppAccessToken();
            List<JSONObject> remoteDepts = fetchAllDepartments(token);
            OrgSyncResult result = upsertDepartments(remoteDepts);
            if (syncUsers) {
                syncUsersFromDepartments(token, remoteDepts, result);
                if (result.getUserUpserted() == 0 && result.getUserSkipped() == 0) {
                    throw new IOException(
                            "未拉取到任何人员。请确认钉钉应用已开通「通讯录部门成员读权限」「成员信息读权限」"
                                    + "（含手机号字段），并点击「同步部门+人员」");
                }
            }
            result.setMessage(String.format(
                    "部门更新 %d，停用 %d；用户更新 %d，跳过 %d",
                    result.getDeptUpserted(), result.getDeptDisabled(),
                    result.getUserUpserted(), result.getUserSkipped()));
            log.info("钉钉组织同步完成: {}", result.getMessage());
            return result;
        } catch (IOException e) {
            throw new RuntimeException("钉钉组织同步失败: " + e.getMessage(), e);
        }
    }

    private List<JSONObject> fetchAllDepartments(String token) throws IOException {
        List<JSONObject> all = new ArrayList<>();
        Set<Long> visited = new HashSet<>();
        Queue<Long> queue = new ArrayDeque<>();
        queue.add(ROOT_DEPT_ID);
        visited.add(ROOT_DEPT_ID);

        // 根部门本身不在 listsub 结果里，补一条
        JSONObject root = new JSONObject();
        root.put("dept_id", ROOT_DEPT_ID);
        root.put("name", "根部门");
        root.put("parent_id", 0L);
        all.add(root);

        while (!queue.isEmpty()) {
            Long parentId = queue.poll();
            List<JSONObject> children = listSubDepartments(token, parentId);
            for (JSONObject child : children) {
                Long deptId = child.getLong("dept_id");
                if (deptId == null || !visited.add(deptId)) {
                    continue;
                }
                all.add(child);
                queue.add(deptId);
            }
        }
        return all;
    }

    private OrgSyncResult upsertDepartments(List<JSONObject> remoteDepts) {
        OrgSyncResult result = new OrgSyncResult();
        LocalDateTime now = LocalDateTime.now();
        Map<Long, Long> dingToLocalId = new HashMap<>();

        // 先按钉钉 id upsert，父级本地 id 第二轮回填
        Set<Long> seenDingIds = new HashSet<>();
        int upserted = 0;
        for (JSONObject remote : remoteDepts) {
            Long dingId = remote.getLong("dept_id");
            if (dingId == null) {
                continue;
            }
            seenDingIds.add(dingId);
            String name = remote.getString("name");
            Long dingParentId = remote.getLong("parent_id");
            if (dingParentId == null) {
                dingParentId = 0L;
            }

            SysDept existing = findByDingTalkDeptId(dingId);
            if (existing == null) {
                existing = new SysDept();
                existing.setDingtalkDeptId(dingId);
                existing.setCreatedAt(now);
            }
            existing.setName(StringUtils.hasText(name) ? name : String.valueOf(dingId));
            existing.setDingtalkParentId(dingParentId);
            existing.setSortOrder(remote.getInteger("order") != null ? remote.getInteger("order") : 0);
            existing.setStatus(1);
            existing.setSyncedAt(now);
            existing.setUpdatedAt(now);
            if (existing.getId() == null) {
                deptMapper.insert(existing);
            } else {
                deptMapper.updateById(existing);
            }
            dingToLocalId.put(dingId, existing.getId());
            upserted++;
        }

        // 回填 parent_id（根部门 parent 为 null，需用 UpdateWrapper 显式写入）
        for (JSONObject remote : remoteDepts) {
            Long dingId = remote.getLong("dept_id");
            Long dingParentId = remote.getLong("parent_id");
            if (dingId == null) {
                continue;
            }
            Long localId = dingToLocalId.get(dingId);
            if (localId == null) {
                continue;
            }
            Long localParentId = dingParentId != null && dingParentId > 0
                    ? dingToLocalId.get(dingParentId) : null;
            deptMapper.update(null, new LambdaUpdateWrapper<SysDept>()
                    .eq(SysDept::getId, localId)
                    .set(SysDept::getParentId, localParentId)
                    .set(SysDept::getUpdatedAt, now));
        }

        // 本次未出现的部门标记停用（保留历史）
        int disabled = 0;
        List<SysDept> locals = deptMapper.selectList(new LambdaQueryWrapper<>());
        for (SysDept local : locals) {
            if (local.getDingtalkDeptId() == null) {
                continue;
            }
            if (!seenDingIds.contains(local.getDingtalkDeptId())
                    && (local.getStatus() == null || local.getStatus() == 1)) {
                SysDept patch = new SysDept();
                patch.setId(local.getId());
                patch.setStatus(0);
                patch.setUpdatedAt(now);
                deptMapper.updateById(patch);
                disabled++;
            }
        }

        result.setDeptUpserted(upserted);
        result.setDeptDisabled(disabled);
        return result;
    }

    private void syncUsersFromDepartments(String token, List<JSONObject> remoteDepts, OrgSyncResult result)
            throws IOException {
        Set<String> processedUserIds = new HashSet<>();
        int upserted = 0;
        int skipped = 0;
        for (JSONObject dept : remoteDepts) {
            Long deptId = dept.getLong("dept_id");
            if (deptId == null) {
                continue;
            }
            List<JSONObject> members = listDepartmentUsers(token, deptId);
            for (JSONObject detail : members) {
                String userid = detail != null ? detail.getString("userid") : null;
                if (!StringUtils.hasText(userid) || !processedUserIds.add(userid)) {
                    continue;
                }
                try {
                    // list 接口有时不含手机号，补拉详情
                    if (!StringUtils.hasText(detail.getString("mobile"))) {
                        JSONObject full = getUserDetail(token, userid);
                        if (full != null) {
                            detail = full;
                        }
                    }
                    if (upsertUserFromDingTalk(detail)) {
                        upserted++;
                    } else {
                        skipped++;
                    }
                    Thread.sleep(30);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new IOException("同步用户被中断", ie);
                } catch (Exception e) {
                    log.warn("同步用户失败 userid={}: {}", userid, e.getMessage());
                    skipped++;
                }
            }
        }
        result.setUserUpserted(upserted);
        result.setUserSkipped(skipped);
    }

    /**
     * @return true 表示新建或更新成功
     */
    private boolean upsertUserFromDingTalk(JSONObject detail) {
        String userid = detail.getString("userid");
        if (!StringUtils.hasText(userid)) {
            return false;
        }
        String unionId = detail.getString("unionid");
        String name = detail.getString("name");
        String avatar = detail.getString("avatar");
        String phone = PhoneUtil.normalize(detail.getString("mobile"));
        String deptIds = null;
        JSONArray deptArr = detail.getJSONArray("dept_id_list");
        if (deptArr != null && !deptArr.isEmpty()) {
            deptIds = deptArr.toJSONString();
        }

        SysUser user = findUserByDingTalkUserId(userid);
        if (user == null && StringUtils.hasText(unionId)) {
            user = findUserByUnionId(unionId);
        }
        if (user == null && StringUtils.hasText(phone)) {
            user = findUserByPhone(phone);
        }

        LocalDateTime now = LocalDateTime.now();
        if (user == null) {
            user = new SysUser();
            String username = StringUtils.hasText(phone) && findUserByUsername(phone) == null
                    ? phone : ("ding_" + userid);
            if (username.length() > 60) {
                username = username.substring(0, 60);
            }
            user.setUsername(username);
            user.setPassword(BCrypt.hashpw(UUID.randomUUID().toString(), BCrypt.gensalt()));
            user.setNickname(StringUtils.hasText(name) ? name : username);
            user.setRole(AppPermissionUtil.ROLE_USER);
            user.setAppPermissions("receipt");
            user.setStatus(1);
            user.setDingtalkUserid(userid);
            user.setDingtalkUnionid(unionId);
            user.setPhone(phone);
            user.setAvatar(avatar);
            user.setDeptIds(deptIds);
            user.setCreatedAt(now);
            user.setUpdatedAt(now);
            userMapper.insert(user);
            return true;
        }

        boolean changed = false;
        if (!StringUtils.hasText(user.getDingtalkUserid())) {
            user.setDingtalkUserid(userid);
            changed = true;
        }
        if (StringUtils.hasText(unionId) && !unionId.equals(user.getDingtalkUnionid())) {
            user.setDingtalkUnionid(unionId);
            changed = true;
        }
        if (StringUtils.hasText(name) && !name.equals(user.getNickname())) {
            user.setNickname(name);
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
        if (StringUtils.hasText(phone) && !phone.equals(PhoneUtil.normalize(user.getPhone()))) {
            SysUser owner = findUserByPhone(phone);
            if (owner == null || owner.getId().equals(user.getId())) {
                user.setPhone(phone);
                changed = true;
            }
        }
        if (changed) {
            user.setUpdatedAt(now);
            userMapper.updateById(user);
        }
        return true;
    }

    private SysDept findByDingTalkDeptId(Long dingId) {
        return deptMapper.selectOne(new LambdaQueryWrapper<SysDept>()
                .eq(SysDept::getDingtalkDeptId, dingId).last("LIMIT 1"));
    }

    private SysUser findUserByDingTalkUserId(String userid) {
        return userMapper.selectOne(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getDingtalkUserid, userid).last("LIMIT 1"));
    }

    private SysUser findUserByUnionId(String unionId) {
        return userMapper.selectOne(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getDingtalkUnionid, unionId).last("LIMIT 1"));
    }

    private SysUser findUserByPhone(String phone) {
        return userMapper.selectOne(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getPhone, phone).last("LIMIT 1"));
    }

    private SysUser findUserByUsername(String username) {
        return userMapper.selectOne(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getUsername, username).last("LIMIT 1"));
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

    private List<JSONObject> listSubDepartments(String accessToken, Long deptId) throws IOException {
        JSONObject body = new JSONObject();
        body.put("dept_id", deptId);
        String url = LIST_SUB_URL + "?access_token=" + urlEncode(accessToken);
        Request request = new Request.Builder()
                .url(url)
                .post(RequestBody.create(body.toJSONString(), JSON_TYPE))
                .addHeader("Content-Type", "application/json")
                .build();
        try (Response response = httpClient.newCall(request).execute()) {
            String resp = response.body() != null ? response.body().string() : "";
            JSONObject json = JSON.parseObject(resp);
            if (json == null || json.getIntValue("errcode") != 0) {
                throw new IOException("department/listsub 失败: " + resp);
            }
            JSONArray result = json.getJSONArray("result");
            List<JSONObject> list = new ArrayList<>();
            if (result != null) {
                for (int i = 0; i < result.size(); i++) {
                    list.add(result.getJSONObject(i));
                }
            }
            return list;
        }
    }

    /** 分页获取部门下用户详情（topapi/v2/user/list） */
    private List<JSONObject> listDepartmentUsers(String accessToken, Long deptId) throws IOException {
        List<JSONObject> all = new ArrayList<>();
        long cursor = 0L;
        boolean hasMore = true;
        while (hasMore) {
            JSONObject body = new JSONObject();
            body.put("dept_id", deptId);
            body.put("cursor", cursor);
            body.put("size", USER_PAGE_SIZE);
            String url = USER_LIST_URL + "?access_token=" + urlEncode(accessToken);
            Request request = new Request.Builder()
                    .url(url)
                    .post(RequestBody.create(body.toJSONString(), JSON_TYPE))
                    .addHeader("Content-Type", "application/json")
                    .build();
            try (Response response = httpClient.newCall(request).execute()) {
                String resp = response.body() != null ? response.body().string() : "";
                JSONObject json = JSON.parseObject(resp);
                if (json == null || json.getIntValue("errcode") != 0) {
                    throw new IOException("user/list 失败 deptId=" + deptId + ": " + resp);
                }
                JSONObject result = json.getJSONObject("result");
                if (result == null) {
                    break;
                }
                JSONArray list = result.getJSONArray("list");
                if (list != null) {
                    for (int i = 0; i < list.size(); i++) {
                        JSONObject item = list.getJSONObject(i);
                        if (item != null) {
                            all.add(item);
                        }
                    }
                }
                hasMore = result.getBooleanValue("has_more");
                if (hasMore) {
                    Long next = result.getLong("next_cursor");
                    cursor = next != null ? next : cursor + USER_PAGE_SIZE;
                }
            }
        }
        return all;
    }

    private JSONObject getUserDetail(String accessToken, String userid) throws IOException {
        JSONObject body = new JSONObject();
        body.put("userid", userid);
        String url = USER_GET_URL + "?access_token=" + urlEncode(accessToken);
        Request request = new Request.Builder()
                .url(url)
                .post(RequestBody.create(body.toJSONString(), JSON_TYPE))
                .addHeader("Content-Type", "application/json")
                .build();
        try (Response response = httpClient.newCall(request).execute()) {
            String resp = response.body() != null ? response.body().string() : "";
            JSONObject json = JSON.parseObject(resp);
            if (json == null || json.getIntValue("errcode") != 0) {
                throw new IOException("user/get 失败 userid=" + userid + ": " + resp);
            }
            return json.getJSONObject("result");
        }
    }

    private static String urlEncode(String s) {
        try {
            return URLEncoder.encode(s, StandardCharsets.UTF_8.name());
        } catch (Exception e) {
            return s;
        }
    }
}
