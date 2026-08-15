import React from 'react';
import { Card, Table, Select, Space, Button } from 'antd';
import { ExportOutlined, EditOutlined, FullscreenOutlined, ShareAltOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface VehicleQueryItem {
  key: string;
  code: string;
  weighDate: string;
  plateNumber: string;
  inspectPhoto: string;
  scrappedInbound: string;
  pickTopPhoto: string;
}

const mockData: VehicleQueryItem[] = [
  { key: '1', code: '6H0060', weighDate: '2026-08-04', plateNumber: '晋L6225', inspectPhoto: '无查看权限', scrappedInbound: '无查看权限', pickTopPhoto: '无查看权限' },
  { key: '2', code: '6H0059', weighDate: '2026-08-04', plateNumber: '晋L2522F', inspectPhoto: '无查看权限', scrappedInbound: '无查看权限', pickTopPhoto: '无查看权限' },
  { key: '3', code: '6H0058', weighDate: '2026-08-04', plateNumber: '晋L5639Q', inspectPhoto: '无查看权限', scrappedInbound: '无查看权限', pickTopPhoto: '无查看权限' },
  { key: '4', code: '6H0057', weighDate: '2026-08-04', plateNumber: '晋LB265K', inspectPhoto: '无查看权限', scrappedInbound: '无查看权限', pickTopPhoto: '无查看权限' },
  { key: '5', code: '6H0056', weighDate: '2026-08-04', plateNumber: '晋L62M89', inspectPhoto: '无查看权限', scrappedInbound: '无查看权限', pickTopPhoto: '无查看权限' },
  { key: '6', code: '6H0055', weighDate: '2026-08-04', plateNumber: '晋LFD861', inspectPhoto: '无查看权限', scrappedInbound: '无查看权限', pickTopPhoto: '无查看权限' },
  { key: '7', code: '6H0054', weighDate: '2026-08-04', plateNumber: '晋LG728K', inspectPhoto: '无查看权限', scrappedInbound: '无查看权限', pickTopPhoto: '无查看权限' },
  { key: '8', code: '6H0053', weighDate: '2026-08-04', plateNumber: '晋L0U088', inspectPhoto: '无查看权限', scrappedInbound: '无查看权限', pickTopPhoto: '无查看权限' },
  { key: '9', code: '6H0052', weighDate: '2026-08-04', plateNumber: '晋L66V10', inspectPhoto: '无查看权限', scrappedInbound: '无查看权限', pickTopPhoto: '无查看权限' },
  { key: '10', code: '6H0051', weighDate: '2026-08-04', plateNumber: '晋L0930Q', inspectPhoto: '无查看权限', scrappedInbound: '无查看权限', pickTopPhoto: '无查看权限' },
  { key: '11', code: '6H0050', weighDate: '2026-08-04', plateNumber: '晋LLD361', inspectPhoto: '无查看权限', scrappedInbound: '无查看权限', pickTopPhoto: '无查看权限' },
  { key: '12', code: '6H0049', weighDate: '2026-08-04', plateNumber: '晋L899H2', inspectPhoto: '无查看权限', scrappedInbound: '无查看权限', pickTopPhoto: '无查看权限' },
  { key: '13', code: '6H0048', weighDate: '2026-08-04', plateNumber: '晋LC378Y', inspectPhoto: '无查看权限', scrappedInbound: '无查看权限', pickTopPhoto: '无查看权限' },
  { key: '14', code: '6H0045', weighDate: '2026-08-03', plateNumber: '晋LMJ77挂', inspectPhoto: '无查看权限', scrappedInbound: '无查看权限', pickTopPhoto: '无查看权限' },
  { key: '15', code: '6H0047', weighDate: '2026-08-03', plateNumber: '晋LK6873', inspectPhoto: '无查看权限', scrappedInbound: '无查看权限', pickTopPhoto: '无查看权限' },
  { key: '16', code: '6H0046', weighDate: '2026-08-03', plateNumber: '晋LZ6215', inspectPhoto: '无查看权限', scrappedInbound: '无查看权限', pickTopPhoto: '无查看权限' },
  { key: '17', code: '6H0044', weighDate: '2026-08-03', plateNumber: '晋LA3325', inspectPhoto: '无查看权限', scrappedInbound: '无查看权限', pickTopPhoto: '无查看权限' },
  { key: '18', code: '6H0043', weighDate: '2026-08-03', plateNumber: '晋LS8892', inspectPhoto: '无查看权限', scrappedInbound: '无查看权限', pickTopPhoto: '无查看权限' },
  { key: '19', code: '6H0042', weighDate: '2026-08-03', plateNumber: '晋LP5588', inspectPhoto: '无查看权限', scrappedInbound: '无查看权限', pickTopPhoto: '无查看权限' },
  { key: '20', code: '6H0041', weighDate: '2026-08-03', plateNumber: '晋LW2231', inspectPhoto: '无查看权限', scrappedInbound: '无查看权限', pickTopPhoto: '无查看权限' },
  { key: '21', code: '6H0040', weighDate: '2026-08-03', plateNumber: '晋LH7766', inspectPhoto: '无查看权限', scrappedInbound: '无查看权限', pickTopPhoto: '无查看权限' },
  { key: '22', code: '6H0039', weighDate: '2026-08-02', plateNumber: '晋LN4412', inspectPhoto: '无查看权限', scrappedInbound: '无查看权限', pickTopPhoto: '无查看权限' },
  { key: '23', code: '6H0038', weighDate: '2026-08-02', plateNumber: '晋LQ9988', inspectPhoto: '无查看权限', scrappedInbound: '无查看权限', pickTopPhoto: '无查看权限' },
  { key: '24', code: '6H0037', weighDate: '2026-08-02', plateNumber: '晋LT3344', inspectPhoto: '无查看权限', scrappedInbound: '无查看权限', pickTopPhoto: '无查看权限' },
  { key: '25', code: '6H0036', weighDate: '2026-08-02', plateNumber: '晋LX1122', inspectPhoto: '无查看权限', scrappedInbound: '无查看权限', pickTopPhoto: '无查看权限' },
];

const columns: ColumnsType<VehicleQueryItem> = [
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>编号</span>,
    dataIndex: 'code',
    width: 110,
    sorter: true,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>过磅日期</span>,
    dataIndex: 'weighDate',
    width: 130,
    sorter: true,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>车牌号</span>,
    dataIndex: 'plateNumber',
    width: 130,
    sorter: true,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>查验照片</span>,
    dataIndex: 'inspectPhoto',
    width: 120,
    sorter: true,
    render: (val: string) => <span style={{ color: '#999' }}>{val}</span>,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>报废车入库</span>,
    dataIndex: 'scrappedInbound',
    width: 130,
    sorter: true,
    render: (val: string) => <span style={{ color: '#999' }}>{val}</span>,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>挑顶照片</span>,
    dataIndex: 'pickTopPhoto',
    width: 120,
    sorter: true,
    render: (val: string) => <span style={{ color: '#999' }}>{val}</span>,
  },
];

export default function VehicleNumberQuery() {
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
          <span style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>车辆编号查询</span>
          <Button type="text" icon={<EditOutlined />}>编辑</Button>
          <Button type="text" icon={<ShareAltOutlined />} />
          <Button type="text" icon={<FullscreenOutlined />} />
        </Space>
        <Space>
          <Button type="text" icon={<ExportOutlined />} />
        </Space>
      </div>

      {/* 筛选区域 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 16,
        padding: 16,
        borderBottom: '1px solid #f0f0f0',
      }}>
        <div style={{ maxWidth: 320 }}>
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#333', fontSize: 14 }}>编号</span>
            <a style={{ color: '#00acc1', fontSize: 12 }}>等于任意一个 ▾</a>
          </div>
          <Select
            mode="multiple"
            placeholder="请输入编号"
            style={{ width: '100%' }}
            notFoundContent="暂无数据"
            options={mockData.map(item => ({ value: item.code, label: item.code }))}
          />
        </div>
      </div>

      {/* 状态查询表格 */}
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 12, fontSize: 15, fontWeight: 600, color: '#333' }}>
          状态查询
        </div>
        <Table
          columns={columns}
          dataSource={mockData}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          bordered
          size="middle"
        />
      </div>
    </div>
  );
}
