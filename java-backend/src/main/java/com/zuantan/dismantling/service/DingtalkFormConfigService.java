package com.zuantan.dismantling.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zuantan.dismantling.dto.DingtalkFormConfigRequest;
import com.zuantan.dismantling.entity.DingtalkFormConfig;
import com.zuantan.dismantling.mapper.DingtalkFormConfigMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class DingtalkFormConfigService extends ServiceImpl<DingtalkFormConfigMapper, DingtalkFormConfig> {

    public DingtalkFormConfig create(DingtalkFormConfigRequest request) {
        DingtalkFormConfig config = new DingtalkFormConfig();
        config.setFormId(request.getFormId());
        config.setFormName(request.getFormName());
        config.setStatus(request.getStatus() != null ? request.getStatus() : 1);
        config.setDescription(request.getDescription());
        config.setCreatedAt(LocalDateTime.now());
        config.setUpdatedAt(LocalDateTime.now());
        save(config);
        return config;
    }

    public DingtalkFormConfig update(Long id, DingtalkFormConfigRequest request) {
        DingtalkFormConfig config = getById(id);
        if (config != null) {
            config.setFormId(request.getFormId());
            config.setFormName(request.getFormName());
            if (request.getStatus() != null) {
                config.setStatus(request.getStatus());
            }
            config.setDescription(request.getDescription());
            config.setUpdatedAt(LocalDateTime.now());
            updateById(config);
        }
        return config;
    }

    public void delete(Long id) {
        removeById(id);
    }

    public DingtalkFormConfig getByFormId(String formId) {
        LambdaQueryWrapper<DingtalkFormConfig> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DingtalkFormConfig::getFormId, formId);
        return getOne(wrapper);
    }

    public boolean isFormAllowed(String formId) {
        if (formId == null || formId.isEmpty()) {
            return false;
        }
        LambdaQueryWrapper<DingtalkFormConfig> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DingtalkFormConfig::getFormId, formId);
        wrapper.eq(DingtalkFormConfig::getStatus, 1);
        return count(wrapper) > 0;
    }

    public Set<String> getAllowedFormIds() {
        LambdaQueryWrapper<DingtalkFormConfig> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DingtalkFormConfig::getStatus, 1);
        return list(wrapper).stream()
                .map(DingtalkFormConfig::getFormId)
                .collect(Collectors.toSet());
    }

    public List<DingtalkFormConfig> listAll() {
        LambdaQueryWrapper<DingtalkFormConfig> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(DingtalkFormConfig::getCreatedAt);
        return list(wrapper);
    }

    public void toggleStatus(Long id) {
        DingtalkFormConfig config = getById(id);
        if (config != null) {
            config.setStatus(config.getStatus() == 1 ? 0 : 1);
            config.setUpdatedAt(LocalDateTime.now());
            updateById(config);
        }
    }
}