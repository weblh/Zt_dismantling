import { useState } from 'react';
import { Table } from 'antd';
import { InfoCircleOutlined, SyncOutlined, EditOutlined, SettingOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';

interface LedgerItem {
  id: number;
  weighDate: string;
  receiveCount: number;
  receiveTonnage: number;
  dismantleCount: number;
  dismantleTonnage: number;
  stockVehicle: number;
  stockTonnage: number;
}

interface MonthlyItem {
  id: number;
  month: string;
  receiveCount: number;
  dismantleCount: number;
  stockCount: number;
}

const leftData: LedgerItem[] = [
  { id: 1, weighDate: '2026/08/03', receiveCount: 6, receiveTonnage: 6.97, dismantleCount: 6, dismantleTonnage: 11.27, stockVehicle: 0, stockTonnage: -4.3 },
  { id: 2, weighDate: '2026/08/02', receiveCount: 36, receiveTonnage: 43.95, dismantleCount: 0, dismantleTonnage: 0, stockVehicle: 36, stockTonnage: 43.95 },
  { id: 3, weighDate: '2026/08/01', receiveCount: 1, receiveTonnage: 5.02, dismantleCount: 0, dismantleTonnage: 0, stockVehicle: 1, stockTonnage: 5.02 },
  { id: 4, weighDate: '2026/07/30', receiveCount: 1, receiveTonnage: 1.17, dismantleCount: 3, dismantleTonnage: 3.09, stockVehicle: -2, stockTonnage: -1.92 },
  { id: 5, weighDate: '2026/07/29', receiveCount: 4, receiveTonnage: 4.83, dismantleCount: 4, dismantleTonnage: 4.06, stockVehicle: 0, stockTonnage: 0.77 },
  { id: 6, weighDate: '2026/07/26', receiveCount: 2, receiveTonnage: 2.1, dismantleCount: 6, dismantleTonnage: 7.77, stockVehicle: -4, stockTonnage: -5.67 },
  { id: 7, weighDate: '2026/07/25', receiveCount: 1, receiveTonnage: 1.26, dismantleCount: 7, dismantleTonnage: 7.69, stockVehicle: -6, stockTonnage: -6.43 },
  { id: 8, weighDate: '2026/07/22', receiveCount: 4, receiveTonnage: 4.59, dismantleCount: 1, dismantleTonnage: 1.65, stockVehicle: 3, stockTonnage: 2.94 },
  { id: 9, weighDate: '2026/07/21', receiveCount: 1, receiveTonnage: 1.12, dismantleCount: 2, dismantleTonnage: 1.97, stockVehicle: -1, stockTonnage: -0.85 },
  { id: 10, weighDate: '2026/07/20', receiveCount: 1, receiveTonnage: 0.89, dismantleCount: 3, dismantleTonnage: 6.33, stockVehicle: -2, stockTonnage: -5.44 },
  { id: 11, weighDate: '2026/07/16', receiveCount: 4, receiveTonnage: 4.31, dismantleCount: 39, dismantleTonnage: 46.35, stockVehicle: -35, stockTonnage: -42.04 },
  { id: 12, weighDate: '2026/07/15', receiveCount: 21, receiveTonnage: 31.35, dismantleCount: 55, dismantleTonnage: 62.93, stockVehicle: -34, stockTonnage: -31.58 },
  { id: 13, weighDate: '2026/07/14', receiveCount: 45, receiveTonnage: 49.99, dismantleCount: 0, dismantleTonnage: 0, stockVehicle: 45, stockTonnage: 49.99 },
  { id: 14, weighDate: '2026/07/13', receiveCount: 13, receiveTonnage: 20.11, dismantleCount: 1, dismantleTonnage: 10.8, stockVehicle: 12, stockTonnage: 9.31 },
  { id: 15, weighDate: '2026/07/12', receiveCount: 20, receiveTonnage: 22.08, dismantleCount: 43, dismantleTonnage: 50.26, stockVehicle: -23, stockTonnage: -28.18 },
  { id: 16, weighDate: '2026/07/11', receiveCount: 35, receiveTonnage: 51.04, dismantleCount: 39, dismantleTonnage: 44.9, stockVehicle: -4, stockTonnage: 6.14 },
  { id: 17, weighDate: '2026/07/10', receiveCount: 22, receiveTonnage: 31.81, dismantleCount: 43, dismantleTonnage: 52.56, stockVehicle: -21, stockTonnage: -20.75 },
  { id: 18, weighDate: '2026/07/09', receiveCount: 12, receiveTonnage: 14.33, dismantleCount: 37, dismantleTonnage: 48.41, stockVehicle: -25, stockTonnage: -34.08 },
  { id: 19, weighDate: '2026/07/08', receiveCount: 52, receiveTonnage: 71.33, dismantleCount: 1, dismantleTonnage: 5.14, stockVehicle: 51, stockTonnage: 66.19 },
];

const rightData: MonthlyItem[] = [
  { id: 1, month: '2026年08月', receiveCount: 43, dismantleCount: 6, stockCount: 37 },
  { id: 2, month: '2026年07月', receiveCount: 438, dismantleCount: 461, stockCount: -23 },
  { id: 3, month: '2026年06月', receiveCount: 942, dismantleCount: 875, stockCount: 67 },
  { id: 4, month: '2026年05月', receiveCount: 780, dismantleCount: 722, stockCount: 58 },
  { id: 5, month: '2026年04月', receiveCount: 618, dismantleCount: 667, stockCount: -49 },
  { id: 6, month: '2026年03月', receiveCount: 1058, dismantleCount: 971, stockCount: 87 },
  { id: 7, month: '2026年02月', receiveCount: 533, dismantleCount: 502, stockCount: 31 },
  { id: 8, month: '2026年01月', receiveCount: 769, dismantleCount: 796, stockCount: -27 },
];

const leftColumns: ColumnsType<LedgerItem> = [
  { title: '过磅日期', dataIndex: 'weighDate', width: 120, align: 'center' },
  { title: '收车数量', dataIndex: 'receiveCount', width: 100, align: 'center' },
  { title: '收车吨位', dataIndex: 'receiveTonnage', width: 100, align: 'center', render: (v: number) => v.toFixed(2) },
  { title: '拆解数量', dataIndex: 'dismantleCount', width: 100, align: 'center' },
  { title: '拆解吨位(吨)', dataIndex: 'dismantleTonnage', width: 120, align: 'center', render: (v: number) => v.toFixed(2) },
  { title: '库存车辆', dataIndex: 'stockVehicle', width: 100, align: 'center' },
  { title: '库存吨位', dataIndex: 'stockTonnage', width: 100, align: 'center', render: (v: number) => v.toFixed(2) },
];

const rightColumns: ColumnsType<MonthlyItem> = [
  { title: '过磅日期', dataIndex: 'month', width: 140, align: 'center' },
  { title: '收车数量', dataIndex: 'receiveCount', width: 100, align: 'center' },
  { title: '拆解数量', dataIndex: 'dismantleCount', width: 100, align: 'center' },
  { title: '库存数量', dataIndex: 'stockCount', width: 100, align: 'center' },
];

const summaryRow: MonthlyItem = { id: 0, month: '汇总', receiveCount: 5181, dismantleCount: 5000, stockCount: 181 };

export default function InventoryLedger() {
  const isMobile = useIsMobile();
  const [leftPage, setLeftPage] = useState(1);

  return (
    <div style={{
      minHeight: 'calc(100vh - 50px)',
      background: 'linear-gradient(135deg, #1a2942 0%, #0d1b2a 100%)',
      padding: isMobile ? '0 8px 12px' : '0 16px 16px',
      color: '#c8d6e5',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        padding: '12px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 24, paddingLeft: 8 }}>
          <span style={{ fontSize: 15, color: '#e8ecf1', fontWeight: 500 }}>出入库台账</span>
          <EditOutlined style={{ color: '#8a9bb4', fontSize: 14, cursor: 'pointer' }} />
          <SyncOutlined style={{ color: '#8a9bb4', fontSize: 14, cursor: 'pointer' }} />
          <SettingOutlined style={{ color: '#8a9bb4', fontSize: 14, cursor: 'pointer' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingRight: isMobile ? 8 : 16 }}>
          <SettingOutlined style={{ color: '#8a9bb4', fontSize: 16, cursor: 'pointer' }} />
          <EditOutlined style={{ color: '#8a9bb4', fontSize: 16, cursor: 'pointer' }} />
          <InfoCircleOutlined style={{ color: '#8a9bb4', fontSize: 16, cursor: 'pointer' }} />
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        {/* Left panel */}
        <div style={{
          background: 'rgba(20, 40, 70, 0.85)',
          borderRadius: 6,
          border: '1px solid rgba(70, 130, 180, 0.3)',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            background: 'linear-gradient(90deg, rgba(30, 80, 140, 0.6) 0%, rgba(20, 50, 90, 0.3) 100%)',
            borderBottom: '1px solid rgba(70, 130, 180, 0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, color: '#e8ecf1', fontWeight: 500 }}>山西华成攒碳车辆出入库台账</span>
              <InfoCircleOutlined style={{ color: '#4a9eff', fontSize: 16 }} />
            </div>
          </div>
          <Table
            rowKey="id"
            columns={leftColumns}
            dataSource={leftData}
            scroll={{ x: 740 }}
            pagination={withMobilePagination(isMobile, {
              current: leftPage,
              pageSize: 10,
              total: 19,
              showSizeChanger: false,
              showTotal: () => `${leftPage} / 17`,
              onChange: (page) => setLeftPage(page),
              itemRender: (_current, type, originalElement) => {
                if (type === 'prev') return <span style={{ color: '#8a9bb4', padding: '0 8px', cursor: 'pointer' }}>‹</span>;
                if (type === 'next') return <span style={{ color: '#8a9bb4', padding: '0 8px', cursor: 'pointer' }}>›</span>;
                if (type === 'page') return <span style={{ color: '#e8ecf1', padding: '0 8px' }}>{originalElement}</span>;
                return originalElement;
              },
            })}
            size="small"
            style={{ background: 'transparent' }}
            className="dark-table"
          />
        </div>

        {/* Right panel */}
        <div style={{
          background: 'rgba(20, 40, 70, 0.85)',
          borderRadius: 6,
          border: '1px solid rgba(70, 130, 180, 0.3)',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            background: 'linear-gradient(90deg, rgba(30, 80, 140, 0.6) 0%, rgba(20, 50, 90, 0.3) 100%)',
            borderBottom: '1px solid rgba(70, 130, 180, 0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, color: '#e8ecf1', fontWeight: 500 }}>月度统计表</span>
              <InfoCircleOutlined style={{ color: '#4a9eff', fontSize: 16 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <SyncOutlined style={{ color: '#8a9bb4', fontSize: 14, cursor: 'pointer' }} />
              <EditOutlined style={{ color: '#8a9bb4', fontSize: 14, cursor: 'pointer' }} />
              <SettingOutlined style={{ color: '#8a9bb4', fontSize: 14, cursor: 'pointer' }} />
            </div>
          </div>
          <Table
            rowKey="id"
            columns={rightColumns}
            dataSource={rightData}
            scroll={{ x: 440 }}
            pagination={false}
            size="small"
            style={{ background: 'transparent' }}
            className="dark-table"
          />
          {/* Summary row */}
          <div style={{
            display: 'flex',
            borderTop: '1px solid rgba(70, 130, 180, 0.3)',
            background: 'rgba(30, 60, 110, 0.5)',
            fontWeight: 500,
            color: '#e8ecf1',
          }}>
            <div style={{ flex: 1, padding: '10px 12px', textAlign: 'center' }}>汇总</div>
            <div style={{ flex: 1, padding: '10px 12px', textAlign: 'center' }}>{summaryRow.receiveCount}</div>
            <div style={{ flex: 1, padding: '10px 12px', textAlign: 'center' }}>{summaryRow.dismantleCount}</div>
            <div style={{ flex: 1, padding: '10px 12px', textAlign: 'center' }}>{summaryRow.stockCount}</div>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            padding: '8px 12px',
            gap: 8,
            color: '#8a9bb4',
          }}>
            <span style={{ cursor: 'pointer', padding: '0 6px' }}>‹</span>
            <span style={{ padding: '0 6px' }}>1</span>
            <span style={{ padding: '0 6px' }}>/</span>
            <span style={{ padding: '0 6px' }}>1</span>
            <span style={{ cursor: 'pointer', padding: '0 6px' }}>›</span>
          </div>
        </div>
      </div>

      <style>{`
        .dark-table .ant-table {
          background: transparent !important;
        }
        .dark-table .ant-table-thead > tr > th {
          background: rgba(30, 70, 130, 0.7) !important;
          color: #c8d6e5 !important;
          border-bottom: 1px solid rgba(70, 130, 180, 0.4) !important;
          font-weight: 500;
          font-size: 13px;
          padding: 10px 12px !important;
        }
        .dark-table .ant-table-tbody > tr > td {
          background: transparent !important;
          color: #c8d6e5 !important;
          border-bottom: 1px solid rgba(70, 130, 180, 0.15) !important;
          padding: 10px 12px !important;
          font-size: 13px;
        }
        .dark-table .ant-table-tbody > tr:hover > td {
          background: rgba(40, 80, 140, 0.3) !important;
        }
        .dark-table .ant-table-pagination {
          color: #8a9bb4 !important;
          padding: 12px !important;
          margin: 0 !important;
        }
        .dark-table .ant-pagination-item {
          background: transparent !important;
          border: none !important;
          color: #c8d6e5 !important;
        }
        .dark-table .ant-pagination-item-active {
          color: #4a9eff !important;
        }
        .dark-table .ant-pagination-prev .ant-pagination-item-link,
        .dark-table .ant-pagination-next .ant-pagination-item-link {
          background: transparent !important;
          border: none !important;
          color: #8a9bb4 !important;
        }
      `}</style>
    </div>
  );
}
