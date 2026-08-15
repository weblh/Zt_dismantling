package com.zuantan.dismantling.util;

import com.zuantan.dismantling.entity.DingtalkApprovalForm;
import org.springframework.util.StringUtils;

public final class DingtalkFormType {

    public static final String EXPENSE_REIMBURSEMENT_PROCESS_CODE = "PROC-0489BF13-C81F-475C-A9AD-5DA75723C2BD";
    public static final String FUND_USAGE_PROCESS_CODE = "PROC-7CE13F4F-CCE0-4D21-9288-907C82977140";

    private DingtalkFormType() {
    }

    public static boolean isFundUsageApplication(DingtalkApprovalForm form) {
        if (form == null) {
            return false;
        }
        if (FUND_USAGE_PROCESS_CODE.equals(form.getProcessCode())) {
            return true;
        }
        String title = form.getTitle();
        return StringUtils.hasText(title) && title.contains("资金使用申请");
    }

    public static boolean isExpenseReimbursement(DingtalkApprovalForm form) {
        if (form == null) {
            return false;
        }
        if (EXPENSE_REIMBURSEMENT_PROCESS_CODE.equals(form.getProcessCode())) {
            return true;
        }
        String title = form.getTitle();
        return StringUtils.hasText(title) && title.contains("费用报销");
    }
}
