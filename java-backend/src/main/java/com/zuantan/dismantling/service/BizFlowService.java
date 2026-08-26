package com.zuantan.dismantling.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zuantan.dismantling.entity.BizFlowCc;
import com.zuantan.dismantling.entity.BizForm;
import com.zuantan.dismantling.entity.BizFormData;
import com.zuantan.dismantling.entity.SysUser;
import com.zuantan.dismantling.mapper.BizFlowCcMapper;
import com.zuantan.dismantling.mapper.BizFormDataMapper;
import com.zuantan.dismantling.mapper.BizFormMapper;
import org.flowable.engine.HistoryService;
import org.flowable.engine.RuntimeService;
import org.flowable.engine.TaskService;
import org.flowable.engine.history.HistoricProcessInstance;
import org.flowable.engine.runtime.ProcessInstance;
import org.flowable.task.api.Task;
import org.flowable.task.api.history.HistoricTaskInstance;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Flowable 嵌入：通用「提交 → 审批 → 结束」流程，办理人默认超级管理员/发起人上级可扩展。
 */
@Service
public class BizFlowService {

    public static final String PROCESS_KEY = "bizFormApproval";

    private final RuntimeService runtimeService;
    private final TaskService taskService;
    private final HistoryService historyService;
    private final BizFormDataMapper dataMapper;
    private final BizFormMapper formMapper;
    private final BizFlowCcMapper ccMapper;
    private final AuthService authService;

    public BizFlowService(RuntimeService runtimeService, TaskService taskService,
                          HistoryService historyService, BizFormDataMapper dataMapper,
                          BizFormMapper formMapper, BizFlowCcMapper ccMapper,
                          AuthService authService) {
        this.runtimeService = runtimeService;
        this.taskService = taskService;
        this.historyService = historyService;
        this.dataMapper = dataMapper;
        this.formMapper = formMapper;
        this.ccMapper = ccMapper;
        this.authService = authService;
    }

    @Transactional
    public Map<String, Object> submit(Long dataId, Long userId) {
        BizFormData data = dataMapper.selectById(dataId);
        if (data == null) {
            throw new RuntimeException("数据不存在");
        }
        BizForm form = formMapper.selectById(data.getFormId());
        SysUser user = authService.requireUser(userId);

        if (form.getFlowEnabled() == null || form.getFlowEnabled() != 1) {
            form.setFlowEnabled(1);
            form.setFlowDefinitionKey(PROCESS_KEY);
            formMapper.updateById(form);
        }

        Map<String, Object> vars = new HashMap<>();
        vars.put("formDataId", dataId);
        vars.put("formId", data.getFormId());
        vars.put("starter", String.valueOf(userId));
        // 默认审批人：admin 用户 id=1，可在变量中覆盖
        vars.put("approver", "1");

        ProcessInstance pi = runtimeService.startProcessInstanceByKey(PROCESS_KEY, "data-" + dataId, vars);
        data.setProcessInstanceId(pi.getId());
        data.setFlowState("approving");
        data.setUpdatedAt(LocalDateTime.now());
        dataMapper.updateById(data);

        // 抄送发起人自己（示例）
        BizFlowCc cc = new BizFlowCc();
        cc.setFormDataId(dataId);
        cc.setProcessInstanceId(pi.getId());
        cc.setUserId(userId);
        cc.setDingtalkUserid(user.getDingtalkUserid());
        cc.setReadFlag(0);
        cc.setCreatedAt(LocalDateTime.now());
        ccMapper.insert(cc);

        Map<String, Object> result = new HashMap<>();
        result.put("processInstanceId", pi.getId());
        result.put("flowState", data.getFlowState());
        return result;
    }

    @Transactional
    public Map<String, Object> approve(String taskId, Long userId, String comment) {
        Task task = taskService.createTaskQuery().taskId(taskId).singleResult();
        if (task == null) {
            throw new RuntimeException("任务不存在");
        }
        if (StringUtils.hasText(comment)) {
            taskService.addComment(taskId, task.getProcessInstanceId(), comment);
        }
        Map<String, Object> vars = new HashMap<>();
        vars.put("approved", true);
        taskService.complete(taskId, vars);
        syncDataState(task.getProcessInstanceId(), "approved");
        Map<String, Object> result = new HashMap<>();
        result.put("ok", true);
        return result;
    }

    @Transactional
    public Map<String, Object> reject(String taskId, Long userId, String comment) {
        Task task = taskService.createTaskQuery().taskId(taskId).singleResult();
        if (task == null) {
            throw new RuntimeException("任务不存在");
        }
        if (StringUtils.hasText(comment)) {
            taskService.addComment(taskId, task.getProcessInstanceId(), comment);
        }
        Map<String, Object> vars = new HashMap<>();
        vars.put("approved", false);
        taskService.complete(taskId, vars);
        syncDataState(task.getProcessInstanceId(), "rejected");
        try {
            runtimeService.deleteProcessInstance(task.getProcessInstanceId(), "rejected");
        } catch (Exception ignored) {
        }
        Map<String, Object> result = new HashMap<>();
        result.put("ok", true);
        return result;
    }

    public List<Map<String, Object>> listTodo(Long userId) {
        List<Task> tasks = taskService.createTaskQuery()
                .taskCandidateOrAssigned(String.valueOf(userId))
                .orderByTaskCreateTime().desc()
                .list();
        // 也查 assignee=admin 给超管
        if (userId != null && userId == 1L) {
            List<Task> adminTasks = taskService.createTaskQuery()
                    .taskAssignee("1")
                    .orderByTaskCreateTime().desc()
                    .list();
            for (Task t : adminTasks) {
                if (tasks.stream().noneMatch(x -> x.getId().equals(t.getId()))) {
                    tasks.add(t);
                }
            }
        }
        List<Map<String, Object>> list = new ArrayList<>();
        for (Task t : tasks) {
            Map<String, Object> m = new HashMap<>();
            m.put("taskId", t.getId());
            m.put("name", t.getName());
            m.put("processInstanceId", t.getProcessInstanceId());
            m.put("createTime", t.getCreateTime());
            Object formDataId = runtimeService.getVariable(t.getExecutionId(), "formDataId");
            m.put("formDataId", formDataId);
            list.add(m);
        }
        return list;
    }

    public List<Map<String, Object>> listInitiated(Long userId) {
        List<HistoricProcessInstance> pis = historyService.createHistoricProcessInstanceQuery()
                .startedBy(String.valueOf(userId))
                .orderByProcessInstanceStartTime().desc()
                .list();
        List<Map<String, Object>> list = new ArrayList<>();
        for (HistoricProcessInstance pi : pis) {
            Map<String, Object> m = new HashMap<>();
            m.put("processInstanceId", pi.getId());
            m.put("startTime", pi.getStartTime());
            m.put("endTime", pi.getEndTime());
            m.put("businessKey", pi.getBusinessKey());
            list.add(m);
        }
        return list;
    }

    public List<Map<String, Object>> listProcessed(Long userId) {
        List<HistoricTaskInstance> tasks = historyService.createHistoricTaskInstanceQuery()
                .taskAssignee(String.valueOf(userId))
                .finished()
                .orderByHistoricTaskInstanceEndTime().desc()
                .list();
        List<Map<String, Object>> list = new ArrayList<>();
        for (HistoricTaskInstance t : tasks) {
            Map<String, Object> m = new HashMap<>();
            m.put("taskId", t.getId());
            m.put("name", t.getName());
            m.put("processInstanceId", t.getProcessInstanceId());
            m.put("endTime", t.getEndTime());
            list.add(m);
        }
        return list;
    }

    public List<Map<String, Object>> listCc(Long userId) {
        List<BizFlowCc> ccs = ccMapper.selectList(new LambdaQueryWrapper<BizFlowCc>()
                .eq(BizFlowCc::getUserId, userId)
                .orderByDesc(BizFlowCc::getId));
        List<Map<String, Object>> list = new ArrayList<>();
        for (BizFlowCc cc : ccs) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", cc.getId());
            m.put("formDataId", cc.getFormDataId());
            m.put("processInstanceId", cc.getProcessInstanceId());
            m.put("readFlag", cc.getReadFlag());
            m.put("createdAt", cc.getCreatedAt());
            list.add(m);
        }
        return list;
    }

    private void syncDataState(String processInstanceId, String state) {
        LambdaQueryWrapper<BizFormData> q = new LambdaQueryWrapper<>();
        q.eq(BizFormData::getProcessInstanceId, processInstanceId);
        BizFormData data = dataMapper.selectOne(q);
        if (data != null) {
            data.setFlowState(state);
            data.setUpdatedAt(LocalDateTime.now());
            dataMapper.updateById(data);
        }
    }
}
