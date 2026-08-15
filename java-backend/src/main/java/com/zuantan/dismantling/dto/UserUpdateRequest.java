package com.zuantan.dismantling.dto;

import java.util.List;

public class UserUpdateRequest {

    private String nickname;
    private Integer status;
    private List<String> appPermissions;
    /** 非空时重置密码 */
    private String password;

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
}
