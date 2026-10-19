package com.zuantan.dismantling.vo;

import lombok.Data;

@Data
public class RetailTransferImportResultVO {
    private int totalRows;
    private int imported;
    private int updated;
    private int skippedDuplicate;
    private int skippedInvalid;
    private int retailCount;
    /** 实际解析到数据的工作表数量 */
    private int sheetCount;
    private String sheetNames;
}
