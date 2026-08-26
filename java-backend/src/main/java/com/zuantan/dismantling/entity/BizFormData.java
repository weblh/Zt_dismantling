package com.zuantan.dismantling.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.time.LocalDateTime;

@TableName("biz_form_data")
public class BizFormData {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long formId;
    private String dataUuid;
    private String dataJson;
    private String flowState;
    private String processInstanceId;
    private Long creatorUserId;
    private String creatorDingId;
    private String creatorName;
    private String deptIds;
    private String sourceJdyDataId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getFormId() { return formId; }
    public void setFormId(Long formId) { this.formId = formId; }
    public String getDataUuid() { return dataUuid; }
    public void setDataUuid(String dataUuid) { this.dataUuid = dataUuid; }
    public String getDataJson() { return dataJson; }
    public void setDataJson(String dataJson) { this.dataJson = dataJson; }
    public String getFlowState() { return flowState; }
    public void setFlowState(String flowState) { this.flowState = flowState; }
    public String getProcessInstanceId() { return processInstanceId; }
    public void setProcessInstanceId(String processInstanceId) { this.processInstanceId = processInstanceId; }
    public Long getCreatorUserId() { return creatorUserId; }
    public void setCreatorUserId(Long creatorUserId) { this.creatorUserId = creatorUserId; }
    public String getCreatorDingId() { return creatorDingId; }
    public void setCreatorDingId(String creatorDingId) { this.creatorDingId = creatorDingId; }
    public String getCreatorName() { return creatorName; }
    public void setCreatorName(String creatorName) { this.creatorName = creatorName; }
    public String getDeptIds() { return deptIds; }
    public void setDeptIds(String deptIds) { this.deptIds = deptIds; }
    public String getSourceJdyDataId() { return sourceJdyDataId; }
    public void setSourceJdyDataId(String sourceJdyDataId) { this.sourceJdyDataId = sourceJdyDataId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
