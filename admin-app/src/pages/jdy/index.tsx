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
  Select,
} from 'antd';
import {
  CloudSyncOutlined,
  ReloadOutlined,
  EyeOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import {
  getJdyStatus,
  updateJdyConfig,
  getJdyForms,
  refreshJdyForms,
  syncAllJdyForms,
  syncJdyForm,
  getJdyFormData,
  getJdyFormDataDetail,
  refreshJdySchemas,
  getJdySyncLogs,
  type JdyStatus,
  type JdyForm,
  type JdyFormData,
  type JdySyncLog,
} from '@/api/jdy';

const { Title, Paragraph, Text, Link } = Typography;

export default function JdySyncPage() {
  const [status, setStatus] = useState<JdyStatus | null>(null);
  const [forms, setForms] = useState<JdyForm[]>([]);
  const [dataRows, setDataRows] = useState<JdyFormData[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [entryId, setEntryId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailData, setDetailData] = useState('');
  const [syncLogs, setSyncLogs] = useState<JdySyncLog[]>([]);
  const [form] = Form.useForm();

  const fetchStatus = useCallback(async () => {
    const res = await getJdyStatus();
    setStatus(res.data);
    form.setFieldsValue({
      appId: res.data.appId,
      corpId: res.data.corpId,
      agentId: res.data.agentId,
      scheduledEnabled: res.data.scheduledEnabled,
    });
  }, [form]);

  const fetchForms = useCallback(async () => {
    const res = await getJdyForms();
    setForms(res.data || []);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getJdyFormData({ entryId, pageNo, pageSize });
      setDataRows(res.data.records || []);
      setTotal(res.data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [entryId, pageNo, pageSize]);

  const fetchSyncLogs = useCallback(async () => {
    const res = await getJdySyncLogs(20);
    setSyncLogs(res.data || []);
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchForms();
    fetchSyncLogs();
  }, [fetchStatus, fetchForms, fetchSyncLogs]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveConfig = async (values: {
    apiKey: string;
    appId?: string;
    corpId?: string;
    agentId?: string;
    scheduledEnabled?: boolean;
  }) => {
    setActionLoading(true);
    try {
      await updateJdyConfig(values);
      message.success('配置已保存');
      await fetchStatus();
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefreshForms = async () => {
    setActionLoading(true);
    try {
      const res = await refreshJdyForms();
      setForms(res.data || []);
      message.success(`已刷新 ${res.data?.length || 0} 个表单`);
      await fetchStatus();
    } catch (e: unknown) {
      const err = e as { message?: string };
      message.error(err?.message || '刷新表单失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSyncAll = async () => {
    setActionLoading(true);
    try {
      const res = await syncAllJdyForms();
      message.success((res.data.message || '同步完成') + '（已自动投影字典）');
      await Promise.all([fetchStatus(), fetchForms(), fetchData(), fetchSyncLogs()]);
    } catch (e: unknown) {
      const err = e as { message?: string };
      message.error(err?.message || '同步失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSyncOne = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await syncJdyForm(id);
      message.success(`已同步 ${res.data} 条`);
      await Promise.all([fetchForms(), fetchData(), fetchSyncLogs()]);
    } catch (e: unknown) {
      const err = e as { message?: string };
      message.error(err?.message || '同步失败');
    } finally {
      setActionLoading(false);
    }
  };

  const showDetail = async (id: number) => {
    const res = await getJdyFormDataDetail(id);
    const raw = res.data.rawData || '';
    try {
      setDetailData(JSON.stringify(JSON.parse(raw), null, 2));
    } catch {
      setDetailData(raw);
    }
    setDetailVisible(true);
  };

  const formColumns: ColumnsType<JdyForm> = [
    { title: '表单名称', dataIndex: 'formName', ellipsis: true },
    { title: 'Entry ID', dataIndex: 'entryId', width: 220, ellipsis: true },
    {
      title: '本地条数',
      dataIndex: 'dataCount',
      width: 90,
    },
    {
      title: '最近同步',
      dataIndex: 'lastSyncAt',
      width: 170,
      render: (val?: string) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '同步信息',
      dataIndex: 'lastSyncMessage',
      ellipsis: true,
    },
    {
      title: '操作',
      width: 120,
      render: (_, record) => (
        <Button type="link" onClick={() => handleSyncOne(record.entryId)} loading={actionLoading}>
          同步
        </Button>
      ),
    },
  ];

  const dataColumns: ColumnsType<JdyFormData> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '表单', dataIndex: 'formName', width: 160, ellipsis: true },
    { title: '数据ID', dataIndex: 'dataId', width: 200, ellipsis: true },
    { title: '创建人', dataIndex: 'creatorName', width: 100 },
    { title: '简道云创建时间', dataIndex: 'jdyCreateTime', width: 180 },
    {
      title: '同步时间',
      dataIndex: 'syncedAt',
      width: 170,
      render: (val?: string) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      width: 90,
      render: (_, record) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => showDetail(record.id)}>
          详情
        </Button>
      ),
    },
  ];

  const syncLogColumns: ColumnsType<JdySyncLog> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    {
      title: '类型',
      dataIndex: 'sync_type',
      width: 80,
      render: (val?: string) => (val === 'single' ? '单表' : '全量'),
    },
    { title: '表单', dataIndex: 'form_name', ellipsis: true },
    { title: '成功/失败', width: 100, render: (_, r) => `${r.success_forms ?? '-'} / ${r.failed_forms ?? '-'}` },
    { title: '写入行数', dataIndex: 'upserted_rows', width: 90 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (val?: string) => (
        <Tag color={val === 'success' ? 'green' : val === 'partial' ? 'orange' : 'red'}>{val || '-'}</Tag>
      ),
    },
    {
      title: '开始时间',
      dataIndex: 'started_at',
      width: 170,
      render: (val?: string) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    { title: '说明', dataIndex: 'message', ellipsis: true },
  ];

  return (
    <div className="page-container">
      <Title level={3}>简道云同步</Title>
      <Paragraph type="secondary">
        同步「收车」+「议价」双应用（收车 appId: <Text code>65c1cb717f6b878acaadd2ab</Text>
        ，议价 appId: <Text code>67ff16f5714711e0b87f173b</Text>
        ）下全部表单数据。API Key 须在简道云开放平台「密钥管理」创建，
        <Link href="https://hc.jiandaoyun.com/open/16782" target="_blank">
          参考文档
        </Link>
        。企业信息页的 API Token 不能用于接口调用。同步结果写入 MySQL 表：
        <Text code>jdy_form_data</Text>（原始数据）、
        <Text code>jdy_sync_log</Text>（同步记录）、
        <Text code>jdy_dashboard_snapshot</Text>（大屏快照）。
      </Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="连接状态">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                配置状态：
                <Tag color={status?.configured ? 'green' : 'orange'}>
                  {status?.configured ? '已配置' : '未配置 API Key'}
                </Tag>
              </div>
              <div>App ID：{status?.appId || '-'}</div>
              <div>CorpId：{status?.corpId || '-'}</div>
              <div>AgentId：{status?.agentId || '-'}</div>
              <div>API Key：{status?.apiKeyMasked || '未设置'}</div>
              <div>
                本地表单 / 数据：{status?.formCount ?? 0} / {status?.dataCount ?? 0}
              </div>
              <Text type="secondary">{status?.message}</Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title="凭证配置">
            <Form form={form} layout="vertical" onFinish={handleSaveConfig}>
              <Form.Item
                label="API Key"
                name="apiKey"
                rules={status?.configured ? [] : [{ required: true, message: '请输入简道云 API Key' }]}
                extra={status?.configured
                  ? '服务端已内置 API Key，无需重复填写；如需更换再输入新 Key'
                  : '开放平台 → 密钥管理 → 创建 API Key（授权本应用 + 表单/数据接口）'}
              >
                <Input.Password placeholder={status?.configured ? '已配置，留空即可' : '粘贴完整 API Key'} />
              </Form.Item>
              <Form.Item label="App ID" name="appId">
                <Input placeholder="65c1cb717f6b878acaadd2ab" />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="CorpId" name="corpId">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="AgentId" name="agentId">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="定时全量同步" name="scheduledEnabled" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={actionLoading}>
                  保存配置
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleRefreshForms} loading={actionLoading}>
                  刷新表单列表
                </Button>
                <Button
                  type="primary"
                  danger
                  icon={<CloudSyncOutlined />}
                  onClick={handleSyncAll}
                  loading={actionLoading}
                >
                  同步全部表单数据
                </Button>
                <Button
                  onClick={async () => {
                    setActionLoading(true);
                    try {
                      const res = await refreshJdySchemas();
                      message.success(`已刷新 ${res.data} 个表单字段结构`);
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  loading={actionLoading}
                >
                  刷新字段结构
                </Button>
              </Space>
            </Form>
          </Card>
        </Col>
      </Row>

      <Card
        title="同步记录"
        style={{ marginTop: 16 }}
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchSyncLogs}>
            刷新
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={syncLogColumns}
          dataSource={syncLogs}
          pagination={false}
          size="middle"
        />
      </Card>

      <Card
        title="表单列表"
        style={{ marginTop: 16 }}
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchForms}>
            刷新
          </Button>
        }
      >
        <Table rowKey="id" columns={formColumns} dataSource={forms} pagination={false} size="middle" />
      </Card>

      <Card
        title="已同步数据"
        style={{ marginTop: 16 }}
        extra={
          <Space>
            <Select
              allowClear
              placeholder="按表单筛选"
              style={{ width: 260 }}
              value={entryId}
              onChange={(v) => {
                setPageNo(1);
                setEntryId(v);
              }}
              options={forms.map((f) => ({
                label: f.formName || f.entryId,
                value: f.entryId,
              }))}
            />
            <Button icon={<ReloadOutlined />} onClick={fetchData}>
              刷新
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={dataColumns}
          dataSource={dataRows}
          pagination={{
            current: pageNo,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (p, ps) => {
              setPageNo(p);
              setPageSize(ps);
            },
          }}
          size="middle"
        />
      </Card>

      <Modal
        title="表单数据详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        <pre style={{ maxHeight: 520, overflow: 'auto', background: '#f5f5f5', padding: 12 }}>
          {detailData}
        </pre>
      </Modal>
    </div>
  );
}
