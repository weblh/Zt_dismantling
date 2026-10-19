import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  createMenu,
  deleteMenu,
  listMenuTree,
  updateMenu,
  type MenuNode,
} from '@/api/menus';
import { MENU_ICON_OPTIONS } from '@/utils/menuIcons';
import PageHeaderBar from '@/components/PageHeaderBar';
import { useIsMobile } from '@/hooks/useIsMobile';

function flatten(nodes: MenuNode[], depth = 0, acc: (MenuNode & { depth: number })[] = []) {
  for (const n of nodes) {
    acc.push({ ...n, depth, children: undefined });
    if (n.children?.length) flatten(n.children, depth + 1, acc);
  }
  return acc;
}

function parentOptions(nodes: MenuNode[], excludeId?: number, prefix = ''): { value: number; label: string }[] {
  const opts: { value: number; label: string }[] = [];
  for (const n of nodes) {
    if (n.id === excludeId) continue;
    opts.push({ value: n.id, label: `${prefix}${n.name}` });
    if (n.children?.length) {
      opts.push(...parentOptions(n.children, excludeId, `${prefix}${n.name} / `));
    }
  }
  return opts;
}

export default function SystemMenusPage() {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [tree, setTree] = useState<MenuNode[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MenuNode | null>(null);
  const [form] = Form.useForm();

  const load = async () => {
    try {
      setLoading(true);
      const res = await listMenuTree(false);
      setTree(res.data || []);
    } catch {
      // interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => flatten(tree), [tree]);
  const parents = useMemo(() => [{ value: 0, label: '顶级' }, ...parentOptions(tree, editing?.id)], [tree, editing]);

  const openCreate = (parentId = 0) => {
    setEditing(null);
    form.setFieldsValue({
      parentId,
      name: '',
      path: '',
      icon: 'AppstoreOutlined',
      menuType: 'M',
      sortOrder: 0,
      visible: true,
      status: true,
    });
    setOpen(true);
  };

  const openEdit = (record: MenuNode) => {
    setEditing(record);
    form.setFieldsValue({
      parentId: record.parentId ?? 0,
      name: record.name,
      path: record.path,
      icon: record.icon || 'AppstoreOutlined',
      menuType: record.menuType || 'M',
      sortOrder: record.sortOrder ?? 0,
      visible: record.visible !== 0,
      status: record.status !== 0,
    });
    setOpen(true);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    const payload = {
      parentId: values.parentId || 0,
      name: values.name,
      path: values.path,
      icon: values.icon,
      menuType: values.menuType,
      sortOrder: values.sortOrder ?? 0,
      visible: values.visible ? 1 : 0,
      status: values.status ? 1 : 0,
    };
    try {
      if (editing) {
        await updateMenu(editing.id, payload);
        message.success('已更新');
      } else {
        await createMenu(payload);
        message.success('已创建');
      }
      setOpen(false);
      load();
    } catch {
      // interceptor
    }
  };

  const handleDelete = (record: MenuNode) => {
    Modal.confirm({
      title: `删除菜单「${record.name}」？`,
      onOk: async () => {
        await deleteMenu(record.id);
        message.success('已删除');
        load();
      },
    });
  };

  return (
    <div className="page-container">
      <PageHeaderBar
        title="菜单管理"
        description="维护侧栏菜单；角色权限页可勾选授权。修改后用户刷新页面生效。"
        extra={
          <Button type="primary" icon={<PlusOutlined />} block={isMobile} onClick={() => openCreate(0)}>
            新建菜单
          </Button>
        }
      />

      <Table<MenuNode & { depth: number }>
        rowKey="id"
        loading={loading}
        dataSource={rows}
        pagination={false}
        scroll={{ x: isMobile ? 720 : 1000 }}
        columns={[
          {
            title: '名称',
            dataIndex: 'name',
            width: 160,
            render: (name: string, record) => (
              <span style={{ paddingLeft: Math.min((record.depth || 0) * (isMobile ? 8 : 16), 48) }}>
                {name}
              </span>
            ),
          },
          { title: '路径/Key', dataIndex: 'path', width: isMobile ? 140 : 260, ellipsis: true },
          {
            title: '类型',
            dataIndex: 'menuType',
            width: 80,
            render: (t?: string) => (t === 'D' ? <Tag>目录</Tag> : <Tag color="blue">菜单</Tag>),
          },
          ...(isMobile
            ? []
            : [
                { title: '图标', dataIndex: 'icon', width: 180, ellipsis: true as const },
                { title: '排序', dataIndex: 'sortOrder', width: 70 },
              ]),
          {
            title: '状态',
            width: 100,
            render: (_: unknown, r: MenuNode) => (
              <Space size={4} wrap>
                {r.visible === 0 ? <Tag>隐藏</Tag> : <Tag color="green">显示</Tag>}
                {r.status === 0 ? <Tag>停用</Tag> : null}
              </Space>
            ),
          },
          {
            title: '操作',
            width: isMobile ? 140 : 200,
            fixed: 'right',
            render: (_: unknown, record: MenuNode) => (
              <Space size="small" wrap>
                <Button type="link" size="small" onClick={() => openCreate(record.id)}>
                  子级
                </Button>
                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
                  编辑
                </Button>
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(record)}
                >
                  删除
                </Button>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editing ? '编辑菜单' : '新建菜单'}
        open={open}
        onOk={handleOk}
        onCancel={() => setOpen(false)}
        destroyOnHidden
        width={560}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="parentId" label="上级">
            <Select options={parents} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="path" label="路径/Key" extra="叶子菜单建议填路由，如 /system/users；目录可用英文 key">
            <Input placeholder="/path 或 directory-key" />
          </Form.Item>
          <Form.Item name="menuType" label="类型" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'D', label: '目录' },
                { value: 'M', label: '菜单' },
              ]}
            />
          </Form.Item>
          <Form.Item name="icon" label="图标">
            <Select options={MENU_ICON_OPTIONS} showSearch />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Space size={24} wrap>
            <Form.Item name="visible" label="显示" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="status" label="启用" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
