import { useEffect, useMemo, useState } from 'react';
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
import type { ColumnsType } from 'antd/es/table';
import { createUser, listUsers, updateUser } from '@/api/users';
import type { UserInfo } from '@/api/auth';
import { APP_ENTRIES, type AppCode } from '@/config/apps';
import { useDepartmentOptions } from '@/config/departments';
import { listAssignableRoles, type RoleInfo } from '@/api/roles';
import PageHeaderBar from '@/components/PageHeaderBar';
import { useIsMobile } from '@/hooks/useIsMobile';

const APP_OPTIONS = APP_ENTRIES.map((a) => ({ label: a.name, value: a.code }));

function roleTag(role?: string, roleName?: string) {
  if (role === 'SUPER_ADMIN') return <Tag color="purple">超管</Tag>;
  if (role === 'INSPECTOR') return <Tag color="orange">{roleName || '查验员'}</Tag>;
  return <Tag>{roleName || role || '普通用户'}</Tag>;
}

export default function SystemUsersPage() {
  const isMobile = useIsMobile();
  const departmentOptions = useDepartmentOptions();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [roleOptions, setRoleOptions] = useState<{ value: string; label: string }[]>([
    { value: 'USER', label: '普通用户' },
    { value: 'INSPECTOR', label: '查验员' },
  ]);
  const [roleNameMap, setRoleNameMap] = useState<Record<string, string>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<UserInfo | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const load = async () => {
    try {
      setLoading(true);
      const [userRes, roleRes] = await Promise.all([
        listUsers(),
        listAssignableRoles().catch(() => ({ data: [] as RoleInfo[] })),
      ]);
      setUsers(userRes.data || []);
      const roles = roleRes.data || [];
      if (roles.length) {
        setRoleOptions(roles.map((r) => ({ value: r.code, label: r.name })));
        const map: Record<string, string> = { SUPER_ADMIN: '超管' };
        roles.forEach((r) => {
          map[r.code] = r.name;
        });
        setRoleNameMap(map);
      }
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
        phone: values.phone,
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
      phone: record.phone,
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
        phone: values.phone ?? '',
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

  const columns: ColumnsType<UserInfo> = useMemo(() => {
    const all: ColumnsType<UserInfo> = [
      { title: 'ID', dataIndex: 'id', width: 70 },
      { title: '用户名', dataIndex: 'username', width: 120, ellipsis: true },
      { title: '昵称', dataIndex: 'nickname', width: 100, ellipsis: true },
      {
        title: '手机号',
        dataIndex: 'phone',
        width: 120,
        render: (phone?: string) => phone || <span style={{ color: '#999' }}>-</span>,
      },
      {
        title: '部门',
        dataIndex: 'department',
        width: 120,
        ellipsis: true,
        render: (_: string, record: UserInfo) => record.department || record.deptIds || '-',
      },
      {
        title: '钉钉',
        dataIndex: 'dingtalkUserId',
        width: 80,
        render: (id?: string) =>
          id ? <Tag color="blue">已绑定</Tag> : <span style={{ color: '#999' }}>未绑</span>,
      },
      {
        title: '角色',
        dataIndex: 'role',
        width: 100,
        render: (role: string) => roleTag(role, roleNameMap[role]),
      },
      {
        title: '可访问应用',
        dataIndex: 'appPermissions',
        width: 200,
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
        width: 90,
        fixed: 'right',
        render: (_, record) => (
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            编辑
          </Button>
        ),
      },
    ];
    if (!isMobile) return all;
    return all.filter((col) => {
      const key = String(('dataIndex' in col && col.dataIndex) || col.title || '');
      return !['ID', 'id', '钉钉', 'dingtalkUserId'].includes(key);
    });
  }, [isMobile, roleNameMap]);

  return (
    <div className="page-container">
      <PageHeaderBar
        title="用户权限"
        description="小程序使用「手机号 + 本地密码」登录；钉钉登录会按手机号自动合并同一账号"
        extra={
          <Button type="primary" icon={<PlusOutlined />} block={isMobile} onClick={() => setCreateOpen(true)}>
            新建用户
          </Button>
        }
      />
      <Table
        rowKey="id"
        loading={loading}
        dataSource={users}
        columns={columns}
        scroll={{ x: isMobile ? 720 : 1100 }}
        pagination={{
          size: isMobile ? 'small' : 'middle',
          simple: isMobile,
          showSizeChanger: !isMobile,
        }}
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
        width={720}
      >
        <Form form={createForm} layout="vertical" initialValues={{ appPermissions: ['receipt'], role: 'USER' }}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="登录用户名" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password placeholder="初始密码（小程序同步使用）" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号"
            rules={[{ pattern: /^1\d{10}$/, message: '请输入 11 位手机号' }]}
            extra="小程序登录账号；钉钉通讯录同号会自动合并"
          >
            <Input placeholder="可选，建议填写" maxLength={11} />
          </Form.Item>
          <Form.Item name="nickname" label="昵称">
            <Input placeholder="显示名称" />
          </Form.Item>
          <Form.Item name="department" label="部门">
            <Select allowClear placeholder="请选择部门" options={departmentOptions} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Select options={roleOptions} />
          </Form.Item>
          <Form.Item name="appPermissions" label="可访问应用">
            <Checkbox.Group options={APP_OPTIONS} style={{ display: 'flex', flexDirection: 'column', gap: 8 }} />
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
        width={720}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="nickname" label="昵称" rules={[{ required: true, message: '请输入昵称' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号"
            rules={[{ pattern: /^1\d{10}$/, message: '请输入 11 位手机号' }]}
            extra="小程序用此手机号 + 下方密码登录"
          >
            <Input placeholder="小程序登录手机号" maxLength={11} allowClear />
          </Form.Item>
          {editing?.role !== 'SUPER_ADMIN' && (
            <Form.Item name="department" label="部门">
              <Select allowClear placeholder="请选择部门" options={departmentOptions} showSearch optionFilterProp="label" />
            </Form.Item>
          )}
          {editing?.role !== 'SUPER_ADMIN' && (
            <>
              <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
                <Select options={roleOptions} />
              </Form.Item>
              <Form.Item name="appPermissions" label="可访问应用">
                <Checkbox.Group options={APP_OPTIONS} style={{ display: 'flex', flexDirection: 'column', gap: 8 }} />
              </Form.Item>
            </>
          )}
          <Form.Item
            name="password"
            label="重置密码"
            extra="留空则不修改。钉钉自动建档用户需在此设置密码后才能用小程序登录"
          >
            <Input.Password placeholder="新密码（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
