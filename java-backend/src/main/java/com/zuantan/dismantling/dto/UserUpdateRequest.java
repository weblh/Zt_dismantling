package com.zuantan.dismantling.dto;

import java.util.List;

public class UserUpdateRequest {

    private String nickname;
    private Integer status;
    private List<String> appPermissions;
    /** 非空时重置密码 */
    private String password;
    /** USER / INSPECTOR，不可改超管 */
    private String role;
    /** 部门名称 */
    private String department;
    /** 手机号（小程序登录） */
    private String phone;

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public List<String> getAppPermissions() {
        return appPermissions;
    }

    public void setAppPermissions(List<String> appPermissions) {
        this.appPermissions = appPermissions;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }
}
