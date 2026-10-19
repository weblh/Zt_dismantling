package com.zuantan.dismantling.vo;

public class BankStatementImportResultVO {

    private String bankSource;
    private int totalRows;
    private int imported;
    private int skippedDuplicate;
    private int skippedInvalid;

    public String getBankSource() {
        return bankSource;
    }

    public void setBankSource(String bankSource) {
        this.bankSource = bankSource;
    }

    public int getTotalRows() {
        return totalRows;
    }

    public void setTotalRows(int totalRows) {
        this.totalRows = totalRows;
    }

    public int getImported() {
        return imported;
    }

    public void setImported(int imported) {
        this.imported = imported;
    }

    public int getSkippedDuplicate() {
        return skippedDuplicate;
    }

    public void setSkippedDuplicate(int skippedDuplicate) {
        this.skippedDuplicate = skippedDuplicate;
    }

    public int getSkippedInvalid() {
        return skippedInvalid;
    }

    public void setSkippedInvalid(int skippedInvalid) {
        this.skippedInvalid = skippedInvalid;
    }
}
