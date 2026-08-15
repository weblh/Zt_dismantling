package com.zuantan.dismantling.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zuantan.dismantling.entity.DingtalkApprovalForm;
import com.zuantan.dismantling.entity.ExpenseReimbursement;
import com.zuantan.dismantling.entity.ExpenseReimbursementItem;
import com.zuantan.dismantling.mapper.DingtalkApprovalFormMapper;
import com.zuantan.dismantling.mapper.ExpenseReimbursementItemMapper;
import com.zuantan.dismantling.mapper.ExpenseReimbursementMapper;
import com.zuantan.dismantling.util.DingtalkFormType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;

@Component
public class DingtalkApprovalStartupSync implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DingtalkApprovalStartupSync.class);

    private final DingtalkApprovalFormMapper approvalFormMapper;
    private final ExpenseReimbursementMapper reimbursementMapper;
    private final ExpenseReimbursementItemMapper itemMapper;
    private final DingtalkApprovalFormService approvalFormService;

    public DingtalkApprovalStartupSync(DingtalkApprovalFormMapper approvalFormMapper,
                                         ExpenseReimbursementMapper reimbursementMapper,
                                         ExpenseReimbursementItemMapper itemMapper,
                                         DingtalkApprovalFormService approvalFormService) {
        this.approvalFormMapper = approvalFormMapper;
        this.reimbursementMapper = reimbursementMapper;
        this.itemMapper = itemMapper;
        this.approvalFormService = approvalFormService;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            syncIncompleteApprovals();
        } catch (Exception e) {
            log.error("启动时同步钉钉审批数据失败", e);
        }
    }

    private void syncIncompleteApprovals() {
        List<DingtalkApprovalForm> forms = approvalFormMapper.selectList(null);
        int refreshed = 0;
        for (DingtalkApprovalForm form : forms) {
            if (!needsRefresh(form)) {
                continue;
            }
            try {
                approvalFormService.refreshApprovalDetail(form.getProcessInstanceId());
                refreshed++;
            } catch (Exception e) {
                log.warn("启动补全审批数据失败: processInstanceId={}", form.getProcessInstanceId(), e);
            }
        }
        if (refreshed > 0) {
            log.info("启动时已自动补全 {} 条不完整审批数据", refreshed);
        }
    }

    private boolean needsRefresh(DingtalkApprovalForm form) {
        if (form == null || !StringUtils.hasText(form.getProcessInstanceId())) {
            return false;
        }
        if (!StringUtils.hasText(form.getFormComponents()) || "[]".equals(form.getFormComponents())) {
            return true;
        }
        if (!StringUtils.hasText(form.getBusinessId())) {
            return true;
        }
        if (!DingtalkFormType.isExpenseReimbursement(form)) {
            return false;
        }
        ExpenseReimbursement reimbursement = reimbursementMapper.selectOne(
                new LambdaQueryWrapper<ExpenseReimbursement>()
                        .eq(ExpenseReimbursement::getProcessInstanceId, form.getProcessInstanceId()));
        if (reimbursement == null) {
            return true;
        }
        if (!StringUtils.hasText(reimbursement.getBankAccount())
                || !StringUtils.hasText(reimbursement.getCompanyName())) {
            return true;
        }
        Long itemCount = itemMapper.selectCount(
                new LambdaQueryWrapper<ExpenseReimbursementItem>()
                        .eq(ExpenseReimbursementItem::getReimbursementId, reimbursement.getId()));
        if (itemCount == null || itemCount == 0) {
            return true;
        }
        List<ExpenseReimbursementItem> items = itemMapper.selectList(
                new LambdaQueryWrapper<ExpenseReimbursementItem>()
                        .eq(ExpenseReimbursementItem::getReimbursementId, reimbursement.getId()));
        for (ExpenseReimbursementItem item : items) {
            if (!StringUtils.hasText(item.getAttachmentFiles())) {
                return true;
            }
        }
        return false;
    }
}
