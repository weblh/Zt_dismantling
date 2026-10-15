package com.zuantan.dismantling.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.time.LocalDateTime;

@TableName("sys_dept")
public class SysDept {

    @TableId(type = IdType.AUTO)
    private Long id;
    /** 钉钉部门 ID */
    private Long dingtalkDeptId;
    private String name;
    /** 本地父部门 id，根为 null */
    private Long parentId;
    /** 钉钉父部门 ID，根一般为 1 */
    private Long dingtalkParentId;
    private Integer sortOrder;
    /** 1 启用 0 停用（同步时钉钉已删则置 0） */
    private Integer status;
    private LocalDateTime syncedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDingtalkDeptId() {
        return dingtalkDeptId;
    }

    public void setDingtalkDeptId(Long dingtalkDeptId) {
        this.dingtalkDeptId = dingtalkDeptId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getParentId() {
        return parentId;
    }

    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }

    public Long getDingtalkParentId() {
        return dingtalkParentId;
    }

    public void setDingtalkParentId(Long dingtalkParentId) {
        this.dingtalkParentId = dingtalkParentId;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public LocalDateTime getSyncedAt() {
        return syncedAt;
    }

    public void setSyncedAt(LocalDateTime syncedAt) {
        this.syncedAt = syncedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
