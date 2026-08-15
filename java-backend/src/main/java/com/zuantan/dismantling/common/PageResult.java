package com.zuantan.dismantling.common;

public class PageResult<T> {

    private Long total;
    private T records;

    public PageResult() {
    }

    public PageResult(Long total, T records) {
        this.total = total;
        this.records = records;
    }

    public Long getTotal() {
        return total;
    }

    public void setTotal(Long total) {
        this.total = total;
    }

    public T getRecords() {
        return records;
    }

    public void setRecords(T records) {
        this.records = records;
    }
}
