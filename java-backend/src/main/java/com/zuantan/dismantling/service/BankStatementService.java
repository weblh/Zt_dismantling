package com.zuantan.dismantling.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zuantan.dismantling.common.PageResult;
import com.zuantan.dismantling.dto.BankStatementClassifyRequest;
import com.zuantan.dismantling.entity.BankStatement;
import com.zuantan.dismantling.entity.BankStatementLearnRule;
import com.zuantan.dismantling.mapper.BankStatementLearnRuleMapper;
import com.zuantan.dismantling.mapper.BankStatementMapper;
import com.zuantan.dismantling.vo.BankStatementDuplicateGroupVO;
import com.zuantan.dismantling.vo.BankStatementImportResultVO;
import com.zuantan.dismantling.vo.BankStatementVO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class BankStatementService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final Set<String> VALID_TYPES;

    static {
        Set<String> types = new HashSet<>();
        types.add(BankStatement.TYPE_EXPENSE);
        types.add(BankStatement.TYPE_REPAIR);
        types.add(BankStatement.TYPE_MATERIAL);
        types.add(BankStatement.TYPE_TAX);
        types.add(BankStatement.TYPE_TRANSFER);
        types.add(BankStatement.TYPE_PART_INCOME);
        types.add(BankStatement.TYPE_RESIDUAL_FEE);
        VALID_TYPES = Collections.unmodifiableSet(types);
    }

    private final BankStatementMapper bankStatementMapper;
    private final BankStatementLearnRuleMapper learnRuleMapper;
    private final BankStatementExcelParser excelParser;

    public BankStatementService(BankStatementMapper bankStatementMapper,
                                BankStatementLearnRuleMapper learnRuleMapper,
                                BankStatementExcelParser excelParser) {
        this.bankStatementMapper = bankStatementMapper;
        this.learnRuleMapper = learnRuleMapper;
        this.excelParser = excelParser;
    }

    @Transactional
    public BankStatementImportResultVO importExcel(MultipartFile file, String bankSource) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("请上传 Excel 文件");
        }
        String fromName = sourceFromFileName(file.getOriginalFilename());
        if ("REJECT".equals(fromName)) {
            throw new RuntimeException("这是散户业务结账台账，请到「散户转字号」导入");
        }
        String preferred = StringUtils.hasText(fromName) ? fromName : normalizeBankSource(bankSource);
        BankStatementExcelParser.ParseResult parsed;
        try {
            parsed = excelParser.parse(file.getInputStream(), preferred);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("解析 Excel 失败：" + e.getMessage(), e);
        }

        BankStatementImportResultVO result = new BankStatementImportResultVO();
        result.setBankSource(parsed.getDetectedSource());
        result.setTotalRows(parsed.getRows().size() + parsed.getSkippedInvalid());
        result.setSkippedInvalid(parsed.getSkippedInvalid());

        int imported = 0;
        int skippedDuplicate = 0;
        LocalDateTime now = LocalDateTime.now();
        for (BankStatement row : parsed.getRows()) {
            Long existingId = bankStatementMapper.selectCount(
                    new LambdaQueryWrapper<BankStatement>()
                            .eq(BankStatement::getFingerprint, row.getFingerprint()));
            if (existingId != null && existingId > 0) {
                skippedDuplicate++;
                continue;
            }
            applyBuiltinType(row);
            applyResidualFeeType(row);
            applyLearnSuggestion(row);
            row.setCreatedAt(now);
            row.setUpdatedAt(now);
            try {
                bankStatementMapper.insert(row);
                imported++;
            } catch (Exception e) {
                skippedDuplicate++;
            }
        }
        result.setImported(imported);
        result.setSkippedDuplicate(skippedDuplicate);
        return result;
    }

    public PageResult<List<BankStatementVO>> listItems(int pageNo, int pageSize,
                                                       String bankSource, String direction,
                                                       String counterpartyName, String voucherType,
                                                       String pushStatus, Boolean onlyOut,
                                                       String tradeDateStart, String tradeDateEnd,
                                                       Boolean duplicateSuspectOnly) {
        tagPartIncomeRows();
        tagResidualFeeRows();
        LambdaQueryWrapper<BankStatement> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(bankSource)) {
            wrapper.eq(BankStatement::getBankSource, normalizeBankSource(bankSource));
        }
        if (StringUtils.hasText(direction)) {
            wrapper.eq(BankStatement::getDirection, direction.trim().toUpperCase(Locale.ROOT));
        } else if (onlyOut == null || onlyOut) {
            // 支出流水，以及已识别的配件收入（收单归集）
            wrapper.and(w -> w.eq(BankStatement::getDirection, BankStatement.DIRECTION_OUT)
                    .or()
                    .eq(BankStatement::getVoucherType, BankStatement.TYPE_PART_INCOME));
        }
        if (StringUtils.hasText(counterpartyName)) {
            wrapper.like(BankStatement::getCounterpartyName, counterpartyName.trim());
        }
        if (StringUtils.hasText(voucherType)) {
            wrapper.eq(BankStatement::getVoucherType, voucherType.trim().toUpperCase(Locale.ROOT));
        }
        if (StringUtils.hasText(pushStatus)) {
            String status = pushStatus.trim().toLowerCase(Locale.ROOT);
            if ("pushed".equals(status)) {
                wrapper.isNotNull(BankStatement::getKingdeeVoucherId)
                        .ne(BankStatement::getKingdeeVoucherId, "");
            } else if ("unpushed".equals(status)) {
                wrapper.and(w -> w.isNull(BankStatement::getKingdeeVoucherId)
                        .or().eq(BankStatement::getKingdeeVoucherId, ""));
            } else if ("error".equals(status)) {
                wrapper.isNotNull(BankStatement::getKingdeePushError)
                        .ne(BankStatement::getKingdeePushError, "");
            } else if ("classified".equals(status)) {
                wrapper.isNotNull(BankStatement::getVoucherType)
                        .ne(BankStatement::getVoucherType, "");
            } else if ("unclassified".equals(status)) {
                wrapper.and(w -> w.isNull(BankStatement::getVoucherType)
                        .or().eq(BankStatement::getVoucherType, ""));
            }
        }
        if (StringUtils.hasText(tradeDateStart)) {
            wrapper.apply("DATE(trade_time) >= {0}", LocalDate.parse(tradeDateStart.trim()));
        }
        if (StringUtils.hasText(tradeDateEnd)) {
            wrapper.apply("DATE(trade_time) <= {0}", LocalDate.parse(tradeDateEnd.trim()));
        }
        wrapper.orderByDesc(BankStatement::getTradeTime).orderByDesc(BankStatement::getId);

        Page<BankStatement> page = bankStatementMapper.selectPage(new Page<>(pageNo, pageSize), wrapper);
        Set<String> suspectKeys = loadApproximateDuplicateKeys(page.getRecords());
        List<BankStatementVO> records = new ArrayList<>();
        for (BankStatement item : page.getRecords()) {
            BankStatementVO vo = toVO(item);
            vo.setDuplicateSuspect(suspectKeys.contains(approxKey(item)));
            if (Boolean.TRUE.equals(duplicateSuspectOnly) && !Boolean.TRUE.equals(vo.getDuplicateSuspect())) {
                continue;
            }
            records.add(vo);
        }
        if (Boolean.TRUE.equals(duplicateSuspectOnly)) {
            return new PageResult<>((long) records.size(), records);
        }
        return new PageResult<>(page.getTotal(), records);
    }

    public BankStatementVO getDetail(Long id) {
        BankStatement item = bankStatementMapper.selectById(id);
        if (item == null) {
            throw new RuntimeException("流水不存在");
        }
        BankStatementVO vo = toVO(item);
        vo.setDuplicateSuspect(isApproximateDuplicate(item));
        return vo;
    }

    @Transactional
    public BankStatementVO classify(Long id, BankStatementClassifyRequest request) {
        BankStatement item = bankStatementMapper.selectById(id);
        if (item == null) {
            throw new RuntimeException("流水不存在");
        }
        applyClassify(item, request);
        bankStatementMapper.updateById(item);
        upsertLearnRule(item);
        return toVO(item);
    }

    @Transactional
    public int batchClassify(BankStatementClassifyRequest request) {
        if (request == null || request.getIds() == null || request.getIds().isEmpty()) {
            throw new RuntimeException("请选择要分类的流水");
        }
        int count = 0;
        for (Long id : request.getIds()) {
            BankStatement item = bankStatementMapper.selectById(id);
            if (item == null) {
                continue;
            }
            applyClassify(item, request);
            bankStatementMapper.updateById(item);
            upsertLearnRule(item);
            count++;
        }
        return count;
    }

    public List<BankStatementDuplicateGroupVO> listDuplicates(String bankSource) {
        LambdaQueryWrapper<BankStatement> wrapper = new LambdaQueryWrapper<BankStatement>()
                .eq(BankStatement::getDirection, BankStatement.DIRECTION_OUT)
                .orderByDesc(BankStatement::getTradeTime)
                .last("LIMIT 2000");
        if (StringUtils.hasText(bankSource)) {
            wrapper.eq(BankStatement::getBankSource, normalizeBankSource(bankSource));
        }
        List<BankStatement> all = bankStatementMapper.selectList(wrapper);
        Map<String, List<BankStatement>> groups = new LinkedHashMap<>();
        for (BankStatement item : all) {
            String key = approxKey(item);
            groups.computeIfAbsent(key, k -> new ArrayList<>()).add(item);
        }
        List<BankStatementDuplicateGroupVO> result = new ArrayList<>();
        for (Map.Entry<String, List<BankStatement>> entry : groups.entrySet()) {
            if (entry.getValue().size() < 2) {
                continue;
            }
            BankStatement first = entry.getValue().get(0);
            BankStatementDuplicateGroupVO group = new BankStatementDuplicateGroupVO();
            group.setGroupType("approx");
            group.setBankSource(first.getBankSource());
            group.setCounterpartyName(first.getCounterpartyName());
            group.setAmount(first.getAmount());
            group.setTradeDate(first.getTradeTime() != null
                    ? first.getTradeTime().toLocalDate().format(DATE_FMT) : null);
            for (BankStatement item : entry.getValue()) {
                group.getItems().add(toVO(item));
            }
            result.add(group);
        }
        return result;
    }

    public BankStatement requireById(Long id) {
        BankStatement item = bankStatementMapper.selectById(id);
        if (item == null) {
            throw new RuntimeException("流水不存在：" + id);
        }
        return item;
    }

    /** 清空银行流水导入数据（误导后重导前使用） */
    @Transactional
    public int clearAll() {
        return bankStatementMapper.delete(new LambdaQueryWrapper<>());
    }

    public List<BankStatement> listByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return Collections.emptyList();
        }
        List<BankStatement> items = new ArrayList<>();
        for (Long id : new HashSet<>(ids)) {
            BankStatement item = bankStatementMapper.selectById(id);
            if (item == null) {
                throw new RuntimeException("流水不存在：" + id);
            }
            items.add(item);
        }
        items.sort((a, b) -> Long.compare(a.getId(), b.getId()));
        return items;
    }

    private void applyClassify(BankStatement item, BankStatementClassifyRequest request) {
        if (request == null || !StringUtils.hasText(request.getVoucherType())) {
            throw new RuntimeException("请选择业务类型");
        }
        String type = request.getVoucherType().trim().toUpperCase(Locale.ROOT);
        if (!VALID_TYPES.contains(type)) {
            throw new RuntimeException("不支持的业务类型：" + request.getVoucherType());
        }
        if (StringUtils.hasText(item.getKingdeeVoucherId())) {
            throw new RuntimeException("已写入金蝶的流水不可修改类型");
        }
        item.setVoucherType(type);
        if (request.getEmployeeName() != null) {
            item.setEmployeeName(trimToNull(request.getEmployeeName()));
        }
        if (request.getPayeeOverride() != null) {
            item.setPayeeOverride(trimToNull(request.getPayeeOverride()));
        }
        if (request.getTargetBankName() != null) {
            item.setTargetBankName(trimToNull(request.getTargetBankName()));
        }
        if (BankStatement.TYPE_EXPENSE.equals(type) && !StringUtils.hasText(item.getEmployeeName())) {
            item.setEmployeeName(trimToNull(item.getCounterpartyName()));
        }
        if (BankStatement.TYPE_TRANSFER.equals(type) && !StringUtils.hasText(item.getTargetBankName())) {
            item.setTargetBankName(guessTargetBankName(item));
        }
        item.setUpdatedAt(LocalDateTime.now());
    }

    private void upsertLearnRule(BankStatement item) {
        if (!StringUtils.hasText(item.getVoucherType()) || !StringUtils.hasText(item.getCounterpartyName())) {
            return;
        }
        String counterparty = item.getCounterpartyName().trim();
        String purposeKeyword = normalizePurposeKeyword(item);
        BankStatementLearnRule existing = learnRuleMapper.selectOne(
                new LambdaQueryWrapper<BankStatementLearnRule>()
                        .eq(BankStatementLearnRule::getBankSource, item.getBankSource())
                        .eq(BankStatementLearnRule::getCounterpartyName, counterparty)
                        .eq(BankStatementLearnRule::getPurposeKeyword, purposeKeyword)
                        .last("LIMIT 1"));
        LocalDateTime now = LocalDateTime.now();
        if (existing == null) {
            BankStatementLearnRule rule = new BankStatementLearnRule();
            rule.setBankSource(item.getBankSource());
            rule.setCounterpartyName(counterparty);
            rule.setPurposeKeyword(purposeKeyword);
            rule.setVoucherType(item.getVoucherType());
            rule.setEmployeeName(item.getEmployeeName());
            rule.setTargetBankName(item.getTargetBankName());
            rule.setHitCount(1);
            rule.setCreatedAt(now);
            rule.setUpdatedAt(now);
            learnRuleMapper.insert(rule);
            return;
        }
        existing.setVoucherType(item.getVoucherType());
        existing.setEmployeeName(item.getEmployeeName());
        existing.setTargetBankName(item.getTargetBankName());
        existing.setHitCount((existing.getHitCount() == null ? 0 : existing.getHitCount()) + 1);
        existing.setUpdatedAt(now);
        learnRuleMapper.updateById(existing);
    }

    /** 对方户名为收单资金归集时，直接记为配件收入，无需再手工设类型。 */
    static boolean isPartIncomeCounterparty(String counterpartyName) {
        return StringUtils.hasText(counterpartyName) && counterpartyName.contains("收单");
    }

    private void applyBuiltinType(BankStatement row) {
        if (!isPartIncomeCounterparty(row.getCounterpartyName())) {
            return;
        }
        if (!BankStatement.DIRECTION_IN.equals(row.getDirection())) {
            return;
        }
        row.setVoucherType(BankStatement.TYPE_PART_INCOME);
        row.setSuggestedVoucherType(BankStatement.TYPE_PART_INCOME);
    }

    /** 用途、摘要或附言含「残值费」时记为残值费，写入金蝶走转字。 */
    static boolean isResidualFeeText(String purpose, String summary, String remark, String receiptInfo) {
        String text = joinText(purpose, summary, remark, receiptInfo);
        return text.contains("残值费");
    }

    private static String joinText(String... parts) {
        StringBuilder sb = new StringBuilder();
        if (parts == null) {
            return "";
        }
        for (String part : parts) {
            if (StringUtils.hasText(part)) {
                sb.append(part);
            }
        }
        return sb.toString();
    }

    private void applyResidualFeeType(BankStatement row) {
        if (StringUtils.hasText(row.getVoucherType())) {
            return;
        }
        if (!BankStatement.DIRECTION_OUT.equals(row.getDirection())) {
            return;
        }
        if (!isResidualFeeText(row.getPurpose(), row.getSummary(), row.getRemark(), row.getReceiptInfo())) {
            return;
        }
        row.setVoucherType(BankStatement.TYPE_RESIDUAL_FEE);
        row.setSuggestedVoucherType(BankStatement.TYPE_RESIDUAL_FEE);
    }

    /** 已导入但尚未分类的车辆残值费支出，补上残值费类型（列表与查重都会触发）。 */
    public void tagResidualFeeRows() {
        List<BankStatement> pending = bankStatementMapper.selectList(
                new LambdaQueryWrapper<BankStatement>()
                        .eq(BankStatement::getDirection, BankStatement.DIRECTION_OUT)
                        .and(w -> w.isNull(BankStatement::getVoucherType)
                                .or().eq(BankStatement::getVoucherType, ""))
                        .and(w -> w.like(BankStatement::getPurpose, "残值费")
                                .or().like(BankStatement::getSummary, "残值费")
                                .or().like(BankStatement::getRemark, "残值费")
                                .or().like(BankStatement::getReceiptInfo, "残值费")));
        if (pending.isEmpty()) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        for (BankStatement item : pending) {
            if (!isResidualFeeText(item.getPurpose(), item.getSummary(), item.getRemark(), item.getReceiptInfo())) {
                continue;
            }
            item.setVoucherType(BankStatement.TYPE_RESIDUAL_FEE);
            item.setSuggestedVoucherType(BankStatement.TYPE_RESIDUAL_FEE);
            item.setUpdatedAt(now);
            bankStatementMapper.updateById(item);
        }
    }

    /** 已导入但当时被列表滤掉的收单收入，补上配件收入类型。 */
    private void tagPartIncomeRows() {
        List<BankStatement> pending = bankStatementMapper.selectList(
                new LambdaQueryWrapper<BankStatement>()
                        .eq(BankStatement::getDirection, BankStatement.DIRECTION_IN)
                        .like(BankStatement::getCounterpartyName, "收单")
                        .and(w -> w.isNull(BankStatement::getVoucherType)
                                .or().eq(BankStatement::getVoucherType, "")));
        if (pending.isEmpty()) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        for (BankStatement item : pending) {
            item.setVoucherType(BankStatement.TYPE_PART_INCOME);
            item.setSuggestedVoucherType(BankStatement.TYPE_PART_INCOME);
            item.setUpdatedAt(now);
            bankStatementMapper.updateById(item);
        }
    }

    private void applyLearnSuggestion(BankStatement row) {
        if (!StringUtils.hasText(row.getCounterpartyName())) {
            return;
        }
        String counterparty = row.getCounterpartyName().trim();
        String purposeKeyword = normalizePurposeKeyword(row);
        BankStatementLearnRule exact = learnRuleMapper.selectOne(
                new LambdaQueryWrapper<BankStatementLearnRule>()
                        .eq(BankStatementLearnRule::getBankSource, row.getBankSource())
                        .eq(BankStatementLearnRule::getCounterpartyName, counterparty)
                        .eq(BankStatementLearnRule::getPurposeKeyword, purposeKeyword)
                        .orderByDesc(BankStatementLearnRule::getHitCount)
                        .last("LIMIT 1"));
        if (exact == null) {
            exact = learnRuleMapper.selectOne(
                    new LambdaQueryWrapper<BankStatementLearnRule>()
                            .eq(BankStatementLearnRule::getBankSource, row.getBankSource())
                            .eq(BankStatementLearnRule::getCounterpartyName, counterparty)
                            .eq(BankStatementLearnRule::getPurposeKeyword, "")
                            .orderByDesc(BankStatementLearnRule::getHitCount)
                            .last("LIMIT 1"));
        }
        if (exact == null) {
            return;
        }
        // 仅写入建议，需用户在页面确认「设类型」后再可推送
        row.setSuggestedVoucherType(exact.getVoucherType());
        row.setSuggestedEmployeeName(exact.getEmployeeName());
        if (!StringUtils.hasText(row.getEmployeeName()) && StringUtils.hasText(exact.getEmployeeName())) {
            row.setEmployeeName(exact.getEmployeeName());
        }
        if (!StringUtils.hasText(row.getTargetBankName()) && StringUtils.hasText(exact.getTargetBankName())) {
            row.setTargetBankName(exact.getTargetBankName());
        }
    }

    private String normalizePurposeKeyword(BankStatement item) {
        String raw = firstNonBlank(item.getPurpose(), item.getSummary(), item.getRemark());
        if (!StringUtils.hasText(raw)) {
            return "";
        }
        String trimmed = raw.trim();
        return trimmed.length() > 64 ? trimmed.substring(0, 64) : trimmed;
    }

    private String guessTargetBankName(BankStatement item) {
        String text = firstNonBlank(item.getRemark(), item.getSummary(), item.getPurpose(),
                item.getCounterpartyBankName(), item.getReceiptInfo());
        if (!StringUtils.hasText(text)) {
            return BankStatement.SOURCE_ICBC.equals(item.getBankSource()) ? "晋商银行" : "工商银行";
        }
        if (text.contains("晋商")) {
            return "晋商银行";
        }
        if (text.contains("工商")) {
            return "工商银行";
        }
        return text.length() > 32 ? text.substring(0, 32) : text;
    }

    private Set<String> loadApproximateDuplicateKeys(List<BankStatement> records) {
        Set<String> suspects = new HashSet<>();
        if (records == null || records.isEmpty()) {
            return suspects;
        }
        Map<String, Integer> counts = new HashMap<>();
        for (BankStatement item : records) {
            String key = approxKey(item);
            counts.put(key, counts.getOrDefault(key, 0) + 1);
        }
        for (BankStatement item : records) {
            String key = approxKey(item);
            if (counts.getOrDefault(key, 0) > 1) {
                suspects.add(key);
                continue;
            }
            if (isApproximateDuplicate(item)) {
                suspects.add(key);
            }
        }
        return suspects;
    }

    private boolean isApproximateDuplicate(BankStatement item) {
        if (item.getTradeTime() == null || item.getAmount() == null) {
            return false;
        }
        Long count = bankStatementMapper.selectCount(
                new LambdaQueryWrapper<BankStatement>()
                        .eq(BankStatement::getBankSource, item.getBankSource())
                        .eq(BankStatement::getDirection, item.getDirection())
                        .eq(BankStatement::getAmount, item.getAmount())
                        .eq(BankStatement::getCounterpartyName, item.getCounterpartyName())
                        .apply("DATE(trade_time) = {0}", item.getTradeTime().toLocalDate())
                        .ne(BankStatement::getId, item.getId()));
        return count != null && count > 0;
    }

    private String approxKey(BankStatement item) {
        String date = item.getTradeTime() != null ? item.getTradeTime().toLocalDate().toString() : "";
        String amount = item.getAmount() != null ? item.getAmount().toPlainString() : "";
        return String.join("|",
                defaultEmpty(item.getBankSource()),
                date,
                amount,
                defaultEmpty(item.getCounterpartyName()),
                defaultEmpty(item.getDirection()));
    }

    private BankStatementVO toVO(BankStatement item) {
        BankStatementVO vo = new BankStatementVO();
        vo.setId(item.getId());
        vo.setBankSource(item.getBankSource());
        vo.setTradeTime(item.getTradeTime());
        vo.setDirection(item.getDirection());
        vo.setAmount(item.getAmount());
        vo.setBalance(item.getBalance());
        vo.setCounterpartyAccount(item.getCounterpartyAccount());
        vo.setCounterpartyName(item.getCounterpartyName());
        vo.setPurpose(item.getPurpose());
        vo.setSummary(item.getSummary());
        vo.setRemark(item.getRemark());
        vo.setReceiptInfo(item.getReceiptInfo());
        vo.setVoucherNo(item.getVoucherNo());
        vo.setCounterpartyBankNo(item.getCounterpartyBankNo());
        vo.setCounterpartyBankName(item.getCounterpartyBankName());
        vo.setSerialNo(item.getSerialNo());
        vo.setCurrency(item.getCurrency());
        vo.setFingerprint(item.getFingerprint());
        vo.setVoucherType(item.getVoucherType());
        vo.setEmployeeName(item.getEmployeeName());
        vo.setPayeeOverride(item.getPayeeOverride());
        vo.setTargetBankName(item.getTargetBankName());
        vo.setSuggestedVoucherType(item.getSuggestedVoucherType());
        vo.setSuggestedEmployeeName(item.getSuggestedEmployeeName());
        vo.setKingdeeVoucherId(item.getKingdeeVoucherId());
        vo.setKingdeeVoucherNo(item.getKingdeeVoucherNo());
        vo.setKingdeePushError(item.getKingdeePushError());
        vo.setKingdeeExistStatus(item.getKingdeeExistStatus());
        vo.setKingdeeExistVoucherWord(item.getKingdeeExistVoucherWord());
        vo.setKingdeeExistVoucherNo(item.getKingdeeExistVoucherNo());
        vo.setKingdeeExistCheckedAt(item.getKingdeeExistCheckedAt());
        vo.setCreatedAt(item.getCreatedAt());
        return vo;
    }

    private String sourceFromFileName(String fileName) {
        if (!StringUtils.hasText(fileName)) {
            return null;
        }
        String name = fileName.toLowerCase(Locale.ROOT);
        if (name.contains("散户") || name.contains("台账")) {
            return "REJECT";
        }
        if (name.contains("晋商")) {
            return BankStatement.SOURCE_JINSHANG;
        }
        if (name.contains("工商") || name.contains("historydetail")) {
            return BankStatement.SOURCE_ICBC;
        }
        return null;
    }

    private String normalizeBankSource(String bankSource) {
        if (!StringUtils.hasText(bankSource)) {
            return null;
        }
        String value = bankSource.trim().toUpperCase(Locale.ROOT);
        if ("工商".equals(bankSource.trim()) || "ICBC".equals(value) || "GONGSHANG".equals(value)) {
            return BankStatement.SOURCE_ICBC;
        }
        if ("晋商".equals(bankSource.trim()) || "JINSHANG".equals(value) || "JS".equals(value)) {
            return BankStatement.SOURCE_JINSHANG;
        }
        if (BankStatement.SOURCE_ICBC.equals(value) || BankStatement.SOURCE_JINSHANG.equals(value)) {
            return value;
        }
        throw new RuntimeException("不支持的银行来源：" + bankSource + "，请使用 ICBC 或 JINSHANG");
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value.trim();
            }
        }
        return null;
    }

    private static String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private static String defaultEmpty(String value) {
        return value == null ? "" : value.trim();
    }
}
