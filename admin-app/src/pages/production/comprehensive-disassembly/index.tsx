import { useEffect, useMemo, useState } from 'react';
import DictSelect from '@/components/DictSelect';
import {
  Card,
  Table,
  Input,
  Button,
  Space,
  Dropdown,
  message,
  Modal,
  Form,
  Select,
  DatePicker,
  InputNumber,
  Image,
} from 'antd';
import type { UploadFile } from 'antd';
import {
  PlusOutlined,
  ImportOutlined,
  ExportOutlined,
  DeleteOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import BusinessJdySyncButtons from '@/components/BusinessJdySyncButtons';
import { makeEditColumn } from '@/components/TableEditColumn';
import BasicFuzzyFilter, { filterBasicRows } from '@/components/BasicFuzzyFilter';
import BizRecordSidePanel from '@/components/BizRecordSidePanel';
import BizFormMetaFooter, { bizRecordKey } from '@/components/BizFormMetaFooter';
import QrPhotoUpload from '@/components/QrPhotoUpload';
import { appendBizDataLog } from '@/api/bizRecordMeta';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';
import { getJdyBusinessData, syncJdyComprehensiveDisassembly } from '@/api/jdy';
import {
  addLocalBizRow,
  formatBizDateTime,
  getLocalBizRows,
  mergeLocalRemoteRows,
  upsertLocalBizRow,
} from '@/utils/localBizStore';
import { getStoredUser } from '@/config/apps';
import dayjs from 'dayjs';

const BIZ_KEY = 'comprehensive-disassembly';

interface ComprehensiveDisassemblyItem {
  id: number;
  dataId?: string;
  entryCode: string;
  weighDate: string;
  netWeight: number | string;
  weighmaster: string;
  disassemblyDate: string;
  disassembler: string;
  vehicleModel: string;
  photos: string[];
  shreddedMaterial?: number | string;
  scrapSteel?: number | string;
  chassisMaterial?: number | string;
  copperWire?: number | string;
  aluminumParts?: number | string;
  plastic?: number | string;
  smallParts?: number | string;
  rubber?: number | string;
  other?: number | string;
  price: number | string;
  submitter: string;
  submitTime: string;
  updateTime?: string;
}

/** 过磅查验入场编号选项 */
interface WeighEntryOption {
  value: string;
  label: string;
  weighDate?: string;
  tonnage?: number;
  vehicleModel?: string;
  weighmaster?: string;
}

const FILTER_FIELDS = [
  { key: 'entryCode', label: '入场编号' },
  { key: 'weighDate', label: '过磅日期' },
  { key: 'netWeight', label: '净重' },
  { key: 'weighmaster', label: '司磅员' },
  { key: 'disassemblyDate', label: '综合拆解日期' },
  { key: 'disassembler', label: '综合拆解人员' },
  { key: 'vehicleModel', label: '车辆型号' },
  { key: 'price', label: '价格' },
  { key: 'submitter', label: '提交人' },
  { key: 'submitTime', label: '提交时间' },
];

const FIELD_LABELS: Record<string, string> = Object.fromEntries(
  FILTER_FIELDS.map(({ key, label }) => [key, label]),
);

function buildChangeSummary(
  before: ComprehensiveDisassemblyItem | null,
  after: Record<string, unknown>,
) {
  if (!before) {
    return `创建综合拆解：${after.entryCode || ''}`.trim();
  }
  const changes: string[] = [];
  const keys = [
    'entryCode',
    'weighDate',
    'netWeight',
    'weighmaster',
    'disassemblyDate',
    'disassembler',
    'vehicleModel',
    'price',
  ] as const;
  keys.forEach((key) => {
    const prev = String(before[key] ?? '');
    const next = String(after[key] ?? '');
    if (prev !== next) {
      changes.push(`${FIELD_LABELS[key] || key}: ${prev || '-'} → ${next || '-'}`);
    }
  });
  return changes.length ? changes.join('；') : '更新综合拆解';
}

function normalizeImages(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const obj = item as Record<string, unknown>;
          return String(obj.url || obj.previewUrl || '');
        }
        return '';
      })
      .filter(Boolean);
  }
  return [];
}

function urlsToFileList(urls: string[] = []): UploadFile[] {
  return urls.filter(Boolean).map((url, i) => ({
    uid: `${i}-${url}`,
    name: `img-${i}`,
    status: 'done' as const,
    url,
  }));
}

function fileListToUrls(list: UploadFile[]): string[] {
  return list.map((f) => f.url || f.thumbUrl || '').filter(Boolean);
}

function renderNum(val: unknown) {
  if (val == null || val === '') return '';
  const n = Number(val);
  if (!Number.isFinite(n)) return String(val);
  return <span style={{ textAlign: 'right', display: 'block' }}>{n.toFixed(2)}</span>;
}

const PhotoThumbnails = ({ photos }: { photos?: string[] | null }) => {
  const list = (photos || []).filter(Boolean);
  if (!list.length) return <span style={{ color: '#999' }}>-</span>;
  return (
    <Image.PreviewGroup items={list}>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {list.slice(0, 3).map((url, index) => (
          <Image
            key={`${url}-${index}`}
            src={url}
            width={28}
            height={28}
            style={{ objectFit: 'cover', borderRadius: 4 }}
          />
        ))}
        {list.length > 3 && <span style={{ color: '#666', fontSize: 12 }}>+{list.length - 3}</span>}
      </div>
    </Image.PreviewGroup>
  );
};

const baseColumns: ColumnsType<ComprehensiveDisassemblyItem> = [
  { title: <span style={{ whiteSpace: 'nowrap' }}>入场编号</span>, dataIndex: 'entryCode', width: 100, fixed: 'left' },
  { title: <span style={{ whiteSpace: 'nowrap' }}>过磅日期</span>, dataIndex: 'weighDate', width: 120 },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>净重</span>,
    dataIndex: 'netWeight',
    width: 90,
    render: renderNum,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>司磅员</span>,
    dataIndex: 'weighmaster',
    width: 100,
    render: (val: string) => <span style={{ color: '#1890ff' }}>{val || '-'}</span>,
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>综合拆解日期</span>, dataIndex: 'disassemblyDate', width: 120 },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>综合拆解人员</span>,
    dataIndex: 'disassembler',
    width: 110,
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车辆型号</span>, dataIndex: 'vehicleModel', width: 110 },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>车辆照片</span>,
    dataIndex: 'photos',
    width: 120,
    render: (photos: string[]) => <PhotoThumbnails photos={photos} />,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>价格</span>,
    dataIndex: 'price',
    width: 110,
    render: (val: number | string) => {
      const n = Number(val);
      if (!val || !Number.isFinite(n) || n === 0) {
        return <span style={{ color: '#ccc', textAlign: 'right', display: 'block' }}>—</span>;
      }
      return (
        <span style={{ color: '#f5222d', fontWeight: 500, textAlign: 'right', display: 'block' }}>
          {n.toLocaleString()}
        </span>
      );
    },
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>提交人</span>,
    dataIndex: 'submitter',
    width: 100,
    render: (val: string) => <span style={{ color: '#1890ff' }}>{val || '-'}</span>,
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>提交时间</span>, dataIndex: 'submitTime', width: 170 },
];

function mapRow(row: Record<string, unknown>): ComprehensiveDisassemblyItem {
  return {
    id: Number(row.id),
    dataId: row.dataId ? String(row.dataId) : undefined,
    entryCode: String(row.entryCode || ''),
    weighDate: String(row.weighDate || ''),
    netWeight: (row.netWeight as number | string) ?? '',
    weighmaster: String(row.weighmaster || ''),
    disassemblyDate: String(row.disassemblyDate || ''),
    disassembler: String(row.disassembler || ''),
    vehicleModel: String(row.vehicleModel || ''),
    photos: normalizeImages(row.photos),
    shreddedMaterial: (row.shreddedMaterial as number | string) ?? '',
    scrapSteel: (row.scrapSteel as number | string) ?? '',
    chassisMaterial: (row.chassisMaterial as number | string) ?? '',
    copperWire: (row.copperWire as number | string) ?? '',
    aluminumParts: (row.aluminumParts as number | string) ?? '',
    plastic: (row.plastic as number | string) ?? '',
    smallParts: (row.smallParts as number | string) ?? '',
    rubber: (row.rubber as number | string) ?? '',
    other: (row.other as number | string) ?? '',
    price: (row.price as number | string) ?? '',
    submitter: String(row.submitter || ''),
    submitTime: String(row.submitTime || ''),
    updateTime: String(row.updateTime || ''),
  };
}

function toWeighEntryOption(row: Record<string, unknown>): WeighEntryOption | null {
  const code = String(row.code || row.entryCode || '').trim();
  if (!code) return null;
  const tonnageRaw = row.tonnage ?? row.netWeight;
  const tonnage =
    tonnageRaw == null || tonnageRaw === '' ? undefined : Number(tonnageRaw);
  return {
    value: code,
    label: code,
    weighDate: String(row.weighDate || ''),
    tonnage: Number.isFinite(tonnage as number) ? (tonnage as number) : undefined,
    vehicleModel: String(row.vehicleModel || ''),
    weighmaster: String(row.weighmaster || ''),
  };
}

export default function ComprehensiveDisassembly() {
  const isMobile = useIsMobile();
  const [dataSource, setDataSource] = useState<ComprehensiveDisassemblyItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editing, setEditing] = useState<ComprehensiveDisassemblyItem | null>(null);
  const [metaTick, setMetaTick] = useState(0);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [weighEntryOptions, setWeighEntryOptions] = useState<WeighEntryOption[]>([]);
  const [linkOptionsLoading, setLinkOptionsLoading] = useState(false);

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
        const remote = ((res.data?.records || []) as Record<string, unknown>[]).map(mapRow);
        const local = keyword
          ? []
          : getLocalBizRows<ComprehensiveDisassemblyItem>(BIZ_KEY).map((r) =>
              mapRow(r as unknown as Record<string, unknown>),
            );
        const merged =
          pageNo === 1
            ? mergeLocalRemoteRows(local, remote)
            : remote.map((r) => local.find((l) => l.id === r.id) || r);
        setDataSource(merged);
        setTotal(
          (res.data?.total || 0) +
            (keyword ? 0 : local.filter((l) => !remote.some((r) => r.id === l.id)).length),
        );
      } catch {
        if (!cancelled) {
          message.error('综合拆解数据加载失败，请稍后重试');
          setDataSource([]);
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
    () => filterBasicRows(dataSource, searchValue, selectedFields),
    [dataSource, searchValue, selectedFields],
  );

  const loadWeighEntryOptions = async () => {
    setLinkOptionsLoading(true);
    try {
      const map = new Map<string, WeighEntryOption>();
      const push = (row: Record<string, unknown>) => {
        const opt = toWeighEntryOption(row);
        if (opt) map.set(opt.value, opt);
      };
      getLocalBizRows<Record<string, unknown>>('weighing-inspection').forEach(push);
      const res = await getJdyBusinessData('weighing-inspection', { pageNo: 1, pageSize: 500 });
      ((res.data?.records || []) as Record<string, unknown>[]).forEach(push);
      setWeighEntryOptions(Array.from(map.values()));
    } catch {
      message.warning('入场编号加载失败，可手动填写或稍后重试');
      setWeighEntryOptions([]);
    } finally {
      setLinkOptionsLoading(false);
    }
  };

  const entryCodeSelectOptions = useMemo(() => {
    const list = [...weighEntryOptions];
    const current = editing?.entryCode?.trim();
    if (current && !list.some((o) => o.value === current)) {
      list.unshift({
        value: current,
        label: current,
        weighDate: editing?.weighDate,
        tonnage:
          editing?.netWeight != null && editing.netWeight !== ''
            ? Number(editing.netWeight)
            : undefined,
        vehicleModel: editing?.vehicleModel,
        weighmaster: editing?.weighmaster,
      });
    }
    return list;
  }, [weighEntryOptions, editing]);

  const defaultDisassembler = () => {
    const user = getStoredUser();
    return (user.nickname || user.username || '').trim();
  };

  const handleEntryCodeChange = (code: string | undefined) => {
    if (!code) return;
    const hit = entryCodeSelectOptions.find((o) => o.value === code);
    if (!hit) return;
    form.setFieldsValue({
      weighDate: hit.weighDate ? dayjs(hit.weighDate) : undefined,
      netWeight: hit.tonnage,
      vehicleModel: hit.vehicleModel || undefined,
      weighmaster: hit.weighmaster || form.getFieldValue('weighmaster') || '齐志江',
    });
  };

  const closeModal = () => {
    setEditing(null);
    setAddModalOpen(false);
    setFileList([]);
  };

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      disassemblyDate: dayjs(),
      weighmaster: '齐志江',
      disassembler: defaultDisassembler(),
    });
    setFileList([]);
    setAddModalOpen(true);
    void loadWeighEntryOptions();
  };

  const handleEdit = (record: ComprehensiveDisassemblyItem) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      weighDate: record.weighDate ? dayjs(record.weighDate) : undefined,
      disassemblyDate: record.disassemblyDate ? dayjs(record.disassemblyDate) : undefined,
    });
    setFileList(urlsToFileList(record.photos));
    setAddModalOpen(true);
    void loadWeighEntryOptions();
  };

  const columns: ColumnsType<ComprehensiveDisassemblyItem> = [
    ...baseColumns.map((col) => {
      if ('dataIndex' in col && col.dataIndex === 'entryCode') {
        return {
          ...col,
          render: (val: string, record: ComprehensiveDisassemblyItem) => (
            <span
              style={{ color: '#1890ff', cursor: 'pointer' }}
              onClick={() => handleEdit(record)}
            >
              {val}
            </span>
          ),
        };
      }
      return col;
    }),
    makeEditColumn<ComprehensiveDisassemblyItem>(handleEdit),
  ];

  const handleAddSubmit = async () => {
    try {
      const values = await form.validateFields();
      const user = getStoredUser();
      const now = formatBizDateTime();
      const operator = user.nickname || user.username || '系统';
      const payload = {
        ...values,
        entryCode: values.entryCode || editing?.entryCode || `ZH${Date.now()}`,
        weighDate: values.weighDate?.format?.('YYYY-MM-DD') || values.weighDate || '',
        disassemblyDate:
          values.disassemblyDate?.format?.('YYYY-MM-DD') || values.disassemblyDate || '',
        photos: fileListToUrls(fileList),
        submitter: editing?.submitter || operator,
        submitTime: editing?.submitTime || now,
        updateTime: now,
      };
      const summary = buildChangeSummary(editing, payload);
      let saved: ComprehensiveDisassemblyItem;
      if (editing) {
        saved = upsertLocalBizRow<ComprehensiveDisassemblyItem>(BIZ_KEY, {
          ...payload,
          id: editing.id,
          dataId: editing.dataId,
        });
        message.success('修改成功');
      } else {
        saved = addLocalBizRow<ComprehensiveDisassemblyItem>(BIZ_KEY, payload);
        message.success('综合拆解完成，已写入列表');
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
      setEditing(null);
      setAddModalOpen(false);
      setFileList([]);
      setPageNo(1);
      setReloadKey((k) => k + 1);
    } catch {
      message.error('请填写完整信息');
    }
  };

  const handleDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的数据');
      return;
    }
    message.info('简道云同步数据请在简道云中删除');
  };

  const moreMenuItems = [
    { key: 'batchUpdate', label: '批量更新' },
    { key: 'batchDelete', label: '批量删除' },
    { key: 'exportAll', label: '导出全部' },
  ];

  const metaRecordKey = bizRecordKey(editing);
  const formMeta = {
    submitter: editing?.submitter || getStoredUser().nickname || getStoredUser().username || '-',
    submitTime: editing?.submitTime || '-',
    updateTime: editing?.updateTime || '-',
  };

  return (
    <div className="page-container">
      <Card styles={{ body: { padding: 0 } }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            padding: '8px 16px',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加
            </Button>
            <BusinessJdySyncButtons
              syncFn={syncJdyComprehensiveDisassembly}
              onSynced={() => {
                setPageNo(1);
                setReloadKey((k) => k + 1);
              }}
            />
            <Button icon={<ImportOutlined />} onClick={() => message.info('导入功能开发中')}>
              导入
            </Button>
            <Button icon={<ExportOutlined />} onClick={() => message.success('导出成功')}>
              导出
            </Button>
            <Button icon={<DeleteOutlined />} onClick={handleDelete}>
              删除
            </Button>
            <Dropdown menu={{ items: moreMenuItems }}>
              <Button>
                <MoreOutlined />
              </Button>
            </Dropdown>
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

        <div style={{ background: '#fff', padding: '0 16px' }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={displayData}
            loading={loading}
            scroll={{ x: 1600 }}
            rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
            pagination={withMobilePagination(isMobile, {
              current: pageNo,
              pageSize,
              total,
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (page, size) => {
                setPageNo(page);
                setPageSize(size);
              },
            })}
          />
        </div>
      </Card>

      <Modal
        open={addModalOpen}
        onCancel={closeModal}
        footer={null}
        width={isMobile ? '100%' : 1200}
        title={null}
        closable={false}
        styles={{ body: { padding: 0, maxHeight: '85vh', overflowY: 'auto' } }}
      >
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          <div style={{ flex: 1, minWidth: 0, padding: isMobile ? '16px 16px 0' : '16px 28px 0' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 500 }}>
                {editing ? '编辑综合拆解' : '综合拆解'}
              </span>
              <span
                onClick={closeModal}
                style={{ fontSize: 18, cursor: 'pointer', color: '#999', lineHeight: '20px' }}
              >
                ×
              </span>
            </div>

            <Form
              form={form}
              layout="vertical"
              requiredMark
              initialValues={{
                weighmaster: '齐志江',
                disassembler: defaultDisassembler(),
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
                  gap: '0 16px',
                }}
              >
                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>入场编号</span>}
                  name="entryCode"
                  rules={[{ required: true, message: '请选择入场编号' }]}
                >
                  <Select
                    placeholder="请选择过磅查验编号"
                    showSearch
                    allowClear
                    loading={linkOptionsLoading}
                    optionFilterProp="label"
                    options={entryCodeSelectOptions}
                    onChange={handleEntryCodeChange}
                    notFoundContent={linkOptionsLoading ? '加载中…' : '暂无过磅查验编号'}
                  />
                </Form.Item>

                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>过磅日期</span>}
                  name="weighDate"
                  rules={[{ required: true, message: '请选择过磅日期' }]}
                >
                  <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
                </Form.Item>

                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>净重</span>}
                  name="netWeight"
                  rules={[{ required: true, message: '请填写净重' }]}
                >
                  <InputNumber
                    placeholder="请填写数值"
                    style={{ width: '100%' }}
                    min={0}
                    precision={2}
                    step={0.01}
                  />
                </Form.Item>

                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>司磅员</span>}
                  name="weighmaster"
                  rules={[{ required: true, message: '请选择司磅员' }]}
                >
                  <DictSelect dict="staff" placeholder="请选择司磅员（基础资料）" />
                </Form.Item>

                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>综合拆解日期</span>}
                  name="disassemblyDate"
                >
                  <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
                </Form.Item>

                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>综合拆解人员</span>}
                  name="disassembler"
                >
                  <DictSelect dict="staff" placeholder="请选择拆解人员（基础资料）" />
                </Form.Item>

                <Form.Item label={<span style={{ fontWeight: 500 }}>车辆型号</span>} name="vehicleModel">
                  <Input placeholder="请选择" />
                </Form.Item>

                <Form.Item label={<span style={{ fontWeight: 500 }}>车辆照片</span>}>
                  <QrPhotoUpload
                    fileList={fileList}
                    onFiles={setFileList}
                    label="拍照/选图/扫码上传"
                    active={addModalOpen}
                    title="综合拆解照片上传"
                    bizKey="comprehensive-disassembly"
                  />
                </Form.Item>
              </div>

              <Form.Item label={<span style={{ fontWeight: 500 }}>价格</span>} name="price">
                <InputNumber
                  placeholder="请填写数值"
                  style={{ width: '100%' }}
                  min={0}
                  precision={0}
                  step={100}
                />
              </Form.Item>

              <BizFormMetaFooter
                submitter={formMeta.submitter}
                submitTime={formMeta.submitTime}
                updateTime={formMeta.updateTime}
              />

              <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
                <Button
                  type="primary"
                  size="large"
                  onClick={handleAddSubmit}
                  style={{
                    background: '#52c41a',
                    borderColor: '#52c41a',
                    color: '#fff',
                    width: 160,
                    height: 48,
                    fontSize: 16,
                    borderRadius: 8,
                  }}
                >
                  综合拆解完成
                </Button>
              </Form.Item>
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
