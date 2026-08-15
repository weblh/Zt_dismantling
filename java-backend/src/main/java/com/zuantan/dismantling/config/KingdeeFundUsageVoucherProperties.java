package com.zuantan.dismantling.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
@ConfigurationProperties(prefix = "kingdee.voucher.fund-usage")
public class KingdeeFundUsageVoucherProperties {

    private String formId = "GL_VOUCHER";
    private String voucherGroup = "\u94f6";
    private String voucherGroupNumber = "PZZ2";
    private String creditAccount = "1002.09";
    private String bankDimensionNumber = "YH01";
    private String bankDimensionKey = "FDETAILID__FFLEX14";
    private String supplierDimensionKey = "FDETAILID__FFLEX4";
    private String currencyId = "PRE001";
    private String exchangeRateType = "HLTX01_SYS";
    private String exchangeRate = "1";

    private String repairDebitAccount = "2241.02";
    private String materialDebitAccount = "2202.02";
    private String taxDebitAccount = "2221.16";
    private String transferDebitAccount = "1002.14";

    private Map<String, String> transferBankDebitAccountMap = new LinkedHashMap<>();

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

    public String getCreditAccount() {
        return creditAccount;
    }

    public void setCreditAccount(String creditAccount) {
        this.creditAccount = creditAccount;
    }

    public String getBankDimensionNumber() {
        return bankDimensionNumber;
    }

    public void setBankDimensionNumber(String bankDimensionNumber) {
        this.bankDimensionNumber = bankDimensionNumber;
    }

    public String resolveBankDimensionNumber() {
        if (StringUtils.hasText(bankDimensionNumber)) {
            return bankDimensionNumber.trim();
        }
        return null;
    }

    public String getBankDimensionKey() {
        return bankDimensionKey;
    }

    public void setBankDimensionKey(String bankDimensionKey) {
        this.bankDimensionKey = bankDimensionKey;
    }

    public String getSupplierDimensionKey() {
        return supplierDimensionKey;
    }

    public void setSupplierDimensionKey(String supplierDimensionKey) {
        this.supplierDimensionKey = supplierDimensionKey;
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

    public String getRepairDebitAccount() {
        return repairDebitAccount;
    }

    public void setRepairDebitAccount(String repairDebitAccount) {
        this.repairDebitAccount = repairDebitAccount;
    }

    public String getMaterialDebitAccount() {
        return materialDebitAccount;
    }

    public void setMaterialDebitAccount(String materialDebitAccount) {
        this.materialDebitAccount = materialDebitAccount;
    }

    public String getTaxDebitAccount() {
        return taxDebitAccount;
    }

    public void setTaxDebitAccount(String taxDebitAccount) {
        this.taxDebitAccount = taxDebitAccount;
    }

    public String getTransferDebitAccount() {
        return transferDebitAccount;
    }

    public void setTransferDebitAccount(String transferDebitAccount) {
        this.transferDebitAccount = transferDebitAccount;
    }

    public Map<String, String> getTransferBankDebitAccountMap() {
        return transferBankDebitAccountMap;
    }

    public void setTransferBankDebitAccountMap(Map<String, String> transferBankDebitAccountMap) {
        this.transferBankDebitAccountMap = transferBankDebitAccountMap;
    }

    public String resolveTransferDebitAccount(String bankName) {
        if (StringUtils.hasText(bankName) && transferBankDebitAccountMap != null) {
            for (Map.Entry<String, String> entry : transferBankDebitAccountMap.entrySet()) {
                if (bankName.contains(entry.getKey()) && StringUtils.hasText(entry.getValue())) {
                    return entry.getValue().trim();
                }
            }
        }
        return transferDebitAccount;
    }
}
