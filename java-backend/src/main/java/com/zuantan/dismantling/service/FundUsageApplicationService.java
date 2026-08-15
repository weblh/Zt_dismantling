package com.zuantan.dismantling.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zuantan.dismantling.common.PageResult;
import com.zuantan.dismantling.entity.DingtalkApprovalForm;
import com.zuantan.dismantling.entity.ExpenseReimbursement;
import com.zuantan.dismantling.entity.ExpenseReimbursementItem;
import com.zuantan.dismantling.entity.FundUsageApplication;
import com.zuantan.dismantling.entity.FundUsageApplicationItem;
import com.zuantan.dismantling.mapper.DingtalkApprovalFormMapper;
import com.zuantan.dismantling.mapper.ExpenseReimbursementItemMapper;
import com.zuantan.dismantling.mapper.ExpenseReimbursementMapper;
import com.zuantan.dismantling.mapper.FundUsageApplicationItemMapper;
import com.zuantan.dismantling.mapper.FundUsageApplicationMapper;
import com.zuantan.dismantling.util.DingtalkFormType;
import com.zuantan.dismantling.vo.FundUsageApplicationItemVO;
import com.zuantan.dismantling.vo.FundUsageApplicationVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class FundUsageApplicationService {

    private static final Logger log = LoggerFactory.getLogger(FundUsageApplicationService.class);

    private final FundUsageApplicationMapper applicationMapper;
    private final FundUsageApplicationItemMapper itemMapper;
    private final ExpenseReimbursementMapper expenseReimbursementMapper;
    private final ExpenseReimbursementItemMapper expenseReimbursementItemMapper;
    private final DingtalkApprovalFormMapper approvalFormMapper;
    private final FundUsageApplicationFormParser formParser;

    public FundUsageApplicationService(FundUsageApplicationMapper applicationMapper,
                                       FundUsageApplicationItemMapper itemMapper,
                                       ExpenseReimbursementMapper expenseReimbursementMapper,
                                       ExpenseReimbursementItemMapper expenseReimbursementItemMapper,
                                       DingtalkApprovalFormMapper approvalFormMapper,
                                       FundUsageApplicationFormParser formParser) {
        this.applicationMapper = applicationMapper;
        this.itemMapper = itemMapper;
        this.expenseReimbursementMapper = expenseReimbursementMapper;
        this.expenseReimbursementItemMapper = expenseReimbursementItemMapper;
        this.approvalFormMapper = approvalFormMapper;
        this.formParser = formParser;
    }

    @Transactional
    public void saveFromApprovalForm(DingtalkApprovalForm approvalForm) {
        if (approvalForm == null || !StringUtils.hasText(approvalForm.getProcessInstanceId())) {
            return;
        }
        if (!DingtalkFormType.isFundUsageApplication(approvalForm)) {
            return;
        }

        removeMisplacedExpenseRecord(approvalForm.getProcessInstanceId());

        FundUsageApplicationFormParser.ParsedApplication parsed = formParser.parse(approvalForm);
        FundUsageApplication header = parsed.getHeader();

        LambdaQueryWrapper<FundUsageApplication> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(FundUsageApplication::getProcessInstanceId, approvalForm.getProcessInstanceId());
        FundUsageApplication existing = applicationMapper.selectOne(wrapper);

        if (existing != null) {
            header.setId(existing.getId());
            header.setCreatedAt(existing.getCreatedAt());
            applicationMapper.updateById(header);

            LambdaQueryWrapper<FundUsageApplicationItem> itemDeleteWrapper = new LambdaQueryWrapper<>();
            itemDeleteWrapper.eq(FundUsageApplicationItem::getApplicationId, existing.getId());
            itemMapper.delete(itemDeleteWrapper);
        } else {
            applicationMapper.insert(header);
        }

        for (FundUsageApplicationItem item : parsed.getItems()) {
            item.setApplicationId(header.getId());
            itemMapper.insert(item);
        }

        log.info("资金使用申请结构化入库完成: processInstanceId={}, itemCount={}",
                approvalForm.getProcessInstanceId(), parsed.getItems().size());
    }

    @Transactional
    public int reparseAllFromApprovalForms() {
        List<DingtalkApprovalForm> forms = approvalFormMapper.selectList(null);
        int count = 0;
        for (DingtalkApprovalForm form : forms) {
            if (DingtalkFormType.isFundUsageApplication(form)) {
                saveFromApprovalForm(form);
                count++;
            }
        }
        log.info("资金使用申请数据重新解析完成: count={}", count);
        return count;
    }

    public PageResult<List<FundUsageApplicationItemVO>> listItems(int pageNo, int pageSize,
                                                                  String businessId,
                                                                  String submitterName,
                                                                  String paymentType) {
        Set<Long> filteredApplicationIds = null;
        if (StringUtils.hasText(businessId) || StringUtils.hasText(submitterName)) {
            LambdaQueryWrapper<FundUsageApplication> headerWrapper = new LambdaQueryWrapper<>();
            if (StringUtils.hasText(businessId)) {
                headerWrapper.like(FundUsageApplication::getBusinessId, businessId);
            }
            if (StringUtils.hasText(submitterName)) {
                headerWrapper.like(FundUsageApplication::getSubmitterName, submitterName);
            }
            List<FundUsageApplication> headers = applicationMapper.selectList(headerWrapper);
            filteredApplicationIds = headers.stream()
                    .map(FundUsageApplication::getId)
                    .collect(Collectors.toSet());
            if (filteredApplicationIds.isEmpty()) {
                return new PageResult<>(0L, Collections.emptyList());
            }
        }

        Page<FundUsageApplicationItem> page = new Page<>(pageNo, pageSize);
        LambdaQueryWrapper<FundUsageApplicationItem> itemWrapper = new LambdaQueryWrapper<>();
        if (filteredApplicationIds != null) {
            itemWrapper.in(FundUsageApplicationItem::getApplicationId, filteredApplicationIds);
        }
        if (StringUtils.hasText(paymentType)) {
            itemWrapper.like(FundUsageApplicationItem::getPaymentType, paymentType);
        }
        itemWrapper.orderByDesc(FundUsageApplicationItem::getCreatedAt);
        Page<FundUsageApplicationItem> result = itemMapper.selectPage(page, itemWrapper);

        Map<Long, FundUsageApplication> headerMap = loadHeaderMap(result.getRecords());
        Map<Long, Long> itemCountMap = loadItemCountMap(result.getRecords());
        List<FundUsageApplicationItemVO> records = new ArrayList<>();
        for (FundUsageApplicationItem item : result.getRecords()) {
            FundUsageApplicationItemVO vo = toItemVO(item, headerMap.get(item.getApplicationId()));
            Long count = itemCountMap.get(item.getApplicationId());
            if (count != null) {
                vo.setApplicationItemCount(count.intValue());
            }
            records.add(vo);
        }
        return new PageResult<>(result.getTotal(), records);
    }

    public FundUsageApplicationItemVO getItemDetail(Long id) {
        FundUsageApplicationItem item = itemMapper.selectById(id);
        if (item == null) {
            throw new RuntimeException("资金使用申请明细不存在");
        }
        FundUsageApplication header = applicationMapper.selectById(item.getApplicationId());
        FundUsageApplicationItemVO vo = toItemVO(item, header);
        Long count = itemMapper.selectCount(
                new LambdaQueryWrapper<FundUsageApplicationItem>()
                        .eq(FundUsageApplicationItem::getApplicationId, item.getApplicationId()));
        vo.setApplicationItemCount(count.intValue());
        return vo;
    }

    public List<FundUsageApplicationItemVO> listItemsByApplicationId(Long applicationId) {
        FundUsageApplication header = applicationMapper.selectById(applicationId);
        if (header == null) {
            throw new RuntimeException("资金使用申请不存在");
        }
        List<FundUsageApplicationItem> items = itemMapper.selectList(
                new LambdaQueryWrapper<FundUsageApplicationItem>()
                        .eq(FundUsageApplicationItem::getApplicationId, applicationId)
                        .orderByAsc(FundUsageApplicationItem::getRowIndex)
                        .orderByAsc(FundUsageApplicationItem::getId));
        int count = items.size();
        List<FundUsageApplicationItemVO> records = new ArrayList<>();
        for (FundUsageApplicationItem item : items) {
            FundUsageApplicationItemVO vo = toItemVO(item, header);
            vo.setApplicationItemCount(count);
            records.add(vo);
        }
        return records;
    }

    private Map<Long, FundUsageApplication> loadHeaderMap(List<FundUsageApplicationItem> items) {
        Map<Long, FundUsageApplication> headerMap = new HashMap<>();
        if (items == null || items.isEmpty()) {
            return headerMap;
        }
        Set<Long> applicationIds = items.stream()
                .map(FundUsageApplicationItem::getApplicationId)
                .collect(Collectors.toSet());
        List<FundUsageApplication> headers = applicationMapper.selectBatchIds(applicationIds);
        for (FundUsageApplication header : headers) {
            headerMap.put(header.getId(), header);
        }
        return headerMap;
    }

    private Map<Long, Long> loadItemCountMap(List<FundUsageApplicationItem> items) {
        Map<Long, Long> countMap = new HashMap<>();
        if (items == null || items.isEmpty()) {
            return countMap;
        }
        Set<Long> applicationIds = items.stream()
                .map(FundUsageApplicationItem::getApplicationId)
                .collect(Collectors.toSet());
        for (Long applicationId : applicationIds) {
            Long count = itemMapper.selectCount(
                    new LambdaQueryWrapper<FundUsageApplicationItem>()
                            .eq(FundUsageApplicationItem::getApplicationId, applicationId));
            countMap.put(applicationId, count);
        }
        return countMap;
    }

    public PageResult<List<FundUsageApplicationVO>> listApplications(int pageNo, int pageSize,
                                                                     String businessId,
                                                                     String submitterName,
                                                                     String paymentType) {
        Page<FundUsageApplication> page = new Page<>(pageNo, pageSize);
        LambdaQueryWrapper<FundUsageApplication> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(businessId)) {
            wrapper.like(FundUsageApplication::getBusinessId, businessId);
        }
        if (StringUtils.hasText(submitterName)) {
            wrapper.like(FundUsageApplication::getSubmitterName, submitterName);
        }
        if (StringUtils.hasText(paymentType)) {
            wrapper.like(FundUsageApplication::getPaymentType, paymentType);
        }
        wrapper.orderByDesc(FundUsageApplication::getSubmitTime)
                .orderByDesc(FundUsageApplication::getCreatedAt);
        Page<FundUsageApplication> result = applicationMapper.selectPage(page, wrapper);

        List<FundUsageApplicationVO> records = result.getRecords().stream()
                .map(this::toListVO)
                .collect(Collectors.toList());
        return new PageResult<>(result.getTotal(), records);
    }

    public FundUsageApplicationVO getApplicationDetail(Long id) {
        FundUsageApplication header = applicationMapper.selectById(id);
        if (header == null) {
            throw new RuntimeException("资金使用申请不存在");
        }

        LambdaQueryWrapper<FundUsageApplicationItem> itemWrapper = new LambdaQueryWrapper<>();
        itemWrapper.eq(FundUsageApplicationItem::getApplicationId, id)
                .orderByAsc(FundUsageApplicationItem::getRowIndex);
        List<FundUsageApplicationItem> items = itemMapper.selectList(itemWrapper);

        FundUsageApplicationVO vo = toDetailVO(header);
        vo.setItems(items.stream().map(item -> toItemVO(item, header)).collect(Collectors.toList()));
        return vo;
    }

    private FundUsageApplicationVO toListVO(FundUsageApplication header) {
        FundUsageApplicationVO vo = new FundUsageApplicationVO();
        vo.setId(header.getId());
        vo.setProcessInstanceId(header.getProcessInstanceId());
        vo.setBusinessId(header.getBusinessId());
        vo.setTitle(header.getTitle());
        vo.setSubmitterName(header.getSubmitterName());
        vo.setDepartment(header.getDepartment());
        vo.setOriginatorDept(header.getOriginatorDept());
        vo.setPaymentType(header.getPaymentType());
        vo.setPaymentReason(header.getPaymentReason());
        vo.setTotalAmount(header.getTotalAmount());
        vo.setApprovalResult(header.getApprovalResult());
        vo.setSubmitTime(header.getSubmitTime());
        vo.setFinishTime(header.getFinishTime());
        vo.setCreatedAt(header.getCreatedAt());
        return vo;
    }

    private FundUsageApplicationVO toDetailVO(FundUsageApplication header) {
        FundUsageApplicationVO vo = toListVO(header);
        vo.setSubmitterId(header.getSubmitterId());
        vo.setTotalAmountUpper(header.getTotalAmountUpper());
        vo.setAttachmentInfo(header.getAttachmentInfo());
        vo.setApprovalUrl(header.getApprovalUrl());
        return vo;
    }

    private FundUsageApplicationItemVO toItemVO(FundUsageApplicationItem item, FundUsageApplication header) {
        FundUsageApplicationItemVO vo = new FundUsageApplicationItemVO();
        vo.setId(item.getId());
        vo.setApplicationId(item.getApplicationId());
        vo.setRowIndex(item.getRowIndex());
        if (header != null) {
            vo.setBusinessId(header.getBusinessId());
            vo.setSubmitterName(header.getSubmitterName());
            vo.setDepartment(header.getDepartment());
            vo.setApprovalResult(header.getApprovalResult());
        }
        vo.setPaymentType(item.getPaymentType());
        vo.setPaymentReason(item.getPaymentReason());
        vo.setPaymentMethod(item.getPaymentMethod());
        vo.setAmount(item.getAmount());
        vo.setPayeeName(item.getPayeeName());
        vo.setPayeeAccount(item.getPayeeAccount());
        vo.setBankName(item.getBankName());
        vo.setBankCode(item.getBankCode());
        vo.setKingdeeVoucherId(item.getKingdeeVoucherId());
        vo.setKingdeeVoucherNo(item.getKingdeeVoucherNo());
        vo.setKingdeePushError(item.getKingdeePushError());
        vo.setCreatedAt(item.getCreatedAt());
        return vo;
    }

    private void removeMisplacedExpenseRecord(String processInstanceId) {
        LambdaQueryWrapper<ExpenseReimbursement> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ExpenseReimbursement::getProcessInstanceId, processInstanceId);
        ExpenseReimbursement existing = expenseReimbursementMapper.selectOne(wrapper);
        if (existing == null) {
            return;
        }
        LambdaQueryWrapper<ExpenseReimbursementItem> itemWrapper = new LambdaQueryWrapper<>();
        itemWrapper.eq(ExpenseReimbursementItem::getReimbursementId, existing.getId());
        expenseReimbursementItemMapper.delete(itemWrapper);
        expenseReimbursementMapper.deleteById(existing.getId());
        log.info("已清理误入费用报销表的资金使用申请: processInstanceId={}", processInstanceId);
    }
}
