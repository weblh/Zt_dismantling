package com.zuantan.dismantling.vo;

public class KingdeeVoucherSaveResultVO {

    private String voucherId;
    private String voucherNumber;
    private String explanation;
    private String voucherGroup;
    private String savedMode;
    private Integer itemCount;

    public String getVoucherId() {
        return voucherId;
    }

    public void setVoucherId(String voucherId) {
        this.voucherId = voucherId;
    }

    public String getVoucherNumber() {
        return voucherNumber;
    }

    public void setVoucherNumber(String voucherNumber) {
        this.voucherNumber = voucherNumber;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public String getVoucherGroup() {
        return voucherGroup;
    }

    public void setVoucherGroup(String voucherGroup) {
        this.voucherGroup = voucherGroup;
    }

    public String getSavedMode() {
        return savedMode;
    }

    public void setSavedMode(String savedMode) {
        this.savedMode = savedMode;
    }

    public Integer getItemCount() {
        return itemCount;
    }

    public void setItemCount(Integer itemCount) {
        this.itemCount = itemCount;
    }
}