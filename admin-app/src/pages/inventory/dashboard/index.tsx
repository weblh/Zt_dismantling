import React from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Tag } from 'antd';
import { DatabaseOutlined, RiseOutlined, FallOutlined, StockOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface RecentActivityItem {
  key: string;
  date: string;
  type: string;
  product: string;
  quantity: number;
  warehouse: string;
  operator: string;
}

const recentData: RecentActivityItem[] = [
  { key: '1', date: '2026-08-05 16:30', type: '入库', product: '废钢材', quantity: 50, warehouse: '1号仓库', operator: '王操作员' },
  { key: '2', date: '2026-08-05 15:20', type: '出库', product: '废铜', quantity: 10, warehouse: '1号仓库', operator: '李操作员' },
  { key: '3', date: '2026-08-05 14:10', type: '入库', product: '废铝', quantity: 20, warehouse: '2号仓库', operator: '张操作员' },
  { key: '4', date: '2026-08-05 11:05', type: '出库', product: '废塑料', quantity: 30, warehouse: '2号仓库', operator: '赵操作员' },
  { key: '5', date: '2026-08-04 17:40', type: '入库', product: '废电瓶', quantity: 5, warehouse: '1号仓库', operator: '孙操作员' },
];

export default function InventoryDashboard() {
  const columns: ColumnsType<RecentActivityItem> = [
    { title: '时间', dataIndex: 'date', width: 150 },
    { title: '类型', dataIndex: 'type', width: 80, render: (text: string) => <Tag color={text === '入库' ? 'green' : 'orange'}>{text}</Tag> },
    { title: '产品', dataIndex: 'product', width: 120 },
    { title: '数量(吨)', dataIndex: 'quantity', width: 100, align: 'right' },
    { title: '仓库', dataIndex: 'warehouse', width: 100 },
    { title: '操作员', dataIndex: 'operator', width: 100 },
  ];

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 20px',
        borderBottom: '1px solid #f0f0f0',
        background: '#fff',
      }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>经营看板</span>
      </div>

      <div style={{ padding: 16 }}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card bordered={false}>
              <Statistic
                title="本月入库量"
                value={1250}
                suffix="吨"
                prefix={<DatabaseOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 8 }}><RiseOutlined /> 12.5% 同比上月</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card bordered={false}>
              <Statistic
                title="本月出库量"
                value={980}
                suffix="吨"
                prefix={<StockOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 8 }}><RiseOutlined /> 8.2% 同比上月</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card bordered={false}>
              <Statistic
                title="当前库存"
                value={4864}
                suffix="吨"
                valueStyle={{ color: '#1890ff' }}
              />
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 8 }}><FallOutlined /> 3.1% 较上月</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card bordered={false}>
              <Statistic
                title="库存周转率"
                value={85}
                suffix="%"
                valueStyle={{ color: '#722ed1' }}
              />
              <Progress percent={85} size="small" style={{ marginTop: 8 }} />
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Card title="库存价值构成" bordered={false}>
              <div style={{ padding: '10px 0' }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>产成品</span>
                    <span style={{ fontWeight: 500 }}>¥6,316,000</span>
                  </div>
                  <Progress percent={72} strokeColor="#1890ff" />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>成品</span>
                    <span style={{ fontWeight: 500 }}>¥1,229,000</span>
                  </div>
                  <Progress percent={28} strokeColor="#52c41a" />
                </div>
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="最近出入库记录" bordered={false}>
              <Table
                columns={columns}
                dataSource={recentData}
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
