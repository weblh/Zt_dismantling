import { useEffect, useMemo, useState } from 'react';
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
  message,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  ExpandOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { makeEditColumn } from '@/components/TableEditColumn';
import {
  formatBizDateTime,
  getLocalBizRows,
  addLocalBizRow,
  upsertLocalBizRow,
  deleteLocalBizRows,
  setLocalBizRows,
} from '@/utils/localBizStore';
import { getStoredUser } from '@/config/apps';
import { useIsMobile } from '@/hooks/useIsMobile';
import BusinessJdySyncButtons from '@/components/BusinessJdySyncButtons';
import { getJdyBusinessData, syncJdyWeighingSync, updateWeighingSyncStatus } from '@/api/jdy';
import { appendBizDataLog } from '@/api/bizRecordMeta';
import BizRecordSidePanel from '@/components/BizRecordSidePanel';
import BizFormMetaFooter, { bizRecordKey } from '@/components/BizFormMetaFooter';
import BasicFuzzyFilter, { filterBasicRows } from '@/components/BasicFuzzyFilter';

const BIZ_KEY = 'weighing-sync';
/** 清理误添加的本地重复编号（打开页面时执行一次） */
const DUPLICATE_CODES_TO_PURGE = ['6J0277'];

interface SyncDataItem {
  id: number;
  dataId?: string;
  code: string;
  negotiation: string;
  tonnage: number | string;
  status: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const STATUS_OPTIONS = [
  { value: '0', label: '已同步' },
  { value: '1', label: '待同步' },
] as const;

const FILTER_FIELDS = [
  { key: 'code', label: '编号' },
  { key: 'negotiation', label: '议价/销户' },
  { key: 'tonnage', label: '吨位' },
  { key: 'status', label: '状态' },
];

const FIELD_LABELS: Record<string, string> = Object.fromEntries(
  FILTER_FIELDS.map(({ key, label }) => [key, label]),
);

function normalizeStatus(val: string | undefined): '0' | '1' {
  if (val === '1' || val === '待同步') return '1';
  return '0';
}

function statusLabel(val: unknown) {
  const n = normalizeStatus(String(val ?? ''));
  return n === '1' ? '待同步' : '已同步';
}

function buildChangeSummary(before: SyncDataItem | null, after: Record<string, unknown>) {
  if (!before) {
    return `创建过磅同步数据：${after.code || ''}`.trim();
  }
  const parts: string[] = [];
  Object.keys(FIELD_LABELS).forEach((key) => {
    const prev = (before as unknown as Record<string, unknown>)[key];
    const next = after[key];
    const prevStr = key === 'status' ? statusLabel(prev) : String(prev ?? '');
    const nextStr = key === 'status' ? statusLabel(next) : String(next ?? '');
    if (prevStr !== nextStr) {
      parts.push(`${FIELD_LABELS[key]}：${prevStr || '空'} → ${nextStr || '空'}`);
    }
  });
  return parts.length ? parts.join('；') : '保存过磅同步数据（无字段变更）';
}

function rowSavingKey(row: SyncDataItem) {
  return row.dataId || String(row.id);
}

export default function SyncDataPage() {
  const isMobile = useIsMobile();
  const [items, setItems] = useState<SyncDataItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editing, setEditing] = useState<SyncDataItem | null>(null);
  const [metaTick, setMetaTick] = useState(0);
  const [form] = Form.useForm();

  /** 一次性清理误添加的本地重复编号 6J0277 */
  useEffect(() => {
    const flagKey = 'weighing-sync-purged-6J0277';
    if (typeof localStorage === 'undefined' || localStorage.getItem(flagKey)) return;
    const local = getLocalBizRows<SyncDataItem>(BIZ_KEY);
    const dupCodes = new Set(DUPLICATE_CODES_TO_PURGE.map((c) => c.trim().toUpperCase()));
    const next = local.filter(
      (row) => !dupCodes.has(String(row.code || '').trim().toUpperCase()),
    );
    localStorage.setItem(flagKey, '1');
    if (next.length !== local.length) {
      setLocalBizRows(BIZ_KEY, next);
      message.success(`已删除 ${local.length - next.length} 条本地重复编号数据`);
      setReloadKey((k) => k + 1);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getJdyBusinessData(BIZ_KEY, {
          pageNo,
          pageSize,
          keyword: keyword || undefined,
        });
        if (cancelled) return;
        const remote = (res.data?.records || []) as unknown as SyncDataItem[];
        const local = keyword
          ? []
          : getLocalBizRows<SyncDataItem>(BIZ_KEY);
        const merged = pageNo === 1 ? [...local, ...remote] : remote;
        setItems(merged);
        setTotal((res.data?.total || 0) + local.length);
      } catch {
        if (!cancelled) {
          setItems([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pageNo, pageSize, keyword, reloadKey]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchValue.trim();
      if (next === keyword) return;
      setPageNo(1);
      setKeyword(next);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, keyword]);

  const displayData = useMemo(
    () => filterBasicRows(items, searchValue, selectedFields),
    [items, searchValue, selectedFields],
  );

  const handleStatusChange = async (row: SyncDataItem, next: '0' | '1') => {
    const current = normalizeStatus(row.status);
    if (current === next) return;
    const key = rowSavingKey(row);
    setSavingId(key);
    try {
      if (!row.dataId) {
        const updated: SyncDataItem = {
          ...row,
          status: next,
          updateTime: formatBizDateTime(),
        };
        upsertLocalBizRow<SyncDataItem>(BIZ_KEY, updated);
        setItems((prev) =>
          prev.map((item) => (item.id === row.id && !item.dataId ? updated : item)),
        );
        message.success(next === '0' ? '已标记为已同步' : '已标记为待同步');
        return;
      }
      await updateWeighingSyncStatus(row.dataId, next);
      setItems((prev) =>
        prev.map((item) =>
          item.dataId === row.dataId
            ? { ...item, status: next, updateTime: formatBizDateTime() }
            : item,
        ),
      );
      message.success(next === '0' ? '已标记为已同步' : '已标记为待同步');
    } catch {
      // request 拦截器已提示
    } finally {
      setSavingId(null);
    }
  };

  const handleEdit = (record: SyncDataItem) => {
    setEditing(record);
    form.setFieldsValue(record);
    setAddModalOpen(true);
  };

  const columns: ColumnsType<SyncDataItem> = useMemo(
    () => [
      {
        title: <span style={{ whiteSpace: 'nowrap' }}>编号</span>,
        dataIndex: 'code',
        width: 100,
        render: (val: string, row) => (
          <a
            style={{ color: '#1890ff', cursor: 'pointer' }}
            onClick={(e) => {
              e.preventDefault();
              handleEdit(row);
            }}
          >
            {val || '-'}
          </a>
        ),
      },
      {
        title: <span style={{ whiteSpace: 'nowrap' }}>议价/销户</span>,
        dataIndex: 'negotiation',
        width: 100,
        render: (val: string) => {
          if (!val) return '-';
          const isNegotiated = val.includes('议');
          return <Tag color={isNegotiated ? 'orange' : 'green'}>{val}</Tag>;
        },
      },
      {
        title: <span style={{ whiteSpace: 'nowrap' }}>吨位</span>,
        dataIndex: 'tonnage',
        width: 90,
        align: 'right',
        render: (val: number | string) => {
          const n = Number(val);
          return Number.isFinite(n) ? n.toFixed(2) : val ?? '-';
        },
      },
      {
        title: <span style={{ whiteSpace: 'nowrap' }}>状态</span>,
        dataIndex: 'status',
        width: 130,
        render: (val: string, row) => {
          const key = rowSavingKey(row);
          return (
            <Select
              size="small"
              style={{ width: 108 }}
              value={normalizeStatus(val)}
              options={[...STATUS_OPTIONS]}
              loading={savingId === key}
              disabled={!!savingId && savingId !== key}
              onChange={(v) => handleStatusChange(row, v as '0' | '1')}
            />
          );
        },
      },
      { title: <span style={{ whiteSpace: 'nowrap' }}>提交人</span>, dataIndex: 'submitter', width: 100 },
      { title: <span style={{ whiteSpace: 'nowrap' }}>提交时间</span>, dataIndex: 'submitTime', width: 170 },
      { title: <span style={{ whiteSpace: 'nowrap' }}>更新时间</span>, dataIndex: 'updateTime', width: 170 },
      makeEditColumn<SyncDataItem>(handleEdit),
    ],
    [savingId],
  );

  const isCodeDuplicate = async (code: string, excludeId?: number) => {
    const normalized = String(code || '').trim();
    if (!normalized) return false;
    const sameCode = (row: SyncDataItem) =>
      String(row.code || '').trim().toUpperCase() === normalized.toUpperCase()
      && (excludeId == null || row.id !== excludeId);

    if (getLocalBizRows<SyncDataItem>(BIZ_KEY).some(sameCode)) return true;
    if (items.some(sameCode)) return true;

    try {
      const res = await getJdyBusinessData(BIZ_KEY, {
        pageNo: 1,
        pageSize: 50,
        keyword: normalized,
      });
      const records = (res.data?.records || []) as unknown as SyncDataItem[];
      return records.some(sameCode);
    } catch {
      return false;
    }
  };

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ negotiation: '销', status: '1' });
    setAddModalOpen(true);
  };

  const handleAddSubmit = async () => {
    try {
      const values = await form.validateFields();
      const code = String(values.code || '').trim();
      if (await isCodeDuplicate(code, editing?.id)) {
        message.error(`编号「${code}」已存在，请勿重复添加`);
        form.setFields([{ name: 'code', errors: ['编号已存在，不能重复添加'] }]);
        return;
      }
      const user = getStoredUser();
      const now = formatBizDateTime();
      const operator = user.nickname || user.username || '系统';
      const payload = {
        code,
        negotiation: values.negotiation || '',
        tonnage: values.tonnage,
        status: values.status,
        submitter: editing?.submitter || operator,
        submitTime: editing?.submitTime || now,
        updateTime: now,
        dataId: editing?.dataId,
      };
      const summary = buildChangeSummary(editing, payload);
      let saved: SyncDataItem;
      if (editing) {
        saved = upsertLocalBizRow<SyncDataItem>(BIZ_KEY, { ...payload, id: editing.id });
        message.success('修改成功');
      } else {
        saved = addLocalBizRow<SyncDataItem>(BIZ_KEY, payload);
        message.success('已添加（本地）');
      }
      const recordKey = bizRecordKey(saved);
      if (recordKey) {
        try {
          await appendBizDataLog(BIZ_KEY, recordKey, {
            action: editing ? '更新' : '创建',
            summary,
            operatorName: operator,
          });
          setMetaTick((t) => t + 1);
        } catch {
          // 日志失败不阻断主流程
        }
      }
      setReloadKey((k) => k + 1);
      setEditing(null);
      setAddModalOpen(false);
      form.resetFields();
    } catch {
      // form validation failed
    }
  };

  const handleSaveDraft = () => {
    message.success('草稿保存成功！');
    setAddModalOpen(false);
  };

  const handleDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先勾选要删除的数据');
      return;
    }
    const selected = items.filter((row) =>
      selectedRowKeys.includes(String(row.dataId || row.id)),
    );
    const localIds = selected
      .filter((row) => !row.dataId)
      .map((row) => row.id);
    const remoteCount = selected.length - localIds.length;
    if (localIds.length === 0) {
      message.warning(
        remoteCount > 0
          ? '简道云同步数据请在简道云中删除；本地新增数据可勾选后删除'
          : '请先勾选要删除的数据',
      );
      return;
    }
    Modal.confirm({
      title: '确认删除？',
      content:
        remoteCount > 0
          ? `将删除 ${localIds.length} 条本地数据；另有 ${remoteCount} 条简道云数据无法在此删除。`
          : `将删除选中的 ${localIds.length} 条本地数据。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        deleteLocalBizRows(BIZ_KEY, localIds);
        message.success(`已删除 ${localIds.length} 条`);
        setSelectedRowKeys([]);
        setReloadKey((k) => k + 1);
      },
    });
  };

  const metaRecordKey = bizRecordKey(editing);
  const formMeta = {
    submitter: editing?.submitter || getStoredUser().nickname || getStoredUser().username || '-',
    submitTime: editing?.submitTime || '-',
    updateTime: editing?.updateTime || '-',
  };

  return (
    <div className="page-container">
      <Card title="过磅同步数据">
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            gap: 12,
          }}
        >
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加
            </Button>
            <BusinessJdySyncButtons
              syncFn={syncJdyWeighingSync}
              onSynced={() => {
                setPageNo(1);
                setReloadKey((k) => k + 1);
              }}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => setReloadKey((k) => k + 1)}
            >
              刷新
            </Button>
            <Button icon={<DeleteOutlined />} danger onClick={handleDelete}>
              删除
            </Button>
          </Space>
          <BasicFuzzyFilter
            fields={FILTER_FIELDS}
            keyword={searchValue}
            onKeywordChange={setSearchValue}
            selectedFields={selectedFields}
            onSelectedFieldsChange={(next) => {
              setSelectedFields(next);
              setPageNo(1);
            }}
            inputWidth={isMobile ? '100%' : 200}
          />
        </div>

        <Table
          rowKey={(r) => String(r.dataId || r.id)}
          columns={columns}
          dataSource={displayData}
          loading={loading}
          size={isMobile ? 'small' : 'middle'}
          scroll={{ x: 860 }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{
            current: pageNo,
            pageSize,
            total,
            size: isMobile ? 'small' : 'middle',
            simple: isMobile,
            showSizeChanger: !isMobile,
            showTotal: (t) => (isMobile ? `共 ${t} 条` : `共 ${t} 条（本地库 · 地磅直写 / 可同步简道云历史）`),
            onChange: (page, size) => {
              setPageNo(page);
              setPageSize(size);
            },
          }}
        />
      </Card>

      <Modal
        title={null}
        open={addModalOpen}
        onCancel={() => {
          setEditing(null);
          setAddModalOpen(false);
        }}
        width={isMobile ? '100%' : 1000}
        closable={false}
        centered
        styles={{ body: { padding: 0, maxHeight: '85vh', overflowY: 'auto' } }}
        footer={
          <div style={{ display: 'flex', gap: 16 }}>
            <Button
              type="primary"
              size="large"
              onClick={handleAddSubmit}
              style={{ flex: 1, background: '#00a884', borderColor: '#00a884', height: 44 }}
            >
              提交
            </Button>
            <Button size="large" onClick={handleSaveDraft} style={{ flex: 1, height: 44 }}>
              保存草稿
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          <div style={{ flex: 1, minWidth: 0, padding: '16px 24px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <span style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>
                {editing ? '编辑过磅同步数据' : '添加过磅同步数据'}
              </span>
              <Space>
                <ExpandOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} />
                <span
                  onClick={() => {
                    setEditing(null);
                    setAddModalOpen(false);
                  }}
                  style={{ fontSize: 18, cursor: 'pointer', color: '#999', lineHeight: '20px' }}
                >
                  ×
                </span>
              </Space>
            </div>

            <Form
              form={form}
              layout="vertical"
              requiredMark
              initialValues={{ code: '', negotiation: '销', tonnage: null, status: '1' }}
            >
              <Form.Item
                label="编号"
                name="code"
                validateDebounce={400}
                rules={[
                  { required: true, message: '请输入编号' },
                  {
                    validator: async (_, value) => {
                      const code = String(value || '').trim();
                      if (!code) return;
                      if (await isCodeDuplicate(code, editing?.id)) {
                        throw new Error('编号已存在，不能重复添加');
                      }
                    },
                  },
                ]}
              >
                <Input placeholder="请输入编号" allowClear />
              </Form.Item>
              <Form.Item label="议价/销户" name="negotiation">
                <Select
                  placeholder="请选择"
                  allowClear
                  options={[
                    { value: '销', label: '销户' },
                    { value: '议', label: '议价' },
                  ]}
                />
              </Form.Item>
              <Form.Item label="吨位" name="tonnage" rules={[{ required: true, message: '请输入吨位' }]}>
                <InputNumber placeholder="请填写数值" style={{ width: '100%' }} min={0} precision={2} step={0.01} />
              </Form.Item>
              <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
                <Select placeholder="请选择状态" options={[...STATUS_OPTIONS]} />
              </Form.Item>

              <BizFormMetaFooter
                submitter={formMeta.submitter}
                submitTime={formMeta.submitTime}
                updateTime={formMeta.updateTime}
              />
            </Form>
          </div>

          {!isMobile && (
            <div style={{ width: 280, flexShrink: 0 }} key={`${metaRecordKey || 'new'}-${metaTick}`}>
              <BizRecordSidePanel bizKey={BIZ_KEY} recordKey={metaRecordKey} height={520} />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
