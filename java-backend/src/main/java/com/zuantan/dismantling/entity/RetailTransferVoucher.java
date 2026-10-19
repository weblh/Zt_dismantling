package com.zuantan.dismantling.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("retail_transfer_voucher")
public class RetailTransferVoucher {

    public static final String DIRECTION_OUT = "OUT";
    public static final String DIRECTION_IN = "IN";

    @TableId(type = IdType.AUTO)
    private Long id;
    private LocalDateTime tradeTime;
    private String direction;
    private BigDecimal amount;
    private BigDecimal balance;
    private String counterpartyAccount;
    private String counterpartyName;
    private String purpose;
    private String summary;
    private String remark;
    private String receiptInfo;
    private String serialNo;
    private String fingerprint;
    /** 1 个人散户（货款/定金/收车） */
    private Integer retailFlag;
    private String kingdeeVoucherId;
    private String kingdeeVoucherNo;
    /** 0未检查 1金蝶已有转字 2未找到 */
    private Integer kingdeeExistStatus;
    private String kingdeeExistVoucherWord;
    private String kingdeeExistVoucherNo;
    private LocalDateTime kingdeeExistCheckedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
