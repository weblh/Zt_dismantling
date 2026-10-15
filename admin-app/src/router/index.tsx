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
import ExpenseReimbursement from '@/pages/business/expense-reimbursement';
import FundUsageApplication from '@/pages/business/fund-usage-application';
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
import Warehouse from '@/pages/basic/warehouse';
import ProductName from '@/pages/basic/product-name';
import PayeeInfo from '@/pages/basic/payee-info';
import Staff from '@/pages/basic/staff';
import JdySyncPage from '@/pages/jdy';
import InspectionTodo from '@/pages/inspection/todo';
import InspectionInitiated from '@/pages/inspection/initiated';
import InspectionProcessed from '@/pages/inspection/processed';
import InspectionCopied from '@/pages/inspection/copied';
import InspectionBusiness from '@/pages/inspection/business';
import InspectionException from '@/pages/inspection/exception';
import InspectionTaskTrack from '@/pages/inspection/task-track';
import InspectionIssueDetail from '@/pages/inspection/issue-detail';
import InspectionMaterial from '@/pages/inspection/material';
import InspectionSite from '@/pages/inspection/site';
import InspectionGroup from '@/pages/inspection/group';
import InspectionDataPlatform from '@/pages/inspection/data-platform';
import InspectionTaskBase from '@/pages/inspection/task-base';
import InspectionExemption from '@/pages/inspection/exemption';
import InspectionTaskExecution from '@/pages/inspection/task-execution';
import InspectionAuthorization from '@/pages/inspection/authorization';
import InspectionSafetyAuthorization from '@/pages/inspection/safety-authorization';
import InspectionSafetyBusiness from '@/pages/inspection/safety-business';
import InspectionCoordinate from '@/pages/inspection/coordinate';
import InspectionTaskMgmt from '@/pages/inspection/task';
import InspectionExceptionNew from '@/pages/inspection/exception-new';
import InspectionBusinessNew from '@/pages/inspection/business-new';
import InspectionLec from '@/pages/inspection/lec';
import InspectionDataReport from '@/pages/inspection/data-report';
import InspectionDetailView from '@/pages/inspection/detail-view';
import InspectionMachiningQuality from '@/pages/inspection/machining-quality';
import InspectionQualityIntercept from '@/pages/inspection/quality-intercept';
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
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="403" element={<ForbiddenPage />} />
        <Route path="home" element={<Home />} />
        <Route path="dingtalk/form-config" element={<DingtalkFormConfig />} />
        <Route path="dingtalk/oa-form-data" element={<DingtalkOaFormData />} />
        <Route path="dingtalk" element={<DingtalkData />} />
        <Route path="jdy/sync" element={<JdySyncPage />} />
        <Route path="business/expense-reimbursement" element={<ExpenseReimbursement />} />
        <Route path="business/fund-usage-application" element={<FundUsageApplication />} />
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
        <Route path="basic/warehouse" element={<Warehouse />} />
        <Route path="basic/product-name" element={<ProductName />} />
        <Route path="basic/payee-info" element={<PayeeInfo />} />
        <Route path="basic/staff" element={<Staff />} />
        <Route path="dashboard/inventory-statistics" element={<Navigate to="/home" replace />} />
        <Route path="inspection/todo" element={<InspectionTodo />} />
        <Route path="inspection/initiated" element={<InspectionInitiated />} />
        <Route path="inspection/processed" element={<InspectionProcessed />} />
        <Route path="inspection/copied" element={<InspectionCopied />} />
        <Route path="inspection/business" element={<InspectionBusiness />} />
        <Route path="inspection/exception" element={<InspectionException />} />
        <Route path="inspection/task-track" element={<InspectionTaskTrack />} />
        <Route path="inspection/issue-detail" element={<InspectionIssueDetail />} />

        {/* 巡检V13 - 基础 */}
        <Route path="inspection/material" element={<InspectionMaterial />} />
        <Route path="inspection/site" element={<InspectionSite />} />
        <Route path="inspection/group" element={<InspectionGroup />} />
        <Route path="inspection/data-platform" element={<InspectionDataPlatform />} />

        {/* 巡检V13 - 巡检基础 */}
        <Route path="inspection/task-base" element={<InspectionTaskBase />} />
        <Route path="inspection/exemption" element={<InspectionExemption />} />
        <Route path="inspection/task-execution" element={<InspectionTaskExecution />} />

        {/* 巡检V13 - 安环基础 */}
        <Route path="inspection/authorization" element={<InspectionAuthorization />} />
        <Route path="inspection/safety-authorization" element={<InspectionSafetyAuthorization />} />
        <Route path="inspection/safety-business" element={<InspectionSafetyBusiness />} />

        {/* 巡检V13 - 业务 */}
        <Route path="inspection/coordinate" element={<InspectionCoordinate />} />
        <Route path="inspection/task" element={<InspectionTaskMgmt />} />
        <Route path="inspection/exception-new" element={<InspectionExceptionNew />} />
        <Route path="inspection/business-new" element={<InspectionBusinessNew />} />
        <Route path="inspection/lec" element={<InspectionLec />} />

        {/* 巡检V13 - 报表 */}
        <Route path="inspection/data-report" element={<InspectionDataReport />} />
        <Route path="inspection/detail-view" element={<InspectionDetailView />} />

        {/* 品质V2 */}
        <Route path="inspection/machining-quality" element={<InspectionMachiningQuality />} />
        <Route path="inspection/quality-intercept" element={<InspectionQualityIntercept />} />

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

        {/* 汽车拆解-收获议价 路由 */}
        <Route path="pricing" element={<Outlet />}>
          <Route index element={<Navigate to="/pricing/home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="basic/salesman" element={<Salesman />} />
          <Route path="basic/supplier" element={<Supplier />} />
          <Route path="basic/vehicle-model" element={<VehicleModel />} />
          <Route path="basic/warehouse" element={<Warehouse />} />
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
