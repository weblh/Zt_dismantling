package com.zuantan.dismantling.util;

import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 简道云表单业务页映射：bizKey → entryId，以及中文业务字段/系统字段 → 前端字段名。
 * 收车 / 议价两个应用共用相同 entryId，以 appId 区分数据来源。
 */
public final class JdyBusinessForms {

    /** 汽车拆解-收车 */
    public static final String APP_ID = "65c1cb717f6b878acaadd2ab";
    /** 汽车拆解_收车议价（总部业务看板所在应用） */
    public static final String PRICING_APP_ID = "67ff16f5714711e0b87f173b";

    public static final String SOURCE_RECEIPT = "收车";
    public static final String SOURCE_PRICING = "议价";

    /** 大屏合并统计用的双应用来源（顺序即展示顺序） */
    public static final List<AppSource> DASHBOARD_SOURCES = Collections.unmodifiableList(Arrays.asList(
            new AppSource(APP_ID, SOURCE_RECEIPT, "receipt"),
            new AppSource(PRICING_APP_ID, SOURCE_PRICING, "pricing")
    ));

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
        entries.put("salesman", "662df42caac7fa9673a158e7");
        entries.put("vehicle-model", "663b1d28e70ddd5951d36e4b");
        entries.put("warehouse", "66f8b152abee705881eec3a5");
        entries.put("product-name", "66f8b2fcb00b52e5eb7841ed");
        entries.put("product-inbound", "6673a90143926f2102b79392");
        entries.put("finished-product-ledger", "663b3b4ad1a1f61d38420867");
        entries.put("finished-product-approval", "67b5879e92f4293f780e230c");
        entries.put("part-ledger", "67b585f3e7521f1d18cd0cf2");
        entries.put("part-approval", "67b58a467e762ba59aee19e1");
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
        maps.put("salesman", salesmanFields());
        maps.put("vehicle-model", vehicleModelFields());
        maps.put("warehouse", warehouseFields());
        maps.put("product-name", productNameFields());
        maps.put("staff", staffFields());
        maps.put("product-inbound", productInboundFields());
        maps.put("finished-product-ledger", finishedProductLedgerFields());
        maps.put("finished-product-approval", finishedProductApprovalFields());
        maps.put("part-ledger", partLedgerFields());
        maps.put("part-approval", partLedgerFields());
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

    public static List<AppSource> dashboardSources() {
        return DASHBOARD_SOURCES;
    }

    public static List<String> dashboardAppIds() {
        return Arrays.asList(APP_ID, PRICING_APP_ID);
    }

    public static final class AppSource {
        private final String appId;
        private final String label;
        private final String code;

        public AppSource(String appId, String label, String code) {
            this.appId = appId;
            this.label = label;
            this.code = code;
        }

        public String getAppId() {
            return appId;
        }

        public String getLabel() {
            return label;
        }

        public String getCode() {
            return code;
        }
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

    private static Map<String, String> salesmanFields() {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("业务员", "salesman");
        m.put("姓名", "salesman");
        return withSys(m);
    }

    private static Map<String, String> vehicleModelFields() {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("车辆型号", "vehicleModel");
        m.put("型号", "vehicleModel");
        return withSys(m);
    }

    private static Map<String, String> warehouseFields() {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("仓库名称", "warehouseName");
        m.put("仓库", "warehouseName");
        return withSys(m);
    }

    private static Map<String, String> productNameFields() {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("产品名称", "productName");
        m.put("品名", "productName");
        m.put("占比", "proportion");
        m.put("比例", "proportion");
        return withSys(m);
    }

    private static Map<String, String> staffFields() {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("姓名", "staffName");
        m.put("生产人员", "staffName");
        m.put("人员", "staffName");
        m.put("司磅员", "staffName");
        m.put("角色", "roleType");
        m.put("岗位", "roleType");
        return withSys(m);
    }

    private static Map<String, String> weighingSyncFields() {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("编号", "code");
        m.put("议价/销户", "negotiation");
        m.put("销户/议价", "negotiation");
        m.put("吨位", "tonnage");
        m.put("状态", "status");
        return withSys(m);
    }

    private static Map<String, String> productInboundFields() {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("车辆编号", "vehicleCode");
        m.put("入库日期", "inboundDate");
        m.put("撕碎料", "shredding");
        m.put("废钢", "scrapSteel");
        m.put("底盘料", "chassis");
        m.put("铜线", "copper");
        m.put("铝件", "aluminum");
        m.put("塑料", "plastic");
        m.put("小件", "smallParts");
        m.put("橡胶", "rubber");
        m.put("其他", "other");
        return withSys(m);
    }

    private static Map<String, String> finishedProductLedgerFields() {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("编号", "code");
        m.put("出货日期", "deliveryDate");
        m.put("过磅同步日期", "syncDate");
        m.put("车号", "carNo");
        m.put("收货单位", "receiver");
        m.put("仓库", "warehouse");
        m.put("品名", "productName");
        m.put("型号", "model");
        m.put("毛重", "grossWeight");
        m.put("皮重", "tareWeight");
        m.put("净重", "netWeight");
        m.put("合同编号", "contractNo");
        m.put("单价 (RMB/吨不含税)", "unitPrice");
        m.put("单价", "unitPrice");
        m.put("总价 （含税）", "totalPrice");
        m.put("总价", "totalPrice");
        m.put("客户", "customer");
        m.put("地址", "address");
        m.put("联系方式", "contact");
        m.put("回款情况", "paymentStatus");
        m.put("出库吨重", "outWeight");
        m.put("实际到账金额", "actualAmount");
        m.put("情况说明", "remark");
        // 简道云英文控件名兜底（widget_schema 未刷新时）
        m.put("number", "code");
        m.put("ales_date", "deliveryDate");
        m.put("sales_date", "deliveryDate");
        m.put("receiving_unit", "receiver");
        m.put("category", "productName");
        m.put("car_number", "carNo");
        m.put("gross_weight", "grossWeight");
        m.put("tare_weight", "tareWeight");
        m.put("net_weight", "netWeight");
        m.put("contract_number", "contractNo");
        m.put("unit_price", "unitPrice");
        m.put("total_price", "totalPrice");
        m.put("collection_situation", "paymentStatus");
        m.put("telephone", "contact");
        return withSys(m);
    }

    private static Map<String, String> finishedProductApprovalFields() {
        return finishedProductLedgerFields();
    }

    private static Map<String, String> partLedgerFields() {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("编号", "code");
        m.put("出货日期", "deliveryDate");
        m.put("过磅同步日期", "syncDate");
        m.put("车号", "carNo");
        m.put("收货单位", "receiver");
        m.put("仓库", "warehouse");
        m.put("品名", "productName");
        m.put("型号", "model");
        m.put("毛重", "grossWeight");
        m.put("皮重", "tareWeight");
        m.put("净重", "netWeight");
        m.put("合同编号", "contractNo");
        m.put("单价", "unitPrice");
        m.put("总价", "totalPrice");
        m.put("客户", "customer");
        m.put("地址", "address");
        m.put("联系方式", "contact");
        m.put("回款情况", "paymentStatus");
        m.put("出库吨重", "outWeight");
        m.put("实际到账金额", "actualAmount");
        m.put("情况说明", "remark");
        m.put("number", "code");
        m.put("ales_date", "deliveryDate");
        m.put("sales_date", "deliveryDate");
        m.put("receiving_unit", "receiver");
        m.put("category", "productName");
        m.put("car_number", "carNo");
        m.put("gross_weight", "grossWeight");
        m.put("tare_weight", "tareWeight");
        m.put("net_weight", "netWeight");
        m.put("contract_number", "contractNo");
        m.put("unit_price", "unitPrice");
        m.put("total_price", "totalPrice");
        m.put("collection_situation", "paymentStatus");
        m.put("telephone", "contact");
        return withSys(m);
    }
}
