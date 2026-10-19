package com.zuantan.dismantling.service;

import com.zuantan.dismantling.entity.BankStatement;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
public class BankStatementExcelParser {

    private static final DataFormatter FORMATTER = new DataFormatter(Locale.CHINA);
    private static final DateTimeFormatter[] DATE_TIME_FORMATTERS = new DateTimeFormatter[]{
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
            DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"),
            DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd")
    };

    public static class ParseResult {
        private final String detectedSource;
        private final List<BankStatement> rows = new ArrayList<>();
        private int skippedInvalid;

        public ParseResult(String detectedSource) {
            this.detectedSource = detectedSource;
        }

        public String getDetectedSource() {
            return detectedSource;
        }

        public List<BankStatement> getRows() {
            return rows;
        }

        public int getSkippedInvalid() {
            return skippedInvalid;
        }

        public void incrementSkippedInvalid() {
            skippedInvalid++;
        }
    }

    public ParseResult parse(InputStream inputStream, String preferredSource) throws Exception {
        try (Workbook workbook = new XSSFWorkbook(inputStream)) {
            Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : null;
            if (sheet == null) {
                throw new RuntimeException("Excel 无有效工作表");
            }
            Row headerRow = findHeaderRow(sheet);
            if (headerRow == null) {
                throw new RuntimeException("未识别到表头，请确认是工商或晋商流水导出文件");
            }
            Map<String, Integer> colIndex = buildColumnIndex(headerRow);
            String detected = detectSource(colIndex, preferredSource);
            ParseResult result = new ParseResult(detected);

            int startRow = headerRow.getRowNum() + 1;
            for (int r = startRow; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null || isEmptyRow(row)) {
                    continue;
                }
                try {
                    BankStatement item = BankStatement.SOURCE_ICBC.equals(detected)
                            ? parseIcbcRow(row, colIndex, detected)
                            : parseJinshangRow(row, colIndex, detected);
                    if (item == null || item.getAmount() == null
                            || item.getAmount().compareTo(BigDecimal.ZERO) <= 0
                            || !StringUtils.hasText(item.getDirection())) {
                        result.incrementSkippedInvalid();
                        continue;
                    }
                    item.setFingerprint(buildFingerprint(item));
                    result.getRows().add(item);
                } catch (Exception e) {
                    result.incrementSkippedInvalid();
                }
            }
            return result;
        }
    }

    private Row findHeaderRow(Sheet sheet) {
        int max = Math.min(sheet.getLastRowNum(), 20);
        for (int i = 0; i <= max; i++) {
            Row row = sheet.getRow(i);
            if (row == null) {
                continue;
            }
            Map<String, Integer> cols = buildColumnIndex(row);
            if (cols.containsKey("交易时间") && (cols.containsKey("借贷标志") || cols.containsKey("支出") || cols.containsKey("收入"))) {
                return row;
            }
        }
        return null;
    }

    private Map<String, Integer> buildColumnIndex(Row headerRow) {
        Map<String, Integer> map = new HashMap<>();
        short last = headerRow.getLastCellNum();
        for (int i = 0; i < last; i++) {
            String name = cellText(headerRow.getCell(i));
            if (StringUtils.hasText(name)) {
                map.put(name.trim(), i);
            }
        }
        return map;
    }

    private String detectSource(Map<String, Integer> cols, String preferredSource) {
        boolean icbcLike = cols.containsKey("借贷标志") && cols.containsKey("发生额") && cols.containsKey("对方单位");
        boolean jinshangLike = cols.containsKey("对方户名") && (cols.containsKey("支出") || cols.containsKey("收入"));
        if (icbcLike && !jinshangLike) {
            return BankStatement.SOURCE_ICBC;
        }
        if (jinshangLike && !icbcLike) {
            return BankStatement.SOURCE_JINSHANG;
        }
        if (StringUtils.hasText(preferredSource)) {
            String p = preferredSource.trim().toUpperCase(Locale.ROOT);
            if (BankStatement.SOURCE_ICBC.equals(p) || BankStatement.SOURCE_JINSHANG.equals(p)) {
                return p;
            }
        }
        if (icbcLike) {
            return BankStatement.SOURCE_ICBC;
        }
        if (jinshangLike) {
            return BankStatement.SOURCE_JINSHANG;
        }
        throw new RuntimeException("无法识别银行流水格式，请确认表头包含工商或晋商字段");
    }

    private BankStatement parseIcbcRow(Row row, Map<String, Integer> cols, String bankSource) {
        BankStatement item = new BankStatement();
        item.setBankSource(bankSource);
        item.setCounterpartyAccount(cellText(row, cols, "对方账号"));
        item.setTradeTime(parseDateTime(row, cols, "交易时间"));
        String flag = cellText(row, cols, "借贷标志");
        if ("借".equals(flag)) {
            item.setDirection(BankStatement.DIRECTION_OUT);
        } else if ("贷".equals(flag)) {
            item.setDirection(BankStatement.DIRECTION_IN);
        } else {
            return null;
        }
        item.setAmount(parseAmount(row, cols, "发生额"));
        item.setBalance(parseAmount(row, cols, "余额"));
        item.setCounterpartyName(cellText(row, cols, "对方单位"));
        item.setPurpose(cellText(row, cols, "用途"));
        item.setSummary(cellText(row, cols, "摘要"));
        item.setRemark(firstNonBlank(cellText(row, cols, "附言"), cellText(row, cols, "备注")));
        item.setReceiptInfo(cellText(row, cols, "回单个性化信息"));
        item.setVoucherNo(cellText(row, cols, "凭证号"));
        item.setCounterpartyBankNo(cellText(row, cols, "对方行号"));
        String receiptSerial = extractSerialFromReceipt(item.getReceiptInfo());
        String voucherNo = item.getVoucherNo();
        if ("000000000".equals(voucherNo) || "0".equals(voucherNo)) {
            voucherNo = null;
        }
        item.setSerialNo(firstNonBlank(receiptSerial, voucherNo));
        return item;
    }

    private BankStatement parseJinshangRow(Row row, Map<String, Integer> cols, String bankSource) {
        BankStatement item = new BankStatement();
        item.setBankSource(bankSource);
        item.setTradeTime(parseDateTime(row, cols, "交易时间"));
        item.setCurrency(cellText(row, cols, "币种"));
        BigDecimal income = parseAmount(row, cols, "收入");
        BigDecimal expense = parseAmount(row, cols, "支出");
        if (expense != null && expense.compareTo(BigDecimal.ZERO) > 0) {
            item.setDirection(BankStatement.DIRECTION_OUT);
            item.setAmount(expense);
        } else if (income != null && income.compareTo(BigDecimal.ZERO) > 0) {
            item.setDirection(BankStatement.DIRECTION_IN);
            item.setAmount(income);
        } else {
            return null;
        }
        item.setBalance(parseAmount(row, cols, "账户余额"));
        item.setCounterpartyName(cellText(row, cols, "对方户名"));
        item.setCounterpartyAccount(cellText(row, cols, "对方账户"));
        item.setCounterpartyBankNo(cellText(row, cols, "对方行号"));
        item.setCounterpartyBankName(cellText(row, cols, "对方行名"));
        item.setSerialNo(cellText(row, cols, "交易流水号"));
        item.setSummary(cellText(row, cols, "摘要"));
        item.setRemark(cellText(row, cols, "备注"));
        item.setPurpose(firstNonBlank(item.getRemark(), item.getSummary()));
        return item;
    }

    public static String buildFingerprint(BankStatement item) {
        String trade = item.getTradeTime() != null ? item.getTradeTime().toString() : "";
        String amount = item.getAmount() != null
                ? item.getAmount().setScale(2, RoundingMode.HALF_UP).toPlainString()
                : "";
        String account = defaultEmpty(item.getCounterpartyAccount());
        String name = defaultEmpty(item.getCounterpartyName());
        String serial = firstNonBlank(item.getSerialNo(), null);
        // 工商凭证号常为 000000000，不能单独作为指纹
        if (!StringUtils.hasText(serial)) {
            String voucher = defaultEmpty(item.getVoucherNo());
            if (!"000000000".equals(voucher) && !"0".equals(voucher)) {
                serial = voucher;
            }
        }
        String balance = item.getBalance() != null
                ? item.getBalance().setScale(2, RoundingMode.HALF_UP).toPlainString()
                : "";
        String direction = defaultEmpty(item.getDirection());
        return String.join("|",
                defaultEmpty(item.getBankSource()),
                trade,
                amount,
                balance,
                account,
                name,
                serial,
                direction,
                defaultEmpty(item.getPurpose()),
                defaultEmpty(item.getSummary()));
    }

    private String extractSerialFromReceipt(String receipt) {
        if (!StringUtils.hasText(receipt)) {
            return null;
        }
        String[] keys = {"支付交易序号:", "指令编号:", "交易流水号:"};
        for (String key : keys) {
            int idx = receipt.indexOf(key);
            if (idx >= 0) {
                int start = idx + key.length();
                int end = start;
                while (end < receipt.length() && !Character.isWhitespace(receipt.charAt(end))) {
                    end++;
                }
                String value = receipt.substring(start, end).trim();
                if (StringUtils.hasText(value)) {
                    return value;
                }
            }
        }
        return null;
    }

    private boolean isEmptyRow(Row row) {
        short last = row.getLastCellNum();
        for (int i = 0; i < last; i++) {
            if (StringUtils.hasText(cellText(row.getCell(i)))) {
                return false;
            }
        }
        return true;
    }

    private String cellText(Row row, Map<String, Integer> cols, String name) {
        Integer idx = cols.get(name);
        if (idx == null) {
            return null;
        }
        return cellText(row.getCell(idx));
    }

    private String cellText(Cell cell) {
        if (cell == null) {
            return null;
        }
        String text = FORMATTER.formatCellValue(cell);
        if (text == null) {
            return null;
        }
        text = text.trim();
        return text.isEmpty() ? null : text;
    }

    private BigDecimal parseAmount(Row row, Map<String, Integer> cols, String name) {
        Integer idx = cols.get(name);
        if (idx == null) {
            return null;
        }
        Cell cell = row.getCell(idx);
        if (cell == null) {
            return null;
        }
        if (cell.getCellType() == CellType.NUMERIC) {
            return BigDecimal.valueOf(cell.getNumericCellValue()).setScale(2, RoundingMode.HALF_UP);
        }
        String text = cellText(cell);
        if (!StringUtils.hasText(text)) {
            return null;
        }
        String normalized = text.replace(",", "").replace("，", "").replace(" ", "");
        if (normalized.isEmpty() || "-".equals(normalized)) {
            return null;
        }
        try {
            return new BigDecimal(normalized).setScale(2, RoundingMode.HALF_UP);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private LocalDateTime parseDateTime(Row row, Map<String, Integer> cols, String name) {
        Integer idx = cols.get(name);
        if (idx == null) {
            return null;
        }
        Cell cell = row.getCell(idx);
        if (cell == null) {
            return null;
        }
        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            Date date = cell.getDateCellValue();
            return LocalDateTime.ofInstant(date.toInstant(), ZoneId.systemDefault());
        }
        String text = cellText(cell);
        if (!StringUtils.hasText(text)) {
            return null;
        }
        for (DateTimeFormatter formatter : DATE_TIME_FORMATTERS) {
            try {
                return LocalDateTime.parse(text, formatter);
            } catch (DateTimeParseException ignored) {
                // try next
            }
        }
        try {
            return java.time.LocalDate.parse(text, DateTimeFormatter.ofPattern("yyyy-MM-dd")).atStartOfDay();
        } catch (DateTimeParseException ignored) {
            // fall through
        }
        try {
            return java.time.LocalDate.parse(text, DateTimeFormatter.ofPattern("yyyy/MM/dd")).atStartOfDay();
        } catch (DateTimeParseException ignored) {
            // fall through
        }
        try {
            if (cell.getCellType() == CellType.NUMERIC) {
                Date date = DateUtil.getJavaDate(cell.getNumericCellValue());
                return LocalDateTime.ofInstant(date.toInstant(), ZoneId.systemDefault());
            }
        } catch (Exception ignored) {
            // ignore
        }
        return null;
    }

    private static String firstNonBlank(String a, String b) {
        if (StringUtils.hasText(a)) {
            return a.trim();
        }
        if (StringUtils.hasText(b)) {
            return b.trim();
        }
        return null;
    }

    private static String defaultEmpty(String value) {
        return value == null ? "" : value.trim();
    }
}
