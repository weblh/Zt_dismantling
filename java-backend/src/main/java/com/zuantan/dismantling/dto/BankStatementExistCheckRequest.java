package com.zuantan.dismantling.dto;

import java.util.List;

public class BankStatementExistCheckRequest {

    private List<Long> ids;
    private Long accountId;
    private String bankSource;
    private List<String> accountingPeriods;

    public List<Long> getIds() {
        return ids;
    }

    public void setIds(List<Long> ids) {
        this.ids = ids;
    }

    public Long getAccountId() {
        return accountId;
    }

    public void setAccountId(Long accountId) {
        this.accountId = accountId;
    }

    public String getBankSource() {
        return bankSource;
    }

    public void setBankSource(String bankSource) {
        this.bankSource = bankSource;
    }

    public List<String> getAccountingPeriods() {
        return accountingPeriods;
    }

    public void setAccountingPeriods(List<String> accountingPeriods) {
        this.accountingPeriods = accountingPeriods;
    }
}
