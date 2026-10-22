import { useEffect, useState } from 'react';
import { Button, Table, Tag, Tree, message, Modal, Form, Input } from 'antd';
import { CloudSyncOutlined, ReloadOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { listDeptTree, syncDeptsFromDingTalk, type DeptNode } from '@/api/depts';
import { makeEditColumn } from '@/components/TableEditColumn';
import PageHeaderBar from '@/components/PageHeaderBar';
import { useIsMobile } from '@/hooks/useIsMobile';

function toTreeData(nodes: DeptNode[]): DataNode[] {
  return nodes.map((n) => ({
    key: String(n.id),
    title: (
      <span>
        {n.name}
        {n.status === 0 ? (
          <Tag color="default" style={{ marginLeft: 8 }}>
            已停用
          </Tag>
        ) : null}
        {n.dingtalkDeptId != null ? (
          <span style={{ color: '#999', marginLeft: 8, fontSize: 12 }}>#{n.dingtalkDeptId}</span>
        ) : null}
      </span>
    ),
    children: n.children?.length ? toTreeData(n.children) : undefined,
  }));
}

function flatten(nodes: DeptNode[], acc: DeptNode[] = []): DeptNode[] {
  for (const n of nodes) {
    acc.push(n);
    if (n.children?.length) flatten(n.children, acc);
  }
  return acc;
}

export default function SystemOrgPage() {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [tree, setTree] = useState<DeptNode[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<DeptNode | null>(null);
  const [editForm] = Form.useForm();

  const handleEdit = (record: DeptNode) => {
    setEditing(record);
    editForm.setFieldsValue({ name: record.name });
    setEditOpen(true);
  };

  const handleEditOk = async () => {
    const values = await editForm.validateFields();
    const walk = (nodes: DeptNode[]): DeptNode[] =>
      nodes.map((n) =>
        n.id === editing?.id
          ? { ...n, ...values }
          : { ...n, children: n.children ? walk(n.children) : undefined },
      );
    setTree((prev) => walk(prev));
    message.success('修改成功（本地）');
    setEditOpen(false);
    setEditing(null);
  };

  const load = async () => {
    try {
      setLoading(true);
      const res = await listDeptTree(true);
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

  const handleSync = async (syncUsers: boolean) => {
    try {
      setSyncing(true);
      const res = await syncDeptsFromDingTalk(syncUsers);
      const r = res.data;
      message.success(r?.message || '同步完成');
      await load();
    } catch {
      // interceptor
    } finally {
      setSyncing(false);
    }
  };

  const flat = flatten(tree);

  return (
    <div className="page-container">
      <PageHeaderBar
        title="组织架构"
        description="从钉钉通讯录同步部门与人员到本地库；用户管理、业务表单部门选项将使用同步结果"
        extra={
          <>
            <Button icon={<ReloadOutlined />} onClick={load} disabled={loading || syncing}>
              刷新
            </Button>
            <Button onClick={() => handleSync(false)} loading={syncing} disabled={loading}>
              仅同步部门
            </Button>
            <Button
              type="primary"
              icon={<CloudSyncOutlined />}
              onClick={() => handleSync(true)}
              loading={syncing}
              disabled={loading}
            >
              同步部门+人员
            </Button>
          </>
        }
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 12 : 24,
        }}
      >
        <div style={{ background: '#fff', padding: 16, borderRadius: 8, minHeight: isMobile ? 240 : 360 }}>
          <div style={{ marginBottom: 12, fontWeight: 600 }}>部门树</div>
          {tree.length === 0 && !loading ? (
            <div style={{ color: '#999' }}>暂无数据，请先点击「同步部门+人员」</div>
          ) : (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <Tree treeData={toTreeData(tree)} defaultExpandAll showLine />
            </div>
          )}
        </div>
        <div style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
          <div style={{ marginBottom: 12, fontWeight: 600 }}>部门列表（{flat.length}）</div>
          <Table
            rowKey="id"
            size="small"
            loading={loading}
            pagination={{
              pageSize: isMobile ? 8 : 12,
              size: isMobile ? 'small' : 'middle',
              simple: isMobile,
            }}
            dataSource={flat}
            scroll={{ x: 360 }}
            columns={[
              { title: '名称', dataIndex: 'name', ellipsis: true },
              { title: '钉钉ID', dataIndex: 'dingtalkDeptId', width: 100 },
              {
                title: '状态',
                dataIndex: 'status',
                width: 90,
                render: (s?: number) => (s === 0 ? <Tag>停用</Tag> : <Tag color="green">启用</Tag>),
              },
              makeEditColumn<DeptNode>(handleEdit),
            ]}
          />
        </div>
      </div>

      <Modal
        title="编辑部门"
        open={editOpen}
        onOk={handleEditOk}
        onCancel={() => { setEditOpen(false); setEditing(null); }}
        width={720}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
