import React, { useState } from 'react';
import { Table, Button, Space, Select } from 'antd';
import {
  EditOutlined,
  ExportOutlined,
  FullscreenOutlined,
  PrinterOutlined,
  SettingOutlined,
  BellOutlined,
  QuestionCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface InboundStatItem {
  key: string;
  productType: string;
  inboundTonnage: number;
}

interface OutboundStatItem {
  key: string;
  productType: string;
  outboundTonnage: number;
}

interface TernaryInboundItem {
  key: string;
  name: string;
  quantity: number;
}

interface TernaryOutboundItem {
  key: string;
  name: string;
  quantity: number;
}

const inboundData: InboundStatItem[] = [
  { key: 'i1', productType: '其他6', inboundTonnage: 16.312 },
  { key: 'i2', productType: '其他1', inboundTonnage: 226.301 },
  { key: 'i3', productType: '其他3', inboundTonnage: 1202.255 },
  { key: 'i4', productType: '其他4', inboundTonnage: 8.57 },
  { key: 'i5', productType: '其他5', inboundTonnage: 0.05 },
  { key: 'i6', productType: '底盘料', inboundTonnage: 5148.739 },
  { key: 'i7', productType: '撕碎料', inboundTonnage: 11492.607 },
  { key: 'i8', productType: '小件', inboundTonnage: 369.089 },
  { key: 'i9', productType: '铜线', inboundTonnage: 241.485 },
  { key: 'i10', productType: '铝件', inboundTonnage: 524.386 },
  { key: 'i11', productType: '其他2', inboundTonnage: 100.233 },
  { key: 'i12', productType: '废钢', inboundTonnage: 3103.188 },
  { key: 'i13', productType: '橡胶', inboundTonnage: 687.516 },
  { key: 'i14', productType: '塑料', inboundTonnage: 0.01 },
  { key: 'i15', productType: '塑料.', inboundTonnage: 1173.255 },
];

const outboundData: OutboundStatItem[] = [
  { key: 'o1', productType: '皮卡前后桥', outboundTonnage: 12.11 },
  { key: 'o2', productType: '撕碎料', outboundTonnage: 11368.662 },
  { key: 'o3', productType: '铜线', outboundTonnage: 233.115 },
  { key: 'o4', productType: '小件', outboundTonnage: 366.376 },
  { key: 'o5', productType: '其他2', outboundTonnage: 99.533 },
  { key: 'o6', productType: '橡胶', outboundTonnage: 671.516 },
  { key: 'o7', productType: '废钢', outboundTonnage: 3080.437 },
  { key: 'o8', productType: '铝件', outboundTonnage: 479.882 },
  { key: 'o9', productType: '塑料.', outboundTonnage: 0.002 },
  { key: 'o10', productType: '塑料', outboundTonnage: 829.892 },
  { key: 'o11', productType: '其他6', outboundTonnage: 16.312 },
  { key: 'o12', productType: '其他1', outboundTonnage: 225.801 },
  { key: 'o13', productType: '底盘料', outboundTonnage: 5040.639 },
  { key: 'o14', productType: '其他3', outboundTonnage: 1173.255 },
  { key: 'o15', productType: '其他4', outboundTonnage: 7.795 },
  { key: 'o16', productType: '其他5', outboundTonnage: 0.035 },
  { key: 'o17', productType: '汇总', outboundTonnage: 23605.362 },
];

const ternaryInboundData: TernaryInboundItem[] = [
  { key: 'ti1', name: 'W11803', quantity: 1 },
  { key: 'ti2', name: '6A00015', quantity: 1 },
  { key: 'ti3', name: 'W11240', quantity: 1 },
  { key: 'ti4', name: 'W11590', quantity: 1 },
  { key: 'ti5', name: 'W11194', quantity: 2 },
  { key: 'ti6', name: '6A0056', quantity: 1 },
  { key: 'ti7', name: 'X12031', quantity: 1 },
  { key: 'ti8', name: 'W11264', quantity: 1 },
  { key: 'ti9', name: 'W11185', quantity: 1 },
  { key: 'ti10', name: 'W11516', quantity: 1 },
  { key: 'ti11', name: 'X12330', quantity: 1 },
  { key: 'ti12', name: 'X12193', quantity: 1 },
  { key: 'ti13', name: 'W11461', quantity: 1 },
  { key: 'ti14', name: 'W11468', quantity: 1 },
];

const ternaryOutboundData: TernaryOutboundItem[] = [];

const timeOptions = [
  { value: 'custom', label: '自定义' },
  { value: 'today', label: '今天' },
  { value: 'yesterday', label: '昨天' },
  { value: 'tomorrow', label: '明天' },
  { value: 'last7', label: '近7天' },
  { value: 'last30', label: '近30天' },
  { value: 'thisWeek', label: '本周' },
  { value: 'lastWeek', label: '上周' },
  { value: 'nextWeek', label: '下周' },
  { value: 'thisMonth', label: '本月' },
  { value: 'lastMonth', label: '上月' },
  { value: 'nextMonth', label: '下月' },
  { value: 'thisQuarter', label: '本季度' },
  { value: 'lastQuarter', label: '上季度' },
  { value: 'nextQuarter', label: '下季度' },
  { value: 'thisYear', label: '今年' },
  { value: 'lastYear', label: '去年' },
  { value: 'nextYear', label: '明年' },
];

const filterOptions = [
  { value: 'all', label: '全部' },
  { value: 'today', label: '今天' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'quarter', label: '本季度' },
  { value: 'year', label: '本年' },
];

export default function InOutStatistics() {
  const [inboundTime, setInboundTime] = useState('thisMonth');
  const [outboundTime, setOutboundTime] = useState('thisMonth');
  const [ternaryInboundTime, setTernaryInboundTime] = useState('thisMonth');
  const [ternaryOutboundTime, setTernaryOutboundTime] = useState('thisMonth');
  const [inboundFilter, setInboundFilter] = useState('all');
  const [outboundFilter, setOutboundFilter] = useState('all');
  const [ternaryInboundFilter, setTernaryInboundFilter] = useState('all');
  const [ternaryOutboundFilter, setTernaryOutboundFilter] = useState('all');

  const inboundColumns: ColumnsType<InboundStatItem> = [
    {
      title: '产品类型',
      dataIndex: 'productType',
      width: 90,
      sorter: (a, b) => a.productType.localeCompare(b.productType),
      ellipsis: true,
    },
    {
      title: '入库吨位',
      dataIndex: 'inboundTonnage',
      width: 80,
      align: 'right',
      sorter: (a, b) => a.inboundTonnage - b.inboundTonnage,
      render: (text: number) => text.toFixed(3),
    },
  ];

  const outboundColumns: ColumnsType<OutboundStatItem> = [
    {
      title: '产品类型',
      dataIndex: 'productType',
      width: 90,
      sorter: (a, b) => a.productType.localeCompare(b.productType),
      ellipsis: true,
    },
    {
      title: '出库吨位',
      dataIndex: 'outboundTonnage',
      width: 80,
      align: 'right',
      sorter: (a, b) => a.outboundTonnage - b.outboundTonnage,
      render: (text: number) => text.toFixed(3),
    },
  ];

  const ternaryInboundColumns: ColumnsType<TernaryInboundItem> = [
    {
      title: '名称',
      dataIndex: 'name',
      width: 80,
      sorter: (a, b) => a.name.localeCompare(b.name),
      ellipsis: true,
    },
    {
      title: '入库数量',
      dataIndex: 'quantity',
      width: 60,
      align: 'right',
      sorter: (a, b) => a.quantity - b.quantity,
    },
  ];

  const ternaryOutboundColumns: ColumnsType<TernaryOutboundItem> = [
    {
      title: '名称',
      dataIndex: 'name',
      width: 80,
      ellipsis: true,
    },
    {
      title: '出库数量',
      dataIndex: 'quantity',
      width: 60,
      align: 'right',
    },
  ];

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #f0f0f0',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  };

  const headerBarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderBottom: '1px solid #f0f0f0',
    background: '#fafafa',
  };

  const filterRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 12px',
    borderBottom: '1px solid #f0f0f0',
    gap: 8,
  };

  const selectStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const statTitleStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: '#333',
  };

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100%', padding: 0 }}>
      {/* 顶部工具栏 */}
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          padding: '10px 16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Space size="middle">
            <span style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>
              出入库统计
            </span>
            <Button type="text" icon={<EditOutlined />} style={{ color: '#666' }}>
              编辑
            </Button>
            <Button type="text" icon={<ExportOutlined />} style={{ color: '#666' }} />
            <Button type="text" icon={<FullscreenOutlined />} style={{ color: '#666' }} />
          </Space>
          <Space size="small">
            <Button type="text" icon={<PrinterOutlined />} style={{ color: '#666' }} />
            <Button type="text" icon={<SettingOutlined />} style={{ color: '#666' }} />
            <Button type="text" icon={<BellOutlined />} style={{ color: '#666' }} />
            <Button type="text" icon={<QuestionCircleOutlined />} style={{ color: '#666' }} />
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#52c41a',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              张
            </div>
          </Space>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gap: 12,
          padding: 12,
        }}
      >
        {/* 入库统计 */}
        <div style={cardStyle}>
          <div style={headerBarStyle}>
            <span style={statTitleStyle}>入库统计</span>
          </div>
          <div style={filterRowStyle}>
            <span style={{ fontSize: 12, color: '#666', whiteSpace: 'nowrap' }}>
              入库时间
            </span>
            <Select
              value={inboundTime}
              onChange={setInboundTime}
              style={selectStyle}
              options={timeOptions}
              size="small"
            />
          </div>
          <div style={filterRowStyle}>
            <span style={{ fontSize: 12, color: '#1890ff', whiteSpace: 'nowrap', cursor: 'pointer' }}>
              动态筛选
            </span>
            <Select
              value={inboundFilter}
              onChange={setInboundFilter}
              style={selectStyle}
              options={filterOptions}
              size="small"
              variant="borderless"
              suffixIcon={<span style={{ fontSize: 10, color: '#999' }}>▼</span>}
            />
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Table
              columns={inboundColumns}
              dataSource={inboundData}
              pagination={false}
              size="small"
              rowKey="key"
              bordered
              scroll={{ x: 'max-content' }}
              style={{ fontSize: 12 }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '6px 0',
              borderTop: '1px solid #f0f0f0',
              fontSize: 12,
              color: '#666',
            }}
          >
            暂无更多数据
          </div>
        </div>

        {/* 出库统计 */}
        <div style={cardStyle}>
          <div style={headerBarStyle}>
            <span style={statTitleStyle}>出库统计</span>
          </div>
          <div style={filterRowStyle}>
            <span style={{ fontSize: 12, color: '#666', whiteSpace: 'nowrap' }}>
              出库时间
            </span>
            <Select
              value={outboundTime}
              onChange={setOutboundTime}
              style={selectStyle}
              options={timeOptions}
              size="small"
            />
          </div>
          <div style={filterRowStyle}>
            <span style={{ fontSize: 12, color: '#1890ff', whiteSpace: 'nowrap', cursor: 'pointer' }}>
              动态筛选
            </span>
            <Select
              value={outboundFilter}
              onChange={setOutboundFilter}
              style={selectStyle}
              options={filterOptions}
              size="small"
              variant="borderless"
              suffixIcon={<span style={{ fontSize: 10, color: '#999' }}>▼</span>}
            />
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Table
              columns={outboundColumns}
              dataSource={outboundData}
              pagination={false}
              size="small"
              rowKey="key"
              bordered
              scroll={{ x: 'max-content' }}
              style={{ fontSize: 12 }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '6px 0',
              borderTop: '1px solid #f0f0f0',
              fontSize: 12,
              color: '#666',
            }}
          >
            共 17 条
          </div>
        </div>

        {/* 三元入库统计 */}
        <div style={cardStyle}>
          <div style={headerBarStyle}>
            <span style={statTitleStyle}>三元入库统计</span>
          </div>
          <div style={filterRowStyle}>
            <span style={{ fontSize: 12, color: '#666', whiteSpace: 'nowrap' }}>
              入库时间
            </span>
            <Select
              value={ternaryInboundTime}
              onChange={setTernaryInboundTime}
              style={selectStyle}
              options={timeOptions}
              size="small"
            />
          </div>
          <div style={filterRowStyle}>
            <span style={{ fontSize: 12, color: '#1890ff', whiteSpace: 'nowrap', cursor: 'pointer' }}>
              动态筛选
            </span>
            <Select
              value={ternaryInboundFilter}
              onChange={setTernaryInboundFilter}
              style={selectStyle}
              options={filterOptions}
              size="small"
              variant="borderless"
              suffixIcon={<span style={{ fontSize: 10, color: '#999' }}>▼</span>}
            />
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Table
              columns={ternaryInboundColumns}
              dataSource={ternaryInboundData}
              pagination={false}
              size="small"
              rowKey="key"
              bordered
              scroll={{ x: 'max-content' }}
              style={{ fontSize: 12 }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '6px 0',
              borderTop: '1px solid #f0f0f0',
              fontSize: 12,
              color: '#666',
            }}
          >
            暂无更多数据
          </div>
        </div>

        {/* 三元出库统计 */}
        <div style={cardStyle}>
          <div style={headerBarStyle}>
            <span style={statTitleStyle}>三元出库统计</span>
          </div>
          <div style={filterRowStyle}>
            <span style={{ fontSize: 12, color: '#666', whiteSpace: 'nowrap' }}>
              出库时间
            </span>
            <Select
              value={ternaryOutboundTime}
              onChange={setTernaryOutboundTime}
              style={selectStyle}
              options={timeOptions}
              size="small"
            />
          </div>
          <div style={filterRowStyle}>
            <span style={{ fontSize: 12, color: '#1890ff', whiteSpace: 'nowrap', cursor: 'pointer' }}>
              动态筛选
            </span>
            <Select
              value={ternaryOutboundFilter}
              onChange={setTernaryOutboundFilter}
              style={selectStyle}
              options={filterOptions}
              size="small"
              variant="borderless"
              suffixIcon={<span style={{ fontSize: 10, color: '#999' }}>▼</span>}
            />
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Table
              columns={ternaryOutboundColumns}
              dataSource={ternaryOutboundData}
              pagination={false}
              size="small"
              rowKey="key"
              bordered
              scroll={{ x: 'max-content' }}
              style={{ fontSize: 12 }}
              locale={{ emptyText: '暂无数据' }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '6px 0',
              borderTop: '1px solid #f0f0f0',
              fontSize: 12,
              color: '#666',
            }}
          >
            暂无更多数据
          </div>
        </div>
      </div>
    </div>
  );
}
