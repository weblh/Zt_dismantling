package com.zuantan.dismantling.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("kingdee_account_config")
public class KingdeeAccountConfig {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String accountName;

    private String kingdeeUrl;

    private String dbId;

    private String username;

    private String password;

    private String orgCompanyCode;

    private String useOrgCode;

    private String defaultFormId;

    private String defaultAccountingPeriod;

    private Integer isDefault;

    private Integer status;

    private String description;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
