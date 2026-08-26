package com.zuantan.dismantling.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.time.LocalDateTime;

@TableName("biz_form")
public class BizForm {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long appId;
    private String code;
    private String name;
    private String schemaJson;
    private String draftSchemaJson;
    private Integer version;
    private Integer status;
    private String sourceEntryId;
    private Integer flowEnabled;
    private String flowDefinitionKey;
    private String menuGroup;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getAppId() { return appId; }
    public void setAppId(Long appId) { this.appId = appId; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSchemaJson() { return schemaJson; }
    public void setSchemaJson(String schemaJson) { this.schemaJson = schemaJson; }
    public String getDraftSchemaJson() { return draftSchemaJson; }
    public void setDraftSchemaJson(String draftSchemaJson) { this.draftSchemaJson = draftSchemaJson; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public String getSourceEntryId() { return sourceEntryId; }
    public void setSourceEntryId(String sourceEntryId) { this.sourceEntryId = sourceEntryId; }
    public Integer getFlowEnabled() { return flowEnabled; }
    public void setFlowEnabled(Integer flowEnabled) { this.flowEnabled = flowEnabled; }
    public String getFlowDefinitionKey() { return flowDefinitionKey; }
    public void setFlowDefinitionKey(String flowDefinitionKey) { this.flowDefinitionKey = flowDefinitionKey; }
    public String getMenuGroup() { return menuGroup; }
    public void setMenuGroup(String menuGroup) { this.menuGroup = menuGroup; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
