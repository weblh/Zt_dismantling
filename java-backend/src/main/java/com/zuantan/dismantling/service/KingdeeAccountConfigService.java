package com.zuantan.dismantling.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zuantan.dismantling.dto.KingdeeAccountConfigRequest;
import com.zuantan.dismantling.entity.KingdeeAccountConfig;
import com.zuantan.dismantling.mapper.KingdeeAccountConfigMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class KingdeeAccountConfigService extends ServiceImpl<KingdeeAccountConfigMapper, KingdeeAccountConfig> {

    public List<KingdeeAccountConfig> listAll() {
        LambdaQueryWrapper<KingdeeAccountConfig> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(KingdeeAccountConfig::getIsDefault)
                .orderByDesc(KingdeeAccountConfig::getCreatedAt);
        List<KingdeeAccountConfig> configs = list(wrapper);
        configs.forEach(this::maskPassword);
        return configs;
    }

    public KingdeeAccountConfig getByIdMasked(Long id) {
        KingdeeAccountConfig config = getById(id);
        if (config != null) {
            maskPassword(config);
        }
        return config;
    }

    public KingdeeAccountConfig getByIdWithPassword(Long id) {
        return getById(id);
    }

    public KingdeeAccountConfig getByAccountName(String accountName) {
        LambdaQueryWrapper<KingdeeAccountConfig> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(KingdeeAccountConfig::getAccountName, accountName);
        return getOne(wrapper);
    }

    public KingdeeAccountConfig getDefaultAccount() {
        LambdaQueryWrapper<KingdeeAccountConfig> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(KingdeeAccountConfig::getIsDefault, 1);
        wrapper.eq(KingdeeAccountConfig::getStatus, 1);
        wrapper.last("LIMIT 1");
        return getOne(wrapper);
    }

    public List<KingdeeAccountConfig> listEnabled() {
        LambdaQueryWrapper<KingdeeAccountConfig> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(KingdeeAccountConfig::getStatus, 1);
        wrapper.orderByDesc(KingdeeAccountConfig::getIsDefault)
                .orderByDesc(KingdeeAccountConfig::getCreatedAt);
        List<KingdeeAccountConfig> configs = list(wrapper);
        configs.forEach(this::maskPassword);
        return configs;
    }

    public KingdeeAccountConfig resolveForLogin(Long accountId) {
        if (accountId == null) {
            throw new IllegalArgumentException("请选择金蝶账号");
        }
        KingdeeAccountConfig config = getById(accountId);
        if (config == null) {
            throw new IllegalArgumentException("金蝶账号不存在");
        }
        if (config.getStatus() == null || config.getStatus() != 1) {
            throw new IllegalArgumentException("金蝶账号已禁用");
        }
        return config;
    }

    @Transactional
    public KingdeeAccountConfig create(KingdeeAccountConfigRequest request) {
        if (request.getPassword() == null
                || request.getPassword().isEmpty()
                || "******".equals(request.getPassword())) {
            throw new IllegalArgumentException("密码不能为空");
        }
        KingdeeAccountConfig config = mapRequestToEntity(request, new KingdeeAccountConfig());
        config.setCreatedAt(LocalDateTime.now());
        config.setUpdatedAt(LocalDateTime.now());
        if (config.getIsDefault() != null && config.getIsDefault() == 1) {
            clearDefaultFlag();
        }
        save(config);
        // MyBatis 不会把内存改动刷回库；仅脱敏返回对象
        maskPassword(config);
        return config;
    }

    @Transactional
    public KingdeeAccountConfig update(Long id, KingdeeAccountConfigRequest request) {
        KingdeeAccountConfig config = getById(id);
        if (config == null) {
            return null;
        }
        mapRequestToEntity(request, config);
        config.setUpdatedAt(LocalDateTime.now());
        if (config.getIsDefault() != null && config.getIsDefault() == 1) {
            clearDefaultFlagExcept(id);
        }
        updateById(config);
        // MyBatis 不会把内存改动刷回库；仅脱敏返回对象
        maskPassword(config);
        return config;
    }

    public void delete(Long id) {
        removeById(id);
    }

    public void toggleStatus(Long id) {
        KingdeeAccountConfig config = getById(id);
        if (config != null) {
            config.setStatus(config.getStatus() == 1 ? 0 : 1);
            config.setUpdatedAt(LocalDateTime.now());
            updateById(config);
        }
    }

    @Transactional
    public void setDefault(Long id) {
        KingdeeAccountConfig config = getById(id);
        if (config == null) {
            return;
        }
        clearDefaultFlag();
        config.setIsDefault(1);
        config.setStatus(1);
        config.setUpdatedAt(LocalDateTime.now());
        updateById(config);
    }

    private KingdeeAccountConfig mapRequestToEntity(KingdeeAccountConfigRequest request, KingdeeAccountConfig config) {
        config.setAccountName(request.getAccountName());
        config.setKingdeeUrl(request.getKingdeeUrl());
        config.setDbId(request.getDbId());
        config.setUsername(request.getUsername());
        // 列表/详情会把密码脱敏为 ******，禁止把脱敏值回写进库
        if (request.getPassword() != null
                && !request.getPassword().isEmpty()
                && !"******".equals(request.getPassword())) {
            config.setPassword(request.getPassword());
        }
        config.setOrgCompanyCode(request.getOrgCompanyCode());
        config.setUseOrgCode(request.getUseOrgCode());
        config.setDefaultFormId(request.getDefaultFormId());
        config.setDefaultAccountingPeriod(request.getDefaultAccountingPeriod());
        config.setIsDefault(request.getIsDefault() != null ? request.getIsDefault() : 0);
        config.setStatus(request.getStatus() != null ? request.getStatus() : 1);
        config.setDescription(request.getDescription());
        return config;
    }

    private void clearDefaultFlag() {
        LambdaUpdateWrapper<KingdeeAccountConfig> wrapper = new LambdaUpdateWrapper<>();
        wrapper.set(KingdeeAccountConfig::getIsDefault, 0);
        update(wrapper);
    }

    private void clearDefaultFlagExcept(Long id) {
        LambdaUpdateWrapper<KingdeeAccountConfig> wrapper = new LambdaUpdateWrapper<>();
        wrapper.ne(KingdeeAccountConfig::getId, id);
        wrapper.set(KingdeeAccountConfig::getIsDefault, 0);
        update(wrapper);
    }

    private void maskPassword(KingdeeAccountConfig config) {
        if (config.getPassword() != null && !config.getPassword().isEmpty()) {
            config.setPassword("******");
        }
    }
}
