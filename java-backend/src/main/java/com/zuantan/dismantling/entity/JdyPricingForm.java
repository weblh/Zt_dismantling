package com.zuantan.dismantling.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.time.LocalDateTime;

/** 议价应用（汽车拆解_收货议价）简道云表单元数据 */
@TableName("jdy_pricing_form")
public class JdyPricingForm {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String appId;
    private String entryId;
    private String formName;
    private Integer status;
    private Integer dataCount;
    private LocalDateTime lastSyncAt;
    private String lastSyncMessage;
    private String widgetSchema;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getAppId() { return appId; }
    public void setAppId(String appId) { this.appId = appId; }
    public String getEntryId() { return entryId; }
    public void setEntryId(String entryId) { this.entryId = entryId; }
    public String getFormName() { return formName; }
    public void setFormName(String formName) { this.formName = formName; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public Integer getDataCount() { return dataCount; }
    public void setDataCount(Integer dataCount) { this.dataCount = dataCount; }
    public LocalDateTime getLastSyncAt() { return lastSyncAt; }
    public void setLastSyncAt(LocalDateTime lastSyncAt) { this.lastSyncAt = lastSyncAt; }
    public String getLastSyncMessage() { return lastSyncMessage; }
    public void setLastSyncMessage(String lastSyncMessage) { this.lastSyncMessage = lastSyncMessage; }
    public String getWidgetSchema() { return widgetSchema; }
    public void setWidgetSchema(String widgetSchema) { this.widgetSchema = widgetSchema; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
