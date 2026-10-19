package com.zuantan.dismantling.dto;

import java.util.List;

public class BankStatementClassifyRequest {

    private List<Long> ids;
    private String voucherType;
    private String employeeName;
    private String payeeOverride;
    private String targetBankName;

    public List<Long> getIds() {
        return ids;
    }

    public void setIds(List<Long> ids) {
        this.ids = ids;
    }

    public String getVoucherType() {
        return voucherType;
    }

    public void setVoucherType(String voucherType) {
        this.voucherType = voucherType;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public String getPayeeOverride() {
        return payeeOverride;
    }

    public void setPayeeOverride(String payeeOverride) {
        this.payeeOverride = payeeOverride;
    }

    public String getTargetBankName() {
        return targetBankName;
    }

    public void setTargetBankName(String targetBankName) {
        this.targetBankName = targetBankName;
    }
}
