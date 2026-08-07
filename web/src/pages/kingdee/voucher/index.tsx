import { useState, useEffect, useCallback } from 'react';
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
} from 'antd';
import {
  FilterOutlined,
  ColumnWidthOutlined,
  FullscreenOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface SyncDataItem {
  id: number;
  code: string;
  isNegotiated: boolean;
  negotiation: string;
  tonnage: string;
  status: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const mockData: SyncDataItem[] = [
  { id: 1, code: '695431', isNegotiated: true, negotiation: '', tonnage: '1.05', status: '0', submitter: '', submitTime: '2026-07-22 14:06:00', updateTime: '2026-07-22 14:09:47' },
  { id: 2, code: '695430', isNegotiated: true, negotiation: '', tonnage: '1.31', status: '0', submitter: '', submitTime: '2026-07-22 14:05:15', updateTime: '2026-07-22 14:09:15' },
  { id: 3, code: '695429', isNegotiated: true, negotiation: '', tonnage: '1.1', status: '0', submitter: '', submitTime: '2026-07-22 14:04:35', updateTime: '2026-07-22 14:08:28' },
  { id: 4, code: '695428', isNegotiated: true, negotiation: '', tonnage: '1.13', status: '0', submitter: '', submitTime: '2026-07-22 09:31:05', updateTime: '2026-07-22 09:31:35' },
  { id: 5, code: '695427', isNegotiated: true, negotiation: '', tonnage: '1.12', status: '0', submitter: '', submitTime: '2026-07-21 10:09:07', updateTime: '2026-07-21 10:14:19' },
  { id: 6, code: '695426', isNegotiated: true, negotiation: '', tonnage: '0.89', status: '0', submitter: '', submitTime: '2026-07-20 14:22:15', updateTime: '2026-07-20 14:24:26' },
  { id: 7, code: '695425', isNegotiated: true, negotiation: '', tonnage: '1.13', status: '0', submitter: '', submitTime: '2026-07-16 09:26:36', updateTime: '2026-07-16 09:33:06' },
  { id: 8, code: '695424', isNegotiated: true, negotiation: '', tonnage: '1.16', status: '0', submitter: '', submitTime: '2026-07-16 09:26:36', updateTime: '2026-07-16 09:32:37' },
  { id: 9, code: '695423', isNegotiated: true, negotiation: '', tonnage: '1.16', status: '0', submitter: '', submitTime: '2026-07-16 09:26:36', updateTime: '2026-07-16 09:22:12' },
  { id: 10, code: '695422', isNegotiated: true, negotiation: '', tonnage: '0.86', status: '0', submitter: '', submitTime: '2026-07-16 09:18:33', updateTime: '2026-07-16 09:21:26' },
  { id: 11, code: '695421', isNegotiated: true, negotiation: '', tonnage: '1.45', status: '0', submitter: '', submitTime: '2026-07-15 17:59:18', updateTime: '2026-07-15 18:00:56' },
  { id: 12, code: '695420', isNegotiated: true, negotiation: '', tonnage: '1.11', status: '0', submitter: '', submitTime: '2026-07-15 17:53:08', updateTime: '2026-07-15 17:54:05' },
  { id: 13, code: '695419', isNegotiated: true, negotiation: '', tonnage: '1.11', status: '0', submitter: '', submitTime: '2026-07-15 17:48:13', updateTime: '2026-07-15 17:50:08' },
  { id: 14, code: '695418', isNegotiated: true, negotiation: '', tonnage: '1.19', status: '0', submitter: '', submitTime: '2026-07-15 17:43:23', updateTime: '2026-07-15 17:45:18' },
  { id: 15, code: '695417', isNegotiated: true, negotiation: '', tonnage: '1.12', status: '0', submitter: '', submitTime: '2026-07-15 17:38:38', updateTime: '2026-07-15 17:44:57' },
  { id: 16, code: '695416', isNegotiated: true, negotiation: '', tonnage: '1.86', status: '0', submitter: '', submitTime: '2026-07-15 17:35:14', updateTime: '2026-07-15 17:37:30' },
  { id: 17, code: '695415', isNegotiated: true, negotiation: '', tonnage: '1.66', status: '0', submitter: '', submitTime: '2026-07-15 12:06:58', updateTime: '2026-07-15 12:32:44' },
  { id: 18, code: '695414', isNegotiated: true, negotiation: '', tonnage: '1.57', status: '0', submitter: '', submitTime: '2026-07-15 11:18:16', updateTime: '2026-07-15 11:23:58' },
  { id: 19, code: '695413', isNegotiated: true, negotiation: '', tonnage: '1.44', status: '0', submitter: '', submitTime: '2026-07-15 11:18:16', updateTime: '2026-07-15 11:22:44' },
  { id: 20, code: '695412', isNegotiated: true, negotiation: '', tonnage: '1.28', status: '0', submitter: '', submitTime: '2026-07-15 11:02:48', updateTime: '2026-07-15 11:07:49' },
];

const columns: ColumnsType<SyncDataItem> = [
  { title: <span style={{ whiteSpace: 'nowrap' }}>编号</span>, dataIndex: 'code', width: 100 },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>议价/销户</span>,
    dataIndex: 'negotiation',
    width: 150,
    render: (_value, record) => {
      if (record.isNegotiated) {
        return <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />;
      }
      return '-';
    },
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>吨位</span>, dataIndex: 'tonnage', width: 80 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>状态</span>, dataIndex: 'status', width: 60 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>提交人</span>, dataIndex: 'submitter', width: 100 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>提交时间</span>, dataIndex: 'submitTime', width: 170 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>更新时间</span>, dataIndex: 'updateTime', width: 170 },
];

export default function SyncDataPage() {
  const [items, setItems] = useState<SyncDataItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      let filteredData = [...mockData];
      if (searchValue) {
        filteredData = filteredData.filter((item) =>
          item.code.includes(searchValue),
        );
      }
      setItems(filteredData);
      setTotal(filteredData.length);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [searchValue]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    setPageNo(1);
  };

  const handleAdd = () => {
    form.resetFields();
    setAddModalOpen(true);
  };

  const handleAddSubmit = async () => {
    try {
      const values = await form.validateFields();
      const newItem: SyncDataItem = {
        id: Date.now(),
        code: values.code,
        isNegotiated: values.negotiation === 'yes',
        negotiation: values.negotiation === 'yes' ? '议价' : values.negotiation,
        tonnage: String(values.tonnage),
        status: values.status,
        submitter: '',
        submitTime: new Date().toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }).replace(/\//g, '-'),
        updateTime: new Date().toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }).replace(/\//g, '-'),
      };
      setItems((prev) => [newItem, ...prev]);
      setTotal((prev) => prev + 1);
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
        style={{ margin: 0, borderRadius: 0 }}
        extra={
          <Space>
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
            justifyContent: 'flex-end',
            marginBottom: 16,
            gap: 12,
          }}
        >
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            添加
          </Button>
          <Input.Search
            placeholder="搜索数据"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 200 }}
          />
          <Button icon={<FilterOutlined />}>筛选</Button>
          <ColumnWidthOutlined
            style={{ fontSize: 16, cursor: 'pointer', color: '#666' }}
          />
          <FullscreenOutlined
            style={{ fontSize: 16, cursor: 'pointer', color: '#666' }}
          />
          <MoreOutlined
            style={{ fontSize: 16, cursor: 'pointer', color: '#666' }}
          />
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
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, size) => {
              setPageNo(page);
              setPageSize(size);
            },
          }}
        />
      </Card>

      {/* 添加表单弹窗 */}
      <Modal
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        width={500}
        centered
        footer={[
          <Button key="cancel" onClick={() => setAddModalOpen(false)}>
            取消
          </Button>,
          <Button
            key="draft"
            onClick={() => {
              form.resetFields();
              setAddModalOpen(false);
            }}
          >
            保存草稿
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
          initialValues={{
            code: '',
            negotiation: '',
            tonnage: null,
            status: '',
          }}
          style={{ paddingTop: 8 }}
        >
          <Form.Item
            label="编号"
            name="code"
            rules={[{ required: true, message: '请输入编号' }]}
          >
            <Input placeholder="请输入编号" />
          </Form.Item>
          <Form.Item
            label="议价/销户"
            name="negotiation"
          >
            <Input placeholder="请输入议价/销户" />
          </Form.Item>
          <Form.Item
            label="吨位"
            name="tonnage"
            rules={[{ required: true, message: '请输入吨位' }]}
          >
            <InputNumber
              placeholder="请填写数值"
              style={{ width: '100%' }}
              min={0}
              precision={2}
              step={0.01}
            />
          </Form.Item>
          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
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
