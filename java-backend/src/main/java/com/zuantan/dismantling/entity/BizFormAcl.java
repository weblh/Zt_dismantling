package com.zuantan.dismantling.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.time.LocalDateTime;

@TableName("biz_form_acl")
public class BizFormAcl {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long formId;
    private String principalType;
    private String principalId;
    private String perm;
    private String dataScope;
    private String fieldAclJson;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getFormId() { return formId; }
    public void setFormId(Long formId) { this.formId = formId; }
    public String getPrincipalType() { return principalType; }
    public void setPrincipalType(String principalType) { this.principalType = principalType; }
    public String getPrincipalId() { return principalId; }
    public void setPrincipalId(String principalId) { this.principalId = principalId; }
    public String getPerm() { return perm; }
    public void setPerm(String perm) { this.perm = perm; }
    public String getDataScope() { return dataScope; }
    public void setDataScope(String dataScope) { this.dataScope = dataScope; }
    public String getFieldAclJson() { return fieldAclJson; }
    public void setFieldAclJson(String fieldAclJson) { this.fieldAclJson = fieldAclJson; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
