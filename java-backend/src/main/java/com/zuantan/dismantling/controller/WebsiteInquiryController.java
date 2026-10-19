package com.zuantan.dismantling.controller;

import com.zuantan.dismantling.common.PageResult;
import com.zuantan.dismantling.common.Result;
import com.zuantan.dismantling.dto.WebsiteInquirySubmitRequest;
import com.zuantan.dismantling.entity.WebsiteInquiry;
import com.zuantan.dismantling.service.WebsiteInquiryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/website/inquiry")
public class WebsiteInquiryController {

    private final WebsiteInquiryService websiteInquiryService;

    public WebsiteInquiryController(WebsiteInquiryService websiteInquiryService) {
        this.websiteInquiryService = websiteInquiryService;
    }

    /** 官网公开提交，无需登录 */
    @PostMapping
    public Result<Map<String, Object>> submit(@RequestBody WebsiteInquirySubmitRequest body,
                                              HttpServletRequest request) {
        try {
            Long id = websiteInquiryService.submit(body, resolveClientIp(request));
            Map<String, Object> data = new HashMap<>();
            data.put("id", id);
            return Result.success("提交成功，我们会尽快与您联系", data);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/items")
    public Result<PageResult<List<WebsiteInquiry>>> list(
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        return Result.success(websiteInquiryService.list(pageNo, pageSize, status, keyword));
    }

    @PutMapping("/{id}/handled")
    public Result<Void> markHandled(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        try {
            String remark = body == null ? null : body.get("remark");
            websiteInquiryService.markHandled(id, remark);
            return Result.success();
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    private static String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.trim().isEmpty()) {
            return forwarded.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.trim().isEmpty()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}
