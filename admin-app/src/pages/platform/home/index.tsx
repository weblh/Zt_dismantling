import { useEffect, useState } from 'react';
import { Button, Card, Col, Row, Statistic, message } from 'antd';
import { dashboardStats, listDashboards, listForms, migrateFromJdy, saveDashboard } from '@/api/platform';

export default function PlatformHomePage() {
  const [formCount, setFormCount] = useState(0);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [migrating, setMigrating] = useState(false);

  const load = async () => {
    const forms = await listForms();
    setFormCount((forms.data || []).length);
    const dashes = await listDashboards();
    const list = (dashes.data as { id: number }[]) || [];
    if (list.length) {
      const s = await dashboardStats(list[0].id);
      setStats(s.data);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <Card
        title="汽车拆解-收车（自研平台）"
        extra={
          <Button
            type="primary"
            loading={migrating}
            onClick={async () => {
              setMigrating(true);
              try {
                const res = await migrateFromJdy(true, 500);
                await saveDashboard({
                  name: '收车总览',
                  configJson: JSON.stringify({ metrics: [{ type: 'count', label: '总数据量' }] }),
                  status: 1,
                });
                message.success(
                  `迁移完成：表单 ${String(res.data.forms)}，数据 ${String(res.data.dataRows)}`,
                );
                void load();
              } finally {
                setMigrating(false);
              }
            }}
          >
            从简道云镜像导入（表结构+每表最多500条）
          </Button>
        }
      >
        <p style={{ color: '#666' }}>
          钉钉登录后在此办理业务。表单/流程/权限/打印均在本系统，切流后可停用简道云。
        </p>
        <Row gutter={16}>
          <Col span={8}>
            <Card>
              <Statistic title="表单数" value={formCount} />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic title="数据总量" value={Number(stats?.totalRecords || 0)} />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic title="看板" value={stats?.name ? 1 : 0} suffix={stats?.name as string} />
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
