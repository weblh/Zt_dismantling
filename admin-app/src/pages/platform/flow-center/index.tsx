import { useEffect, useState } from 'react';
import { Button, Card, Space, Table, Tabs, message } from 'antd';
import {
  flowApprove,
  flowCc,
  flowInitiated,
  flowProcessed,
  flowReject,
  flowTodo,
} from '@/api/platform';

export default function FlowCenterPage() {
  const [todo, setTodo] = useState<Record<string, unknown>[]>([]);
  const [initiated, setInitiated] = useState<Record<string, unknown>[]>([]);
  const [processed, setProcessed] = useState<Record<string, unknown>[]>([]);
  const [cc, setCc] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [a, b, c, d] = await Promise.all([
        flowTodo(),
        flowInitiated(),
        flowProcessed(),
        flowCc(),
      ]);
      setTodo(a.data || []);
      setInitiated(b.data || []);
      setProcessed(c.data || []);
      setCc(d.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <Card
      title="流程中心"
      extra={
        <Button onClick={() => void load()} loading={loading}>
          刷新
        </Button>
      }
    >
      <Tabs
        items={[
          {
            key: 'todo',
            label: `我的待办 (${todo.length})`,
            children: (
              <Table
                rowKey={(r) => String(r.taskId)}
                dataSource={todo}
                columns={[
                  { title: '任务', dataIndex: 'name' },
                  { title: '数据ID', dataIndex: 'formDataId' },
                  { title: '实例', dataIndex: 'processInstanceId' },
                  {
                    title: '操作',
                    render: (_: unknown, row: Record<string, unknown>) => (
                      <Space>
                        <Button
                          type="link"
                          onClick={async () => {
                            await flowApprove(String(row.taskId), '同意');
                            message.success('已通过');
                            void load();
                          }}
                        >
                          同意
                        </Button>
                        <Button
                          type="link"
                          danger
                          onClick={async () => {
                            await flowReject(String(row.taskId), '驳回');
                            message.success('已驳回');
                            void load();
                          }}
                        >
                          驳回
                        </Button>
                      </Space>
                    ),
                  },
                ]}
              />
            ),
          },
          {
            key: 'initiated',
            label: `我发起的 (${initiated.length})`,
            children: (
              <Table
                rowKey={(r) => String(r.processInstanceId)}
                dataSource={initiated}
                columns={[
                  { title: '实例', dataIndex: 'processInstanceId' },
                  { title: '业务键', dataIndex: 'businessKey' },
                  { title: '开始', dataIndex: 'startTime' },
                  { title: '结束', dataIndex: 'endTime' },
                ]}
              />
            ),
          },
          {
            key: 'processed',
            label: `我处理的 (${processed.length})`,
            children: (
              <Table
                rowKey={(r) => String(r.taskId)}
                dataSource={processed}
                columns={[
                  { title: '任务', dataIndex: 'name' },
                  { title: '实例', dataIndex: 'processInstanceId' },
                  { title: '完成时间', dataIndex: 'endTime' },
                ]}
              />
            ),
          },
          {
            key: 'cc',
            label: `抄送我的 (${cc.length})`,
            children: (
              <Table
                rowKey={(r) => String(r.id)}
                dataSource={cc}
                columns={[
                  { title: '数据ID', dataIndex: 'formDataId' },
                  { title: '实例', dataIndex: 'processInstanceId' },
                  { title: '时间', dataIndex: 'createdAt' },
                ]}
              />
            ),
          },
        ]}
      />
    </Card>
  );
}
