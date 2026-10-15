import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Space, Table, Tag, Typography, message } from 'antd';
import { CloudSyncOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  getBusinessOverview,
  getJdyStatus,
  syncAllJdyForms,
  type BusinessOverviewRow,
  type JdyStatus,
} from '@/api/jdy';

const { Title, Paragraph, Text } = Typography;

type FlatRow = {
  key: string;
  period: string;
  label: string;
  value: number;
};

function buildPricingTable(rows: BusinessOverviewRow[]): FlatRow[] {
  return rows.flatMap((row) =>
    row.stats.map((stat) => {
      const match = (stat.bySource || []).find(
        (s) => s.source === '议价' || s.code === 'pricing',
      );
      return {
        key: `议价-${row.title}-${stat.label}`,
        period: row.title,
        label: stat.label,
        value: match?.value ?? 0,
      };
    }),
  );
}

const columns = [
  { title: '周期', dataIndex: 'period', width: 90 },
  { title: '指标', dataIndex: 'label', width: 160 },
  {
    title: '数量',
    dataIndex: 'value',
    width: 120,
    render: (v: number) => <Text strong>{(v ?? 0).toLocaleString()}</Text>,
  },
];

export default function BusinessDashboardPage() {
  const [syncLoading, setSyncLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<JdyStatus | null>(null);
  const [rows, setRows] = useState<BusinessOverviewRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, overviewRes] = await Promise.all([
        getJdyStatus('pricing'),
        getBusinessOverview(),
      ]);
      setStatus(statusRes.data);
      setRows(overviewRes.data.rows || []);
    } catch {
      // interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSync = async () => {
    setSyncLoading(true);
    try {
      const res = await syncAllJdyForms('pricing');
      message.success(res.data.message || '议价应用同步完成');
      await load();
    } catch {
      // interceptor
    } finally {
      setSyncLoading(false);
    }
  };

  const pricingRows = useMemo(() => buildPricingTable(rows), [rows]);
  const pricingTotal = pricingRows.reduce((s, r) => s + (r.value || 0), 0);

  return (
    <div style={{ padding: 16 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>
              经营看板 · 简道云数据
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              本页仅拉取并展示「汽车拆解_收货议价」数据，写入 <Text code>jdy_pricing_form_data</Text>。
              收车数据请在「汽车拆解-收车」应用中同步查看。
            </Paragraph>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void load()} loading={loading}>
              刷新
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<CloudSyncOutlined />}
              loading={syncLoading}
              onClick={() => void handleSync()}
            >
              同步议价数据
            </Button>
          </Space>
        </div>

        <div style={{ marginTop: 16 }}>
          <Space wrap size="middle">
            <Tag color={status?.configured ? 'success' : 'warning'}>
              {status?.configured ? '简道云已配置' : '简道云未配置'}
            </Tag>
            <Tag color="orange">议价应用</Tag>
            <Text type="secondary">表单 {status?.formCount ?? 0} 个</Text>
            <Text type="secondary">镜像数据 {status?.dataCount ?? 0} 条</Text>
            {status?.message && <Text type="secondary">{status.message}</Text>}
          </Space>
        </div>
      </Card>

      <Card
        style={{ marginTop: 16 }}
        loading={loading}
        title={
          <Space>
            <Tag color="orange">议价应用</Tag>
            <span>汽车拆解_收货议价 · 业务表</span>
          </Space>
        }
        extra={<Text type="secondary">指标合计 {pricingTotal.toLocaleString()}</Text>}
      >
        <Table
          size="middle"
          pagination={false}
          dataSource={pricingRows}
          columns={columns}
          scroll={{ y: 560 }}
          locale={{ emptyText: '暂无议价数据，请先同步' }}
        />
      </Card>
    </div>
  );
}
