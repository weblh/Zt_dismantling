import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { PrivateRoute } from './PrivateRoute';
import Login from '@/pages/login';
import Layout from '@/layouts';
import Home from '@/pages/home';
import HeadquartersDashboard from '@/pages/headquarters-dashboard';
import DingtalkFormConfig from '@/pages/dingtalk/form-config';
import DingtalkOaFormData from '@/pages/dingtalk/oa-form-data';
import DingtalkData from '@/pages/dingtalk';
import KingdeeVoucher from '@/pages/kingdee/voucher';
import KingdeeSupplier from '@/pages/kingdee/supplier';
import KingdeeAccount from '@/pages/kingdee/account';
import BankStatement from '@/pages/kingdee/bank-statement';
import RetailTransfer from '@/pages/kingdee/retail-transfer';
import VehicleReceiptStatistics from '@/pages/business/vehicle-receipt-statistics';
import PaymentApplication from '@/pages/business/payment-application';
import RepairWorkOrder from '@/pages/production/repair-work-order';
import ReceiptPage from '@/pages/business/receipt';
import VehiclePhotoPage from '@/pages/business/vehicle-photo';
import SettlementPage from '@/pages/business/settlement';
import PriceChangePage from '@/pages/business/price-change';
import MobileForm from '@/pages/mobile/form';
import InspectionForm from '@/pages/mobile/inspection-form';
import WeighingInspection from '@/pages/production/weighing-inspection';
import InspectionPhoto from '@/pages/production/inspection-photo';
import ScrappedVehicle from '@/pages/production/scrapped-vehicle';
import PickTopPhoto from '@/pages/production/pick-top-photo';
import Disassembly from '@/pages/production/disassembly';
import ComprehensiveDisassembly from '@/pages/production/comprehensive-disassembly';
import FinishedProductApproval from '@/pages/sales/finished-product-approval';
import FinishedProductLedger from '@/pages/sales/finished-product-ledger';
import PartApproval from '@/pages/sales/part-approval';
import PartLedger from '@/pages/sales/part-ledger';
import ModifyShippingPrice from '@/pages/sales/modify-shipping-price';
import FinishedProductStatistics from '@/pages/sales/finished-product-statistics';
import PartStatistics from '@/pages/sales/part-statistics';
import InventoryLedger from '@/pages/finance/inventory-ledger';
import MachineryInbound from '@/pages/agriculture/machinery-inbound';
import MachineryOutbound from '@/pages/agriculture/machinery-outbound';
import MachineryStock from '@/pages/agriculture/machinery-stock';
import FinishedProductInbound from '@/pages/agriculture/finished-product-inbound';
import FinishedProductOutbound from '@/pages/agriculture/finished-product-outbound';
import FinishedRemaining from '@/pages/agriculture/finished-remaining';
import RecycleCertificateLedger from '@/pages/agriculture/recycle-certificate-ledger';
import RecycleCertificateVoid from '@/pages/agriculture/recycle-certificate-void';
import OuhaiFormalities from '@/pages/agriculture/ouhai-formalities';
import RecycleStatistics from '@/pages/agriculture/recycle-statistics';
import RecycleCertificateDaily from '@/pages/agriculture/recycle-certificate-daily';
import PartStock from '@/pages/part/part-stock';
import PartInfoCustomer from '@/pages/part/part-info-customer';
import VinRecognition from '@/pages/recognition/vin';
import VehicleArchive from '@/pages/recognition/vehicle-archive';
import Salesman from '@/pages/basic/salesman';
import Supplier from '@/pages/basic/supplier';
import VehicleModel from '@/pages/basic/vehicle-model';
import ProductName from '@/pages/basic/product-name';
import PayeeInfo from '@/pages/basic/payee-info';
import Staff from '@/pages/basic/staff';
import ProductInfo from '@/pages/inventory/product-info';
import FinishedProduct from '@/pages/inventory/finished-product';
import WarehouseInfo from '@/pages/inventory/warehouse-info';
import InventoryDashboard from '@/pages/inventory/dashboard';
import ProductInbound from '@/pages/inventory/product-inbound';
import ProductOutbound from '@/pages/inventory/product-outbound';
import OtherInbound from '@/pages/inventory/other-inbound';
import OtherOutbound from '@/pages/inventory/other-outbound';
import InOutStatistics from '@/pages/inventory/inout-statistics';
import SystemUsers from '@/pages/system/users';
import SystemOrg from '@/pages/system/org';
import SystemRoles from '@/pages/system/roles';
import SystemMenus from '@/pages/system/menus';
import SystemDicts from '@/pages/system/dicts';
import ForbiddenPage from '@/pages/system/forbidden';
import { getStoredUser } from '@/config/apps';
import { MenuGuard } from './MenuGuard';
import WebsiteLayout from '@/website/WebsiteLayout';
import SiteHome from '@/website/pages/Home';
import SiteProcess from '@/website/pages/Process';
import SiteProducts from '@/website/pages/Products';
import SiteCompliance from '@/website/pages/Compliance';
import SiteAbout from '@/website/pages/About';
import SiteContact from '@/website/pages/Contact';
import SiteInquiry from '@/website/pages/Inquiry';
import SystemWebsiteInquiry from '@/pages/system/website-inquiry';

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const user = getStoredUser();
  if (user.role !== 'SUPER_ADMIN') {
    return <Navigate to="/home" replace />;
  }
  return <>{children}</>;
}

export default function Router() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {/* 独立路由 - 无需登录即可访问 */}
      <Route path="/mobile/form" element={<MobileForm />} />
      <Route path="/mobile/inspection-form" element={<InspectionForm />} />
      <Route
        path="/headquarters-dashboard"
        element={
          <PrivateRoute>
            <MenuGuard>
              <HeadquartersDashboard />
            </MenuGuard>
          </PrivateRoute>
        }
      />
      <Route path="/" element={<WebsiteLayout />}>
        <Route index element={<SiteHome />} />
        <Route path="process" element={<SiteProcess />} />
        <Route path="products" element={<SiteProducts />} />
        <Route path="compliance" element={<SiteCompliance />} />
        <Route path="about" element={<SiteAbout />} />
        <Route path="inquiry" element={<SiteInquiry />} />
        <Route path="contact" element={<SiteContact />} />
      </Route>
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="403" element={<ForbiddenPage />} />
        <Route path="home" element={<Home />} />
        <Route path="dingtalk/form-config" element={<DingtalkFormConfig />} />
        <Route path="dingtalk/oa-form-data" element={<DingtalkOaFormData />} />
        <Route path="dingtalk" element={<DingtalkData />} />
        <Route path="kingdee/bank-statement" element={<BankStatement />} />
        <Route path="kingdee/retail-transfer" element={<RetailTransfer />} />
        <Route path="business/expense-reimbursement" element={<Navigate to="/kingdee/bank-statement" replace />} />
        <Route path="business/fund-usage-application" element={<Navigate to="/kingdee/bank-statement" replace />} />
        <Route path="business/vehicle-receipt-statistics" element={<VehicleReceiptStatistics />} />
        <Route path="business/payment-application" element={<PaymentApplication />} />
        <Route path="business/receipt" element={<ReceiptPage />} />
        <Route path="business/vehicle-photo" element={<VehiclePhotoPage />} />
        <Route path="business/settlement" element={<SettlementPage />} />
        <Route path="business/price-change" element={<PriceChangePage />} />
        <Route path="production/repair-work-order" element={<RepairWorkOrder />} />
        <Route path="business/repair-work-order" element={<Navigate to="/production/repair-work-order" replace />} />
        <Route path="kingdee/voucher" element={<KingdeeVoucher />} />
        <Route path="kingdee/supplier" element={<KingdeeSupplier />} />
        <Route path="kingdee/account" element={<KingdeeAccount />} />
        <Route path="production/weighing-inspection" element={<WeighingInspection />} />
        <Route path="production/inspection-photo" element={<InspectionPhoto />} />
        <Route path="production/scrapped-vehicle" element={<ScrappedVehicle />} />
        <Route path="production/pick-top-photo" element={<PickTopPhoto />} />
        <Route path="production/disassembly" element={<Disassembly />} />
        <Route path="production/comprehensive-disassembly" element={<ComprehensiveDisassembly />} />
        <Route path="sales/finished-product-approval" element={<FinishedProductApproval />} />
        <Route path="sales/finished-product-ledger" element={<FinishedProductLedger />} />
        <Route path="sales/part-approval" element={<PartApproval />} />
        <Route path="sales/part-ledger" element={<PartLedger />} />
        <Route path="sales/modify-shipping-price" element={<ModifyShippingPrice />} />
        <Route path="sales/finished-product-statistics" element={<FinishedProductStatistics />} />
        <Route path="sales/part-statistics" element={<PartStatistics />} />
        <Route path="finance/inventory-ledger" element={<Navigate to="/home" replace />} />
        {/* 库存台账已迁至议价应用 */}
        <Route path="agriculture/machinery-inbound" element={<MachineryInbound />} />
        <Route path="agriculture/machinery-outbound" element={<MachineryOutbound />} />
        <Route path="agriculture/machinery-stock" element={<MachineryStock />} />
        <Route path="agriculture/finished-product-inbound" element={<FinishedProductInbound />} />
        <Route path="agriculture/finished-product-outbound" element={<FinishedProductOutbound />} />
        <Route path="agriculture/finished-remaining" element={<FinishedRemaining />} />
        <Route path="agriculture/recycle-certificate-ledger" element={<RecycleCertificateLedger />} />
        <Route path="agriculture/recycle-certificate-daily" element={<RecycleCertificateDaily />} />
        <Route path="agriculture/recycle-certificate-void" element={<RecycleCertificateVoid />} />
        <Route path="agriculture/ouhai-formalities" element={<OuhaiFormalities />} />
        <Route path="agriculture/recycle-statistics" element={<RecycleStatistics />} />
        <Route path="part/part-stock" element={<PartStock />} />
        <Route path="part/part-info-customer" element={<PartInfoCustomer />} />
        <Route path="recognition/vin" element={<VinRecognition />} />
        <Route path="recognition/vehicle-archive" element={<VehicleArchive />} />
        <Route path="basic/salesman" element={<Salesman />} />
        <Route path="basic/supplier" element={<Supplier />} />
        <Route path="basic/vehicle-model" element={<VehicleModel />} />
        <Route path="basic/product-name" element={<ProductName />} />
        <Route path="basic/payee-info" element={<PayeeInfo />} />
        <Route path="basic/staff" element={<Staff />} />
        <Route path="dashboard/inventory-statistics" element={<Navigate to="/home" replace />} />

        {/* 库存台账 路由（库存统计已删除） */}
        <Route path="inventory/statistics" element={<Navigate to="/home" replace />} />
        <Route path="inventory/product-info" element={<ProductInfo />} />
        <Route path="inventory/finished-product" element={<FinishedProduct />} />
        <Route path="inventory/warehouse-info" element={<WarehouseInfo />} />
        <Route path="inventory/dashboard" element={<InventoryDashboard />} />
        <Route path="inventory/product-inbound" element={<ProductInbound />} />
        <Route path="inventory/product-outbound" element={<ProductOutbound />} />
        <Route path="inventory/other-inbound" element={<OtherInbound />} />
        <Route path="inventory/other-outbound" element={<OtherOutbound />} />
        <Route path="inventory/inout-statistics" element={<InOutStatistics />} />

        <Route
          path="system/users"
          element={
            <SuperAdminRoute>
              <SystemUsers />
            </SuperAdminRoute>
          }
        />
        <Route
          path="system/org"
          element={
            <SuperAdminRoute>
              <SystemOrg />
            </SuperAdminRoute>
          }
        />
        <Route
          path="system/roles"
          element={
            <SuperAdminRoute>
              <SystemRoles />
            </SuperAdminRoute>
          }
        />
        <Route
          path="system/menus"
          element={
            <SuperAdminRoute>
              <SystemMenus />
            </SuperAdminRoute>
          }
        />
        <Route
          path="system/dicts"
          element={
            <SuperAdminRoute>
              <SystemDicts />
            </SuperAdminRoute>
          }
        />
        <Route
          path="system/website-inquiry"
          element={
            <SuperAdminRoute>
              <SystemWebsiteInquiry />
            </SuperAdminRoute>
          }
        />

        {/* 汽车拆解-收获议价 路由 */}
        <Route path="pricing" element={<Outlet />}>
          <Route index element={<Navigate to="/pricing/home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="basic/salesman" element={<Salesman />} />
          <Route path="basic/supplier" element={<Supplier />} />
          <Route path="basic/vehicle-model" element={<VehicleModel />} />
          <Route path="basic/product-name" element={<ProductName />} />
          <Route path="basic/payee-info" element={<PayeeInfo />} />
        <Route path="basic/staff" element={<Staff />} />
          <Route path="recognition/vin" element={<VinRecognition />} />
          <Route path="recognition/vehicle-archive" element={<VehicleArchive />} />
          <Route path="business/receipt" element={<ReceiptPage />} />
          <Route path="business/vehicle-photo" element={<VehiclePhotoPage />} />
          <Route path="business/settlement" element={<SettlementPage />} />
          <Route path="business/payment-application" element={<PaymentApplication />} />
          <Route path="business/price-change" element={<PriceChangePage />} />
          <Route path="business/vehicle-receipt-statistics" element={<VehicleReceiptStatistics />} />
          <Route path="kingdee/voucher" element={<KingdeeVoucher />} />
          <Route path="production/weighing-inspection" element={<WeighingInspection />} />
          <Route path="production/inspection-photo" element={<InspectionPhoto />} />
          <Route path="production/scrapped-vehicle" element={<ScrappedVehicle />} />
          <Route path="production/pick-top-photo" element={<PickTopPhoto />} />
          <Route path="production/disassembly" element={<Disassembly />} />
          <Route path="production/comprehensive-disassembly" element={<ComprehensiveDisassembly />} />
          <Route path="sales/finished-product-approval" element={<FinishedProductApproval />} />
          <Route path="sales/finished-product-ledger" element={<FinishedProductLedger />} />
          <Route path="sales/part-approval" element={<PartApproval />} />
          <Route path="sales/part-ledger" element={<PartLedger />} />
          <Route path="sales/modify-shipping-price" element={<ModifyShippingPrice />} />
          <Route path="sales/finished-product-statistics" element={<FinishedProductStatistics />} />
          <Route path="sales/part-statistics" element={<PartStatistics />} />
          <Route path="finance/inventory-ledger" element={<Navigate to="/pricing/inventory/ledger" replace />} />
          <Route path="dashboard/inventory-statistics" element={<Navigate to="/pricing/inventory/ledger" replace />} />
          <Route path="agriculture/machinery-inbound" element={<MachineryInbound />} />
          <Route path="agriculture/machinery-outbound" element={<MachineryOutbound />} />
          <Route path="agriculture/machinery-stock" element={<MachineryStock />} />
          <Route path="agriculture/finished-product-inbound" element={<FinishedProductInbound />} />
          <Route path="agriculture/finished-product-outbound" element={<FinishedProductOutbound />} />
          <Route path="agriculture/finished-remaining" element={<FinishedRemaining />} />
          <Route path="agriculture/recycle-certificate-ledger" element={<RecycleCertificateLedger />} />
          <Route path="agriculture/recycle-certificate-daily" element={<RecycleCertificateDaily />} />
          <Route path="agriculture/recycle-certificate-void" element={<RecycleCertificateVoid />} />
          <Route path="agriculture/ouhai-formalities" element={<OuhaiFormalities />} />
          <Route path="agriculture/recycle-statistics" element={<RecycleStatistics />} />

          {/* 议价-库存台账 路由 */}
          <Route path="inventory/statistics" element={<Navigate to="/pricing/inventory/ledger" replace />} />
          <Route path="inventory/product-info" element={<ProductInfo />} />
          <Route path="inventory/finished-product" element={<FinishedProduct />} />
          <Route path="inventory/warehouse-info" element={<WarehouseInfo />} />
          <Route path="inventory/dashboard" element={<InventoryDashboard />} />
          <Route path="inventory/product-inbound" element={<ProductInbound />} />
          <Route path="inventory/product-outbound" element={<ProductOutbound />} />
          <Route path="inventory/other-inbound" element={<OtherInbound />} />
          <Route path="inventory/other-outbound" element={<OtherOutbound />} />
          <Route path="inventory/inout-statistics" element={<InOutStatistics />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
