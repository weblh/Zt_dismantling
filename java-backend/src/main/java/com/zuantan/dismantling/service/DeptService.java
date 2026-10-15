package com.zuantan.dismantling.service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zuantan.dismantling.dto.DeptVO;
import com.zuantan.dismantling.dto.OrgSyncResult;
import com.zuantan.dismantling.entity.SysDept;
import com.zuantan.dismantling.mapper.SysDeptMapper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DeptService {

    private final SysDeptMapper deptMapper;
    private final DingTalkOrgSyncService orgSyncService;
    private final AuthService authService;

    public DeptService(SysDeptMapper deptMapper,
                       DingTalkOrgSyncService orgSyncService,
                       AuthService authService) {
        this.deptMapper = deptMapper;
        this.orgSyncService = orgSyncService;
        this.authService = authService;
    }

    public OrgSyncResult syncFromDingTalk(Long operatorId, boolean syncUsers) {
        authService.requireSuperAdmin(operatorId);
        return orgSyncService.syncAll(syncUsers);
    }

    public List<DeptVO> listTree(boolean includeDisabled) {
        List<SysDept> all = deptMapper.selectList(new LambdaQueryWrapper<SysDept>()
                .orderByAsc(SysDept::getSortOrder)
                .orderByAsc(SysDept::getId));
        if (!includeDisabled) {
            all = all.stream()
                    .filter(d -> d.getStatus() == null || d.getStatus() == 1)
                    .collect(Collectors.toList());
        }
        Map<Long, DeptVO> map = new HashMap<>();
        for (SysDept d : all) {
            map.put(d.getId(), toVo(d));
        }
        List<DeptVO> roots = new ArrayList<>();
        for (SysDept d : all) {
            DeptVO vo = map.get(d.getId());
            if (d.getParentId() != null && map.containsKey(d.getParentId())) {
                map.get(d.getParentId()).getChildren().add(vo);
            } else {
                roots.add(vo);
            }
        }
        return roots;
    }

    /** 扁平选项：value=部门名称，兼容业务表单与历史用户 dept_ids 存中文名 */
    public List<DeptVO.Option> listOptions() {
        List<SysDept> all = deptMapper.selectList(new LambdaQueryWrapper<SysDept>()
                .eq(SysDept::getStatus, 1)
                .orderByAsc(SysDept::getSortOrder)
                .orderByAsc(SysDept::getId));
        List<DeptVO.Option> options = new ArrayList<>();
        for (SysDept d : all) {
            if (!StringUtils.hasText(d.getName()) || "根部门".equals(d.getName())) {
                continue;
            }
            DeptVO.Option opt = new DeptVO.Option();
            opt.setId(d.getId());
            opt.setDingtalkDeptId(d.getDingtalkDeptId());
            opt.setValue(d.getName());
            opt.setLabel(d.getName());
            options.add(opt);
        }
        return options;
    }

    public String resolvePrimaryDeptName(String deptIdsRaw) {
        if (!StringUtils.hasText(deptIdsRaw)) {
            return null;
        }
        String raw = deptIdsRaw.trim();
        if (!raw.startsWith("[")) {
            return raw;
        }
        try {
            JSONArray arr = JSON.parseArray(raw);
            if (arr == null || arr.isEmpty()) {
                return null;
            }
            Long dingId = arr.getLong(0);
            if (dingId == null) {
                return null;
            }
            SysDept dept = deptMapper.selectOne(new LambdaQueryWrapper<SysDept>()
                    .eq(SysDept::getDingtalkDeptId, dingId)
                    .last("LIMIT 1"));
            return dept != null ? dept.getName() : String.valueOf(dingId);
        } catch (Exception e) {
            return raw;
        }
    }

    /**
     * 管理端选择部门名称时：若能匹配钉钉部门，则存 JSON id，便于与钉钉登录一致；否则存名称。
     */
    public String encodeDeptForStorage(String departmentNameOrJson) {
        if (!StringUtils.hasText(departmentNameOrJson)) {
            return null;
        }
        String raw = departmentNameOrJson.trim();
        if (raw.startsWith("[")) {
            return raw;
        }
        SysDept dept = deptMapper.selectOne(new LambdaQueryWrapper<SysDept>()
                .eq(SysDept::getName, raw)
                .eq(SysDept::getStatus, 1)
                .last("LIMIT 1"));
        if (dept != null && dept.getDingtalkDeptId() != null) {
            return "[" + dept.getDingtalkDeptId() + "]";
        }
        return raw;
    }

    private static DeptVO toVo(SysDept d) {
        DeptVO vo = new DeptVO();
        vo.setId(d.getId());
        vo.setDingtalkDeptId(d.getDingtalkDeptId());
        vo.setName(d.getName());
        vo.setParentId(d.getParentId());
        vo.setDingtalkParentId(d.getDingtalkParentId());
        vo.setSortOrder(d.getSortOrder());
        vo.setStatus(d.getStatus());
        return vo;
    }
}
