package com.zuantan.dismantling.controller;

import com.zuantan.dismantling.common.Result;
import com.zuantan.dismantling.dto.DictItemVO;
import com.zuantan.dismantling.dto.DictTypeVO;
import com.zuantan.dismantling.service.DictService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dicts")
public class DictController {

    private final DictService dictService;

    public DictController(DictService dictService) {
        this.dictService = dictService;
    }

    @GetMapping("/types")
    public Result<List<DictTypeVO>> types() {
        try {
            return Result.success(dictService.listTypes());
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/items")
    public Result<List<DictItemVO>> items(@RequestParam String typeCode,
                                          @RequestParam(required = false) String keyword) {
        try {
            return Result.success(dictService.listItems(typeCode, keyword));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    /** 从简道云收车/议价镜像数据投影到 sys_dict_* */
    @PostMapping("/sync")
    public Result<Map<String, Object>> sync() {
        try {
            return Result.success(dictService.syncFromJdy());
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }
}
