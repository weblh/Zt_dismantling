package com.zuantan.dismantling.dto;

public class OrgSyncResult {

    private int deptUpserted;
    private int deptDisabled;
    private int userUpserted;
    private int userSkipped;
    private String message;

    public int getDeptUpserted() {
        return deptUpserted;
    }

    public void setDeptUpserted(int deptUpserted) {
        this.deptUpserted = deptUpserted;
    }

    public int getDeptDisabled() {
        return deptDisabled;
    }

    public void setDeptDisabled(int deptDisabled) {
        this.deptDisabled = deptDisabled;
    }

    public int getUserUpserted() {
        return userUpserted;
    }

    public void setUserUpserted(int userUpserted) {
        this.userUpserted = userUpserted;
    }

    public int getUserSkipped() {
        return userSkipped;
    }

    public void setUserSkipped(int userSkipped) {
        this.userSkipped = userSkipped;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
