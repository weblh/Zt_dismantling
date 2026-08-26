package com.zuantan.dismantling.dto;

public class JdySyncResult {

    private int formCount;
    private int successForms;
    private int failedForms;
    private int upsertedRows;
    private String message;

    public int getFormCount() {
        return formCount;
    }

    public void setFormCount(int formCount) {
        this.formCount = formCount;
    }

    public int getSuccessForms() {
        return successForms;
    }

    public void setSuccessForms(int successForms) {
        this.successForms = successForms;
    }

    public int getFailedForms() {
        return failedForms;
    }

    public void setFailedForms(int failedForms) {
        this.failedForms = failedForms;
    }

    public int getUpsertedRows() {
        return upsertedRows;
    }

    public void setUpsertedRows(int upsertedRows) {
        this.upsertedRows = upsertedRows;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
