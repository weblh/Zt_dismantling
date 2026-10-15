package com.zuantan.dismantling.controller;

import com.zuantan.dismantling.common.Result;
import com.zuantan.dismantling.dto.DeptVO;
import com.zuantan.dismantling.dto.OrgSyncResult;
import com.zuantan.dismantling.service.DeptService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/api/depts")
public class DeptController {

    private final DeptService deptService;

    public DeptController(DeptService deptService) {
        this.deptService = deptService;
    }

    /** 部门树（含钉钉同步结果） */
    @GetMapping("/tree")
    public Result<List<DeptVO>> tree(
            @RequestParam(defaultValue = "false") boolean includeDisabled) {
        return Result.success(deptService.listTree(includeDisabled));
    }

    /** 扁平 Select 选项（value=部门名） */
    @GetMapping("/options")
    public Result<List<DeptVO.Option>> options() {
        return Result.success(deptService.listOptions());
    }

    /**
     * 从钉钉拉取组织架构。
     * @param syncUsers true 时同步部门下人员（手机号合并本地账号）
     */
    @PostMapping("/sync")
    public Result<OrgSyncResult> sync(
            @RequestParam(defaultValue = "true") boolean syncUsers,
            HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            return Result.success(deptService.syncFromDingTalk(userId, syncUsers));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }
}
