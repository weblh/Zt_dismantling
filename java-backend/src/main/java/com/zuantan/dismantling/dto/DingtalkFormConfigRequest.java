package com.zuantan.dismantling.dto;

import javax.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DingtalkFormConfigRequest {

    @NotBlank(message = "表单ID不能为空")
    private String formId;

    private String formName;

    private Integer status;

    private String description;
}