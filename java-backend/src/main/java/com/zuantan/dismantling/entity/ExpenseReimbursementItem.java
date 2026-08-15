package com.zuantan.dismantling.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@TableName("expense_reimbursement_item")
public class ExpenseReimbursementItem {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long reimbursementId;
    private Integer rowIndex;
    private String expenseType;
    private LocalDate expenseDate;
    private BigDecimal amount;
    private String description;
    private String invoiceInfo;
    private String attachmentInfo;
    private String attachmentFiles;
    private String rawRowJson;
    private LocalDateTime createdAt;
    private String kingdeeVoucherId;
    private String kingdeeVoucherNo;
    private String kingdeePushError;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getReimbursementId() {
        return reimbursementId;
    }

    public void setReimbursementId(Long reimbursementId) {
        this.reimbursementId = reimbursementId;
    }

    public Integer getRowIndex() {
        return rowIndex;
    }

    public void setRowIndex(Integer rowIndex) {
        this.rowIndex = rowIndex;
    }

    public String getExpenseType() {
        return expenseType;
    }

    public void setExpenseType(String expenseType) {
        this.expenseType = expenseType;
    }

    public LocalDate getExpenseDate() {
        return expenseDate;
    }

    public void setExpenseDate(LocalDate expenseDate) {
        this.expenseDate = expenseDate;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getInvoiceInfo() {
        return invoiceInfo;
    }

    public void setInvoiceInfo(String invoiceInfo) {
        this.invoiceInfo = invoiceInfo;
    }

    public String getAttachmentInfo() {
        return attachmentInfo;
    }

    public void setAttachmentInfo(String attachmentInfo) {
        this.attachmentInfo = attachmentInfo;
    }

    public String getAttachmentFiles() {
        return attachmentFiles;
    }

    public void setAttachmentFiles(String attachmentFiles) {
        this.attachmentFiles = attachmentFiles;
    }

    public String getRawRowJson() {
        return rawRowJson;
    }

    public void setRawRowJson(String rawRowJson) {
        this.rawRowJson = rawRowJson;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
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
}
