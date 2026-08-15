package com.zuantan.dismantling.vo;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class FundUsageApplicationItemVO {

    private Long id;
    private Long applicationId;
    private Integer rowIndex;
    private String businessId;
    private String submitterName;
    private String department;
    private String approvalResult;
    private String paymentType;
    private String paymentReason;
    private String paymentMethod;
    private BigDecimal amount;
    private String payeeName;
    private String payeeAccount;
    private String bankName;
    private String bankCode;
    private String kingdeeVoucherId;
    private String kingdeeVoucherNo;
    private String kingdeePushError;
    private LocalDateTime createdAt;
    private Integer applicationItemCount;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(Long applicationId) {
        this.applicationId = applicationId;
    }

    public Integer getRowIndex() {
        return rowIndex;
    }

    public void setRowIndex(Integer rowIndex) {
        this.rowIndex = rowIndex;
    }

    public String getBusinessId() {
        return businessId;
    }

    public void setBusinessId(String businessId) {
        this.businessId = businessId;
    }

    public String getSubmitterName() {
        return submitterName;
    }

    public void setSubmitterName(String submitterName) {
        this.submitterName = submitterName;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getApprovalResult() {
        return approvalResult;
    }

    public void setApprovalResult(String approvalResult) {
        this.approvalResult = approvalResult;
    }

    public String getPaymentType() {
        return paymentType;
    }

    public void setPaymentType(String paymentType) {
        this.paymentType = paymentType;
    }

    public String getPaymentReason() {
        return paymentReason;
    }

    public void setPaymentReason(String paymentReason) {
        this.paymentReason = paymentReason;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getPayeeName() {
        return payeeName;
    }

    public void setPayeeName(String payeeName) {
        this.payeeName = payeeName;
    }

    public String getPayeeAccount() {
        return payeeAccount;
    }

    public void setPayeeAccount(String payeeAccount) {
        this.payeeAccount = payeeAccount;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public String getBankCode() {
        return bankCode;
    }

    public void setBankCode(String bankCode) {
        this.bankCode = bankCode;
    }

    public String getKingdeeVoucherId() {
        return kingdeeVoucherId;
    }

    public void setKingdeeVoucherId(String kingdeeVoucherId) {
        this.kingdeeVoucherId = kingdeeVoucherId;
    }

    public String getKingdeeVoucherNo() {
        return kingdeeVoucherNo;
    }

    public void setKingdeeVoucherNo(String kingdeeVoucherNo) {
        this.kingdeeVoucherNo = kingdeeVoucherNo;
    }

    public String getKingdeePushError() {
        return kingdeePushError;
    }

    public void setKingdeePushError(String kingdeePushError) {
        this.kingdeePushError = kingdeePushError;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Integer getApplicationItemCount() {
        return applicationItemCount;
    }

    public void setApplicationItemCount(Integer applicationItemCount) {
        this.applicationItemCount = applicationItemCount;
    }
}
