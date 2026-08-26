package com.zuantan.dismantling.dto;

import javax.validation.constraints.NotBlank;
import java.util.List;

public class UserCreateRequest {

    @NotBlank(message = "用户名不能为空")
    private String username;

    @NotBlank(message = "密码不能为空")
    private String password;

    private String nickname;

    private List<String> appPermissions;

    private String role;

    /** 部门名称（存于 deptIds 字段，供本部门权限过滤） */
    private String department;

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

    public List<String> getAppPermissions() {
        return appPermissions;
    }

    public void setAppPermissions(List<String> appPermissions) {
        this.appPermissions = appPermissions;
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
}
