package com.zuantan.dismantling.controller;

import com.zuantan.dismantling.common.Result;
import com.zuantan.dismantling.dto.KingdeeAccountConfigRequest;
import com.zuantan.dismantling.entity.KingdeeAccountConfig;
import com.zuantan.dismantling.service.KingdeeAccountConfigService;
import com.zuantan.dismantling.service.KingdeeLoginService;
import javax.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/kingdee/account")
public class KingdeeAccountConfigController {

    private final KingdeeAccountConfigService accountConfigService;
    private final KingdeeLoginService kingdeeLoginService;

    public KingdeeAccountConfigController(KingdeeAccountConfigService accountConfigService,
                                          KingdeeLoginService kingdeeLoginService) {
        this.accountConfigService = accountConfigService;
        this.kingdeeLoginService = kingdeeLoginService;
    }

    @GetMapping
    public Result<List<KingdeeAccountConfig>> list() {
        return Result.success(accountConfigService.listAll());
    }

    @GetMapping("/enabled")
    public Result<List<KingdeeAccountConfig>> listEnabled() {
        return Result.success(accountConfigService.listEnabled());
    }

    @GetMapping("/default")
    public Result<KingdeeAccountConfig> getDefault() {
        KingdeeAccountConfig config = accountConfigService.getDefaultAccount();
        if (config == null) {
            return Result.error(404, "未设置默认金蝶账号");
        }
        config.setPassword("******");
        return Result.success(config);
    }

    @GetMapping("/{id}")
    public Result<KingdeeAccountConfig> get(@PathVariable Long id) {
        KingdeeAccountConfig config = accountConfigService.getByIdMasked(id);
        if (config == null) {
            return Result.error(404, "账号配置不存在");
        }
        return Result.success(config);
    }

    @PostMapping
    public Result<KingdeeAccountConfig> create(@Valid @RequestBody KingdeeAccountConfigRequest request) {
        KingdeeAccountConfig existing = accountConfigService.getByAccountName(request.getAccountName());
        if (existing != null) {
            return Result.error(400, "账号名称已存在");
        }
        try {
            return Result.success(accountConfigService.create(request));
        } catch (IllegalArgumentException e) {
            return Result.error(400, e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public Result<KingdeeAccountConfig> update(@PathVariable Long id,
                                               @Valid @RequestBody KingdeeAccountConfigRequest request) {
        KingdeeAccountConfig existing = accountConfigService.getByAccountName(request.getAccountName());
        if (existing != null && !existing.getId().equals(id)) {
            return Result.error(400, "账号名称已存在");
        }
        KingdeeAccountConfig config = accountConfigService.update(id, request);
        if (config == null) {
            return Result.error(404, "账号配置不存在");
        }
        return Result.success(config);
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        accountConfigService.delete(id);
        return Result.success();
    }

    @PostMapping("/{id}/toggle")
    public Result<KingdeeAccountConfig> toggleStatus(@PathVariable Long id) {
        accountConfigService.toggleStatus(id);
        KingdeeAccountConfig config = accountConfigService.getByIdMasked(id);
        if (config == null) {
            return Result.error(404, "账号配置不存在");
        }
        return Result.success(config);
    }

    @PostMapping("/{id}/default")
    public Result<KingdeeAccountConfig> setDefault(@PathVariable Long id) {
        accountConfigService.setDefault(id);
        KingdeeAccountConfig config = accountConfigService.getByIdMasked(id);
        if (config == null) {
            return Result.error(404, "账号配置不存在");
        }
        return Result.success(config);
    }

    @PostMapping("/{id}/test-login")
    public Result<Map<String, Object>> testLogin(@PathVariable Long id) {
        KingdeeAccountConfig config = accountConfigService.getByIdWithPassword(id);
        if (config == null) {
            return Result.error(404, "账号配置不存在");
        }
        try {
            String sessionId = kingdeeLoginService.login(
                    config.getKingdeeUrl(), config.getDbId(), config.getUsername(), config.getPassword());
            Map<String, Object> data = new HashMap<>();
            data.put("success", true);
            data.put("sessionIdPreview", sessionId != null && sessionId.length() > 8
                    ? sessionId.substring(0, 8) + "..." : sessionId);
            data.put("message", "登录成功");
            return Result.success(data);
        } catch (Exception e) {
            return Result.error("登录失败：" + e.getMessage());
        }
    }
}
