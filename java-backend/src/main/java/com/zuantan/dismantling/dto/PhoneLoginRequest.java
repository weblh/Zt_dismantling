package com.zuantan.dismantling.dto;

import javax.validation.constraints.NotBlank;

public class PhoneLoginRequest {

    @NotBlank(message = "账号不能为空")
    private String phone;

    @NotBlank(message = "密码不能为空")
    private String password;

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
