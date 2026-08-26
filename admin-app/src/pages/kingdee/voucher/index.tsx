import { useState } from 'react';
import { useJdyBusinessData } from '@/hooks/useJdyBusinessData';
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
  } = useJdyBusinessData<SyncDataItem>('weighing-sync');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form] = Form.useForm();

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
      console.log('本地新增(未写回简道云):', newItem);
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
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={onSearch}
            style={{ width: 200 }}
            allowClear
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
