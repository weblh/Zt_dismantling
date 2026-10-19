import { useState, useRef } from 'react';
import { Card, Table, Select, Button, Space } from 'antd';
import {
  ReloadOutlined,
  DownOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useIsMobile } from '@/hooks/useIsMobile';
import MobileStatSummary from '@/components/MobileStatSummary';

interface StatisticsItem {
  id: number;
  overweightDate: string;
  tonnage: number;
  count: number;
  totalPrice: number;
  isSummary?: boolean;
}

const mockData: StatisticsItem[] = [
  {
    id: 1,
    overweightDate: '2026/07/30',
    tonnage: 1.17,
    count: 1,
    totalPrice: 3000,
  },
];

const summaryData: StatisticsItem = {
  id: 999,
  overweightDate: '汇总',
  tonnage: 1.17,
  count: 1,
  totalPrice: 3000,
  isSummary: true,
};

const dateOptions = [
  [
    { value: 'today', label: '今天' },
    { value: 'yesterday', label: '昨天' },
    { value: 'tomorrow', label: '明天' },
  ],
  [{ value: 'last7', label: '近7天' }, { value: 'last30', label: '近30天' }],
  [
    { value: 'thisWeek', label: '本周' },
    { value: 'lastWeek', label: '上周' },
    { value: 'nextWeek', label: '下周' },
  ],
  [
    { value: 'thisMonth', label: '本月' },
    { value: 'lastMonth', label: '上月' },
    { value: 'nextMonth', label: '下月' },
  ],
  [
    { value: 'thisQuarter', label: '本季度' },
    { value: 'lastQuarter', label: '上季度' },
    { value: 'nextQuarter', label: '下季度' },
  ],
  [
    { value: 'thisYear', label: '今年' },
    { value: 'lastYear', label: '去年' },
    { value: 'nextYear', label: '明年' },
  ],
];

const flatDateOptions = dateOptions.flat();

export default function VehicleReceiptStatisticsPage() {
  const isMobile = useIsMobile();
  const [dateFilter, setDateFilter] = useState('today');
  const [dynamicFilter, setDynamicFilter] = useState('all');
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const dateSelectRef = useRef<any>(null);

  const dateFilterLabel =
    flatDateOptions.find((o) => o.value === dateFilter)?.label || '今天';

  const customDateDropdown = (
    <div style={{ padding: 8, width: 360, boxSizing: 'border-box' }}>
      <div
        style={{
          fontWeight: 500,
          padding: '4px 4px 12px',
          borderBottom: '1px solid #f0f0f0',
          marginBottom: 8,
          color: '#333',
        }}
      >
        自定义
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {dateOptions.map((row, rowIndex) => (
          <div
            key={rowIndex}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 100px)',
              gap: 8,
              justifyContent: 'start',
            }}
          >
            {row.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  setDateFilter(option.value);
                  setDateDropdownOpen(false);
                  dateSelectRef.current?.blur?.();
                }}
                style={{
                  padding: '6px 4px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  borderRadius: 4,
                  fontSize: 13,
                  background:
                    dateFilter === option.value ? '#e6f7ff' : 'transparent',
                  color: dateFilter === option.value ? '#1890ff' : '#333',
                  border:
                    dateFilter === option.value
                      ? '1px solid #91d5ff'
                      : '1px solid transparent',
                  transition: 'all 0.2s',
                  userSelect: 'none',
                  width: '100px',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => {
                  if (dateFilter !== option.value) {
                    (e.currentTarget as HTMLElement).style.background =
                      '#f5f5f5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (dateFilter !== option.value) {
                    (e.currentTarget as HTMLElement).style.background =
                      'transparent';
                  }
                }}
              >
                {option.label}
              </div>
            ))}
            {row.length < 3 &&
              Array(3 - row.length)
                .fill(null)
                .map((_, i) => (
                  <div key={`empty-${i}`} style={{ visibility: 'hidden', width: '100px' }} />
                ))}
          </div>
        ))}
      </div>
    </div>
  );

  const columns: ColumnsType<StatisticsItem> = [
    {
      title: (
        <span style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>过磅日期</span>
      ),
      dataIndex: 'overweightDate',
      width: 150,
      render: (val: string, record: StatisticsItem) => (
        <span style={record.isSummary ? { fontWeight: 600 } : {}}>{val}</span>
      ),
    },
    {
      title: <span style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>吨位</span>,
      dataIndex: 'tonnage',
      width: 150,
      align: 'center',
      render: (val: number, record: StatisticsItem) => (
        <span style={record.isSummary ? { fontWeight: 600 } : {}}>
          {val.toFixed(2)}
        </span>
      ),
    },
    {
      title: <span style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>台数</span>,
      dataIndex: 'count',
      width: 150,
      align: 'center',
      render: (val: number, record: StatisticsItem) => (
        <span style={record.isSummary ? { fontWeight: 600 } : {}}>{val}</span>
      ),
    },
    {
      title: <span style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>总价</span>,
      dataIndex: 'totalPrice',
      width: 150,
      align: 'right',
      render: (val: number, record: StatisticsItem) => (
        <span style={record.isSummary ? { fontWeight: 600 } : {}}>
          {val.toLocaleString()}
        </span>
      ),
    },
  ];

  const tableData = [...mockData, summaryData];

  return (
    <div className="page-container">
      <Card
        bordered={false}
        styles={{ body: { padding: 0 } }}
      >
        {/* 顶部工具栏 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            padding: '12px 16px',
            borderBottom: '1px solid #f0f0f0',
            background: '#fff',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 500, marginRight: 16 }}>
            业务收车统计表
          </span>
          {!isMobile && (
            <ReloadOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} />
          )}
        </div>

        {/* 筛选区域 */}
        <div
          style={{
            padding: '12px 16px',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          {isMobile && (
            <div style={{ marginBottom: 12 }}>
              <MobileStatSummary
                title={`${dateFilterLabel}收车`}
                items={[
                  { label: '吨位', value: summaryData.tonnage.toFixed(2), unit: '吨' },
                  { label: '台数', value: summaryData.count, unit: '台' },
                  { label: '总价', value: summaryData.totalPrice.toLocaleString(), unit: '元', color: '#cf1322' },
                ]}
              />
            </div>
          )}
          <Space wrap size={12} style={{ width: isMobile ? '100%' : undefined }}>
            <Select
              ref={dateSelectRef}
              value={dateFilter}
              onChange={setDateFilter}
              style={{ width: isMobile ? '100%' : 160 }}
              prefix={
                <span style={{ color: '#666', marginRight: 4 }}>过磅日期</span>
              }
              suffixIcon={<DownOutlined style={{ color: '#999' }} />}
              open={dateDropdownOpen}
              onDropdownVisibleChange={(open) => setDateDropdownOpen(open)}
              dropdownRender={() => customDateDropdown}
              options={flatDateOptions}
              optionLabelProp="label"
              popupMatchSelectWidth={false}
              dropdownStyle={{ minWidth: 360 }}
            />
            <Select
              value={dynamicFilter}
              onChange={setDynamicFilter}
              style={{ width: isMobile ? '100%' : 140 }}
              prefix={
                <span style={{ color: '#666', marginRight: 4 }}>动态...</span>
              }
              options={[
                { value: 'all', label: '全部' },
                { value: 'active', label: '进行中' },
                { value: 'completed', label: '已完成' },
              ]}
              suffixIcon={<DownOutlined style={{ color: '#999' }} />}
            />
            <Select
              value={dateFilter}
              onChange={setDateFilter}
              style={{ width: isMobile ? '100%' : 120 }}
              options={[
                { value: 'today', label: '今天' },
                { value: 'yesterday', label: '昨天' },
                { value: 'week', label: '本周' },
              ]}
              suffixIcon={<DownOutlined style={{ color: '#999' }} />}
            />
          </Space>
        </div>

        {/* 表格区域 */}
        <div style={{ padding: '0 16px', background: '#fff' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
              padding: '12px 0',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 500 }}>业务收车统计表</span>
            {!isMobile && (
              <Space size={16}>
                <ReloadOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} />
              </Space>
            )}
          </div>

          <Table
            rowKey="id"
            columns={columns}
            dataSource={tableData}
            pagination={false}
            bordered
            size={isMobile ? 'small' : 'middle'}
            scroll={{ x: 600 }}
            rowClassName={(record) =>
              record.isSummary ? 'summary-row' : ''
            }
          />
        </div>
      </Card>
    </div>
  );
}
