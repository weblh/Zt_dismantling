import { Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from './PrivateRoute';
import Login from '@/pages/login';
import Layout from '@/layouts';
import Home from '@/pages/home';
import InventoryLedger from '@/pages/inventory/ledger';
import InventoryDocPage from '@/pages/inventory/doc';
import Placeholder from '@/pages/common/Placeholder';

export default function Router() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<Home />} />
        <Route path="inventory/ledger" element={<InventoryLedger />} />
        <Route path="inventory/product-info" element={<Placeholder title="产成品产品信息" />} />
        <Route path="inventory/finished-product" element={<Placeholder title="成品产品信息" />} />
        <Route path="inventory/warehouse-info" element={<Placeholder title="仓库信息" />} />
        <Route path="inventory/dashboard" element={<Placeholder title="经营看板" />} />
        <Route path="inventory/product-inbound" element={<InventoryDocPage variant="product-inbound" />} />
        <Route path="inventory/product-outbound" element={<InventoryDocPage variant="product-outbound" />} />
        <Route path="inventory/other-inbound" element={<InventoryDocPage variant="other-inbound" />} />
        <Route path="inventory/other-outbound" element={<InventoryDocPage variant="other-outbound" />} />
        <Route path="inventory/inout-statistics" element={<Placeholder title="出入库统计" />} />
      </Route>
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
