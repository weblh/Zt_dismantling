package com.zuantan.dismantling.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("dingtalk_form_config")
public class DingtalkFormConfig {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String formId;

    private String formName;

    private Integer status;

    private String description;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}