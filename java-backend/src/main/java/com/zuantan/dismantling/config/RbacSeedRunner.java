package com.zuantan.dismantling.config;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zuantan.dismantling.entity.SysMenu;
import com.zuantan.dismantling.entity.SysRole;
import com.zuantan.dismantling.entity.SysRoleMenu;
import com.zuantan.dismantling.mapper.SysMenuMapper;
import com.zuantan.dismantling.mapper.SysRoleMapper;
import com.zuantan.dismantling.mapper.SysRoleMenuMapper;
import com.zuantan.dismantling.util.AppPermissionUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 首次启动注入默认菜单与角色；已有数据则跳过。
 */
@Component
@Order(20)
public class RbacSeedRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(RbacSeedRunner.class);

    private final SysMenuMapper menuMapper;
    private final SysRoleMapper roleMapper;
    private final SysRoleMenuMapper roleMenuMapper;

    public RbacSeedRunner(SysMenuMapper menuMapper, SysRoleMapper roleMapper, SysRoleMenuMapper roleMenuMapper) {
        this.menuMapper = menuMapper;
        this.roleMapper = roleMapper;
        this.roleMenuMapper = roleMenuMapper;
    }

    @Override
    public void run(ApplicationArguments args) {
        seedRoles();
        if (menuMapper.selectCount(null) == 0) {
            seedMenusAndBindings();
            log.info("RBAC 默认菜单与角色权限已初始化");
        } else {
            ensureSystemMenus();
        }
    }

    private void seedRoles() {
        ensureRole(AppPermissionUtil.ROLE_SUPER_ADMIN, "超级管理员", "拥有全部菜单与权限");
        ensureRole(AppPermissionUtil.ROLE_USER, "普通用户", "默认业务菜单");
        ensureRole(AppPermissionUtil.ROLE_INSPECTOR, "查验员", "偏生产/查验相关菜单");
    }

    private void ensureRole(String code, String name, String remark) {
        SysRole existing = roleMapper.selectOne(new LambdaQueryWrapper<SysRole>()
                .eq(SysRole::getCode, code).last("LIMIT 1"));
        if (existing != null) {
            return;
        }
        SysRole role = new SysRole();
        role.setCode(code);
        role.setName(name);
        role.setRemark(remark);
        role.setStatus(1);
        role.setCreatedAt(LocalDateTime.now());
        role.setUpdatedAt(LocalDateTime.now());
        roleMapper.insert(role);
    }

    private void seedMenusAndBindings() {
        List<Long> allMenuIds = new ArrayList<>();
        List<Long> systemMenuIds = new ArrayList<>();

        int order = 10;
        allMenuIds.add(menu(0L, "华成攒碳大屏", "/home", "DashboardOutlined", "M", order++));
        allMenuIds.add(menu(0L, "总部大屏", "/headquarters-dashboard", "DashboardOutlined", "M", order++));
        allMenuIds.add(menu(0L, "简道云同步", "/jdy/sync", "CloudSyncOutlined", "M", order++));
        allMenuIds.add(menu(0L, "我的待办", "todo", "ClockCircleOutlined", "M", order++));
        allMenuIds.add(menu(0L, "我发起的", "initiated", "SendOutlined", "M", order++));
        allMenuIds.add(menu(0L, "我处理的", "processed", "CheckCircleOutlined", "M", order++));
        allMenuIds.add(menu(0L, "抄送我的", "copied", "MailOutlined", "M", order++));

        Long basic = menu(0L, "基础", "basic", "DatabaseOutlined", "D", order++);
        allMenuIds.add(basic);
        allMenuIds.add(menu(basic, "业务员", "/basic/salesman", "UserOutlined", "M", 1));
        allMenuIds.add(menu(basic, "供应商基础资料", "/basic/supplier", "TeamOutlined", "M", 2));
        allMenuIds.add(menu(basic, "车辆型号", "/basic/vehicle-model", "CarOutlined", "M", 3));
        allMenuIds.add(menu(basic, "仓库", "/basic/warehouse", "InboxOutlined", "M", 4));
        allMenuIds.add(menu(basic, "产品名称", "/basic/product-name", "TagOutlined", "M", 5));
        allMenuIds.add(menu(basic, "收款人信息", "/basic/payee-info", "PayCircleOutlined", "M", 6));
        allMenuIds.add(menu(basic, "生产人员", "/basic/staff", "UserOutlined", "M", 7));

        Long recognition = menu(0L, "识别", "recognition", "ScanOutlined", "D", order++);
        allMenuIds.add(recognition);
        allMenuIds.add(menu(recognition, "VIN识别", "/recognition/vin", "InboxOutlined", "M", 1));
        allMenuIds.add(menu(recognition, "车辆档案识别", "/recognition/vehicle-archive", "FileTextOutlined", "M", 2));

        Long business = menu(0L, "业务", "business", "FolderOpenOutlined", "D", order++);
        allMenuIds.add(business);
        allMenuIds.add(menu(business, "1.业务收货", "/business/receipt", "ShoppingFilled", "M", 1));
        allMenuIds.add(menu(business, "异地车固照片", "/business/vehicle-photo", "PictureOutlined", "M", 2));
        allMenuIds.add(menu(business, "业务结账", "/business/settlement", "FileTextOutlined", "M", 3));
        allMenuIds.add(menu(business, "业务结账付款申请", "/business/payment-application", "PayCircleOutlined", "M", 4));
        allMenuIds.add(menu(business, "修改价格", "/business/price-change", "TagOutlined", "M", 5));
        allMenuIds.add(menu(business, "业务收车统计表", "/business/vehicle-receipt-statistics", "BarChartOutlined", "M", 6));

        Long production = menu(0L, "生产", "production", "DatabaseOutlined", "D", order++);
        allMenuIds.add(production);
        allMenuIds.add(menu(production, "1.过磅同步数据", "/kingdee/voucher", "DatabaseOutlined", "M", 1));
        allMenuIds.add(menu(production, "2.过磅查验", "/production/weighing-inspection", "UserOutlined", "M", 2));
        allMenuIds.add(menu(production, "3.查验照片", "/production/inspection-photo", "HomeOutlined", "M", 3));
        allMenuIds.add(menu(production, "4.报废车入库", "/production/scrapped-vehicle", "WarningOutlined", "M", 4));
        allMenuIds.add(menu(production, "5.挑顶照片", "/production/pick-top-photo", "PictureOutlined", "M", 5));
        allMenuIds.add(menu(production, "6.拆解", "/production/disassembly", "SettingOutlined", "M", 6));
        allMenuIds.add(menu(production, "7.综合拆解", "/production/comprehensive-disassembly", "AppstoreOutlined", "M", 7));
        allMenuIds.add(menu(production, "8.维修工单", "/production/repair-work-order", "ToolOutlined", "M", 8));

        Long dingtalk = menu(0L, "钉钉", "dingtalk", "SendOutlined", "D", order++);
        allMenuIds.add(dingtalk);
        allMenuIds.add(menu(dingtalk, "Stream通道", "/dingtalk", "DatabaseOutlined", "M", 1));
        allMenuIds.add(menu(dingtalk, "表单配置", "/dingtalk/form-config", "FormOutlined", "M", 2));
        allMenuIds.add(menu(dingtalk, "OA表单数据", "/dingtalk/oa-form-data", "FileTextOutlined", "M", 3));

        Long finance = menu(0L, "财务", "finance", "AccountBookOutlined", "D", order++);
        allMenuIds.add(finance);
        Long kingdee = menu(finance, "金蝶", "kingdee", "AccountBookOutlined", "D", 1);
        allMenuIds.add(kingdee);
        allMenuIds.add(menu(kingdee, "账套配置", "/kingdee/account", "SettingOutlined", "M", 1));
        allMenuIds.add(menu(kingdee, "供应商", "/kingdee/supplier", "ShopOutlined", "M", 2));
        Long kingdeeWrite = menu(kingdee, "写入金蝶", "kingdee-write", "SendOutlined", "D", 3);
        allMenuIds.add(kingdeeWrite);
        allMenuIds.add(menu(kingdeeWrite, "费用报销明细", "/business/expense-reimbursement", "AccountBookOutlined", "M", 1));
        allMenuIds.add(menu(kingdeeWrite, "资金使用申请", "/business/fund-usage-application", "FundOutlined", "M", 2));

        Long sales = menu(0L, "销售", "sales", "ShoppingOutlined", "D", order++);
        allMenuIds.add(sales);
        allMenuIds.add(menu(sales, "成品销售审批单", "/sales/finished-product-approval", "InboxOutlined", "M", 1));
        allMenuIds.add(menu(sales, "成品销售台账", "/sales/finished-product-ledger", "InboxOutlined", "M", 2));
        allMenuIds.add(menu(sales, "配件销售审批单", "/sales/part-approval", "InboxOutlined", "M", 3));
        allMenuIds.add(menu(sales, "配件销售台账", "/sales/part-ledger", "InboxOutlined", "M", 4));
        allMenuIds.add(menu(sales, "修改出货价格", "/sales/modify-shipping-price", "TagOutlined", "M", 5));
        allMenuIds.add(menu(sales, "成品销售统计", "/sales/finished-product-statistics", "BarChartOutlined", "M", 6));
        allMenuIds.add(menu(sales, "配件销售统计", "/sales/part-statistics", "BarChartOutlined", "M", 7));

        Long agriculture = menu(0L, "农机业务", "agriculture", "TruckOutlined", "D", order++);
        allMenuIds.add(agriculture);
        allMenuIds.add(menu(agriculture, "原材料-农机入库", "/agriculture/machinery-inbound", "InboxOutlined", "M", 1));
        allMenuIds.add(menu(agriculture, "原材料-农机出库", "/agriculture/machinery-outbound", "InboxOutlined", "M", 2));
        allMenuIds.add(menu(agriculture, "原材料-农机剩余库存", "/agriculture/machinery-stock", "InboxOutlined", "M", 3));
        allMenuIds.add(menu(agriculture, "农机成品入库", "/agriculture/finished-product-inbound", "InboxOutlined", "M", 4));
        allMenuIds.add(menu(agriculture, "农机成品出库", "/agriculture/finished-product-outbound", "InboxOutlined", "M", 5));
        allMenuIds.add(menu(agriculture, "成品剩余", "/agriculture/finished-remaining", "InboxOutlined", "M", 6));

        Long procedures = menu(0L, "手续", "procedures", "FileTextOutlined", "D", order++);
        allMenuIds.add(procedures);
        allMenuIds.add(menu(procedures, "回收证明", "recycle-certificate", "FileTextOutlined", "M", 1));
        allMenuIds.add(menu(procedures, "山西华成攒碳回收证明台账", "/agriculture/recycle-certificate-daily", "InboxOutlined", "M", 2));
        allMenuIds.add(menu(procedures, "回收证明作废台账", "/agriculture/recycle-certificate-void", "InboxOutlined", "M", 3));
        allMenuIds.add(menu(procedures, "欧海手续详情", "/agriculture/ouhai-formalities", "InboxOutlined", "M", 4));
        allMenuIds.add(menu(procedures, "回收证明统计看板", "/agriculture/recycle-statistics", "BarChartOutlined", "M", 5));

        Long pricingInv = menu(0L, "议价-库存台账", "pricing-inventory", "InboxOutlined", "D", order++);
        allMenuIds.add(pricingInv);
        allMenuIds.add(menu(pricingInv, "打开议价端库存台账", "open-pricing-inventory", "InboxOutlined", "M", 1));
        allMenuIds.add(menu(pricingInv, "配件库存", "/part/part-stock", "InboxOutlined", "M", 2));
        allMenuIds.add(menu(pricingInv, "配件客户信息", "/part/part-info-customer", "UserOutlined", "M", 3));

        Long system = menu(0L, "系统管理", "system", "SafetyCertificateOutlined", "D", order++);
        systemMenuIds.add(system);
        systemMenuIds.add(menu(system, "用户权限", "/system/users", "TeamOutlined", "M", 1));
        systemMenuIds.add(menu(system, "组织架构", "/system/org", "ApartmentOutlined", "M", 2));
        systemMenuIds.add(menu(system, "角色权限", "/system/roles", "SafetyCertificateOutlined", "M", 3));
        systemMenuIds.add(menu(system, "菜单管理", "/system/menus", "AppstoreOutlined", "M", 4));
        systemMenuIds.add(menu(system, "字典管理", "/system/dicts", "TagOutlined", "M", 5));
        allMenuIds.addAll(systemMenuIds);

        // USER / INSPECTOR：全部业务菜单（不含系统管理）；超管不靠关联表
        List<Long> businessMenus = new ArrayList<>(allMenuIds);
        businessMenus.removeAll(systemMenuIds);
        bindMenus(AppPermissionUtil.ROLE_USER, businessMenus);
        bindMenus(AppPermissionUtil.ROLE_INSPECTOR, businessMenus);
    }

    /** 已有菜单库时，确保系统管理子菜单齐全 */
    private void ensureSystemMenus() {
        SysMenu system = menuMapper.selectOne(new LambdaQueryWrapper<SysMenu>()
                .eq(SysMenu::getPath, "system").last("LIMIT 1"));
        if (system == null) {
            system = new SysMenu();
            system.setParentId(0L);
            system.setName("系统管理");
            system.setPath("system");
            system.setIcon("SafetyCertificateOutlined");
            system.setMenuType("D");
            system.setSortOrder(900);
            system.setVisible(1);
            system.setStatus(1);
            system.setCreatedAt(LocalDateTime.now());
            system.setUpdatedAt(LocalDateTime.now());
            menuMapper.insert(system);
        }
        ensureChild(system.getId(), "用户权限", "/system/users", "TeamOutlined", 1);
        ensureChild(system.getId(), "组织架构", "/system/org", "ApartmentOutlined", 2);
        ensureChild(system.getId(), "角色权限", "/system/roles", "SafetyCertificateOutlined", 3);
        ensureChild(system.getId(), "菜单管理", "/system/menus", "AppstoreOutlined", 4);
        ensureChild(system.getId(), "字典管理", "/system/dicts", "TagOutlined", 5);
    }

    private void ensureChild(Long parentId, String name, String path, String icon, int sort) {
        Long count = menuMapper.selectCount(new LambdaQueryWrapper<SysMenu>().eq(SysMenu::getPath, path));
        if (count != null && count > 0) {
            return;
        }
        menu(parentId, name, path, icon, "M", sort);
    }

    private void bindMenus(String roleCode, List<Long> menuIds) {
        SysRole role = roleMapper.selectOne(new LambdaQueryWrapper<SysRole>()
                .eq(SysRole::getCode, roleCode).last("LIMIT 1"));
        if (role == null) {
            return;
        }
        Long existing = roleMenuMapper.selectCount(new LambdaQueryWrapper<SysRoleMenu>()
                .eq(SysRoleMenu::getRoleId, role.getId()));
        if (existing != null && existing > 0) {
            return;
        }
        for (Long menuId : menuIds) {
            SysRoleMenu rm = new SysRoleMenu();
            rm.setRoleId(role.getId());
            rm.setMenuId(menuId);
            roleMenuMapper.insert(rm);
        }
    }

    private Long menu(Long parentId, String name, String path, String icon, String type, int sort) {
        SysMenu m = new SysMenu();
        m.setParentId(parentId == null ? 0L : parentId);
        m.setName(name);
        m.setPath(path);
        m.setIcon(icon);
        m.setMenuType(type);
        m.setSortOrder(sort);
        m.setVisible(1);
        m.setStatus(1);
        m.setCreatedAt(LocalDateTime.now());
        m.setUpdatedAt(LocalDateTime.now());
        menuMapper.insert(m);
        return m.getId();
    }
}
