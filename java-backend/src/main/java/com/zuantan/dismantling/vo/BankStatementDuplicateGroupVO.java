package com.zuantan.dismantling.vo;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class BankStatementDuplicateGroupVO {

    private String groupType;
    private String bankSource;
    private String counterpartyName;
    private BigDecimal amount;
    private String tradeDate;
    private List<BankStatementVO> items = new ArrayList<>();

    public String getGroupType() {
        return groupType;
    }

    public void setGroupType(String groupType) {
        this.groupType = groupType;
    }

    public String getBankSource() {
        return bankSource;
    }

    public void setBankSource(String bankSource) {
        this.bankSource = bankSource;
    }

    public String getCounterpartyName() {
        return counterpartyName;
    }

    public void setCounterpartyName(String counterpartyName) {
        this.counterpartyName = counterpartyName;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getTradeDate() {
        return tradeDate;
    }

    public void setTradeDate(String tradeDate) {
        this.tradeDate = tradeDate;
    }

    public List<BankStatementVO> getItems() {
        return items;
    }

    public void setItems(List<BankStatementVO> items) {
        this.items = items;
    }
}
