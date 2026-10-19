package com.zuantan.dismantling.service;

import com.zuantan.dismantling.entity.RetailTransferVoucher;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * 散户业务结账台账：编号、回车日期、车牌号、供应商、业务员、合计。
 * 工商 HISTORYDETAIL / 晋商流水请走银行流水导入。
 */
@Component
public class RetailTransferExcelParser {

    private static final DataFormatter FORMATTER = new DataFormatter(Locale.CHINA);
    private static final DateTimeFormatter[] DATE_FORMATTERS = new DateTimeFormatter[]{
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
            DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd"),
            DateTimeFormatter.ofPattern("yyyy/M/d"),
            DateTimeFormatter.ofPattern("yyyy/MM/dd")
    };

    public static class ParseResult {
        private final List<RetailTransferVoucher> rows = new ArrayList<>();
        private int skippedInvalid;
        private final List<String> sheetNames = new ArrayList<>();

        public List<RetailTransferVoucher> getRows() {
            return rows;
        }

        public int getSkippedInvalid() {
            return skippedInvalid;
        }

        public List<String> getSheetNames() {
            return sheetNames;
        }
    }

    public ParseResult parse(InputStream inputStream) throws Exception {
        try (Workbook workbook = new XSSFWorkbook(inputStream)) {
            if (workbook.getNumberOfSheets() <= 0) {
                throw new RuntimeException("Excel 无有效工作表");
            }
            ParseResult result = new ParseResult();
            // 跨 sheet 按指纹去重（总表「1」与按日 sheet 可能重叠）
            Map<String, RetailTransferVoucher> byFingerprint = new LinkedHashMap<>();
            Set<String> usedSheets = new LinkedHashSet<>();

            // 先解析日期 sheet（9.30…），再解析总表「1」，避免合计 SUM 行抢占
            List<Integer> sheetOrder = new ArrayList<>();
            for (int s = 0; s < workbook.getNumberOfSheets(); s++) {
                sheetOrder.add(s);
            }
            sheetOrder.sort((a, b) -> {
                String na = workbook.getSheetAt(a) != null ? workbook.getSheetAt(a).getSheetName() : "";
                String nb = workbook.getSheetAt(b) != null ? workbook.getSheetAt(b).getSheetName() : "";
                return Integer.compare(sheetPriority(na), sheetPriority(nb));
            });

            for (int s : sheetOrder) {
                Sheet sheet = workbook.getSheetAt(s);
                if (sheet == null) {
                    continue;
                }
                Row header = findHeader(sheet);
                if (header == null) {
                    continue;
                }
                Map<String, Integer> cols = index(header);
                String sheetName = StringUtils.hasText(sheet.getSheetName())
                        ? sheet.getSheetName().trim() : ("Sheet" + (s + 1));
                int sheetRows = 0;
                for (int r = header.getRowNum() + 1; r <= sheet.getLastRowNum(); r++) {
                    Row row = sheet.getRow(r);
                    if (row == null) {
                        continue;
                    }
                    RetailTransferVoucher item = parseRow(row, cols, sheetName);
                    if (item == null) {
                        String code = text(row, cols, "编号");
                        if (StringUtils.hasText(code)) {
                            result.skippedInvalid++;
                        }
                        continue;
                    }
                    sheetRows++;
                    RetailTransferVoucher prev = byFingerprint.putIfAbsent(item.getFingerprint(), item);
                    if (prev != null && StringUtils.hasText(sheetName)) {
                        String remark = prev.getRemark();
                        if (remark == null || !remark.contains("[" + sheetName + "]")) {
                            prev.setRemark(join(remark, "[" + sheetName + "]"));
                        }
                    }
                }
                if (sheetRows > 0) {
                    usedSheets.add(sheetName);
                }
            }
            if (byFingerprint.isEmpty() && usedSheets.isEmpty()) {
                throw new RuntimeException("请上传散户业务结账台账（各 sheet 表头需含编号、供应商、合计）。工商/晋商流水请到「银行流水」导入");
            }
            result.rows.addAll(byFingerprint.values());
            result.sheetNames.addAll(usedSheets);
            return result;
        }
    }

    private RetailTransferVoucher parseRow(Row row, Map<String, Integer> cols, String sheetName) {
        String code = text(row, cols, "编号");
        if (!StringUtils.hasText(code) || "编号".equals(code) || "合计".equals(code) || "日合计".equals(code)) {
            return null;
        }
        // 优先「总价」：台账「合计」常为供应商分组 SUM，与金蝶转字日合计一致，不能当成单车金额
        BigDecimal total = amount(row, cols, "总价");
        if (total == null || total.compareTo(BigDecimal.ZERO) == 0) {
            total = amount(row, cols, "合计");
        }
        if (total == null || total.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        LocalDateTime returnDate = dateTime(row, cols, "回车日期");
        if (returnDate == null) {
            returnDate = dateTime(row, cols, "过磅日期");
        }
        String supplier = text(row, cols, "供应商");
        String plate = text(row, cols, "车牌号");
        String salesman = text(row, cols, "业务员");
        String place = text(row, cols, "回车地");
        String model = first(text(row, cols, "车辆型号"), text(row, cols, "车辆类型"));
        String note = text(row, cols, "备注");

        RetailTransferVoucher item = new RetailTransferVoucher();
        item.setDirection(RetailTransferVoucher.DIRECTION_OUT);
        item.setAmount(total.abs().setScale(2, RoundingMode.HALF_UP));
        item.setTradeTime(returnDate);
        item.setCounterpartyName(supplier);
        item.setSerialNo(code.trim());
        item.setPurpose(plate);
        item.setSummary(model);
        item.setRemark(join(sheetName != null ? "[" + sheetName + "]" : null, salesman, place, note));
        item.setRetailFlag(1);
        item.setFingerprint(fingerprint(item));
        return item;
    }

    private String fingerprint(RetailTransferVoucher item) {
        // 以编号为主键，金额变更（合计→总价）时仍更新同一行
        return "LEDGER|" + nvl(item.getSerialNo()) + "|" + nvl(item.getPurpose());
    }

    /** 日期 sheet 优先，总表「1」与空表靠后 */
    private int sheetPriority(String name) {
        if (!StringUtils.hasText(name)) {
            return 90;
        }
        String n = name.trim();
        if (n.matches("\\d{1,2}\\.\\d{1,2}")) {
            return 10;
        }
        if ("1".equals(n)) {
            return 50;
        }
        if (n.toLowerCase(Locale.ROOT).startsWith("sheet")) {
            return 80;
        }
        return 40;
    }

    private Row findHeader(Sheet sheet) {
        int max = Math.min(sheet.getLastRowNum(), 8);
        for (int i = 0; i <= max; i++) {
            Row row = sheet.getRow(i);
            if (row == null) {
                continue;
            }
            Map<String, Integer> cols = index(row);
            if (cols.containsKey("编号") && cols.containsKey("供应商")
                    && (cols.containsKey("合计") || cols.containsKey("总价"))) {
                return row;
            }
        }
        return null;
    }

    private Map<String, Integer> index(Row header) {
        Map<String, Integer> map = new HashMap<>();
        short last = header.getLastCellNum();
        for (int i = 0; i < last; i++) {
            String name = cell(header.getCell(i));
            if (StringUtils.hasText(name)) {
                map.put(name.trim(), i);
            }
        }
        return map;
    }

    private String text(Row row, Map<String, Integer> cols, String name) {
        Integer idx = cols.get(name);
        if (idx == null) {
            return null;
        }
        String value = cell(row.getCell(idx));
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private BigDecimal amount(Row row, Map<String, Integer> cols, String name) {
        Integer idx = cols.get(name);
        if (idx == null) {
            return null;
        }
        Cell cell = row.getCell(idx);
        if (cell == null) {
            return null;
        }
        CellType type = cell.getCellType();
        if (type == CellType.FORMULA) {
            type = cell.getCachedFormulaResultType();
        }
        if (type == CellType.NUMERIC && !DateUtil.isCellDateFormatted(cell)) {
            return BigDecimal.valueOf(cell.getNumericCellValue());
        }
        String raw = cell(cell);
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        try {
            return new BigDecimal(raw.replace(",", "").replace("，", "").replace(" ", ""));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private LocalDateTime dateTime(Row row, Map<String, Integer> cols, String name) {
        Integer idx = cols.get(name);
        if (idx == null) {
            return null;
        }
        Cell cell = row.getCell(idx);
        if (cell == null) {
            return null;
        }
        CellType type = cell.getCellType();
        if (type == CellType.FORMULA) {
            type = cell.getCachedFormulaResultType();
        }
        if (type == CellType.NUMERIC) {
            try {
                double serial = cell.getNumericCellValue();
                if (DateUtil.isCellDateFormatted(cell) || serial > 20000) {
                    Date date = DateUtil.getJavaDate(serial);
                    if (date != null) {
                        return LocalDateTime.ofInstant(date.toInstant(), ZoneId.systemDefault());
                    }
                }
            } catch (Exception ignored) {
                // fall through
            }
        }
        String raw = cell(cell);
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        String text = raw.trim();
        for (DateTimeFormatter formatter : DATE_FORMATTERS) {
            try {
                if (text.contains(":")) {
                    return LocalDateTime.parse(text, formatter);
                }
                return LocalDate.parse(text, formatter).atStartOfDay();
            } catch (DateTimeParseException ignored) {
                // next
            }
        }
        return null;
    }

    private String cell(Cell cell) {
        if (cell == null) {
            return "";
        }
        return FORMATTER.formatCellValue(cell).trim();
    }

    private String first(String a, String b) {
        return StringUtils.hasText(a) ? a : b;
    }

    private String join(String... parts) {
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            if (!StringUtils.hasText(part)) {
                continue;
            }
            if (sb.length() > 0) {
                sb.append(' ');
            }
            sb.append(part.trim());
        }
        return sb.length() == 0 ? null : sb.toString();
    }

    private static String nvl(String value) {
        return value == null ? "" : value.trim();
    }
}
