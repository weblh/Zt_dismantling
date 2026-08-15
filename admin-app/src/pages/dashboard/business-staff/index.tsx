import React from 'react';
import { Card, Table, Row, Col, Select, Button, Space, ConfigProvider } from 'antd';
import { ExportOutlined, EditOutlined, FullscreenOutlined, ShareAltOutlined, DatabaseOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface DisassemblyItem {
  key: string;
  date: string;
  person: string;
  quantity: number;
}

interface ComprehensiveItem {
  key: string;
  date: string;
  person: string;
  quantity: number;
  isSummary?: boolean;
}

const disassemblyDailyData: DisassemblyItem[] = [
  { key: '1', date: '2026/08/04', person: '孙文奇', quantity: 1 },
  { key: '2', date: '2026/08/03', person: '段石峰', quantity: 2 },
  { key: '3', date: '2026/08/03', person: '许敬红', quantity: 1 },
  { key: '4', date: '2026/08/03', person: '周月胜', quantity: 1 },
  { key: '5', date: '2026/08/03', person: '边飞旋', quantity: 1 },
  { key: '6', date: '2026/08/02', person: '武汉马', quantity: 2 },
  { key: '7', date: '2026/08/01', person: '孙文奇', quantity: 3 },
  { key: '8', date: '2026/08/01', person: '段石峰', quantity: 1 },
  { key: '9', date: '2026/07/31', person: '许敬红', quantity: 2 },
  { key: '10', date: '2026/07/31', person: '周月胜', quantity: 1 },
];

const disassemblyMonthlyData: DisassemblyItem[] = [
  { key: '1', date: '2026/08月', person: '段石峰', quantity: 2 },
  { key: '2', date: '', person: '周月胜', quantity: 1 },
  { key: '3', date: '', person: '边飞旋', quantity: 1 },
  { key: '4', date: '', person: '孙文奇', quantity: 1 },
  { key: '5', date: '', person: '许敬红', quantity: 1 },
  { key: '6', date: '', person: '武汉马', quantity: 2 },
  { key: '7', date: '2026/07月', person: '张智慧', quantity: 5 },
  { key: '8', date: '', person: '段石峰', quantity: 3 },
  { key: '9', date: '', person: '孙文奇', quantity: 4 },
  { key: '10', date: '', person: '许敬红', quantity: 2 },
];

const comprehensiveDailyData: ComprehensiveItem[] = [
  { key: '1', date: '2026/08/03', person: '樊志强', quantity: 6 },
  { key: '2', date: '2026/08/04', person: '樊志强', quantity: 1 },
  { key: '3', date: '汇总', person: '', quantity: 7, isSummary: true },
  { key: '4', date: '2026/08/02', person: '李帅(已离职)', quantity: 3 },
  { key: '5', date: '2026/08/01', person: '张瑞安', quantity: 2 },
];

const comprehensiveMonthlyData: ComprehensiveItem[] = [
  { key: '1', date: '', person: '董红斌(已离职)', quantity: 28 },
  { key: '2', date: '', person: '李帅(已离职)', quantity: 1 },
  { key: '3', date: '2025/04月', person: '张瑞安(已离职)', quantity: 1627 },
  { key: '4', date: '', person: '张复磊', quantity: 129 },
  { key: '5', date: '', person: '李帅(已离职)', quantity: 34 },
];

const disassemblyColumns: ColumnsType<DisassemblyItem> = [
  {
    title: '拆解日期',
    dataIndex: 'date',
    width: 100,
  },
  {
    title: '拆解人员',
    dataIndex: 'person',
    width: 120,
  },
  {
    title: '数量',
    dataIndex: 'quantity',
    width: 80,
  },
];

const comprehensiveColumns: ColumnsType<ComprehensiveItem> = [
  {
    title: '综合拆解日期',
    dataIndex: 'date',
    width: 120,
    onCell: (record) => ({
      style: record.isSummary
        ? { fontWeight: 600 }
        : {},
    }),
  },
  {
    title: '综合拆解人员',
    dataIndex: 'person',
    width: 140,
    onCell: (record) => ({
      style: record.isSummary
        ? { fontWeight: 600 }
        : {},
    }),
  },
  {
    title: '数量',
    dataIndex: 'quantity',
    width: 80,
    onCell: (record) => ({
      style: record.isSummary
        ? { textAlign: 'center', fontWeight: 600 }
        : { textAlign: 'center' },
    }),
  },
];

export default function BusinessStaffStatistics() {
  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 6,
        },
      }}
    >
    <div style={{ minHeight: '100%' }}>
      {/* 顶部工具栏 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 20px',
        borderBottom: '1px solid #f0f0f0',
      }}>
        <Space size="large">
          <DatabaseOutlined style={{ fontSize: 18 }} />
          <span style={{ fontSize: 16, fontWeight: 600 }}>各业务人员统计</span>
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
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
        padding: 16,
      }}>
        <div style={{ padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13 }}>日期</span>
            <a style={{ fontSize: 12 }}>动态筛选 ▾</a>
          </div>
          <Select
            defaultValue="thisMonth"
            style={{ width: '100%' }}
            options={[
              { value: 'today', label: '今天' },
              { value: 'yesterday', label: '昨天' },
              { value: 'thisWeek', label: '本周' },
              { value: 'thisMonth', label: '本月' },
              { value: 'lastMonth', label: '上月' },
              { value: 'all', label: '全部' },
            ]}
          />
        </div>
        <div style={{ padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13 }}>人员姓名</span>
            <a style={{ fontSize: 12 }}>等于任意一个 ▾</a>
          </div>
          <Select
            mode="multiple"
            placeholder="请选择人员"
            style={{ width: '100%' }}
            options={[
              { value: 'duanshifeng', label: '段石峰' },
              { value: 'zhouyuesheng', label: '周月胜' },
              { value: 'bianfeixuan', label: '边飞旋' },
              { value: 'sunwenqi', label: '孙文奇' },
              { value: 'xujinghong', label: '许敬红' },
              { value: 'wuhanma', label: '武汉马' },
              { value: 'fanzhiqiang', label: '樊志强' },
              { value: 'zhangzhihui', label: '张智慧' },
            ]}
          />
        </div>
      </div>

      {/* 统计表格区域 2x2 网格 */}
      <div style={{ padding: '0 16px 16px' }}>
        <Row gutter={16}>
          <Col span={12}>
            <Card
              title={<span style={{ fontSize: 14, fontWeight: 600 }}>拆解统计表</span>}
              style={{ marginBottom: 16 }}
              styles={{ body: { padding: 0 } }}
            >
              <Table
                columns={disassemblyColumns}
                dataSource={disassemblyDailyData}
                pagination={{
                  pageSize: 6,
                  showSizeChanger: false,
                  showTotal: (t) => `共 ${t} 条`,
                }}
                size="small"
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card
              title={<span style={{ fontSize: 14, fontWeight: 600 }}>拆解统计表（月度）</span>}
              style={{ marginBottom: 16 }}
              styles={{ body: { padding: 0 } }}
            >
              <Table
                columns={disassemblyColumns}
                dataSource={disassemblyMonthlyData}
                pagination={{
                  pageSize: 6,
                  showSizeChanger: false,
                  showTotal: (t) => `共 ${t} 条`,
                }}
                size="small"
              />
            </Card>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Card
              title={<span style={{ fontSize: 14, fontWeight: 600 }}>综合拆解统计表</span>}
              style={{ marginBottom: 16 }}
              styles={{ body: { padding: 0 } }}
            >
              <Table
                columns={comprehensiveColumns}
                dataSource={comprehensiveDailyData}
                pagination={{
                  pageSize: 6,
                  showSizeChanger: false,
                  showTotal: (t) => `共 ${t} 条`,
                }}
                size="small"
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card
              title={<span style={{ fontSize: 14, fontWeight: 600 }}>综合拆解统计表（月度）</span>}
              style={{ marginBottom: 16 }}
              styles={{ body: { padding: 0 } }}
            >
              <Table
                columns={comprehensiveColumns}
                dataSource={comprehensiveMonthlyData}
                pagination={{
                  pageSize: 6,
                  showSizeChanger: false,
                  showTotal: (t) => `共 ${t} 条`,
                }}
                size="small"
              />
            </Card>
          </Col>
        </Row>
      </div>
    </div>
    </ConfigProvider>
  );
}
