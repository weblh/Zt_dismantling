package com.zuantan.dismantling.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zuantan.dismantling.common.PageResult;
import com.zuantan.dismantling.dto.WebsiteInquirySubmitRequest;
import com.zuantan.dismantling.entity.WebsiteInquiry;
import com.zuantan.dismantling.mapper.WebsiteInquiryMapper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class WebsiteInquiryService {

    private static final Set<String> CATEGORIES = new HashSet<>(Arrays.asList(
            "VEHICLE", "PARTS", "MATERIAL", "OTHER"
    ));

    private final WebsiteInquiryMapper websiteInquiryMapper;

    public WebsiteInquiryService(WebsiteInquiryMapper websiteInquiryMapper) {
        this.websiteInquiryMapper = websiteInquiryMapper;
    }

    public Long submit(WebsiteInquirySubmitRequest request, String clientIp) {
        String name = trim(request.getContactName());
        String phone = trim(request.getPhone());
        String content = trim(request.getContent());
        String category = StringUtils.hasText(request.getCategory())
                ? request.getCategory().trim().toUpperCase()
                : "OTHER";

        if (!StringUtils.hasText(name) || name.length() > 64) {
            throw new RuntimeException("请填写有效的联系人姓名");
        }
        if (!StringUtils.hasText(phone) || phone.length() > 32) {
            throw new RuntimeException("请填写有效的联系电话");
        }
        if (!phone.matches("^[0-9+\\-()\\s]{6,32}$")) {
            throw new RuntimeException("联系电话格式不正确");
        }
        if (!StringUtils.hasText(content) || content.length() > 2000) {
            throw new RuntimeException("请填写询价内容（2000字以内）");
        }
        if (!CATEGORIES.contains(category)) {
            throw new RuntimeException("询价类型不正确");
        }

        String email = trim(request.getEmail());
        if (StringUtils.hasText(email) && email.length() > 128) {
            throw new RuntimeException("邮箱过长");
        }
        String company = trim(request.getCompany());
        if (StringUtils.hasText(company) && company.length() > 128) {
            throw new RuntimeException("单位名称过长");
        }

        if (StringUtils.hasText(clientIp)) {
            LocalDateTime since = LocalDateTime.now().minusMinutes(2);
            Long recent = websiteInquiryMapper.selectCount(new LambdaQueryWrapper<WebsiteInquiry>()
                    .eq(WebsiteInquiry::getClientIp, clientIp)
                    .ge(WebsiteInquiry::getCreatedAt, since));
            if (recent != null && recent >= 3) {
                throw new RuntimeException("提交过于频繁，请稍后再试");
            }
        }

        LocalDateTime now = LocalDateTime.now();
        WebsiteInquiry row = new WebsiteInquiry();
        row.setContactName(name);
        row.setPhone(phone);
        row.setEmail(email);
        row.setCompany(company);
        row.setCategory(category);
        row.setContent(content);
        row.setStatus(WebsiteInquiry.STATUS_NEW);
        row.setClientIp(clientIp);
        row.setCreatedAt(now);
        row.setUpdatedAt(now);
        websiteInquiryMapper.insert(row);
        return row.getId();
    }

    public PageResult<List<WebsiteInquiry>> list(int pageNo, int pageSize, String status, String keyword) {
        int safePage = Math.max(pageNo, 1);
        int safeSize = Math.min(Math.max(pageSize, 1), 100);
        LambdaQueryWrapper<WebsiteInquiry> q = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(status)) {
            q.eq(WebsiteInquiry::getStatus, status.trim());
        }
        if (StringUtils.hasText(keyword)) {
            String kw = keyword.trim();
            q.and(w -> w.like(WebsiteInquiry::getContactName, kw)
                    .or().like(WebsiteInquiry::getPhone, kw)
                    .or().like(WebsiteInquiry::getCompany, kw)
                    .or().like(WebsiteInquiry::getContent, kw));
        }
        q.orderByDesc(WebsiteInquiry::getCreatedAt).orderByDesc(WebsiteInquiry::getId);
        Page<WebsiteInquiry> page = websiteInquiryMapper.selectPage(new Page<>(safePage, safeSize), q);
        return new PageResult<>(page.getTotal(), page.getRecords());
    }

    public void markHandled(Long id, String remark) {
        WebsiteInquiry row = websiteInquiryMapper.selectById(id);
        if (row == null) {
            throw new RuntimeException("询价记录不存在");
        }
        row.setStatus(WebsiteInquiry.STATUS_HANDLED);
        if (remark != null) {
            String trimmed = remark.trim();
            row.setRemark(trimmed.length() > 512 ? trimmed.substring(0, 512) : trimmed);
        }
        row.setUpdatedAt(LocalDateTime.now());
        websiteInquiryMapper.updateById(row);
    }

    private static String trim(String value) {
        return value == null ? null : value.trim();
    }
}
