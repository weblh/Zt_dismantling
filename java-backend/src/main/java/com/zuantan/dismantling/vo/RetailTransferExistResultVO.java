package com.zuantan.dismantling.vo;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class RetailTransferExistResultVO {
    private int total;
    private int existsCount;
    private int notExistsCount;
    private int uncheckedCount;
    private List<String> periodsQueried = new ArrayList<>();
    private int kingdeeEntryCount;
    private List<Item> items = new ArrayList<>();

    @Data
    public static class Item {
        private Long id;
        private String tradeTime;
        private String counterpartyName;
        private String amountSide;
        private String amount;
        private Integer kingdeeExistStatus;
        private String kingdeeExistVoucherWord;
        private String kingdeeExistVoucherNo;
        private String message;
    }
}
