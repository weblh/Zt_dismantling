package com.zuantan.dismantling.service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zuantan.dismantling.common.PageResult;
import com.zuantan.dismantling.entity.DingtalkApprovalForm;
import com.zuantan.dismantling.entity.ExpenseReimbursement;
import com.zuantan.dismantling.entity.ExpenseReimbursementItem;
import com.zuantan.dismantling.mapper.ExpenseReimbursementItemMapper;
import com.zuantan.dismantling.mapper.ExpenseReimbursementMapper;
import com.zuantan.dismantling.util.DingtalkAttachmentUtil;
import com.zuantan.dismantling.util.DingtalkFormType;
import com.zuantan.dismantling.vo.AttachmentFileVO;
import com.zuantan.dismantling.vo.ExpenseReimbursementItemVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ExpenseReimbursementService {

    private static final Logger log = LoggerFactory.getLogger(ExpenseReimbursementService.class);

    private final ExpenseReimbursementMapper reimbursementMapper;
    private final ExpenseReimbursementItemMapper itemMapper;
    private final ExpenseReimbursementFormParser formParser;
    private final DingtalkApiService dingtalkApiService;

    public ExpenseReimbursementService(ExpenseReimbursementMapper reimbursementMapper,
                                       ExpenseReimbursementItemMapper itemMapper,
                                       ExpenseReimbursementFormParser formParser,
                                       DingtalkApiService dingtalkApiService) {
        this.reimbursementMapper = reimbursementMapper;
        this.itemMapper = itemMapper;
        this.formParser = formParser;
        this.dingtalkApiService = dingtalkApiService;
    }

    @Transactional
    public void saveFromApprovalForm(DingtalkApprovalForm approvalForm) {
        if (approvalForm == null || !StringUtils.hasText(approvalForm.getProcessInstanceId())) {
            return;
        }
        if (!DingtalkFormType.isExpenseReimbursement(approvalForm)) {
            return;
        }
        if (!StringUtils.hasText(approvalForm.getApprovalResult())
                || !"agree".equalsIgnoreCase(approvalForm.getApprovalResult())) {
            return;
        }

        ExpenseReimbursementFormParser.ParsedReimbursement parsed = formParser.parse(approvalForm);
        if (parsed.getItems() == null || parsed.getItems().isEmpty()) {
            log.warn("费用报销审批未解析到明细行，跳过入库: processInstanceId={}",
                    approvalForm.getProcessInstanceId());
            return;
        }

        ExpenseReimbursement header = parsed.getHeader();

        LambdaQueryWrapper<ExpenseReimbursement> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ExpenseReimbursement::getProcessInstanceId, approvalForm.getProcessInstanceId());
        ExpenseReimbursement existing = reimbursementMapper.selectOne(wrapper);

        if (existing != null) {
            header.setId(existing.getId());
            header.setCreatedAt(existing.getCreatedAt());
            reimbursementMapper.updateById(header);

            LambdaQueryWrapper<ExpenseReimbursementItem> itemDeleteWrapper = new LambdaQueryWrapper<>();
            itemDeleteWrapper.eq(ExpenseReimbursementItem::getReimbursementId, existing.getId());
            itemMapper.delete(itemDeleteWrapper);
        } else {
            reimbursementMapper.insert(header);
        }

        for (ExpenseReimbursementItem item : parsed.getItems()) {
            item.setReimbursementId(header.getId());
            LocalDateTime importTime = header.getFinishTime() != null
                    ? header.getFinishTime()
                    : header.getSubmitTime();
            if (importTime != null) {
                item.setCreatedAt(importTime);
            }
            itemMapper.insert(item);
        }

        log.info("费用报销结构化入库完成: processInstanceId={}, itemCount={}",
                approvalForm.getProcessInstanceId(), parsed.getItems().size());
    }

    public PageResult<List<ExpenseReimbursementItemVO>> listItems(int pageNo, int pageSize,
                                                                  String businessId,
                                                                  String submitterName,
                                                                  String expenseType) {
        Set<Long> filteredReimbursementIds = null;
        if (StringUtils.hasText(businessId) || StringUtils.hasText(submitterName)) {
            LambdaQueryWrapper<ExpenseReimbursement> headerWrapper = new LambdaQueryWrapper<>();
            if (StringUtils.hasText(businessId)) {
                headerWrapper.like(ExpenseReimbursement::getBusinessId, businessId);
            }
            if (StringUtils.hasText(submitterName)) {
                headerWrapper.like(ExpenseReimbursement::getSubmitterName, submitterName);
            }
            List<ExpenseReimbursement> headers = reimbursementMapper.selectList(headerWrapper);
            filteredReimbursementIds = headers.stream()
                    .map(ExpenseReimbursement::getId)
                    .collect(Collectors.toSet());
            if (filteredReimbursementIds.isEmpty()) {
                return new PageResult<>(0L, Collections.emptyList());
            }
        }

        Page<ExpenseReimbursementItem> page = new Page<>(pageNo, pageSize);
        LambdaQueryWrapper<ExpenseReimbursementItem> itemWrapper = new LambdaQueryWrapper<>();
        if (filteredReimbursementIds != null) {
            itemWrapper.in(ExpenseReimbursementItem::getReimbursementId, filteredReimbursementIds);
        }
        if (StringUtils.hasText(expenseType)) {
            itemWrapper.like(ExpenseReimbursementItem::getExpenseType, expenseType);
        }
        itemWrapper.orderByDesc(ExpenseReimbursementItem::getCreatedAt);
        Page<ExpenseReimbursementItem> result = itemMapper.selectPage(page, itemWrapper);

        Map<Long, ExpenseReimbursement> headerMap = loadHeaderMap(result.getRecords());
        Map<Long, Long> itemCountMap = loadItemCountMap(result.getRecords());
        List<ExpenseReimbursementItemVO> records = new ArrayList<>();
        for (ExpenseReimbursementItem item : result.getRecords()) {
            ExpenseReimbursementItemVO vo = toVO(item, headerMap.get(item.getReimbursementId()));
            Long count = itemCountMap.get(item.getReimbursementId());
            if (count != null) {
                vo.setReimbursementItemCount(count.intValue());
            }
            records.add(vo);
        }

        return new PageResult<>(result.getTotal(), records);
    }

    public ExpenseReimbursementItemVO getItemDetail(Long id) {
        ExpenseReimbursementItem item = itemMapper.selectById(id);
        if (item == null) {
            throw new RuntimeException("费用报销明细不存在");
        }
        ExpenseReimbursement header = reimbursementMapper.selectById(item.getReimbursementId());
        ExpenseReimbursementItemVO vo = toVO(item, header);
        Long count = itemMapper.selectCount(
                new LambdaQueryWrapper<ExpenseReimbursementItem>()
                        .eq(ExpenseReimbursementItem::getReimbursementId, item.getReimbursementId()));
        vo.setReimbursementItemCount(count.intValue());
        return vo;
    }

    public List<ExpenseReimbursementItemVO> listItemsByReimbursementId(Long reimbursementId) {
        ExpenseReimbursement header = reimbursementMapper.selectById(reimbursementId);
        if (header == null) {
            throw new RuntimeException("\u8d39\u7528\u62a5\u9500\u4e3b\u8868\u4e0d\u5b58\u5728");
        }
        List<ExpenseReimbursementItem> items = itemMapper.selectList(
                new LambdaQueryWrapper<ExpenseReimbursementItem>()
                        .eq(ExpenseReimbursementItem::getReimbursementId, reimbursementId)
                        .orderByAsc(ExpenseReimbursementItem::getRowIndex)
                        .orderByAsc(ExpenseReimbursementItem::getId));
        int count = items.size();
        List<ExpenseReimbursementItemVO> records = new ArrayList<>();
        for (ExpenseReimbursementItem item : items) {
            ExpenseReimbursementItemVO vo = toVO(item, header);
            vo.setReimbursementItemCount(count);
            records.add(vo);
        }
        return records;
    }

    public void writeAttachmentPreview(Long itemId, String fileId, HttpServletResponse response) throws IOException {
        ExpenseReimbursementItem item = itemMapper.selectById(itemId);
        if (item == null) {
            throw new RuntimeException("费用报销明细不存在");
        }

        AttachmentFileVO attachment = findAttachment(item, fileId);
        if (attachment == null) {
            throw new RuntimeException("附件不存在");
        }

        ExpenseReimbursement header = reimbursementMapper.selectById(item.getReimbursementId());
        if (header == null || !StringUtils.hasText(header.getProcessInstanceId())) {
            throw new RuntimeException("审批实例不存在");
        }

        String downloadUrl = dingtalkApiService.getApprovalAttachmentDownloadUrl(
                header.getProcessInstanceId(), attachment.getFileId());
        byte[] content = dingtalkApiService.downloadFile(downloadUrl);

        String contentType = DingtalkAttachmentUtil.resolveContentType(
                attachment.getFileType(), attachment.getFileName());
        String fileName = attachment.getFileName() != null ? attachment.getFileName() : "attachment";

        response.setContentType(contentType);
        response.setHeader("Content-Disposition", buildInlineContentDisposition(fileName));
        response.setContentLength(content.length);

        try (OutputStream outputStream = response.getOutputStream()) {
            outputStream.write(content);
            outputStream.flush();
        }
    }

    private AttachmentFileVO findAttachment(ExpenseReimbursementItem item, String fileId) {
        for (AttachmentFileVO attachment : DingtalkAttachmentUtil.parseAttachmentFiles(item.getAttachmentFiles())) {
            if (fileId.equals(attachment.getFileId())) {
                return attachment;
            }
        }
        return null;
    }

    private String buildInlineContentDisposition(String fileName) {
        String safeName = fileName != null ? fileName : "attachment";
        String asciiFallback = toAsciiFallbackFileName(safeName);
        try {
            String encoded = URLEncoder.encode(safeName, StandardCharsets.UTF_8.name()).replace("+", "%20");
            return "inline; filename=\"" + asciiFallback + "\"; filename*=UTF-8''" + encoded;
        } catch (UnsupportedEncodingException e) {
            throw new IllegalStateException("UTF-8 encoding not supported", e);
        }
    }

    private String toAsciiFallbackFileName(String fileName) {
        int dot = fileName.lastIndexOf('.');
        String ext = dot >= 0 ? fileName.substring(dot).replaceAll("[^a-zA-Z0-9._-]", "") : "";
        return "attachment" + ext;
    }

    private Map<Long, ExpenseReimbursement> loadHeaderMap(List<ExpenseReimbursementItem> items) {
        if (items == null || items.isEmpty()) {
            return Collections.emptyMap();
        }
        Set<Long> reimbursementIds = items.stream()
                .map(ExpenseReimbursementItem::getReimbursementId)
                .collect(Collectors.toSet());
        List<ExpenseReimbursement> headers = reimbursementMapper.selectBatchIds(reimbursementIds);
        return headers.stream().collect(Collectors.toMap(ExpenseReimbursement::getId, h -> h));
    }

    private Map<Long, Long> loadItemCountMap(List<ExpenseReimbursementItem> items) {
        if (items == null || items.isEmpty()) {
            return Collections.emptyMap();
        }
        Set<Long> reimbursementIds = items.stream()
                .map(ExpenseReimbursementItem::getReimbursementId)
                .collect(Collectors.toSet());
        Map<Long, Long> countMap = new HashMap<>();
        for (Long reimbursementId : reimbursementIds) {
            Long count = itemMapper.selectCount(
                    new LambdaQueryWrapper<ExpenseReimbursementItem>()
                            .eq(ExpenseReimbursementItem::getReimbursementId, reimbursementId));
            countMap.put(reimbursementId, count);
        }
        return countMap;
    }

    private ExpenseReimbursementItemVO toVO(ExpenseReimbursementItem item, ExpenseReimbursement header) {
        ExpenseReimbursementItemVO vo = new ExpenseReimbursementItemVO();
        vo.setId(item.getId());
        vo.setReimbursementId(item.getReimbursementId());
        vo.setRowIndex(item.getRowIndex());
        vo.setExpenseType(item.getExpenseType());
        vo.setExpenseDate(item.getExpenseDate());
        vo.setAmount(item.getAmount());
        vo.setDescription(item.getDescription());
        vo.setInvoiceInfo(item.getInvoiceInfo());
        vo.setAttachmentInfo(item.getAttachmentInfo());
        vo.setAttachments(DingtalkAttachmentUtil.parseAttachmentFiles(item.getAttachmentFiles()));
        vo.setCreatedAt(item.getCreatedAt());
        vo.setKingdeeVoucherId(item.getKingdeeVoucherId());
        vo.setKingdeeVoucherNo(item.getKingdeeVoucherNo());
        vo.setKingdeePushError(item.getKingdeePushError());

        if (header != null) {
            vo.setProcessInstanceId(header.getProcessInstanceId());
            vo.setBusinessId(header.getBusinessId());
            vo.setTitle(header.getTitle());
            vo.setSubmitterId(header.getSubmitterId());
            vo.setSubmitterName(header.getSubmitterName());
            vo.setDepartment(header.getDepartment());
            vo.setReason(header.getReason());
            vo.setTotalAmount(header.getTotalAmount());
            vo.setBankAccount(header.getBankAccount());
            vo.setBankName(header.getBankName());
            vo.setCompanyName(header.getCompanyName());
            vo.setApprovalUrl(header.getApprovalUrl());
            vo.setSubmitTime(header.getSubmitTime());
            vo.setFinishTime(header.getFinishTime());
            vo.setApprovalResult(header.getApprovalResult());
        }
        return vo;
    }
}
