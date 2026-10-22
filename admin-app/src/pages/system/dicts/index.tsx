import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import { CloudSyncOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { makeEditColumn } from '@/components/TableEditColumn';
import {
  listDictItems,
  listDictTypes,
  syncDictsFromJdy,
  type DictItemInfo,
  type DictTypeInfo,
} from '@/api/dicts';
import { useIsMobile } from '@/hooks/useIsMobile';

const { Text } = Typography;

const SOURCE_TAG: Record<string, { color: string; text: string }> = {
  receipt: { color: 'red', text: '收车' },
  pricing: { color: 'blue', text: '议价' },
  schema: { color: 'default', text: '表单选项' },
};

type TabKey = 'master' | 'enum';

function isEnumType(t: DictTypeInfo) {
  return t.source === 'enum' || (t.code || '').startsWith('opt:');
}

export default function SystemDictsPage() {
  const isMobile = useIsMobile();
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [types, setTypes] = useState<DictTypeInfo[]>([]);
  const [items, setItems] = useState<DictItemInfo[]>([]);
  const [activeCode, setActiveCode] = useState<string>('');
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [tab, setTab] = useState<TabKey>('master');
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<DictItemInfo | null>(null);
  const [editForm] = Form.useForm();

  const handleEdit = (record: DictItemInfo) => {
    setEditing(record);
    editForm.setFieldsValue(record);
    setEditOpen(true);
  };

  const handleEditOk = async () => {
    const values = await editForm.validateFields();
    setItems((prev) => prev.map((r) => (r.id === editing?.id ? { ...r, ...values } : r)));
    message.success('修改成功（本地）');
    setEditOpen(false);
    setEditing(null);
  };

  const filteredTypes = useMemo(() => {
    const byTab = types.filter((t) => (tab === 'enum' ? isEnumType(t) : !isEnumType(t)));
    const q = typeFilter.trim().toLowerCase();
    if (!q) return byTab;
    return byTab.filter(
      (t) =>
        (t.name || '').toLowerCase().includes(q) ||
        (t.code || '').toLowerCase().includes(q),
    );
  }, [types, tab, typeFilter]);

  const activeType = useMemo(
    () => types.find((t) => t.code === activeCode),
    [types, activeCode],
  );

  const masterCount = useMemo(() => types.filter((t) => !isEnumType(t)).length, [types]);
  const enumCount = useMemo(() => types.filter((t) => isEnumType(t)).length, [types]);

  const selectFirstInList = (list: DictTypeInfo[], preferCode?: string) => {
    const next =
      (preferCode && list.some((t) => t.code === preferCode) && preferCode) ||
      (activeCode && list.some((t) => t.code === activeCode) && activeCode) ||
      list[0]?.code ||
      '';
    setActiveCode(next);
    if (next) {
      void loadItems(next);
    } else {
      setItems([]);
    }
  };

  const loadTypes = async (preferCode?: string, preferTab?: TabKey) => {
    try {
      setLoadingTypes(true);
      const res = await listDictTypes();
      const list = res.data || [];
      setTypes(list);
      const nextTab = preferTab || tab;
      const scoped = list.filter((t) => (nextTab === 'enum' ? isEnumType(t) : !isEnumType(t)));
      selectFirstInList(scoped, preferCode);
    } catch {
      // interceptor
    } finally {
      setLoadingTypes(false);
    }
  };

  const loadItems = async (typeCode: string, kw?: string) => {
    if (!typeCode) {
      setItems([]);
      return;
    }
    try {
      setLoadingItems(true);
      const res = await listDictItems(typeCode, kw);
      setItems(res.data || []);
    } catch {
      // interceptor
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    loadTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // 切换 Tab 时选中该分类下第一项
    const scoped = types.filter((t) => (tab === 'enum' ? isEnumType(t) : !isEnumType(t)));
    if (!scoped.some((t) => t.code === activeCode)) {
      selectFirstInList(scoped);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await syncDictsFromJdy();
      message.success(res.data?.message || '已从简道云同步基础资料');
      const { BIZ_KEY_TO_DICT_TYPE, hydrateBizFromDictServer } = await import('@/utils/dictHydrate');
      await Promise.all(Object.keys(BIZ_KEY_TO_DICT_TYPE).map((key) => hydrateBizFromDictServer(key))).catch(() => {});
      await loadTypes(activeCode, tab);
    } catch {
      // interceptor
    } finally {
      setSyncing(false);
    }
  };

  const typeColumns: ColumnsType<DictTypeInfo> = [
    {
      title: '字典',
      dataIndex: 'name',
      render: (name: string, row) => (
        <Space direction="vertical" size={0}>
          <Text strong={row.code === activeCode}>{name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {row.code}
          </Text>
        </Space>
      ),
    },
    {
      title: '条数',
      dataIndex: 'itemCount',
      width: 72,
      align: 'right',
      render: (v: number) => v ?? 0,
    },
  ];

  const parseExtra = (extraJson?: string): Record<string, string> => {
    if (!extraJson) return {};
    try {
      const obj = JSON.parse(extraJson) as Record<string, unknown>;
      const out: Record<string, string> = {};
      Object.entries(obj).forEach(([k, v]) => {
        if (v == null || v === '') return;
        out[k] = String(v);
      });
      return out;
    } catch {
      return {};
    }
  };

  const extraText = (extra: Record<string, string>, ...keys: string[]) => {
    for (const k of keys) {
      if (extra[k]) return extra[k];
    }
    return '';
  };

  const isPayeeType = (activeType?.code || '') === 'payee-info';
  const isSupplierType = (activeType?.code || '') === 'supplier';

  const itemColumns: ColumnsType<DictItemInfo> = [
    { title: '显示名', dataIndex: 'itemLabel', ellipsis: true, width: 140 },
    ...(isPayeeType
      ? ([
          {
            title: '收款账号',
            key: 'payeeAccount',
            width: 180,
            ellipsis: true,
            render: (_: unknown, row: DictItemInfo) =>
              extraText(parseExtra(row.extraJson), '收款账号', 'payeeAccount', '账号') || '-',
          },
          {
            title: '开户行',
            key: 'openingBank',
            width: 160,
            ellipsis: true,
            render: (_: unknown, row: DictItemInfo) =>
              extraText(parseExtra(row.extraJson), '开户行', 'openingBank') || '-',
          },
        ] as ColumnsType<DictItemInfo>)
      : []),
    ...(isSupplierType
      ? ([
          {
            title: '联系电话',
            key: 'contactPhone',
            width: 140,
            ellipsis: true,
            render: (_: unknown, row: DictItemInfo) =>
              extraText(parseExtra(row.extraJson), '联系电话', 'contactPhone') || '-',
          },
        ] as ColumnsType<DictItemInfo>)
      : []),
    { title: '值', dataIndex: 'itemValue', ellipsis: true, width: 180 },
    {
      title: '来源',
      dataIndex: 'sourceApp',
      width: 90,
      render: (v?: string) => {
        const meta = SOURCE_TAG[v || ''] || { color: 'default', text: v || '-' };
        return <Tag color={meta.color}>{meta.text}</Tag>;
      },
    },
    {
      title: '简道云 ID',
      dataIndex: 'jdyDataId',
      width: 140,
      ellipsis: true,
      render: (v?: string) => v || '-',
    },
    makeEditColumn<DictItemInfo>(handleEdit),
  ];

  return (
    <div className="page-container">
      <Card
        size="small"
        title="字典管理"
        extra={
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={() => loadTypes(activeCode, tab)}>
              刷新
            </Button>
            <Button
              type="primary"
              icon={<CloudSyncOutlined />}
              loading={syncing}
              onClick={handleSync}
            >
              {isMobile ? '刷新字典' : '刷新本地字典'}
            </Button>
          </Space>
        }
      >
        <Text type="secondary">
          字典数据已改为本地维护（简道云镜像已下线）。可在此查看与编辑基础资料、固定下拉选项。
        </Text>
      </Card>

      <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
        <Col xs={24} md={8} lg={7}>
          <Card
            size="small"
            title="字典类型"
            styles={{ body: { padding: 0 } }}
            extra={
              <Input.Search
                allowClear
                size="small"
                placeholder="筛选类型"
                style={{ width: isMobile ? 120 : 140 }}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              />
            }
          >
            <Tabs
              size="small"
              activeKey={tab}
              onChange={(k) => setTab(k as TabKey)}
              style={{ padding: '0 8px' }}
              items={[
                { key: 'master', label: isMobile ? `基础(${masterCount})` : `基础资料 (${masterCount})` },
                { key: 'enum', label: isMobile ? `选项(${enumCount})` : `固定选项 (${enumCount})` },
              ]}
            />
            <Table
              size="small"
              rowKey="code"
              loading={loadingTypes}
              pagination={false}
              columns={typeColumns}
              dataSource={filteredTypes}
              scroll={{
                x: 280,
                y: isMobile ? 280 : 'calc(100vh - 340px)',
              }}
              locale={{ emptyText: syncing ? '同步中…' : '暂无数据，请先全量同步' }}
              onRow={(row) => ({
                onClick: () => {
                  setActiveCode(row.code);
                  setKeyword('');
                  loadItems(row.code);
                },
                style: {
                  cursor: 'pointer',
                  background: row.code === activeCode ? '#e6f4ff' : undefined,
                },
              })}
            />
          </Card>
        </Col>
        <Col xs={24} md={16} lg={17}>
          <Card
            size="small"
            title={
              activeType ? (
                <Space wrap>
                  <span>{activeType.name}</span>
                  <Tag>{isEnumType(activeType) ? '固定选项' : '基础资料'}</Tag>
                  {!isMobile && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {activeType.code}
                    </Text>
                  )}
                </Space>
              ) : (
                '字典项'
              )
            }
            extra={
              <Input.Search
                allowClear
                placeholder={isMobile ? '搜索' : '搜索显示名 / 值 / 账号'}
                style={{ width: isMobile ? 140 : 240 }}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onSearch={(v) => loadItems(activeCode, v)}
              />
            }
          >
            <Table
              size="small"
              rowKey="id"
              loading={loadingItems}
              columns={itemColumns}
              dataSource={items}
              pagination={{
                pageSize: isMobile ? 20 : 50,
                showSizeChanger: !isMobile,
                simple: isMobile,
                size: isMobile ? 'small' : 'middle',
                showTotal: (t) => `共 ${t} 条`,
              }}
              scroll={{
                x: 600,
                y: isMobile ? undefined : 'calc(100vh - 320px)',
              }}
              locale={{ emptyText: '暂无字典项' }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="编辑字典项"
        open={editOpen}
        onOk={handleEditOk}
        onCancel={() => { setEditOpen(false); setEditing(null); }}
        width={720}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="itemLabel" label="显示名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="itemValue" label="值">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
