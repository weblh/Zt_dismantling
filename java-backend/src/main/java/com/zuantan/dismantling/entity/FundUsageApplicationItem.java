package com.zuantan.dismantling.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@TableName("fund_usage_application_item")
public class FundUsageApplicationItem {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long applicationId;
    private Integer rowIndex;
    private String paymentType;
    private String paymentReason;
    private String paymentMethod;
    private BigDecimal amount;
    private String payeeName;
    private String payeeAccount;
    private String bankName;
    private String bankCode;
    private String rawRowJson;
    private String kingdeeVoucherId;
    private String kingdeeVoucherNo;
    private String kingdeePushError;
    private LocalDateTime createdAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(Long applicationId) {
        this.applicationId = applicationId;
    }

    public Integer getRowIndex() {
        return rowIndex;
    }

    public void setRowIndex(Integer rowIndex) {
        this.rowIndex = rowIndex;
    }

    public String getPaymentType() {
        return paymentType;
    }

    public void setPaymentType(String paymentType) {
        this.paymentType = paymentType;
    }

    public String getPaymentReason() {
        return paymentReason;
    }

    public void setPaymentReason(String paymentReason) {
        this.paymentReason = paymentReason;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getPayeeName() {
        return payeeName;
    }

    public void setPayeeName(String payeeName) {
        this.payeeName = payeeName;
    }

    public String getPayeeAccount() {
        return payeeAccount;
    }

    public void setPayeeAccount(String payeeAccount) {
        this.payeeAccount = payeeAccount;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public String getBankCode() {
        return bankCode;
    }

    public void setBankCode(String bankCode) {
        this.bankCode = bankCode;
    }

    public String getRawRowJson() {
        return rawRowJson;
    }

    public void setRawRowJson(String rawRowJson) {
        this.rawRowJson = rawRowJson;
    }

    public String getKingdeeVoucherId() {
        return kingdeeVoucherId;
    }

    public void setKingdeeVoucherId(String kingdeeVoucherId) {
        this.kingdeeVoucherId = kingdeeVoucherId;
    }

    public String getKingdeeVoucherNo() {
        return kingdeeVoucherNo;
    }

    public void setKingdeeVoucherNo(String kingdeeVoucherNo) {
        this.kingdeeVoucherNo = kingdeeVoucherNo;
    }

    public String getKingdeePushError() {
        return kingdeePushError;
    }

    public void setKingdeePushError(String kingdeePushError) {
        this.kingdeePushError = kingdeePushError;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
