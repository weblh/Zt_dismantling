package com.zuantan.dismantling.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.time.LocalDateTime;

@TableName("biz_flow_cc")
public class BizFlowCc {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long formDataId;
    private String processInstanceId;
    private Long userId;
    private String dingtalkUserid;
    private Integer readFlag;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getFormDataId() { return formDataId; }
    public void setFormDataId(Long formDataId) { this.formDataId = formDataId; }
    public String getProcessInstanceId() { return processInstanceId; }
    public void setProcessInstanceId(String processInstanceId) { this.processInstanceId = processInstanceId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getDingtalkUserid() { return dingtalkUserid; }
    public void setDingtalkUserid(String dingtalkUserid) { this.dingtalkUserid = dingtalkUserid; }
    public Integer getReadFlag() { return readFlag; }
    public void setReadFlag(Integer readFlag) { this.readFlag = readFlag; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
