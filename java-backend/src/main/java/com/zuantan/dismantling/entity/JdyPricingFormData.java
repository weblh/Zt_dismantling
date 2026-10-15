package com.zuantan.dismantling.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.time.LocalDateTime;

/** 议价应用（汽车拆解_收货议价）简道云镜像数据 */
@TableName("jdy_pricing_form_data")
public class JdyPricingFormData {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String appId;
    private String entryId;
    private String dataId;
    private String formName;
    private String creatorName;
    private String creatorUsername;
    private String jdyCreateTime;
    private String jdyUpdateTime;
    private String submitDate;
    private String rawData;
    private LocalDateTime syncedAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getAppId() { return appId; }
    public void setAppId(String appId) { this.appId = appId; }
    public String getEntryId() { return entryId; }
    public void setEntryId(String entryId) { this.entryId = entryId; }
    public String getDataId() { return dataId; }
    public void setDataId(String dataId) { this.dataId = dataId; }
    public String getFormName() { return formName; }
    public void setFormName(String formName) { this.formName = formName; }
    public String getCreatorName() { return creatorName; }
    public void setCreatorName(String creatorName) { this.creatorName = creatorName; }
    public String getCreatorUsername() { return creatorUsername; }
    public void setCreatorUsername(String creatorUsername) { this.creatorUsername = creatorUsername; }
    public String getJdyCreateTime() { return jdyCreateTime; }
    public void setJdyCreateTime(String jdyCreateTime) { this.jdyCreateTime = jdyCreateTime; }
    public String getJdyUpdateTime() { return jdyUpdateTime; }
    public void setJdyUpdateTime(String jdyUpdateTime) { this.jdyUpdateTime = jdyUpdateTime; }
    public String getSubmitDate() { return submitDate; }
    public void setSubmitDate(String submitDate) { this.submitDate = submitDate; }
    public String getRawData() { return rawData; }
    public void setRawData(String rawData) { this.rawData = rawData; }
    public LocalDateTime getSyncedAt() { return syncedAt; }
    public void setSyncedAt(LocalDateTime syncedAt) { this.syncedAt = syncedAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
