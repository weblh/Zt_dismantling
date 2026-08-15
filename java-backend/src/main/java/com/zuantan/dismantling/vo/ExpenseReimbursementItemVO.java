package com.zuantan.dismantling.vo;



import com.zuantan.dismantling.vo.AttachmentFileVO;

import java.math.BigDecimal;

import java.time.LocalDate;

import java.time.LocalDateTime;

import java.time.LocalDateTime;

import java.util.List;



public class ExpenseReimbursementItemVO {



    private Long id;

    private Long reimbursementId;

    private Integer rowIndex;

    private String processInstanceId;

    private String businessId;

    private String title;

    private String submitterId;

    private String submitterName;

    private String department;

    private String reason;

    private BigDecimal totalAmount;

    private String bankAccount;

    private String bankName;

    private String companyName;

    private String approvalUrl;

    private LocalDateTime submitTime;

    private LocalDateTime finishTime;

    private String approvalResult;

    private String expenseType;

    private LocalDate expenseDate;

    private BigDecimal amount;

    private String description;

    private String invoiceInfo;

    private String attachmentInfo;

    private List<AttachmentFileVO> attachments;

    private LocalDateTime createdAt;

    private String kingdeeVoucherId;

    private String kingdeeVoucherNo;

    private String kingdeePushError;

    private Integer reimbursementItemCount;



    public Long getId() {

        return id;

    }



    public void setId(Long id) {

        this.id = id;

    }



    public Long getReimbursementId() {

        return reimbursementId;

    }



    public void setReimbursementId(Long reimbursementId) {

        this.reimbursementId = reimbursementId;

    }



    public Integer getRowIndex() {

        return rowIndex;

    }



    public void setRowIndex(Integer rowIndex) {

        this.rowIndex = rowIndex;

    }



    public String getProcessInstanceId() {

        return processInstanceId;

    }



    public void setProcessInstanceId(String processInstanceId) {

        this.processInstanceId = processInstanceId;

    }



    public String getBusinessId() {

        return businessId;

    }



    public void setBusinessId(String businessId) {

        this.businessId = businessId;

    }



    public String getTitle() {

        return title;

    }



    public void setTitle(String title) {

        this.title = title;

    }



    public String getSubmitterId() {

        return submitterId;

    }



    public void setSubmitterId(String submitterId) {

        this.submitterId = submitterId;

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



    public String getReason() {

        return reason;

    }



    public void setReason(String reason) {

        this.reason = reason;

    }



    public BigDecimal getTotalAmount() {

        return totalAmount;

    }



    public void setTotalAmount(BigDecimal totalAmount) {

        this.totalAmount = totalAmount;

    }



    public String getBankAccount() {

        return bankAccount;

    }



    public void setBankAccount(String bankAccount) {

        this.bankAccount = bankAccount;

    }



    public String getBankName() {

        return bankName;

    }



    public void setBankName(String bankName) {

        this.bankName = bankName;

    }



    public String getCompanyName() {

        return companyName;

    }



    public void setCompanyName(String companyName) {

        this.companyName = companyName;

    }



    public String getApprovalUrl() {

        return approvalUrl;

    }



    public void setApprovalUrl(String approvalUrl) {

        this.approvalUrl = approvalUrl;

    }



    public LocalDateTime getSubmitTime() {

        return submitTime;

    }



    public void setSubmitTime(LocalDateTime submitTime) {

        this.submitTime = submitTime;

    }



    public LocalDateTime getFinishTime() {

        return finishTime;

    }



    public void setFinishTime(LocalDateTime finishTime) {

        this.finishTime = finishTime;

    }



    public String getApprovalResult() {

        return approvalResult;

    }



    public void setApprovalResult(String approvalResult) {

        this.approvalResult = approvalResult;

    }



    public String getExpenseType() {

        return expenseType;

    }



    public void setExpenseType(String expenseType) {

        this.expenseType = expenseType;

    }



    public LocalDate getExpenseDate() {

        return expenseDate;

    }



    public void setExpenseDate(LocalDate expenseDate) {

        this.expenseDate = expenseDate;

    }



    public BigDecimal getAmount() {

        return amount;

    }



    public void setAmount(BigDecimal amount) {

        this.amount = amount;

    }



    public String getDescription() {

        return description;

    }



    public void setDescription(String description) {

        this.description = description;

    }



    public String getInvoiceInfo() {

        return invoiceInfo;

    }



    public void setInvoiceInfo(String invoiceInfo) {

        this.invoiceInfo = invoiceInfo;

    }



    public String getAttachmentInfo() {

        return attachmentInfo;

    }



    public void setAttachmentInfo(String attachmentInfo) {

        this.attachmentInfo = attachmentInfo;

    }



    public List<AttachmentFileVO> getAttachments() {

        return attachments;

    }



    public void setAttachments(List<AttachmentFileVO> attachments) {

        this.attachments = attachments;

    }



    public LocalDateTime getCreatedAt() {

        return createdAt;

    }



    public void setCreatedAt(LocalDateTime createdAt) {

        this.createdAt = createdAt;

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

    public Integer getReimbursementItemCount() {
        return reimbursementItemCount;
    }

    public void setReimbursementItemCount(Integer reimbursementItemCount) {
        this.reimbursementItemCount = reimbursementItemCount;
    }

}

