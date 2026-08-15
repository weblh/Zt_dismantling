package com.zuantan.dismantling.vo;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class VoucherDetailVO {

    private String fdate;
    private String fyear;
    private String fperiod;
    private String fbillTypeID;
    private String fvoucherNo;
    private String fexplanation;
    private String faccountID;
    private String faccountName;
    private String fcurrencyID;
    private BigDecimal famountFor;
    private BigDecimal fdebit;
    private BigDecimal fcredit;
    private String faccountBookNumber;
    private String fposterID;
    private String fauditorID;
    private String fpastorID;
    private String fcashierID;
    private Integer fattachementCount;
    private String fsourceSysId;
    private String fbusinessType;
    private String fapproveStatus;
    private String fforbiddenStatus;
}
