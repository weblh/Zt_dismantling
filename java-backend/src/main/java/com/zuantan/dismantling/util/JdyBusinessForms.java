package com.zuantan.dismantling.util;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 简道云表单业务页映射：bizKey → entryId，以及中文业务字段/系统字段 → 前端字段名。
 */
public final class JdyBusinessForms {

    public static final String APP_ID = "65c1cb717f6b878acaadd2ab";

    private static final Map<String, String> ENTRY_IDS;
    private static final Map<String, Map<String, String>> FIELD_MAPS;

    static {
        Map<String, String> entries = new LinkedHashMap<>();
        entries.put("receipt", "662dc1c2e0555ac4e79278c3");
        entries.put("weighing-inspection", "662dc4486b4c3bc965464bae");
        entries.put("scrapped-vehicle", "662dc901bcd3aaaab61ba2c5");
        entries.put("pick-top-photo", "662df863bf6b4a2bd11c9bc1");
        entries.put("disassembly", "662df865bf6b4a2bd11c9d6e");
        entries.put("comprehensive-disassembly", "662df8672ff334b695e36ea7");
        entries.put("settlement", "663b3f2ee0b00783765247b2");
        entries.put("payment-application", "66f8e827c75fa95816c2bef3");
        entries.put("price-change", "66a1feb91fcd7c001cc5682f");
        entries.put("weighing-sync", "66a20b980183b692cab589c9");
        entries.put("payee-info", "672f20b05a9cca282dabcf68");
        entries.put("supplier", "6617543cbad6f2f89103bc62");
        ENTRY_IDS = Collections.unmodifiableMap(entries);

        Map<String, Map<String, String>> maps = new LinkedHashMap<>();
        maps.put("receipt", receiptFields());
        maps.put("weighing-inspection", weighingInspectionFields());
        maps.put("scrapped-vehicle", scrappedVehicleFields());
        maps.put("pick-top-photo", pickTopPhotoFields());
        maps.put("disassembly", disassemblyFields());
        maps.put("comprehensive-disassembly", comprehensiveDisassemblyFields());
        maps.put("settlement", settlementFields());
        maps.put("payment-application", paymentApplicationFields());
        maps.put("price-change", priceChangeFields());
        maps.put("weighing-sync", weighingSyncFields());
        maps.put("payee-info", payeeInfoFields());
        maps.put("supplier", supplierFields());
        FIELD_MAPS = Collections.unmodifiableMap(maps);
    }

    private JdyBusinessForms() {
    }

    public static String entryIdOf(String bizKey) {
        return ENTRY_IDS.get(bizKey);
    }

    public static Map<String, String> fieldMapOf(String bizKey) {
        Map<String, String> map = FIELD_MAPS.get(bizKey);
        return map == null ? Collections.emptyMap() : map;
    }

    public static Map<String, String> allEntryIds() {
        return ENTRY_IDS;
    }

    private static Map<String, String> sysFields() {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("提交人", "submitter");
        m.put("提交时间", "submitTime");
        m.put("更新时间", "updateTime");
        return m;
    }

    private static Map<String, String> withSys(Map<String, String> biz) {
        Map<String, String> m = new LinkedHashMap<>(biz);
        m.putAll(sysFields());
        return Collections.unmodifiableMap(m);
    }

    private static Map<String, String> receiptFields() {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("供应商名称", "supplierName");
        m.put("回车地", "returnLocation");
        m.put("联系电话", "contactPhone");
        m.put("日期时间", "datetime");
        m.put("大板车", "bigTruck");
        m.put("车牌号", "plateNo");
        m.put("销户/议价", "isNegotiated");
        m.put("车主身份信息", "ownerIdInfo");
        m.put("行车本", "drivingLicense");
        m.put("登记证书", "registrationCert");
        m.put("需说明事项", "remark");
        m.put("是否查验", "isChecked");
        return withSys(m);
    }

    private static Map<String, String> weighingInspectionFields() {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("编号", "code");
        m.put("销户/议价", "negotiation");
        m.put("过磅日期", "weighDate");
        m.put("车牌号", "plateNumber");
        m.put("回车日期", "returnDate");
        m.put("车辆类型", "vehicleType");
        m.put("车辆型号", "vehicleModel");
        m.put("供应商", "supplier");
        m.put("业务员", "salesperson");
        m.put("回车地", "returnLocation");
        m.put("吨位", "tonnage");
        m.put("压扁", "flatten");
        m.put("营运", "operation");
        m.put("B 级", "bLevel");
        m.put("B级", "bLevel");
        m.put("铁", "iron");
        m.put("铝", "aluminum");
        m.put("三元", "ternary");
        m.put("电瓶", "battery");
        m.put("轮胎", "tire");
        m.put("备注", "remark");
        return withSys(m);
    }

    private static Map<String, String> scrappedVehicleFields() {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("入场编号", "entryCode");
        m.put("销户/议价", "negotiation");
        m.put("过磅日期", "weighDate");
        m.put("净重", "netWeight");
        m.put("供应商", "supplier");
        m.put("车辆类型", "vehicleType");
        m.put("车辆型号", "vehicleModel");
        m.put("司磅员", "weighmaster");
        m.put("压扁", "flatten");
        m.put("营运", "operation");
        m.put("B 级", "bLevel");
        m.put("B级", "bLevel");
        m.put("铁", "iron");
        m.put("铝", "aluminum");
        m.put("三元", "ternary");
        m.put("电瓶", "battery");
        m.put("轮胎", "tire");
        m.put("备注", "remark");
        return withSys(m);
    }

    private static Map<String, String> pickTopPhotoFields() {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("入场编号", "entryCode");
        m.put("挑顶照片", "pickTopPhotos");
        m.put("查验照片", "inspectionPhotos");
        return withSys(m);
    }

    private static Map<String, String> disassemblyFields() {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("入场编号", "entryCode");
        m.put("过磅日期", "weighDate");
        m.put("净重", "netWeight");
        m.put("司磅员", "weighmaster");
        m.put("营运", "operation");
        m.put("B 级", "bLevel");
        m.put("B级", "bLevel");
        m.put("压扁", "flatten");
        m.put("铁", "iron");
        m.put("铝", "aluminum");
        m.put("三元", "ternary");
        m.put("电瓶", "battery");
        m.put("轮胎", "tire");
        m.put("拆解日期", "disassemblyDate");
        m.put("车辆类型", "vehicleType");
        m.put("车辆型号", "vehicleModel");
        m.put("照片", "photos");
        m.put("拆解人员", "disassembler");
        return withSys(m);
    }

    private static Map<String, String> comprehensiveDisassemblyFields() {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("入场编号", "entryCode");
        m.put("过磅日期", "weighDate");
        m.put("净重", "netWeight");
        m.put("司磅员", "weighmaster");
        m.put("综合拆解日期", "disassemblyDate");
        m.put("综合拆解人员", "disassembler");
        m.put("车辆型号", "vehicleModel");
        m.put("车辆照片", "photos");
        m.put("价格", "price");
        return withSys(m);
    }

    private static Map<String, String> settlementFields() {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("结账情况", "settlementStatus");
        m.put("编号", "code");
        m.put("回车日期", "returnDate");
        m.put("过磅日期", "weighDate");
        m.put("车牌号", "plateNumber");
        m.put("车辆类型", "vehicleType");
        m.put("车辆型号", "vehicleModel");
        m.put("供应商", "supplier");
        m.put("业务员", "salesperson");
        m.put("回车地", "returnLocation");
        m.put("吨位", "tonnage");
        m.put("铁", "iron");
        m.put("铝", "aluminum");
        m.put("三元", "ternary");
        m.put("电瓶", "battery");
        m.put("公斤差", "kgDiff");
        m.put("扣净重", "deductNetWeight");
        m.put("扣电瓶", "deductBattery");
        m.put("车况较好", "goodCondition");
        m.put("扣两厢", "deductTwoBox");
        m.put("扣面包斗斗", "deductBreadBox");
        m.put("扣铁圈", "deductIronRing");
        m.put("扣柴油", "deductDiesel");
        m.put("自送", "selfDelivery");
        m.put("扣小件", "deductSmallParts");
        m.put("单价", "unitPrice");
        m.put("总价", "totalPrice");
        m.put("备注", "remark");
        return withSys(m);
    }

    private static Map<String, String> paymentApplicationFields() {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("日期", "date");
        m.put("申请人", "applicant");
        m.put("部门单选", "department");
        m.put("付款明细", "details");
        m.put("合计金额(小写)", "totalAmount");
        m.put("合计金额", "totalAmount");
        m.put("合计金额(大写)", "totalAmountCapital");
        m.put("合计金额大写", "totalAmountCapital");
        m.put("车辆数量", "vehicleCount");
        m.put("总吨位", "totalTonnage");
        m.put("付款账户", "paymentAccount");
        m.put("付款方式", "paymentMethod");
        m.put("收款单位1", "payeeName1");
        m.put("收款账号1", "payeeAccount1");
        m.put("账号1", "payeeAccount1");
        m.put("开户行1", "bankName1");
        m.put("银行账号1", "bankAccount1");
        m.put("收款单位2", "payeeName2");
        m.put("收款账号2", "payeeAccount2");
        m.put("开户行2", "bankName2");
        m.put("银行账号2", "bankAccount2");
        m.put("付款事由", "paymentReason");
        m.put("流程状态", "processStatus");
        m.put("当前节点", "currentNode");
        m.put("当前负责人", "currentHandler");
        return withSys(m);
    }

    private static Map<String, String> priceChangeFields() {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("编号", "code");
        m.put("回车日期", "returnDate");
        m.put("过磅日期", "weighDate");
        m.put("车牌号", "plateNumber");
        m.put("车辆类型", "vehicleType");
        m.put("车辆型号", "vehicleModel");
        m.put("供应商", "supplier");
        m.put("业务员", "salesperson");
        m.put("回车地", "returnLocation");
        m.put("吨位", "tonnage");
        m.put("铁", "iron");
        m.put("铝", "aluminum");
        m.put("三元", "ternary");
        m.put("电瓶", "battery");
        m.put("公斤差", "kgDiff");
        m.put("扣净重", "deductNetWeight");
        m.put("扣电瓶", "deductBattery");
        m.put("车况较好", "goodCondition");
        m.put("扣两厢", "deductTwoBox");
        m.put("扣面包斗斗", "deductBreadBox");
        m.put("扣铁圈", "deductIronRing");
        m.put("扣柴油", "deductDiesel");
        m.put("自送", "selfDelivery");
        m.put("扣小件", "deductSmallParts");
        m.put("单价", "unitPrice");
        m.put("总价", "totalPrice");
        m.put("备注", "remark");
        m.put("流程状态", "processStatus");
        m.put("当前节点", "currentNode");
        m.put("当前负责人", "currentHandler");
        return withSys(m);
    }

    private static Map<String, String> payeeInfoFields() {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("收款单位", "payeeUnit");
        m.put("收款账号", "payeeAccount");
        m.put("开户行", "openingBank");
        m.put("银行行号", "bankCode");
        return withSys(m);
    }

    private static Map<String, String> supplierFields() {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("供应商名称", "supplierName");
        m.put("联系电话", "contactPhone");
        return withSys(m);
    }

    private static Map<String, String> weighingSyncFields() {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("编号", "code");
        m.put("议价/销户", "isNegotiated");
        m.put("销户/议价", "isNegotiated");
        m.put("吨位", "tonnage");
        m.put("状态", "status");
        return withSys(m);
    }
}
