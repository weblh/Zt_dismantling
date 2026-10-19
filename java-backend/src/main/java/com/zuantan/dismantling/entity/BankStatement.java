package com.zuantan.dismantling.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@TableName("bank_statement")
public class BankStatement {

    public static final String SOURCE_ICBC = "ICBC";
    public static final String SOURCE_JINSHANG = "JINSHANG";
    public static final String DIRECTION_OUT = "OUT";
    public static final String DIRECTION_IN = "IN";

    public static final String TYPE_EXPENSE = "EXPENSE";
    public static final String TYPE_REPAIR = "REPAIR";
    public static final String TYPE_MATERIAL = "MATERIAL";
    public static final String TYPE_TAX = "TAX";
    public static final String TYPE_TRANSFER = "TRANSFER";
    /** 晋商收单归集等配件销售收入 */
    public static final String TYPE_PART_INCOME = "PART_INCOME";
    /** 用途/摘要含车辆残值费，金蝶记转字 */
    public static final String TYPE_RESIDUAL_FEE = "RESIDUAL_FEE";

    @TableId(type = IdType.AUTO)
    private Long id;
    private String bankSource;
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
    private String voucherNo;
    private String counterpartyBankNo;
    private String counterpartyBankName;
    private String serialNo;
    private String currency;
    private String fingerprint;
    private String voucherType;
    private String employeeName;
    private String payeeOverride;
    private String targetBankName;
    private String suggestedVoucherType;
    private String suggestedEmployeeName;
    private String kingdeeVoucherId;
    private String kingdeeVoucherNo;
    private String kingdeePushError;
    /** 0未检查 1金蝶已存在 2不存在 */
    private Integer kingdeeExistStatus;
    private String kingdeeExistVoucherWord;
    private String kingdeeExistVoucherNo;
    private LocalDateTime kingdeeExistCheckedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getBankSource() {
        return bankSource;
    }

    public void setBankSource(String bankSource) {
        this.bankSource = bankSource;
    }

    public LocalDateTime getTradeTime() {
        return tradeTime;
    }

    public void setTradeTime(LocalDateTime tradeTime) {
        this.tradeTime = tradeTime;
    }

    public String getDirection() {
        return direction;
    }

    public void setDirection(String direction) {
        this.direction = direction;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }

    public String getCounterpartyAccount() {
        return counterpartyAccount;
    }

    public void setCounterpartyAccount(String counterpartyAccount) {
        this.counterpartyAccount = counterpartyAccount;
    }

    public String getCounterpartyName() {
        return counterpartyName;
    }

    public void setCounterpartyName(String counterpartyName) {
        this.counterpartyName = counterpartyName;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }

    public String getReceiptInfo() {
        return receiptInfo;
    }

    public void setReceiptInfo(String receiptInfo) {
        this.receiptInfo = receiptInfo;
    }

    public String getVoucherNo() {
        return voucherNo;
    }

    public void setVoucherNo(String voucherNo) {
        this.voucherNo = voucherNo;
    }

    public String getCounterpartyBankNo() {
        return counterpartyBankNo;
    }

    public void setCounterpartyBankNo(String counterpartyBankNo) {
        this.counterpartyBankNo = counterpartyBankNo;
    }

    public String getCounterpartyBankName() {
        return counterpartyBankName;
    }

    public void setCounterpartyBankName(String counterpartyBankName) {
        this.counterpartyBankName = counterpartyBankName;
    }

    public String getSerialNo() {
        return serialNo;
    }

    public void setSerialNo(String serialNo) {
        this.serialNo = serialNo;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getFingerprint() {
        return fingerprint;
    }

    public void setFingerprint(String fingerprint) {
        this.fingerprint = fingerprint;
    }

    public String getVoucherType() {
        return voucherType;
    }

    public void setVoucherType(String voucherType) {
        this.voucherType = voucherType;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public String getPayeeOverride() {
        return payeeOverride;
    }

    public void setPayeeOverride(String payeeOverride) {
        this.payeeOverride = payeeOverride;
    }

    public String getTargetBankName() {
        return targetBankName;
    }

    public void setTargetBankName(String targetBankName) {
        this.targetBankName = targetBankName;
    }

    public String getSuggestedVoucherType() {
        return suggestedVoucherType;
    }

    public void setSuggestedVoucherType(String suggestedVoucherType) {
        this.suggestedVoucherType = suggestedVoucherType;
    }

    public String getSuggestedEmployeeName() {
        return suggestedEmployeeName;
    }

    public void setSuggestedEmployeeName(String suggestedEmployeeName) {
        this.suggestedEmployeeName = suggestedEmployeeName;
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

    public Integer getKingdeeExistStatus() {
        return kingdeeExistStatus;
    }

    public void setKingdeeExistStatus(Integer kingdeeExistStatus) {
        this.kingdeeExistStatus = kingdeeExistStatus;
    }

    public String getKingdeeExistVoucherWord() {
        return kingdeeExistVoucherWord;
    }

    public void setKingdeeExistVoucherWord(String kingdeeExistVoucherWord) {
        this.kingdeeExistVoucherWord = kingdeeExistVoucherWord;
    }

    public String getKingdeeExistVoucherNo() {
        return kingdeeExistVoucherNo;
    }

    public void setKingdeeExistVoucherNo(String kingdeeExistVoucherNo) {
        this.kingdeeExistVoucherNo = kingdeeExistVoucherNo;
    }

    public LocalDateTime getKingdeeExistCheckedAt() {
        return kingdeeExistCheckedAt;
    }

    public void setKingdeeExistCheckedAt(LocalDateTime kingdeeExistCheckedAt) {
        this.kingdeeExistCheckedAt = kingdeeExistCheckedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
