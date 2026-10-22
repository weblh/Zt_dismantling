import { useEffect, useState } from 'react';
import {
  Button,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  Tree,
  message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  createRole,
  deleteRole,
  listRoles,
  updateRole,
  type RoleInfo,
} from '@/api/roles';
import { listMenuTree } from '@/api/menus';
import { menusToTreeData } from '@/utils/menuTree';
import PageHeaderBar from '@/components/PageHeaderBar';
import { useIsMobile } from '@/hooks/useIsMobile';

const BUILTIN = new Set(['SUPER_ADMIN', 'USER', 'INSPECTOR']);

export default function SystemRolesPage() {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [menuTreeData, setMenuTreeData] = useState<ReturnType<typeof menusToTreeData>>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RoleInfo | null>(null);
  const [checkedKeys, setCheckedKeys] = useState<number[]>([]);
  const [form] = Form.useForm();

  const load = async () => {
    try {
      setLoading(true);
      const [roleRes, menuRes] = await Promise.all([listRoles(), listMenuTree(true)]);
      setRoles(roleRes.data || []);
      setMenuTreeData(menusToTreeData(menuRes.data || []));
    } catch {
      // interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setCheckedKeys([]);
    form.setFieldsValue({ code: '', name: '', remark: '' });
    setOpen(true);
  };

  const openEdit = (record: RoleInfo) => {
    setEditing(record);
    setCheckedKeys(record.menuIds || []);
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      remark: record.remark,
    });
    setOpen(true);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    try {
      if (editing) {
        await updateRole(editing.id, {
          code: editing.code,
          name: values.name,
          remark: values.remark,
          menuIds: editing.code === 'SUPER_ADMIN' ? undefined : checkedKeys,
        });
        message.success('已更新');
      } else {
        await createRole({
          code: values.code,
          name: values.name,
          remark: values.remark,
          menuIds: checkedKeys,
        });
        message.success('已创建');
      }
      setOpen(false);
      load();
    } catch {
      // interceptor
    }
  };

  const handleDelete = (record: RoleInfo) => {
    Modal.confirm({
      title: `删除角色「${record.name}」？`,
      onOk: async () => {
        await deleteRole(record.id);
        message.success('已删除');
        load();
      },
    });
  };

  return (
    <div className="page-container">
      <PageHeaderBar
        title="角色权限"
        description="为角色勾选可访问菜单；用户通过「用户权限」绑定角色后，侧栏按此过滤。超管始终拥有全部菜单。"
        extra={
          <Button type="primary" icon={<PlusOutlined />} block={isMobile} onClick={openCreate}>
            新建角色
          </Button>
        }
      />

      <Table
        rowKey="id"
        loading={loading}
        dataSource={roles}
        scroll={{ x: isMobile ? 640 : 900 }}
        pagination={{
          size: isMobile ? 'small' : 'middle',
          simple: isMobile,
          showSizeChanger: !isMobile,
        }}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 70 },
          { title: '编码', dataIndex: 'code', width: 140, ellipsis: true },
          { title: '名称', dataIndex: 'name', width: 120, ellipsis: true },
          { title: '备注', dataIndex: 'remark', ellipsis: true, width: 160 },
          {
            title: '菜单数',
            width: 80,
            render: (_: unknown, r: RoleInfo) =>
              r.code === 'SUPER_ADMIN' ? <Tag color="purple">全部</Tag> : (r.menuIds?.length ?? 0),
          },
          {
            title: '类型',
            width: 90,
            render: (_: unknown, r: RoleInfo) =>
              BUILTIN.has(r.code) ? <Tag>内置</Tag> : <Tag color="blue">自定义</Tag>,
          },
          {
            title: '操作',
            width: isMobile ? 120 : 160,
            fixed: 'right',
            render: (_: unknown, record: RoleInfo) => (
              <Space size="small" wrap>
                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
                  编辑
                </Button>
                {!BUILTIN.has(record.code) && (
                  <Button
                    type="link"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(record)}
                  >
                    删除
                  </Button>
                )}
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editing ? '编辑角色' : '新建角色'}
        open={open}
        onOk={handleOk}
        onCancel={() => setOpen(false)}
        destroyOnHidden
        width={960}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="角色编码"
            rules={[
              { required: true, message: '请输入编码' },
              { pattern: /^[A-Z][A-Z0-9_]*$/, message: '大写字母开头，仅字母数字下划线' },
            ]}
          >
            <Input disabled={!!editing} placeholder="如 SALES" />
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          {editing?.code === 'SUPER_ADMIN' ? (
            <div style={{ color: '#888' }}>超管固定拥有全部菜单，无需勾选。</div>
          ) : (
            <Form.Item label="菜单权限">
              <div
                style={{
                  maxHeight: isMobile ? 280 : 360,
                  overflow: 'auto',
                  border: '1px solid #f0f0f0',
                  padding: 12,
                  borderRadius: 8,
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                <Tree
                  checkable
                  defaultExpandAll
                  treeData={menuTreeData}
                  checkedKeys={checkedKeys}
                  onCheck={(keys) => {
                    const list = Array.isArray(keys) ? keys : keys.checked;
                    setCheckedKeys(list.map((k) => Number(k)));
                  }}
                />
              </div>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
