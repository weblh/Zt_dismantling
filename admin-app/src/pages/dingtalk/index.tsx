import { useCallback, useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Table,
  Form,
  Input,
  Switch,
  Space,
  Modal,
  Typography,
  message,
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';
import {
  getDingtalkStatus,
  updateDingtalkConfig,
  startDingtalkStream,
  stopDingtalkStream,
  getDingtalkEvents,
  getDingtalkEventDetail,
  type DingtalkEvent,
  type DingtalkStatus,
} from '@/api/dingtalk';

const { Title, Paragraph, Link } = Typography;

export default function DingtalkDataPage() {
  const isMobile = useIsMobile();
  const [status, setStatus] = useState<DingtalkStatus | null>(null);
  const [events, setEvents] = useState<DingtalkEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailData, setDetailData] = useState('');
  const [form] = Form.useForm();

  const fetchStatus = useCallback(async () => {
    const res = await getDingtalkStatus();
    setStatus(res.data);
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDingtalkEvents({ pageNo, pageSize });
      setEvents(res.data.records);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }, [pageNo, pageSize]);

  useEffect(() => {
    fetchStatus();
    fetchEvents();
  }, [fetchStatus, fetchEvents]);

  const handleSaveConfig = async (values: {
    clientId: string;
    clientSecret: string;
    autoStart?: boolean;
  }) => {
    setActionLoading(true);
    try {
      await updateDingtalkConfig(values);
      message.success('配置已保存');
      fetchStatus();
      if (values.autoStart) {
        fetchEvents();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = async () => {
    setActionLoading(true);
    try {
      await startDingtalkStream();
      message.success('Stream 通道已启动');
      fetchStatus();
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    setActionLoading(true);
    try {
      await stopDingtalkStream();
      message.success('Stream 通道已停止');
      fetchStatus();
    } finally {
      setActionLoading(false);
    }
  };

  const showDetail = async (id: number) => {
    const res = await getDingtalkEventDetail(id);
    const data = res.data.eventData;
    try {
      setDetailData(JSON.stringify(JSON.parse(data), null, 2));
    } catch {
      setDetailData(data || '');
    }
    setDetailVisible(true);
  };

  const columns: ColumnsType<DingtalkEvent> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '事件ID', dataIndex: 'eventId', ellipsis: true, width: 200 },
    { title: '事件类型', dataIndex: 'eventType', width: 180 },
    {
      title: '产生时间',
      dataIndex: 'eventBornTime',
      width: 180,
      render: (val: number) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '接收时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (val: string) => (
        <Tag color={val === 'SUCCESS' ? 'green' : 'red'}>{val}</Tag>
      ),
    },
    {
      title: '操作',
      width: 100,
      render: (_, record) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => showDetail(record.id)}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Title level={isMobile ? 4 : 3}>钉钉数据</Title>
      <Paragraph type="secondary">
        基于钉钉 Stream 模式接入事件推送，无需公网回调地址。
        参考文档：
        <Link
          href="https://open.dingtalk.com/document/development/develop-stream-mode-push-server"
          target="_blank"
        >
          开发 Stream 模式推送服务端
        </Link>
      </Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="Stream 通道状态">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                连接状态：
                <Tag color={status?.connected ? 'green' : 'default'}>
                  {status?.connected ? '已连接' : '未连接'}
                </Tag>
              </div>
              <div>Client ID：{status?.clientId || '未配置'}</div>
              <div>配置状态：{status?.configured ? '已配置' : '未配置'}</div>
              <Space>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  loading={actionLoading}
                  onClick={handleStart}
                >
                  启动通道
                </Button>
                <Button
                  icon={<PauseCircleOutlined />}
                  loading={actionLoading}
                  onClick={handleStop}
                >
                  停止通道
                </Button>
                <Button icon={<ReloadOutlined />} onClick={fetchStatus}>
                  刷新
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card title="应用配置">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSaveConfig}
              initialValues={{ autoStart: false }}
            >
              <Form.Item
                label="Client ID (AppKey)"
                name="clientId"
                rules={[{ required: true, message: '请输入 Client ID' }]}
              >
                <Input placeholder="钉钉应用 Client ID" />
              </Form.Item>
              <Form.Item
                label="Client Secret (AppSecret)"
                name="clientSecret"
                rules={[{ required: true, message: '请输入 Client Secret' }]}
              >
                <Input.Password placeholder="钉钉应用 Client Secret" />
              </Form.Item>
              <Form.Item label="保存后自动启动" name="autoStart" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={actionLoading}>
                  保存配置
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      <Card
        title="事件推送记录"
        style={{ marginTop: 16 }}
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchEvents}>
            刷新
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={events}
          loading={loading}
          scroll={{ x: 900 }}
          pagination={withMobilePagination(isMobile, {
            current: pageNo,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, size) => {
              setPageNo(page);
              setPageSize(size);
            },
          })}
        />
      </Card>

      <Modal
        title="事件详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={1000}
      >
        <pre className="event-data-pre">{detailData}</pre>
      </Modal>
    </div>
  );
}
