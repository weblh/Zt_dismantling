package com.zuantan.dismantling.entity;



import com.baomidou.mybatisplus.annotation.IdType;

import com.baomidou.mybatisplus.annotation.TableId;

import com.baomidou.mybatisplus.annotation.TableName;



import java.time.LocalDateTime;



@TableName("dingtalk_approval_form")

public class DingtalkApprovalForm {



    @TableId(type = IdType.AUTO)

    private Long id;

    private String processInstanceId;

    private String processCode;

    private String businessId;

    private String title;

    private String staffId;

    private String approvalResult;

    private String eventId;

    private String eventType;

    private String bizCategoryId;

    private String approvalUrl;

    private LocalDateTime submitTime;

    private LocalDateTime finishTime;

    private String formComponents;

    private String rawDetail;

    private String rawEvent;

    private LocalDateTime createdAt;



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



    public String getStaffId() {

        return staffId;

    }



    public void setStaffId(String staffId) {

        this.staffId = staffId;

    }



    public String getApprovalResult() {

        return approvalResult;

    }



    public void setApprovalResult(String approvalResult) {

        this.approvalResult = approvalResult;

    }



    public String getEventId() {

        return eventId;

    }



    public void setEventId(String eventId) {

        this.eventId = eventId;

    }



    public String getEventType() {

        return eventType;

    }



    public void setEventType(String eventType) {

        this.eventType = eventType;

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



    public String getFormComponents() {

        return formComponents;

    }



    public void setFormComponents(String formComponents) {

        this.formComponents = formComponents;

    }



    public String getRawDetail() {

        return rawDetail;

    }



    public void setRawDetail(String rawDetail) {

        this.rawDetail = rawDetail;

    }



    public String getRawEvent() {

        return rawEvent;

    }



    public void setRawEvent(String rawEvent) {

        this.rawEvent = rawEvent;

    }



    public LocalDateTime getCreatedAt() {

        return createdAt;

    }



    public void setCreatedAt(LocalDateTime createdAt) {

        this.createdAt = createdAt;

    }

}

