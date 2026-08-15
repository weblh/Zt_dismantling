import React from 'react';
import { Table, Button, Space } from 'antd';
import { ExportOutlined, EditOutlined, FullscreenOutlined, ShareAltOutlined, ReloadOutlined, ColumnHeightOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface DisassemblyItem {
  key: string;
  date: string;
  count: number;
  weight: number;
  price: number;
}

const mockData: DisassemblyItem[] = [
  { key: '1', date: '2026年08月', count: 8, weight: 13.69, price: 0 },
  { key: '2', date: '2026年07月', count: 513, weight: 682.59, price: 172512 },
  { key: '3', date: '2026年06月', count: 875, weight: 1039.2, price: 198055 },
  { key: '4', date: '2026年05月', count: 791, weight: 1029.09, price: 2908000 },
  { key: '5', date: '2026年04月', count: 705, weight: 889.22, price: 2460132 },
  { key: '6', date: '2026年03月', count: 971, weight: 1101.7, price: 3022109 },
  { key: '7', date: '2026年02月', count: 502, weight: 568.54, price: 1544442 },
  { key: '8', date: '2026年01月', count: 796, weight: 941.498, price: 2471869 },
  { key: '9', date: '2025年12月', count: 629, weight: 873.6, price: 2080236 },
  { key: '10', date: '2025年11月', count: 878, weight: 1070.36, price: 2574138 },
  { key: '11', date: '2025年10月', count: 861, weight: 1048.34, price: 2709091 },
  { key: '12', date: '2025年09月', count: 745, weight: 935.8, price: 2345678 },
];

const columns: ColumnsType<DisassemblyItem> = [
  {
    title: '综合拆解日期',
    dataIndex: 'date',
    width: 150,
    sorter: true,
  },
  {
    title: '拆车数量',
    dataIndex: 'count',
    width: 120,
    sorter: true,
    align: 'right',
  },
  {
    title: '吨重',
    dataIndex: 'weight',
    width: 120,
    sorter: true,
    align: 'right',
    render: (val: number) => val.toFixed(2),
  },
  {
    title: '价格',
    dataIndex: 'price',
    width: 150,
    sorter: true,
    align: 'right',
    render: (val: number) => val.toLocaleString(),
  },
];

const tableHeaderStyle: React.CSSProperties = {
  background: '#f5f5f5',
  fontWeight: 600,
  color: '#333',
};

export default function DisassemblyDashboard() {
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
          <span style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>拆解展示看板</span>
          <Button type="text" icon={<EditOutlined />}>编辑</Button>
          <Button type="text" icon={<ShareAltOutlined />} />
          <Button type="text" icon={<FullscreenOutlined />} />
        </Space>
        <Space>
          <Button type="text" icon={<ExportOutlined />} />
        </Space>
      </div>

      <div style={{ padding: 16 }}>
        {/* 拆解统计表格 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>拆解展示看板</span>
            <Space>
              <Button type="text" icon={<ExportOutlined />} />
              <Button type="text" icon={<ReloadOutlined />} />
              <Button type="text" icon={<ColumnHeightOutlined />} />
              <Button type="text" icon={<FullscreenOutlined />} />
            </Space>
          </div>
          <Table
            columns={columns.map(col => ({
              ...col,
              onHeaderCell: () => ({ style: tableHeaderStyle }),
            }))}
            dataSource={mockData}
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
