import React from 'react';
import { Table, Button, Space } from 'antd';
import { ExportOutlined, EditOutlined, FullscreenOutlined, ShareAltOutlined, ReloadOutlined, ColumnHeightOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface InboundItem {
  key: string;
  date: string;
  shredding: number;
  scrapSteel: number;
  chassis: number;
  copper: number;
  aluminum: number;
  plastic: number;
  smallParts: number;
  rubber: number;
  other: number;
}

interface OutboundItem {
  key: string;
  productName: string;
  date: string;
  shredding: number | string;
  scrapSteel: number | string;
  chassis: number | string;
  copper: number | string;
  aluminum: number | string;
  rubber: number | string;
  plastic: number | string;
  smallParts: number | string;
  other: number | string;
  otherGarbage: number | string;
  otherCategory: number | string;
}

interface StockItem {
  key: string;
  warehouse: string;
  productName: string;
  inbound: number;
  outbound: number;
  remaining: number;
}

const inboundData: InboundItem[] = [
  { key: '1', date: '2025/02月', shredding: 500.106, scrapSteel: 161.244, chassis: 188.158, copper: 10.841, aluminum: 22.614, plastic: 39.438, smallParts: 27.813, rubber: 35.912, other: 103.522 },
  { key: '2', date: '2024/10月', shredding: 889.107, scrapSteel: 286.654, chassis: 334.51, copper: 19.251, aluminum: 40.187, plastic: 70.107, smallParts: 49.438, rubber: 63.823, other: 184.029 },
  { key: '3', date: '2024/02月', shredding: 1.584, scrapSteel: 0.576, chassis: 0.594, copper: 0.062, aluminum: 0.043, plastic: 0.212, smallParts: 0.115, rubber: 0.09, other: 0.324 },
  { key: '4', date: '2026/05月', shredding: 403.549, scrapSteel: 130.128, chassis: 151.818, copper: 8.747, aluminum: 18.24, plastic: 31.826, smallParts: 22.439, rubber: 28.97, other: 83.524 },
  { key: '5', date: '2025/06月', shredding: 725.904, scrapSteel: 234.033, chassis: 273.075, copper: 15.722, aluminum: 32.803, plastic: 57.228, smallParts: 40.352, rubber: 52.106, other: 150.258 },
  { key: '6', date: '2026/06月', shredding: 499.951, scrapSteel: 161.187, chassis: 188.106, copper: 10.843, aluminum: 22.599, plastic: 39.413, smallParts: 27.822, rubber: 35.884, other: 103.467 },
  { key: '7', date: '2025/07月', shredding: 667.662, scrapSteel: 215.286, chassis: 251.193, copper: 14.469, aluminum: 30.174, plastic: 52.655, smallParts: 37.111, rubber: 47.945, other: 138.193 },
  { key: '8', date: '2024/05月', shredding: 240.733, scrapSteel: 79.462, chassis: 90.516, copper: 5.983, aluminum: 10.066, plastic: 21.451, smallParts: 14.146, rubber: 16.598, other: 49.731 },
  { key: '9', date: '2026/03月', shredding: 541.239, scrapSteel: 174.502, chassis: 203.637, copper: 11.747, aluminum: 24.45, plastic: 42.672, smallParts: 30.097, rubber: 38.854, other: 112.028 },
  { key: '10', date: '2026/01月', shredding: 417.582, scrapSteel: 134.638, chassis: 157.1, copper: 9.055, aluminum: 18.877, plastic: 32.914, smallParts: 23.225, rubber: 29.979, other: 86.451 },
  { key: '11', date: '2024/03月', shredding: 3.871, scrapSteel: 1.301, chassis: 1.455, copper: 0.105, aluminum: 0.152, plastic: 0.375, smallParts: 0.237, rubber: 0.259, other: 0.798 },
  { key: '12', date: '2025/10月', shredding: 507.737, scrapSteel: 163.701, chassis: 191.004, copper: 11.009, aluminum: 22.952, plastic: 40.044, smallParts: 28.237, rubber: 36.436, other: 105.104 },
];

const outboundData: OutboundItem[] = [
  { key: '1', productName: '净重', date: '2026年08月', shredding: '-', scrapSteel: '-', chassis: '-', copper: '-', aluminum: '-', rubber: '-', plastic: 1.065, smallParts: '-', other: '-', otherGarbage: '-', otherCategory: '-' },
  { key: '2', productName: '净重', date: '2026年07月', shredding: 442.439, scrapSteel: 33.62, chassis: 239.64, copper: 13.036, aluminum: 37.92, rubber: 39.12, plastic: 5.97, smallParts: 11.847, other: '-', otherGarbage: '-', otherCategory: '-' },
  { key: '3', productName: '净重', date: '2026年06月', shredding: 616.586, scrapSteel: 125.18, chassis: 551.34, copper: 0.001, aluminum: 20.3, rubber: 30.05, plastic: 55.37, smallParts: 15.826, other: '-', otherGarbage: '-', otherCategory: '-' },
  { key: '4', productName: '净重', date: '2026年05月', shredding: 128.236, scrapSteel: 141.78, chassis: 449.31, copper: 13.808, aluminum: 19.47, rubber: 3.07, plastic: 49.52, smallParts: 18.892, other: '-', otherGarbage: '-', otherCategory: '-' },
  { key: '5', productName: '净重', date: '2026年04月', shredding: 128.236, scrapSteel: 33.71, chassis: 358.81, copper: 22.64, aluminum: '-', rubber: '-', plastic: 3.32, smallParts: 1.46, other: '-', otherGarbage: '-', otherCategory: '-' },
  { key: '6', productName: '净重', date: '2026年03月', shredding: 487.95, scrapSteel: 187.76, chassis: 406.585, copper: '-', aluminum: 15.16, rubber: 33.305, plastic: 18.33, smallParts: '-', other: '-', otherGarbage: '-', otherCategory: '-' },
  { key: '7', productName: '净重', date: '2026年02月', shredding: 112.831, scrapSteel: 70.28, chassis: 184.725, copper: 8.359, aluminum: 18.09, rubber: 19.215, plastic: 32.26, smallParts: 14.152, other: '-', otherGarbage: '-', otherCategory: '-' },
  { key: '8', productName: '净重', date: '2026年01月', shredding: 20.185, scrapSteel: 114.8, chassis: 203.74, copper: 10.53, aluminum: 14.97, rubber: 14.74, plastic: 53.14, smallParts: 12.291, other: '-', otherGarbage: '-', otherCategory: '-' },
  { key: '9', productName: '净重', date: '2025年12月', shredding: 562.444, scrapSteel: 80.94, chassis: 401.735, copper: 10.734, aluminum: 41.55, rubber: 29.815, plastic: 68.258, smallParts: 16.266, other: '-', otherGarbage: '-', otherCategory: '-' },
];

const stockData: StockItem[] = [
  { key: '1', warehouse: '28.28', productName: '铝件', inbound: 0, outbound: 12.81, remaining: -12.81 },
  { key: '2', warehouse: '37.2', productName: '撕碎料', inbound: 0, outbound: 20.9, remaining: -20.9 },
  { key: '3', warehouse: '27.37', productName: '小件', inbound: 0, outbound: 1.1, remaining: -1.1 },
  { key: '4', warehouse: '7.26', productName: '橡胶', inbound: 0, outbound: 2.86, remaining: -2.86 },
  { key: '5', warehouse: '17.26', productName: '底盘料', inbound: 0, outbound: 2.44, remaining: -2.44 },
  { key: '6', warehouse: '22.79', productName: '撕碎料', inbound: 0, outbound: 0, remaining: 0 },
  { key: '7', warehouse: '17.6', productName: '撕碎料', inbound: 0, outbound: 4, remaining: -4 },
  { key: '8', warehouse: '22.44', productName: '底盘料', inbound: 0, outbound: 9.5, remaining: -9.5 },
  { key: '9', warehouse: '61.31', productName: '废钢', inbound: 0, outbound: 22.23, remaining: -22.23 },
  { key: '10', warehouse: '7.56', productName: '底盘料', inbound: 0, outbound: 2.75, remaining: -2.75 },
];

const inboundColumns: ColumnsType<InboundItem> = [
  {
    title: '过磅日期',
    dataIndex: 'date',
    width: 110,
    sorter: true,
    fixed: 'left',
  },
  { title: '撕碎料', dataIndex: 'shredding', width: 100, sorter: true, render: (val: number) => val.toFixed(3) },
  { title: '废钢', dataIndex: 'scrapSteel', width: 100, sorter: true, render: (val: number) => val.toFixed(3) },
  { title: '底盘料', dataIndex: 'chassis', width: 100, sorter: true, render: (val: number) => val.toFixed(3) },
  { title: '铜线', dataIndex: 'copper', width: 100, sorter: true, render: (val: number) => val.toFixed(3) },
  { title: '铝件', dataIndex: 'aluminum', width: 100, sorter: true, render: (val: number) => val.toFixed(3) },
  { title: '塑料', dataIndex: 'plastic', width: 100, sorter: true, render: (val: number) => val.toFixed(3) },
  { title: '小件', dataIndex: 'smallParts', width: 100, sorter: true, render: (val: number) => val.toFixed(3) },
  { title: '橡胶', dataIndex: 'rubber', width: 100, sorter: true, render: (val: number) => val.toFixed(3) },
  { title: '其他', dataIndex: 'other', width: 100, sorter: true, render: (val: number) => val.toFixed(3) },
];

const renderValue = (val: number | string) => {
  if (typeof val === 'string') return <span style={{ color: '#999' }}>{val}</span>;
  return val.toFixed(3);
};

const outboundColumns: ColumnsType<OutboundItem> = [
  {
    title: '品名',
    dataIndex: 'productName',
    width: 100,
    fixed: 'left',
    children: [
      { title: '出货日期', dataIndex: 'date', width: 110, fixed: 'left', sorter: true },
    ],
  },
  {
    title: '净重',
    children: [
      { title: '撕碎料', dataIndex: 'shredding', width: 100, sorter: true, render: renderValue },
      { title: '废钢', dataIndex: 'scrapSteel', width: 100, sorter: true, render: renderValue },
      { title: '底盘料', dataIndex: 'chassis', width: 100, sorter: true, render: renderValue },
      { title: '铜线', dataIndex: 'copper', width: 100, sorter: true, render: renderValue },
      { title: '铝件', dataIndex: 'aluminum', width: 100, sorter: true, render: renderValue },
      { title: '橡胶', dataIndex: 'rubber', width: 100, sorter: true, render: renderValue },
      { title: '塑料', dataIndex: 'plastic', width: 100, sorter: true, render: renderValue },
      { title: '小件', dataIndex: 'smallParts', width: 100, sorter: true, render: renderValue },
      { title: '其他', dataIndex: 'other', width: 100, sorter: true, render: renderValue },
      { title: '其他3垃圾', dataIndex: 'otherGarbage', width: 110, sorter: true, render: renderValue },
      { title: '起他', dataIndex: 'otherCategory', width: 100, sorter: true, render: renderValue },
    ],
  },
];

const stockColumns: ColumnsType<StockItem> = [
  { title: '仓库', dataIndex: 'warehouse', width: 100, sorter: true },
  { title: '品名', dataIndex: 'productName', width: 120, sorter: true },
  { title: '入库', dataIndex: 'inbound', width: 100, sorter: true, render: (val: number) => val.toFixed(2) },
  { title: '出库', dataIndex: 'outbound', width: 100, sorter: true, render: (val: number) => val.toFixed(2) },
  {
    title: '剩余吨位',
    dataIndex: 'remaining',
    width: 110,
    sorter: true,
    render: (val: number) => <span style={{ color: val < 0 ? '#ff4d4f' : undefined }}>{val.toFixed(2)}</span>,
  },
];

const tableHeaderStyle: React.CSSProperties = {
  background: '#f5f5f5',
  fontWeight: 600,
  color: '#333',
};

export default function InventoryStatistics() {
  return (
    <div style={{ background: '#fff', minHeight: '100%' }}>
      {/* 顶部工具栏 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid #f0f0f0',
      }}>
        <Space size="large">
          <span style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>库存统计</span>
          <Button type="text" icon={<EditOutlined />}>编辑</Button>
          <Button type="text" icon={<ShareAltOutlined />} />
          <Button type="text" icon={<FullscreenOutlined />} />
        </Space>
        <Space>
          <Button type="text" icon={<ExportOutlined />} />
        </Space>
      </div>

      <div style={{ padding: 16 }}>
        {/* 入库统计表 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>入库统计表</span>
            <Space>
              <Button type="text" icon={<ExportOutlined />} />
              <Button type="text" icon={<ReloadOutlined />} />
              <Button type="text" icon={<ColumnHeightOutlined />} />
              <Button type="text" icon={<FullscreenOutlined />} />
            </Space>
          </div>
          <Table
            columns={inboundColumns.map(col => ({
              ...col,
              onHeaderCell: () => ({ style: tableHeaderStyle }),
            }))}
            dataSource={inboundData}
            pagination={{
              pageSize: 12,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
              showQuickJumper: false,
            }}
            bordered
            size="middle"
            scroll={{ x: 1200 }}
          />
        </div>

        {/* 销售出库 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>销售出库</span>
            <Space>
              <Button type="text" icon={<ExportOutlined />} />
              <Button type="text" icon={<ReloadOutlined />} />
              <Button type="text" icon={<ColumnHeightOutlined />} />
              <Button type="text" icon={<FullscreenOutlined />} />
            </Space>
          </div>
          <Table
            columns={outboundColumns.map(col => {
              if ('children' in col && col.children) {
                return {
                  ...col,
                  children: col.children.map(child => ({
                    ...child,
                    onHeaderCell: () => ({ style: tableHeaderStyle }),
                  })),
                };
              }
              return { ...col, onHeaderCell: () => ({ style: tableHeaderStyle }) };
            })}
            dataSource={outboundData}
            pagination={{
              pageSize: 9,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
              showQuickJumper: false,
            }}
            bordered
            size="middle"
            scroll={{ x: 1400 }}
          />
        </div>

        {/* 实时库存 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>实时库存</span>
            <Space>
              <Button type="text" icon={<ExportOutlined />} />
              <Button type="text" icon={<ReloadOutlined />} />
              <Button type="text" icon={<ColumnHeightOutlined />} />
              <Button type="text" icon={<FullscreenOutlined />} />
            </Space>
          </div>
          <Table
            columns={stockColumns.map(col => ({
              ...col,
              onHeaderCell: () => ({ style: tableHeaderStyle }),
            }))}
            dataSource={stockData}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
              showQuickJumper: false,
            }}
            bordered
            size="middle"
          />
        </div>
      </div>
    </div>
  );
}
