package com.zuantan.dismantling.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@ConfigurationProperties(prefix = "kingdee.voucher.expense-reimbursement")
public class KingdeeExpenseReimbursementVoucherProperties {

    private String formId = "GL_VOUCHER";
    private String voucherGroup = "\u94f6";
    private String voucherGroupNumber = "PZZ2";
    private String debitAccount = "2241.03";
    private String creditAccount = "1002.09";
    private String bankDimensionValue = "\u5de5\u5546\u94f6\u884c";
    private String bankDimensionNumber = "YH01";
    private String employeeDimensionKey = "FDETAILID__FFLEX7";
    private String bankDimensionKey = "FDETAILID__FFLEX14";
    private String currencyId = "PRE001";
    private String exchangeRateType = "HLTX01_SYS";
    private String exchangeRate = "1";

    public String getFormId() {
        return formId;
    }

    public void setFormId(String formId) {
        this.formId = formId;
    }

    public String getVoucherGroup() {
        return voucherGroup;
    }

    public void setVoucherGroup(String voucherGroup) {
        this.voucherGroup = voucherGroup;
    }

    public String getVoucherGroupNumber() {
        return voucherGroupNumber;
    }

    public void setVoucherGroupNumber(String voucherGroupNumber) {
        this.voucherGroupNumber = voucherGroupNumber;
    }

    public String resolveVoucherGroupNumber(String resolvedNumber) {
        if (StringUtils.hasText(resolvedNumber)) {
            return resolvedNumber.trim();
        }
        if (StringUtils.hasText(voucherGroupNumber)) {
            return voucherGroupNumber.trim();
        }
        return voucherGroup;
    }

    public String getDebitAccount() {
        return debitAccount;
    }

    public void setDebitAccount(String debitAccount) {
        this.debitAccount = debitAccount;
    }

    public String getCreditAccount() {
        return creditAccount;
    }

    public void setCreditAccount(String creditAccount) {
        this.creditAccount = creditAccount;
    }

    public String getBankDimensionValue() {
        return bankDimensionValue;
    }

    public void setBankDimensionValue(String bankDimensionValue) {
        this.bankDimensionValue = bankDimensionValue;
    }

    public String getBankDimensionNumber() {
        return bankDimensionNumber;
    }

    public void setBankDimensionNumber(String bankDimensionNumber) {
        this.bankDimensionNumber = bankDimensionNumber;
    }

    public String resolveBankDimensionNumber(String resolvedNumber) {
        if (StringUtils.hasText(resolvedNumber)) {
            return resolvedNumber.trim();
        }
        if (StringUtils.hasText(bankDimensionNumber)) {
            return bankDimensionNumber.trim();
        }
        return null;
    }

    public String getEmployeeDimensionKey() {
        return employeeDimensionKey;
    }

    public void setEmployeeDimensionKey(String employeeDimensionKey) {
        this.employeeDimensionKey = employeeDimensionKey;
    }

    public String getBankDimensionKey() {
        return bankDimensionKey;
    }

    public void setBankDimensionKey(String bankDimensionKey) {
        this.bankDimensionKey = bankDimensionKey;
    }

    public String getCurrencyId() {
        return currencyId;
    }

    public void setCurrencyId(String currencyId) {
        this.currencyId = currencyId;
    }

    public String getExchangeRateType() {
        return exchangeRateType;
    }

    public void setExchangeRateType(String exchangeRateType) {
        this.exchangeRateType = exchangeRateType;
    }

    public String getExchangeRate() {
        return exchangeRate;
    }

    public void setExchangeRate(String exchangeRate) {
        this.exchangeRate = exchangeRate;
    }
}