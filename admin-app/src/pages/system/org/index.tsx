import { useEffect, useState } from 'react';
import { Button, Space, Table, Tag, Tree, message } from 'antd';
import { CloudSyncOutlined, ReloadOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { listDeptTree, syncDeptsFromDingTalk, type DeptNode } from '@/api/depts';

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
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [tree, setTree] = useState<DeptNode[]>([]);

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
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>组织架构</h2>
          <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
            从钉钉通讯录同步部门与人员到本地库；用户管理、业务表单部门选项将使用同步结果
          </div>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load} disabled={loading || syncing}>
            刷新
          </Button>
          <Button
            onClick={() => handleSync(false)}
            loading={syncing}
            disabled={loading}
          >
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
        </Space>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ background: '#fff', padding: 16, borderRadius: 8, minHeight: 360 }}>
          <div style={{ marginBottom: 12, fontWeight: 600 }}>部门树</div>
          {tree.length === 0 && !loading ? (
            <div style={{ color: '#999' }}>暂无数据，请先点击「同步部门+人员」</div>
          ) : (
            <Tree treeData={toTreeData(tree)} defaultExpandAll showLine />
          )}
        </div>
        <div style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
          <div style={{ marginBottom: 12, fontWeight: 600 }}>部门列表（{flat.length}）</div>
          <Table
            rowKey="id"
            size="small"
            loading={loading}
            pagination={{ pageSize: 12 }}
            dataSource={flat}
            columns={[
              { title: '名称', dataIndex: 'name' },
              { title: '钉钉ID', dataIndex: 'dingtalkDeptId', width: 100 },
              {
                title: '状态',
                dataIndex: 'status',
                width: 90,
                render: (s?: number) =>
                  s === 0 ? <Tag>停用</Tag> : <Tag color="green">启用</Tag>,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
