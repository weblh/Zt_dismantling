package com.zuantan.dismantling.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

/**
 * 组织内账号（钉钉同步）首次激活 / 自助设密。
 * 手机号必须已存在于 sys_user，不创建新用户。
 */
public class PhoneActivateRequest {

    @NotBlank(message = "手机号不能为空")
    private String phone;

    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 64, message = "密码长度需 6-64 位")
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
