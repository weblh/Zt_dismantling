package com.zuantan.dismantling.dto;

import java.util.ArrayList;
import java.util.List;

public class DeptVO {

    private Long id;
    private Long dingtalkDeptId;
    private String name;
    private Long parentId;
    private Long dingtalkParentId;
    private Integer sortOrder;
    private Integer status;
    private List<DeptVO> children = new ArrayList<>();

    /** Select 选项：value 用部门名称（兼容业务表单） */
    public static class Option {
        private String value;
        private String label;
        private Long dingtalkDeptId;
        private Long id;

        public String getValue() {
            return value;
        }

        public void setValue(String value) {
            this.value = value;
        }

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }

        public Long getDingtalkDeptId() {
            return dingtalkDeptId;
        }

        public void setDingtalkDeptId(Long dingtalkDeptId) {
            this.dingtalkDeptId = dingtalkDeptId;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }
    }

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

    public List<DeptVO> getChildren() {
        return children;
    }

    public void setChildren(List<DeptVO> children) {
        this.children = children;
    }
}
