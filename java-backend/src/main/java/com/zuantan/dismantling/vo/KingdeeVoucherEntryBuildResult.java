package com.zuantan.dismantling.vo;

import com.alibaba.fastjson.JSONArray;

import java.util.ArrayList;
import java.util.List;

public class KingdeeVoucherEntryBuildResult {

    private JSONArray entity;
    private String firstExplanation;
    private int itemCount;
    private List<Long> succeededItemIds = new ArrayList<>();
    private String lastErrorMessage;

    public JSONArray getEntity() {
        return entity;
    }

    public void setEntity(JSONArray entity) {
        this.entity = entity;
    }

    public String getFirstExplanation() {
        return firstExplanation;
    }

    public void setFirstExplanation(String firstExplanation) {
        this.firstExplanation = firstExplanation;
    }

    public int getItemCount() {
        return itemCount;
    }

    public void setItemCount(int itemCount) {
        this.itemCount = itemCount;
    }

    public List<Long> getSucceededItemIds() {
        return succeededItemIds;
    }

    public void setSucceededItemIds(List<Long> succeededItemIds) {
        this.succeededItemIds = succeededItemIds != null ? succeededItemIds : new ArrayList<>();
    }

    public String getLastErrorMessage() {
        return lastErrorMessage;
    }

    public void setLastErrorMessage(String lastErrorMessage) {
        this.lastErrorMessage = lastErrorMessage;
    }
}