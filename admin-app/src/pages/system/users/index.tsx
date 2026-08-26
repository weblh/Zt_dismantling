import { useEffect, useState } from 'react';
import {
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { createUser, listUsers, updateUser } from '@/api/users';
import type { UserInfo } from '@/api/auth';
import { APP_ENTRIES, type AppCode } from '@/config/apps';
import { DEPARTMENT_OPTIONS } from '@/config/departments';

const APP_OPTIONS = APP_ENTRIES.map((a) => ({ label: a.name, value: a.code }));

const ROLE_OPTIONS = [
  { value: 'USER', label: '普通用户' },
  { value: 'INSPECTOR', label: '查验员' },
];

function roleTag(role?: string) {
  if (role === 'SUPER_ADMIN') return <Tag color="purple">超管</Tag>;
  if (role === 'INSPECTOR') return <Tag color="orange">查验员</Tag>;
  return <Tag>普通用户</Tag>;
}

export default function SystemUsersPage() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<UserInfo | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const load = async () => {
    try {
      setLoading(true);
      const res = await listUsers();
      setUsers(res.data || []);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    const values = await createForm.validateFields();
    try {
      await createUser({
        username: values.username,
        password: values.password,
        nickname: values.nickname,
        role: values.role,
        department: values.department,
        appPermissions: values.appPermissions || [],
      });
      message.success('用户已创建');
      setCreateOpen(false);
      createForm.resetFields();
      load();
    } catch {
      // handled
    }
  };

  const openEdit = (record: UserInfo) => {
    setEditing(record);
    editForm.setFieldsValue({
      nickname: record.nickname,
      role: record.role === 'SUPER_ADMIN' ? undefined : record.role || 'USER',
      department: record.department || record.deptIds || undefined,
      appPermissions: record.appPermissions || [],
      password: undefined,
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editing) return;
    const values = await editForm.validateFields();
    try {
      await updateUser(editing.id, {
        nickname: values.nickname,
        role: editing.role === 'SUPER_ADMIN' ? undefined : values.role,
        department: values.department,
        appPermissions: editing.role === 'SUPER_ADMIN' ? undefined : values.appPermissions || [],
        password: values.password || undefined,
      });
      message.success('已更新');
      setEditOpen(false);
      setEditing(null);
      load();
    } catch {
      // handled
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>用户权限</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          新建用户
        </Button>
      </div>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={users}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 80 },
          { title: '用户名', dataIndex: 'username' },
          { title: '昵称', dataIndex: 'nickname' },
          {
            title: '部门',
            dataIndex: 'department',
            render: (_: string, record: UserInfo) => record.department || record.deptIds || '-',
          },
          {
            title: '角色',
            dataIndex: 'role',
            render: (role: string) => roleTag(role),
          },
          {
            title: '可访问应用',
            dataIndex: 'appPermissions',
            render: (perms: string[] = [], record: UserInfo) => {
              if (record.role === 'SUPER_ADMIN') {
                return <Tag color="blue">全部应用</Tag>;
              }
              if (!perms.length) {
                return <span style={{ color: '#999' }}>无</span>;
              }
              return (
                <Space wrap size={[4, 4]}>
                  {perms.map((code) => {
                    const name = APP_ENTRIES.find((a) => a.code === (code as AppCode))?.name || code;
                    return (
                      <Tag key={code} color="geekblue">
                        {name}
                      </Tag>
                    );
                  })}
                </Space>
              );
            },
          },
          {
            title: '操作',
            width: 100,
            render: (_, record) => (
              <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)}>
                编辑
              </Button>
            ),
          },
        ]}
      />

      <Modal
        title="新建用户"
        open={createOpen}
        onOk={handleCreate}
        onCancel={() => {
          setCreateOpen(false);
          createForm.resetFields();
        }}
        destroyOnHidden
      >
        <Form form={createForm} layout="vertical" initialValues={{ appPermissions: ['receipt'], role: 'USER' }}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="登录用户名" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password placeholder="初始密码" />
          </Form.Item>
          <Form.Item name="nickname" label="昵称">
            <Input placeholder="显示名称" />
          </Form.Item>
          <Form.Item name="department" label="部门">
            <Select allowClear placeholder="请选择部门" options={DEPARTMENT_OPTIONS} />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Select options={ROLE_OPTIONS} />
          </Form.Item>
          <Form.Item name="appPermissions" label="可访问应用">
            <Checkbox.Group options={APP_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑用户"
        open={editOpen}
        onOk={handleEdit}
        onCancel={() => {
          setEditOpen(false);
          setEditing(null);
        }}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="nickname" label="昵称" rules={[{ required: true, message: '请输入昵称' }]}>
            <Input />
          </Form.Item>
          {editing?.role !== 'SUPER_ADMIN' && (
            <Form.Item name="department" label="部门">
              <Select allowClear placeholder="请选择部门" options={DEPARTMENT_OPTIONS} />
            </Form.Item>
          )}
          {editing?.role !== 'SUPER_ADMIN' && (
            <>
              <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
                <Select options={ROLE_OPTIONS} />
              </Form.Item>
              <Form.Item name="appPermissions" label="可访问应用">
                <Checkbox.Group options={APP_OPTIONS} />
              </Form.Item>
            </>
          )}
          <Form.Item name="password" label="重置密码" extra="留空则不修改密码">
            <Input.Password placeholder="新密码（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
