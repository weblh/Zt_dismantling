package com.zuantan.dismantling.entity;



import com.baomidou.mybatisplus.annotation.IdType;

import com.baomidou.mybatisplus.annotation.TableId;

import com.baomidou.mybatisplus.annotation.TableName;



import java.math.BigDecimal;

import java.time.LocalDateTime;



@TableName("expense_reimbursement")

public class ExpenseReimbursement {



    @TableId(type = IdType.AUTO)

    private Long id;

    private Long approvalFormId;

    private String processInstanceId;

    private String processCode;

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

    private String bizCategoryId;

    private String approvalUrl;

    private LocalDateTime submitTime;

    private LocalDateTime finishTime;

    private String approvalResult;

    private LocalDateTime createdAt;



    public Long getId() {

        return id;

    }



    public void setId(Long id) {

        this.id = id;

    }



    public Long getApprovalFormId() {

        return approvalFormId;

    }



    public void setApprovalFormId(Long approvalFormId) {

        this.approvalFormId = approvalFormId;

    }



    public String getProcessInstanceId() {

        return processInstanceId;

    }



    public void setProcessInstanceId(String processInstanceId) {

        this.processInstanceId = processInstanceId;

    }



    public String getProcessCode() {

        return processCode;

    }



    public void setProcessCode(String processCode) {

        this.processCode = processCode;

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



    public String getBizCategoryId() {

        return bizCategoryId;

    }



    public void setBizCategoryId(String bizCategoryId) {

        this.bizCategoryId = bizCategoryId;

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

}

