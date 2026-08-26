package com.zuantan.dismantling.service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zuantan.dismantling.entity.BizDashboard;
import com.zuantan.dismantling.entity.BizForm;
import com.zuantan.dismantling.entity.BizFormData;
import com.zuantan.dismantling.mapper.BizDashboardMapper;
import com.zuantan.dismantling.mapper.BizFormDataMapper;
import com.zuantan.dismantling.mapper.BizFormMapper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class BizDashboardService {

    private final BizDashboardMapper dashboardMapper;
    private final BizFormMapper formMapper;
    private final BizFormDataMapper dataMapper;

    public BizDashboardService(BizDashboardMapper dashboardMapper, BizFormMapper formMapper,
                               BizFormDataMapper dataMapper) {
        this.dashboardMapper = dashboardMapper;
        this.formMapper = formMapper;
        this.dataMapper = dataMapper;
    }

    public List<BizDashboard> list(Long appId) {
        LambdaQueryWrapper<BizDashboard> q = new LambdaQueryWrapper<>();
        if (appId != null) {
            q.eq(BizDashboard::getAppId, appId);
        }
        q.eq(BizDashboard::getStatus, 1);
        return dashboardMapper.selectList(q);
    }

    public BizDashboard save(BizDashboard d) {
        LocalDateTime now = LocalDateTime.now();
        if (d.getId() == null) {
            if (d.getStatus() == null) {
                d.setStatus(1);
            }
            if (!StringUtils.hasText(d.getConfigJson())) {
                d.setConfigJson("{\"metrics\":[{\"type\":\"count\",\"label\":\"总数据量\"}]}");
            }
            d.setCreatedAt(now);
            d.setUpdatedAt(now);
            dashboardMapper.insert(d);
        } else {
            d.setUpdatedAt(now);
            dashboardMapper.updateById(d);
        }
        return d;
    }

    public Map<String, Object> computeStats(Long dashboardId) {
        BizDashboard dash = dashboardMapper.selectById(dashboardId);
        if (dash == null) {
            throw new RuntimeException("看板不存在");
        }
        Map<String, Object> result = new HashMap<>();
        result.put("name", dash.getName());

        Long appId = dash.getAppId();
        List<BizForm> forms;
        if (appId != null) {
            forms = formMapper.selectList(new LambdaQueryWrapper<BizForm>().eq(BizForm::getAppId, appId));
        } else {
            forms = formMapper.selectList(new LambdaQueryWrapper<>());
        }
        long total = 0;
        Map<String, Long> byForm = new HashMap<>();
        for (BizForm f : forms) {
            Long c = dataMapper.selectCount(new LambdaQueryWrapper<BizFormData>().eq(BizFormData::getFormId, f.getId()));
            byForm.put(f.getName(), c);
            total += c == null ? 0 : c;
        }
        result.put("totalRecords", total);
        result.put("byForm", byForm);

        JSONObject cfg = new JSONObject();
        try {
            cfg = JSON.parseObject(dash.getConfigJson());
        } catch (Exception ignored) {
        }
        result.put("config", cfg);
        return result;
    }
}
