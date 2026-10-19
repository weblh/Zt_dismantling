package com.zuantan.dismantling.dto;

import lombok.Data;

import java.util.List;

@Data
public class RetailTransferExistCheckRequest {
    private List<Long> ids;
    private Long accountId;
    private Boolean retailOnly;
}
