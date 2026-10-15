import { useState } from 'react';
import { useBizDataWithLocal } from '@/hooks/useBizDataWithLocal';
import { syncJdyForm } from '@/api/jdy';
import DataScopeDropdown from '@/components/DataScopeDropdown';
import {
  Card,
  Table,
  Input,
  Button,
  Modal,
  Form,
  Select,
  InputNumber,
  Space,
  message,
  Tag,
} from 'antd';
import {
  FilterOutlined,
  ColumnWidthOutlined,
  FullscreenOutlined,
  MoreOutlined,
  PlusOutlined,
  EditOutlined,
  DatabaseOutlined,
  CloudSyncOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { formatBizDateTime } from '@/utils/localBizStore';
import { getStoredUser } from '@/config/apps';

const WEIGHING_SYNC_ENTRY_ID = '66a20b980183b692cab589c9';

interface SyncDataItem {
  id: number;
  code: string;
  negotiation: string;
  tonnage: number | string;
  status: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const columns: ColumnsType<SyncDataItem> = [
  { title: <span style={{ whiteSpace: 'nowrap' }}>编号</span>, dataIndex: 'code', width: 100 },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>议价/销户</span>,
    dataIndex: 'negotiation',
    width: 100,
    render: (val: string) => {
      if (!val) return '-';
      const isNegotiated = val.includes('议');
      return (
        <Tag color={isNegotiated ? 'orange' : 'green'}>
          {val}
        </Tag>
      );
    },
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>吨位</span>,
    dataIndex: 'tonnage',
    width: 90,
    align: 'right',
    render: (val: number | string) => {
      const n = Number(val);
      return Number.isFinite(n) ? n.toFixed(2) : val ?? '-';
    },
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>状态</span>,
    dataIndex: 'status',
    width: 80,
    render: (val: string) => {
      if (val === '0' || val === '已同步') return <Tag color="success">已同步</Tag>;
      if (val === '1' || val === '待同步') return <Tag color="processing">待同步</Tag>;
      if (val === '2' || val === '同步失败') return <Tag color="error">同步失败</Tag>;
      return val || '-';
    },
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>提交人</span>, dataIndex: 'submitter', width: 100 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>提交时间</span>, dataIndex: 'submitTime', width: 170 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>更新时间</span>, dataIndex: 'updateTime', width: 170 },
];

export default function SyncDataPage() {
  const {
    dataSource: items,
    total,
    pageNo,
    pageSize,
    loading,
    searchValue,
    setSearchValue,
    setPageNo,
    setPageSize,
    onSearch,
    reload,
    appendLocal,
    setDataScope,
  } = useBizDataWithLocal<SyncDataItem>('weighing-sync');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [form] = Form.useForm();

  const handleSyncFromJdy = async () => {
    setSyncing(true);
    try {
      const res = await syncJdyForm(WEIGHING_SYNC_ENTRY_ID);
      message.success(`已从简道云同步大磅数据：${res.data} 条`);
      await reload();
    } catch (e) {
      message.error(e instanceof Error ? e.message : '同步失败，请检查简道云 API 配置');
    } finally {
      setSyncing(false);
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setAddModalOpen(true);
  };

  const handleAddSubmit = async () => {
    try {
      const values = await form.validateFields();
      const user = getStoredUser();
      const now = formatBizDateTime();
      appendLocal({
        code: values.code,
        negotiation: values.negotiation || '',
        tonnage: values.tonnage,
        status: values.status,
        submitter: user.nickname || user.username || '系统',
        submitTime: now,
        updateTime: now,
      });
      message.success('已添加（本地）');
      setAddModalOpen(false);
      form.resetFields();
    } catch {
      // form validation failed
    }
  };

  return (
    <div className="page-container">
      <Card
        title="过磅同步数据"
        extra={
          <Space>
            <Button
              type="primary"
              icon={<CloudSyncOutlined />}
              loading={syncing}
              onClick={handleSyncFromJdy}
            >
              从简道云同步
            </Button>
            <Select
              defaultValue="addOnly"
              style={{ width: 120 }}
              options={[
                { value: 'addOnly', label: '仅添加数据' },
                { value: 'edit', label: '仅编辑数据' },
              ]}
            />
            <Button icon={<EditOutlined />}>编辑</Button>
            <Button icon={<DatabaseOutlined />}>数据管理</Button>
          </Space>
        }
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            gap: 12,
          }}
        >
          <DataScopeDropdown onChange={setDataScope} />
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加
            </Button>
            <Input.Search
              placeholder="搜索编号/吨位"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={onSearch}
              style={{ width: 220 }}
              allowClear
            />
            <Button icon={<FilterOutlined />}>筛选</Button>
            <ColumnWidthOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} />
            <FullscreenOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} />
            <MoreOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} />
          </Space>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={items}
          loading={loading}
          pagination={{
            current: pageNo,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条（大磅 → 简道云 → 平台）`,
            onChange: (page, size) => {
              setPageNo(page);
              setPageSize(size);
            },
          }}
        />
      </Card>

      <Modal
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        width={500}
        centered
        title="添加过磅同步数据"
        footer={[
          <Button key="cancel" onClick={() => setAddModalOpen(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleAddSubmit}>
            提交
          </Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark
          initialValues={{ code: '', negotiation: '', tonnage: null, status: '0' }}
          style={{ paddingTop: 8 }}
        >
          <Form.Item label="编号" name="code" rules={[{ required: true, message: '请输入编号' }]}>
            <Input placeholder="请输入编号" />
          </Form.Item>
          <Form.Item label="议价/销户" name="negotiation">
            <Select
              placeholder="请选择"
              allowClear
              options={[
                { value: '销', label: '销户' },
                { value: '议', label: '议价' },
              ]}
            />
          </Form.Item>
          <Form.Item label="吨位" name="tonnage" rules={[{ required: true, message: '请输入吨位' }]}>
            <InputNumber placeholder="请填写数值" style={{ width: '100%' }} min={0} precision={2} step={0.01} />
          </Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
            <Select
              placeholder="请选择状态"
              options={[
                { value: '0', label: '已同步' },
                { value: '1', label: '待同步' },
                { value: '2', label: '同步失败' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
