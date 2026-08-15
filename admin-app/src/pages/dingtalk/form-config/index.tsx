import { useCallback, useEffect, useState } from 'react';
import {
  Card,
  Table,
  Form,
  Input,
  Button,
  Tag,
  Space,
  Modal,
  message,
  Popconfirm,
  Select,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  getDingtalkFormConfigs,
  createDingtalkFormConfig,
  updateDingtalkFormConfig,
  deleteDingtalkFormConfig,
  toggleDingtalkFormConfigStatus,
  type DingtalkFormConfig,
} from '@/api/dingtalk';

export default function DingtalkFormConfigPage() {
  const [configs, setConfigs] = useState<DingtalkFormConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDingtalkFormConfigs();
      setConfigs(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (config: DingtalkFormConfig) => {
    setEditingId(config.id);
    form.setFieldsValue({
      formId: config.formId,
      formName: config.formName,
      status: config.status,
      description: config.description,
    });
    setModalVisible(true);
  };

  const handleSave = async (values: {
    formId: string;
    formName?: string;
    status?: number;
    description?: string;
  }) => {
    try {
      if (editingId) {
        await updateDingtalkFormConfig(editingId, values);
        message.success('配置已更新');
      } else {
        await createDingtalkFormConfig(values);
        message.success('配置已添加');
      }
      setModalVisible(false);
      fetchConfigs();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteDingtalkFormConfig(id);
      message.success('配置已删除');
      fetchConfigs();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await toggleDingtalkFormConfigStatus(id);
      message.success('状态已切换');
      fetchConfigs();
    } catch (error) {
      message.error('切换失败');
    }
  };

  const columns: ColumnsType<DingtalkFormConfig> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '表单ID', dataIndex: 'formId', ellipsis: true, width: 250 },
    { title: '表单名称', dataIndex: 'formName', width: 180 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (val: number) => (
        <Tag color={val === 1 ? 'green' : 'red'}>
          {val === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
    },
    {
      title: '操作',
      width: 220,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button
            type="link"
            icon={record.status === 1 ? <StopOutlined /> : <CheckCircleOutlined />}
            onClick={() => handleToggleStatus(record.id)}
          >
            {record.status === 1 ? '禁用' : '启用'}
          </Button>
          <Popconfirm
            title="确定删除此配置？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Card
        title="表单ID管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加配置
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={configs}
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={false}
        />
      </Card>

      <Modal
        title={editingId ? '编辑表单配置' : '添加表单配置'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={520}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{ status: 1 }}
        >
          <Form.Item
            label="表单ID"
            name="formId"
            rules={[{ required: true, message: '请输入表单ID' }]}
          >
            <Input placeholder="钉钉OA表单ID" />
          </Form.Item>
          <Form.Item label="表单名称" name="formName">
            <Input placeholder="表单名称（可选）" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea placeholder="描述信息（可选）" rows={3} />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Select options={[
              { value: 1, label: '启用' },
              { value: 0, label: '禁用' },
            ]} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingId ? '保存修改' : '添加'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}