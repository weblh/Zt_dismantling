import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/layouts';
import Home from '@/pages/home';
import DingtalkFormConfig from '@/pages/dingtalk/form-config';
import DingtalkOaFormData from '@/pages/dingtalk/oa-form-data';
import KingdeeVoucher from '@/pages/kingdee/voucher';
import KingdeeSupplier from '@/pages/kingdee/supplier';
import KingdeeAccount from '@/pages/kingdee/account';
import ExpenseReimbursement from '@/pages/business/expense-reimbursement';
import FundUsageApplication from '@/pages/business/fund-usage-application';
import VehicleReceiptStatistics from '@/pages/business/vehicle-receipt-statistics';
import PaymentApplication from '@/pages/business/payment-application';
import RepairWorkOrder from '@/pages/business/repair-work-order';
import ReceiptPage from '@/pages/business/receipt';
import VehiclePhotoPage from '@/pages/business/vehicle-photo';
import SettlementPage from '@/pages/business/settlement';
import PriceChangePage from '@/pages/business/price-change';
import InspectionLocation from '@/pages/inspection-location';
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

export default function Router() {
  return (
    <Routes>
      {/* 独立路由 - 无需登录即可访问 */}
      <Route path="/mobile/form" element={<MobileForm />} />
      <Route path="/mobile/inspection-form" element={<InspectionForm />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<Home />} />
        <Route path="dingtalk/form-config" element={<DingtalkFormConfig />} />
        <Route path="dingtalk/oa-form-data" element={<DingtalkOaFormData />} />
        <Route path="business/expense-reimbursement" element={<ExpenseReimbursement />} />
        <Route path="business/fund-usage-application" element={<FundUsageApplication />} />
        <Route path="business/vehicle-receipt-statistics" element={<VehicleReceiptStatistics />} />
        <Route path="business/payment-application" element={<PaymentApplication />} />
        <Route path="business/receipt" element={<ReceiptPage />} />
        <Route path="business/vehicle-photo" element={<VehiclePhotoPage />} />
        <Route path="business/settlement" element={<SettlementPage />} />
        <Route path="business/price-change" element={<PriceChangePage />} />
        <Route path="business/repair-work-order" element={<RepairWorkOrder />} />
        <Route path="inspection-location" element={<InspectionLocation />} />
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
        <Route path="finance/inventory-ledger" element={<InventoryLedger />} />
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
      </Route>
      <Route path="*" element={<Navigate to="/my-apps" replace />} />
    </Routes>
  );
}
