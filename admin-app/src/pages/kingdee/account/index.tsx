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
  Switch,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ApiOutlined,
  StarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  getKingdeeAccounts,
  createKingdeeAccount,
  updateKingdeeAccount,
  deleteKingdeeAccount,
  toggleKingdeeAccountStatus,
  setDefaultKingdeeAccount,
  testKingdeeAccountLogin,
  type KingdeeAccountConfig,
} from '@/api/kingdee';

interface AccountFormValues {
  accountName: string;
  kingdeeUrl: string;
  dbId: string;
  username: string;
  password?: string;
  orgCompanyCode?: string;
  useOrgCode?: string;
  defaultFormId?: string;
  defaultAccountingPeriod?: string;
  isDefault?: boolean;
  status?: number;
  description?: string;
}

export default function KingdeeAccountPage() {
  const [accounts, setAccounts] = useState<KingdeeAccountConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [form] = Form.useForm<AccountFormValues>();

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getKingdeeAccounts();
      setAccounts(res.data);
    } catch {
      message.error('加载金蝶账套配置失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      status: 1,
      isDefault: false,
      defaultFormId: 'GL_VOUCHER',
    });
    setModalVisible(true);
  };

  const handleEdit = (account: KingdeeAccountConfig) => {
    setEditingId(account.id);
    form.setFieldsValue({
      accountName: account.accountName,
      kingdeeUrl: account.kingdeeUrl,
      dbId: account.dbId,
      username: account.username,
      password: undefined,
      orgCompanyCode: account.orgCompanyCode,
      useOrgCode: account.useOrgCode,
      defaultFormId: account.defaultFormId,
      defaultAccountingPeriod: account.defaultAccountingPeriod,
      isDefault: account.isDefault === 1,
      status: account.status,
      description: account.description,
    });
    setModalVisible(true);
  };

  const handleSave = async (values: AccountFormValues) => {
    setSaving(true);
    try {
      const payload = {
        accountName: values.accountName,
        kingdeeUrl: values.kingdeeUrl,
        dbId: values.dbId,
        username: values.username,
        password: values.password,
        orgCompanyCode: values.orgCompanyCode,
        useOrgCode: values.useOrgCode,
        defaultFormId: values.defaultFormId,
        defaultAccountingPeriod: values.defaultAccountingPeriod,
        isDefault: values.isDefault ? 1 : 0,
        status: values.status ?? 1,
        description: values.description,
      };
      if (editingId) {
        await updateKingdeeAccount(editingId, payload);
        message.success('账套配置已更新');
      } else {
        if (!payload.password) {
          message.error('请输入密码');
          return;
        }
        await createKingdeeAccount(payload);
        message.success('账套配置已添加');
      }
      setModalVisible(false);
      fetchAccounts();
    } catch {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteKingdeeAccount(id);
      message.success('账套配置已删除');
      fetchAccounts();
    } catch {
      message.error('删除失败');
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await toggleKingdeeAccountStatus(id);
      message.success('状态已切换');
      fetchAccounts();
    } catch {
      message.error('切换失败');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultKingdeeAccount(id);
      message.success('已设为默认账套');
      fetchAccounts();
    } catch {
      message.error('设置默认失败');
    }
  };

  const handleTestLogin = async (id: number) => {
    setTestingId(id);
    try {
      const res = await testKingdeeAccountLogin(id);
      if (res.data.success) {
        message.success(res.data.message || '登录成功');
      } else {
        message.error(res.data.message || '登录失败');
      }
    } catch {
      // error already toasted by request interceptor
    } finally {
      setTestingId(null);
    }
  };

  const columns: ColumnsType<KingdeeAccountConfig> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    {
      title: '账套名称',
      dataIndex: 'accountName',
      width: 160,
      render: (name: string, record) => (
        <Space>
          <span>{name}</span>
          {record.isDefault === 1 && <Tag color="gold">默认</Tag>}
        </Space>
      ),
    },
    { title: '金蝶地址', dataIndex: 'kingdeeUrl', width: 220, ellipsis: true },
    { title: '账套ID', dataIndex: 'dbId', width: 120 },
    { title: '用户名', dataIndex: 'username', width: 120 },
    { title: '账簿编码', dataIndex: 'orgCompanyCode', width: 120 },
    { title: '使用组织', dataIndex: 'useOrgCode', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (val: number) => (
        <Tag color={val === 1 ? 'green' : 'red'}>{val === 1 ? '启用' : '禁用'}</Tag>
      ),
    },
    { title: '描述', dataIndex: 'description', ellipsis: true, width: 160 },
    { title: '创建时间', dataIndex: 'createdAt', width: 180 },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 320,
      render: (_, record) => (
        <Space wrap size={0}>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button
            type="link"
            icon={<ApiOutlined />}
            loading={testingId === record.id}
            onClick={() => handleTestLogin(record.id)}
          >
            测试登录
          </Button>
          {record.isDefault !== 1 && (
            <Button type="link" icon={<StarOutlined />} onClick={() => handleSetDefault(record.id)}>
              设为默认
            </Button>
          )}
          <Button
            type="link"
            icon={record.status === 1 ? <StopOutlined /> : <CheckCircleOutlined />}
            onClick={() => handleToggleStatus(record.id)}
          >
            {record.status === 1 ? '禁用' : '启用'}
          </Button>
          <Popconfirm
            title="确定删除此账套配置？"
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
    <div style={{ padding: 24 }}>
      <Card
        title="金蝶账套配置"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加账套
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={accounts}
          loading={loading}
          scroll={{ x: 1600 }}
          pagination={false}
        />
      </Card>

      <Modal
        title={editingId ? '编辑账套配置' : '添加账套配置'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={640}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{ status: 1, isDefault: false, defaultFormId: 'GL_VOUCHER' }}
        >
          <Form.Item
            label="账套名称"
            name="accountName"
            rules={[{ required: true, message: '请输入账套名称' }]}
          >
            <Input placeholder="便于识别的名称，如：华成主账套" />
          </Form.Item>
          <Form.Item
            label="金蝶地址"
            name="kingdeeUrl"
            rules={[{ required: true, message: '请输入金蝶地址' }]}
          >
            <Input placeholder="例如：http://xxx.xxx.xxx.xxx/k3cloud" />
          </Form.Item>
          <Form.Item
            label="账套ID"
            name="dbId"
            rules={[{ required: true, message: '请输入账套ID' }]}
          >
            <Input placeholder="金蝶账套 ID（acctID）" />
          </Form.Item>
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="金蝶登录用户名" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={editingId ? [] : [{ required: true, message: '请输入密码' }]}
            extra={editingId ? '留空表示不修改原密码' : undefined}
          >
            <Input.Password placeholder={editingId ? '留空则不修改' : '金蝶登录密码'} />
          </Form.Item>
          <Form.Item label="账簿编码" name="orgCompanyCode">
            <Input placeholder="凭证查询默认账簿编码" />
          </Form.Item>
          <Form.Item label="使用组织编码" name="useOrgCode">
            <Input placeholder="供应商查询默认使用组织" />
          </Form.Item>
          <Form.Item label="默认表单ID" name="defaultFormId">
            <Input placeholder="如 GL_VOUCHER" />
          </Form.Item>
          <Form.Item label="默认会计期间" name="defaultAccountingPeriod">
            <Input placeholder="如 202601" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={2} placeholder="备注说明（可选）" />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Select
              options={[
                { value: 1, label: '启用' },
                { value: 0, label: '禁用' },
              ]}
            />
          </Form.Item>
          <Form.Item label="设为默认" name="isDefault" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>
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
