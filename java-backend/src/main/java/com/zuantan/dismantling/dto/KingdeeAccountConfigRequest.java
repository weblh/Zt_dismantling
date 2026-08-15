package com.zuantan.dismantling.dto;

import javax.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class KingdeeAccountConfigRequest {

    @NotBlank(message = "账号名称不能为空")
    private String accountName;

    @NotBlank(message = "金蝶地址不能为空")
    private String kingdeeUrl;

    @NotBlank(message = "账套ID不能为空")
    private String dbId;

    @NotBlank(message = "用户名不能为空")
    private String username;

    private String password;

    private String orgCompanyCode;

    private String useOrgCode;

    private String defaultFormId;

    private String defaultAccountingPeriod;

    private Integer isDefault;

    private Integer status;

    private String description;
}
