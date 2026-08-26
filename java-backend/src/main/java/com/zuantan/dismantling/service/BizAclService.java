package com.zuantan.dismantling.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zuantan.dismantling.entity.BizFormAcl;
import com.zuantan.dismantling.entity.BizFormData;
import com.zuantan.dismantling.entity.SysUser;
import com.zuantan.dismantling.mapper.BizFormAclMapper;
import com.zuantan.dismantling.util.AppPermissionUtil;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * 表单 ACL：无规则时默认全员可读写（迁移期）；有规则则按 role/user 匹配。
 */
@Service
public class BizAclService {

    private final BizFormAclMapper aclMapper;

    public BizAclService(BizFormAclMapper aclMapper) {
        this.aclMapper = aclMapper;
    }

    public void requirePerm(Long formId, SysUser user, String perm) {
        if (AppPermissionUtil.isSuperAdmin(user.getRole())) {
            return;
        }
        List<BizFormAcl> rules = listRules(formId);
        if (rules.isEmpty()) {
            return;
        }
        for (BizFormAcl r : rules) {
            if (!matchesPrincipal(r, user)) {
                continue;
            }
            if (permEquals(r.getPerm(), perm) || "manage".equalsIgnoreCase(r.getPerm())) {
                return;
            }
        }
        throw new RuntimeException("无权限: " + perm);
    }

    public void applyDataScope(LambdaQueryWrapper<BizFormData> q, Long formId, SysUser user) {
        if (AppPermissionUtil.isSuperAdmin(user.getRole())) {
            return;
        }
        List<BizFormAcl> rules = listRules(formId);
        if (rules.isEmpty()) {
            return;
        }
        String scope = "all";
        for (BizFormAcl r : rules) {
            if (matchesPrincipal(r, user) && StringUtils.hasText(r.getDataScope())) {
                scope = r.getDataScope();
                break;
            }
        }
        if ("self".equalsIgnoreCase(scope)) {
            q.eq(BizFormData::getCreatorUserId, user.getId());
        } else if ("dept".equalsIgnoreCase(scope) && StringUtils.hasText(user.getDeptIds())) {
            q.like(BizFormData::getDeptIds, user.getDeptIds().replace("[", "").replace("]", "").split(",")[0].trim());
        }
    }

    public List<BizFormAcl> listRules(Long formId) {
        return aclMapper.selectList(new LambdaQueryWrapper<BizFormAcl>().eq(BizFormAcl::getFormId, formId));
    }

    public BizFormAcl saveRule(BizFormAcl rule) {
        if (rule.getId() == null) {
            aclMapper.insert(rule);
        } else {
            aclMapper.updateById(rule);
        }
        return rule;
    }

    public void deleteRule(Long id) {
        aclMapper.deleteById(id);
    }

    private boolean matchesPrincipal(BizFormAcl r, SysUser user) {
        String type = r.getPrincipalType();
        String pid = r.getPrincipalId();
        if ("all".equalsIgnoreCase(type)) {
            return true;
        }
        if ("role".equalsIgnoreCase(type)) {
            return pid != null && pid.equalsIgnoreCase(user.getRole());
        }
        if ("user".equalsIgnoreCase(type)) {
            return pid != null && (pid.equals(String.valueOf(user.getId()))
                    || pid.equals(user.getDingtalkUserid())
                    || pid.equals(user.getUsername()));
        }
        return false;
    }

    private boolean permEquals(String rulePerm, String need) {
        if (rulePerm == null) {
            return false;
        }
        if (rulePerm.equalsIgnoreCase(need)) {
            return true;
        }
        if ("write".equalsIgnoreCase(rulePerm)
                && ("create".equalsIgnoreCase(need) || "update".equalsIgnoreCase(need) || "delete".equalsIgnoreCase(need))) {
            return true;
        }
        if ("read".equalsIgnoreCase(need) && ("write".equalsIgnoreCase(rulePerm) || "manage".equalsIgnoreCase(rulePerm))) {
            return true;
        }
        return false;
    }
}
