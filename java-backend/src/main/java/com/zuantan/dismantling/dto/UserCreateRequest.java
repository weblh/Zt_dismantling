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
}
