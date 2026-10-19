package com.zuantan.dismantling.vo;

import java.util.ArrayList;
import java.util.List;

public class BankStatementKingdeeExistResultVO {

    private int total;
    private int existsCount;
    private int notExistsCount;
    private int uncheckedCount;
    private List<String> periodsQueried = new ArrayList<>();
    private int kingdeeEntryCount;
    private List<Item> items = new ArrayList<>();

    public int getTotal() {
        return total;
    }

    public void setTotal(int total) {
        this.total = total;
    }

    public int getExistsCount() {
        return existsCount;
    }

    public void setExistsCount(int existsCount) {
        this.existsCount = existsCount;
    }

    public int getNotExistsCount() {
        return notExistsCount;
    }

    public void setNotExistsCount(int notExistsCount) {
        this.notExistsCount = notExistsCount;
    }

    public int getUncheckedCount() {
        return uncheckedCount;
    }

    public void setUncheckedCount(int uncheckedCount) {
        this.uncheckedCount = uncheckedCount;
    }

    public List<String> getPeriodsQueried() {
        return periodsQueried;
    }

    public void setPeriodsQueried(List<String> periodsQueried) {
        this.periodsQueried = periodsQueried;
    }

    public int getKingdeeEntryCount() {
        return kingdeeEntryCount;
    }

    public void setKingdeeEntryCount(int kingdeeEntryCount) {
        this.kingdeeEntryCount = kingdeeEntryCount;
    }

    public List<Item> getItems() {
        return items;
    }

    public void setItems(List<Item> items) {
        this.items = items;
    }

    public static class Item {
        private Long id;
        private String bankSource;
        private String tradeTime;
        private String serialNo;
        private String counterpartyName;
        /** 业务类型，残值费等查重前会按摘要自动识别 */
        private String voucherType;
        private String amountSide;
        private String amount;
        /** 1金蝶已存在 2不存在 0未检查 */
        private Integer kingdeeExistStatus;
        private String kingdeeExistVoucherWord;
        private String kingdeeExistVoucherNo;
        private String message;

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

        public String getTradeTime() {
            return tradeTime;
        }

        public void setTradeTime(String tradeTime) {
            this.tradeTime = tradeTime;
        }

        public String getSerialNo() {
            return serialNo;
        }

        public void setSerialNo(String serialNo) {
            this.serialNo = serialNo;
        }

        public String getCounterpartyName() {
            return counterpartyName;
        }

        public void setCounterpartyName(String counterpartyName) {
            this.counterpartyName = counterpartyName;
        }

        public String getVoucherType() {
            return voucherType;
        }

        public void setVoucherType(String voucherType) {
            this.voucherType = voucherType;
        }

        public String getAmountSide() {
            return amountSide;
        }

        public void setAmountSide(String amountSide) {
            this.amountSide = amountSide;
        }

        public String getAmount() {
            return amount;
        }

        public void setAmount(String amount) {
            this.amount = amount;
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

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}
