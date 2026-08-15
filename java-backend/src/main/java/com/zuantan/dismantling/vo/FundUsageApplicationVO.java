package com.zuantan.dismantling.vo;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class FundUsageApplicationVO {

    private Long id;
    private String processInstanceId;
    private String businessId;
    private String title;
    private String submitterId;
    private String submitterName;
    private String department;
    private String originatorDept;
    private String paymentType;
    private String paymentReason;
    private BigDecimal totalAmount;
    private String totalAmountUpper;
    private String attachmentInfo;
    private String approvalUrl;
    private LocalDateTime submitTime;
    private LocalDateTime finishTime;
    private String approvalResult;
    private LocalDateTime createdAt;
    private List<FundUsageApplicationItemVO> items;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getOriginatorDept() {
        return originatorDept;
    }

    public void setOriginatorDept(String originatorDept) {
        this.originatorDept = originatorDept;
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

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getTotalAmountUpper() {
        return totalAmountUpper;
    }

    public void setTotalAmountUpper(String totalAmountUpper) {
        this.totalAmountUpper = totalAmountUpper;
    }

    public String getAttachmentInfo() {
        return attachmentInfo;
    }

    public void setAttachmentInfo(String attachmentInfo) {
        this.attachmentInfo = attachmentInfo;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<FundUsageApplicationItemVO> getItems() {
        return items;
    }

    public void setItems(List<FundUsageApplicationItemVO> items) {
        this.items = items;
    }
}
