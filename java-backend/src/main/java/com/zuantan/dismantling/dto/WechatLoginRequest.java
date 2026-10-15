package com.zuantan.dismantling.dto;

import javax.validation.constraints.NotBlank;

public class WechatLoginRequest {

    @NotBlank(message = "微信 code 不能为空")
    private String code;

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}
