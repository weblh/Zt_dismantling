package com.zuantan.dismantling.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.time.LocalDateTime;

@TableName("sys_user")
public class SysUser {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String username;
    private String password;
    private String nickname;
    /** SUPER_ADMIN / USER */
    private String role;
    /** 逗号分隔：receipt,pricing,inspection */
    private String appPermissions;
    /** 钉钉 userid（企业内部唯一） */
    private String dingtalkUserid;
    private String dingtalkUnionid;
    /** 手机号（小程序登录） */
    private String phone;
    /** 微信小程序 openid */
    private String wechatOpenid;
    private String avatar;
    /** JSON 数组字符串，钉钉部门 id 列表 */
    private String deptIds;
    private Integer status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getAppPermissions() {
        return appPermissions;
    }

    public void setAppPermissions(String appPermissions) {
        this.appPermissions = appPermissions;
    }

    public String getDingtalkUserid() {
        return dingtalkUserid;
    }

    public void setDingtalkUserid(String dingtalkUserid) {
        this.dingtalkUserid = dingtalkUserid;
    }

    public String getDingtalkUnionid() {
        return dingtalkUnionid;
    }

    public void setDingtalkUnionid(String dingtalkUnionid) {
        this.dingtalkUnionid = dingtalkUnionid;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getWechatOpenid() {
        return wechatOpenid;
    }

    public void setWechatOpenid(String wechatOpenid) {
        this.wechatOpenid = wechatOpenid;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getDeptIds() {
        return deptIds;
    }

    public void setDeptIds(String deptIds) {
        this.deptIds = deptIds;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
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
