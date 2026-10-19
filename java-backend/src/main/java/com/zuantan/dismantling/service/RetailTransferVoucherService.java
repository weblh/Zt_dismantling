package com.zuantan.dismantling.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zuantan.dismantling.common.PageResult;
import com.zuantan.dismantling.entity.RetailTransferVoucher;
import com.zuantan.dismantling.mapper.RetailTransferVoucherMapper;
import com.zuantan.dismantling.vo.RetailTransferImportResultVO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class RetailTransferVoucherService {

    private final RetailTransferVoucherMapper mapper;
    private final RetailTransferExcelParser parser;

    public RetailTransferVoucherService(RetailTransferVoucherMapper mapper,
                                        RetailTransferExcelParser parser) {
        this.mapper = mapper;
        this.parser = parser;
    }

    @Transactional
    public RetailTransferImportResultVO importExcel(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("请上传 Excel 文件");
        }
        rejectBankStatementFile(file.getOriginalFilename());
        RetailTransferExcelParser.ParseResult parsed;
        try {
            parsed = parser.parse(file.getInputStream());
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("解析 Excel 失败：" + e.getMessage(), e);
        }
        RetailTransferImportResultVO result = new RetailTransferImportResultVO();
        result.setTotalRows(parsed.getRows().size() + parsed.getSkippedInvalid());
        result.setSkippedInvalid(parsed.getSkippedInvalid());
        result.setSheetCount(parsed.getSheetNames() != null ? parsed.getSheetNames().size() : 0);
        if (parsed.getSheetNames() != null && !parsed.getSheetNames().isEmpty()) {
            result.setSheetNames(String.join("、", parsed.getSheetNames()));
        }
        int imported = 0;
        int updated = 0;
        int skipped = 0;
        int retail = 0;
        LocalDateTime now = LocalDateTime.now();
        for (RetailTransferVoucher row : parsed.getRows()) {
            RetailTransferVoucher existing = mapper.selectOne(new LambdaQueryWrapper<RetailTransferVoucher>()
                    .eq(RetailTransferVoucher::getFingerprint, row.getFingerprint())
                    .last("LIMIT 1"));
            if (existing != null) {
                // 已存在：刷新金额/日期等（合计列误导入后重导可纠正）
                boolean flagChanged = !java.util.Objects.equals(existing.getRetailFlag(), row.getRetailFlag());
                existing.setTradeTime(row.getTradeTime());
                existing.setDirection(row.getDirection());
                existing.setAmount(row.getAmount());
                existing.setCounterpartyName(row.getCounterpartyName());
                existing.setRetailFlag(row.getRetailFlag());
                existing.setPurpose(row.getPurpose());
                existing.setSummary(row.getSummary());
                existing.setRemark(row.getRemark());
                existing.setReceiptInfo(row.getReceiptInfo());
                existing.setSerialNo(row.getSerialNo());
                existing.setFingerprint(row.getFingerprint());
                existing.setUpdatedAt(now);
                mapper.updateById(existing);
                if (flagChanged || row.getRetailFlag() != null && row.getRetailFlag() == 1) {
                    updated++;
                } else {
                    skipped++;
                }
                if (row.getRetailFlag() != null && row.getRetailFlag() == 1) {
                    retail++;
                }
                continue;
            }
            // 旧指纹可能因凭证号全 0 撞车；按交易要素再查一次
            RetailTransferVoucher softHit = findSoftDuplicate(row);
            if (softHit != null) {
                softHit.setFingerprint(row.getFingerprint());
                softHit.setTradeTime(row.getTradeTime());
                softHit.setDirection(row.getDirection());
                softHit.setAmount(row.getAmount());
                softHit.setCounterpartyName(row.getCounterpartyName());
                softHit.setRetailFlag(row.getRetailFlag());
                softHit.setPurpose(row.getPurpose());
                softHit.setSummary(row.getSummary());
                softHit.setRemark(row.getRemark());
                softHit.setReceiptInfo(row.getReceiptInfo());
                softHit.setSerialNo(row.getSerialNo());
                softHit.setUpdatedAt(now);
                mapper.updateById(softHit);
                updated++;
                if (row.getRetailFlag() != null && row.getRetailFlag() == 1) {
                    retail++;
                }
                continue;
            }
            row.setKingdeeExistStatus(0);
            row.setCreatedAt(now);
            row.setUpdatedAt(now);
            try {
                mapper.insert(row);
                imported++;
                if (row.getRetailFlag() != null && row.getRetailFlag() == 1) {
                    retail++;
                }
            } catch (Exception e) {
                skipped++;
            }
        }
        result.setImported(imported);
        result.setUpdated(updated);
        result.setSkippedDuplicate(skipped);
        result.setRetailCount(retail);
        return result;
    }

    private RetailTransferVoucher findSoftDuplicate(RetailTransferVoucher row) {
        if (StringUtils.hasText(row.getSerialNo())) {
            RetailTransferVoucher bySerial = mapper.selectOne(new LambdaQueryWrapper<RetailTransferVoucher>()
                    .eq(RetailTransferVoucher::getSerialNo, row.getSerialNo().trim())
                    .last("LIMIT 1"));
            if (bySerial != null) {
                return bySerial;
            }
        }
        if (row.getTradeTime() == null || row.getAmount() == null) {
            return null;
        }
        LambdaQueryWrapper<RetailTransferVoucher> wrapper = new LambdaQueryWrapper<RetailTransferVoucher>()
                .eq(RetailTransferVoucher::getTradeTime, row.getTradeTime())
                .eq(RetailTransferVoucher::getDirection, row.getDirection())
                .eq(RetailTransferVoucher::getAmount, row.getAmount())
                .last("LIMIT 5");
        if (StringUtils.hasText(row.getCounterpartyName())) {
            wrapper.eq(RetailTransferVoucher::getCounterpartyName, row.getCounterpartyName());
        }
        if (StringUtils.hasText(row.getPurpose())) {
            wrapper.eq(RetailTransferVoucher::getPurpose, row.getPurpose());
        }
        List<RetailTransferVoucher> hits = mapper.selectList(wrapper);
        if (hits == null || hits.isEmpty()) {
            return null;
        }
        return hits.size() == 1 ? hits.get(0) : null;
    }

    public PageResult<List<RetailTransferVoucher>> listItems(int pageNo, int pageSize,
                                                             String counterpartyName, String direction,
                                                             Boolean retailOnly, String existStatus,
                                                             String tradeDateStart, String tradeDateEnd) {
        LambdaQueryWrapper<RetailTransferVoucher> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(counterpartyName)) {
            wrapper.like(RetailTransferVoucher::getCounterpartyName, counterpartyName.trim());
        }
        if (StringUtils.hasText(direction)) {
            wrapper.eq(RetailTransferVoucher::getDirection, direction.trim().toUpperCase());
        }
        if (Boolean.TRUE.equals(retailOnly)) {
            wrapper.eq(RetailTransferVoucher::getRetailFlag, 1);
        }
        if ("matched".equalsIgnoreCase(existStatus)) {
            wrapper.eq(RetailTransferVoucher::getKingdeeExistStatus, 1);
        } else if ("unmatched".equalsIgnoreCase(existStatus)) {
            wrapper.and(w -> w.isNull(RetailTransferVoucher::getKingdeeExistStatus)
                    .or().ne(RetailTransferVoucher::getKingdeeExistStatus, 1));
        }
        if (StringUtils.hasText(tradeDateStart)) {
            wrapper.apply("DATE(trade_time) >= {0}", LocalDate.parse(tradeDateStart.trim()));
        }
        if (StringUtils.hasText(tradeDateEnd)) {
            wrapper.apply("DATE(trade_time) <= {0}", LocalDate.parse(tradeDateEnd.trim()));
        }
        wrapper.orderByDesc(RetailTransferVoucher::getTradeTime);
        Page<RetailTransferVoucher> page = mapper.selectPage(new Page<>(pageNo, pageSize), wrapper);
        return new PageResult<>(page.getTotal(), page.getRecords());
    }

    /** 清空散户转字导入数据（误导入工商/晋商后重导前使用） */
    @Transactional
    public int clearAll() {
        return mapper.delete(new LambdaQueryWrapper<>());
    }

    private void rejectBankStatementFile(String fileName) {
        if (!StringUtils.hasText(fileName)) {
            return;
        }
        String name = fileName.toLowerCase(java.util.Locale.ROOT);
        if (name.contains("工商") || name.contains("historydetail") || name.contains("晋商")
                || name.contains("交易明细")) {
            throw new RuntimeException("这是银行流水文件，请到「银行流水」导入；本页仅支持「散户业务结账台账」");
        }
    }

    public List<RetailTransferVoucher> listByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return mapper.selectList(new LambdaQueryWrapper<RetailTransferVoucher>()
                    .eq(RetailTransferVoucher::getRetailFlag, 1)
                    .orderByAsc(RetailTransferVoucher::getTradeTime)
                    .last("LIMIT 2000"));
        }
        List<RetailTransferVoucher> rows = mapper.selectBatchIds(ids);
        rows.sort((a, b) -> {
            if (a.getTradeTime() == null) {
                return 1;
            }
            if (b.getTradeTime() == null) {
                return -1;
            }
            return a.getTradeTime().compareTo(b.getTradeTime());
        });
        return rows;
    }
}
