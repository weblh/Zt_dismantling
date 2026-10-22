import { useEffect, useMemo, useState } from 'react';
import DictSelect from '@/components/DictSelect';
import {
  Card,
  Table,
  Button,
  Space,
  Dropdown,
  message,
  Modal,
  Form,
  Select,
  DatePicker,
  InputNumber,
  Input,
  Image,
} from 'antd';
import {
  PlusOutlined,
  ImportOutlined,
  ExportOutlined,
  DeleteOutlined,
  MoreOutlined,
  DownOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd';
import BasicFuzzyFilter, { filterBasicRows } from '@/components/BasicFuzzyFilter';
import BizRecordSidePanel from '@/components/BizRecordSidePanel';
import BizFormMetaFooter, { bizRecordKey } from '@/components/BizFormMetaFooter';
import QrPhotoUpload from '@/components/QrPhotoUpload';
import BusinessJdySyncButtons from '@/components/BusinessJdySyncButtons';
import { makeEditColumn } from '@/components/TableEditColumn';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';
import { getJdyBusinessData, syncJdyDisassembly } from '@/api/jdy';
import { appendBizDataLog } from '@/api/bizRecordMeta';
import {
  addLocalBizRow,
  formatBizDateTime,
  getLocalBizRows,
  mergeLocalRemoteRows,
  upsertLocalBizRow,
} from '@/utils/localBizStore';
import { getStoredUser } from '@/config/apps';
import dayjs from 'dayjs';

const BIZ_KEY = 'disassembly';

interface DisassemblyItem {
  id: number;
  dataId?: string;
  entryCode: string;
  weighDate: string;
  netWeight: number | string;
  weighmaster: string;
  operation: string;
  bLevel: string;
  flatten: string;
  iron: number | string;
  aluminum: number | string;
  ternary: number | string;
  battery: number | string;
  tire: number | string;
  disassemblyDate: string;
  vehicleType: string;
  vehicleModel: string;
  photos: string[];
  disassembler: string;
  submitter: string;
  submitTime: string;
  updateTime?: string;
}

interface WeighingEntryOption {
  value: string;
  label: string;
  weighDate?: string;
  tonnage?: number;
  vehicleType?: string;
  vehicleModel?: string;
  operation?: string;
  bLevel?: string;
  flatten?: string;
  iron?: number | string;
  aluminum?: number | string;
  ternary?: number | string;
  battery?: number | string;
  tire?: number | string;
  supplier?: string;
  weighmaster?: string;
}

const FILTER_FIELDS = [
  { key: 'entryCode', label: '入场编号' },
  { key: 'weighDate', label: '过磅日期' },
  { key: 'netWeight', label: '净重' },
  { key: 'weighmaster', label: '司磅员' },
  { key: 'operation', label: '营运' },
  { key: 'bLevel', label: 'B级' },
  { key: 'flatten', label: '压扁' },
  { key: 'disassemblyDate', label: '拆解日期' },
  { key: 'vehicleType', label: '车辆类型' },
  { key: 'vehicleModel', label: '车辆型号' },
  { key: 'disassembler', label: '拆解人员' },
  { key: 'submitter', label: '提交人' },
];

const FIELD_LABELS: Record<string, string> = Object.fromEntries(
  FILTER_FIELDS.map(({ key, label }) => [key, label]),
);

function buildChangeSummary(before: DisassemblyItem | null, after: Record<string, unknown>) {
  if (!before) {
    return `创建拆解：${after.entryCode || ''}`.trim();
  }
  const parts: string[] = [];
  Object.keys(FIELD_LABELS).forEach((key) => {
    const prevStr = String((before as unknown as Record<string, unknown>)[key] ?? '');
    const nextStr = String(after[key] ?? '');
    if (prevStr !== nextStr) {
      parts.push(`${FIELD_LABELS[key]}：${prevStr || '空'} → ${nextStr || '空'}`);
    }
  });
  return parts.length ? parts.join('；') : '保存拆解（无字段变更）';
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

function renderNum(val: unknown) {
  if (val == null || val === '') return '';
  const n = Number(val);
  if (!Number.isFinite(n)) return String(val);
  return <span style={{ textAlign: 'right', display: 'block' }}>{n.toFixed(2)}</span>;
}

function renderYes(val: unknown) {
  const s = String(val || '');
  return s === '是' || s === '√' || s === '✓' ? '是' : s === '否' ? '否' : s;
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

function mapRow(row: Record<string, unknown>): DisassemblyItem {
  return {
    id: Number(row.id),
    dataId: row.dataId ? String(row.dataId) : undefined,
    entryCode: String(row.entryCode || ''),
    weighDate: String(row.weighDate || ''),
    netWeight: (row.netWeight as number | string) ?? '',
    weighmaster: String(row.weighmaster || ''),
    operation: String(row.operation || ''),
    bLevel: String(row.bLevel || ''),
    flatten: String(row.flatten || ''),
    iron: (row.iron as number | string) ?? '',
    aluminum: (row.aluminum as number | string) ?? '',
    ternary: (row.ternary as number | string) ?? '',
    battery: (row.battery as number | string) ?? '',
    tire: (row.tire as number | string) ?? '',
    disassemblyDate: String(row.disassemblyDate || ''),
    vehicleType: String(row.vehicleType || ''),
    vehicleModel: String(row.vehicleModel || ''),
    photos: normalizeImages(row.photos),
    disassembler: String(row.disassembler || ''),
    submitter: String(row.submitter || ''),
    submitTime: String(row.submitTime || ''),
    updateTime: String(row.updateTime || ''),
  };
}

function toWeighingOption(row: Record<string, unknown>): WeighingEntryOption | null {
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
    vehicleType: String(row.vehicleType || ''),
    vehicleModel: String(row.vehicleModel || ''),
    operation: String(row.operation || ''),
    bLevel: String(row.bLevel || ''),
    flatten: String(row.flatten || ''),
    iron: (row.iron as number | string) ?? '',
    aluminum: (row.aluminum as number | string) ?? '',
    ternary: (row.ternary as number | string) ?? '',
    battery: (row.battery as number | string) ?? '',
    tire: (row.tire as number | string) ?? '',
    supplier: String(row.supplier || ''),
    weighmaster: String(row.weighmaster || ''),
  };
}

export default function Disassembly() {
  const isMobile = useIsMobile();
  const [dataSource, setDataSource] = useState<DisassemblyItem[]>([]);
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
  const [editing, setEditing] = useState<DisassemblyItem | null>(null);
  const [metaTick, setMetaTick] = useState(0);
  const [form] = Form.useForm();
  const [photoFileList, setPhotoFileList] = useState<UploadFile[]>([]);
  const [entryOptionsLoading, setEntryOptionsLoading] = useState(false);
  const [weighingEntryOptions, setWeighingEntryOptions] = useState<WeighingEntryOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getJdyBusinessData('disassembly', {
          pageNo,
          pageSize,
          keyword: keyword || undefined,
        });
        if (cancelled) return;
        const remote = ((res.data?.records || []) as Record<string, unknown>[]).map(mapRow);
        const local = keyword
          ? []
          : getLocalBizRows<DisassemblyItem>('disassembly').map((r) =>
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
          message.error('拆解数据加载失败，请稍后重试');
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

  const loadWeighingEntryOptions = async () => {
    setEntryOptionsLoading(true);
    try {
      const map = new Map<string, WeighingEntryOption>();
      const push = (row: Record<string, unknown>) => {
        const opt = toWeighingOption(row);
        if (opt) map.set(opt.value, opt);
      };
      getLocalBizRows<Record<string, unknown>>('weighing-inspection').forEach(push);
      for (let page = 1; page <= 5; page += 1) {
        const res = await getJdyBusinessData('weighing-inspection', {
          pageNo: page,
          pageSize: 100,
        });
        const records = (res.data?.records || []) as Record<string, unknown>[];
        if (records.length === 0) break;
        records.forEach(push);
        if (page * 100 >= Number(res.data?.total || 0)) break;
      }
      setWeighingEntryOptions(Array.from(map.values()));
    } catch {
      message.warning('过磅查验编号加载失败，可稍后重试');
      setWeighingEntryOptions([]);
    } finally {
      setEntryOptionsLoading(false);
    }
  };

  const entrySelectOptions = useMemo(() => {
    const list = [...weighingEntryOptions];
    const current = editing?.entryCode?.trim();
    if (current && !list.some((o) => o.value === current)) {
      list.unshift({ value: current, label: current });
    }
    return list;
  }, [weighingEntryOptions, editing]);

  const handleEntryCodeChange = (code: string | undefined) => {
    if (!code) return;
    const hit = weighingEntryOptions.find((o) => o.value === code);
    if (!hit) return;
    form.setFieldsValue({
      entryCode: hit.value,
      weighDate: hit.weighDate ? dayjs(hit.weighDate) : undefined,
      netWeight: hit.tonnage,
      vehicleType: hit.vehicleType || undefined,
      vehicleModel: hit.vehicleModel || undefined,
      operation: hit.operation || undefined,
      bLevel: hit.bLevel || undefined,
      flatten: hit.flatten || undefined,
      iron: hit.iron,
      aluminum: hit.aluminum,
      ternary: hit.ternary,
      battery: hit.battery,
      tire: hit.tire,
      weighmaster: hit.weighmaster || form.getFieldValue('weighmaster') || '齐志江',
    });
  };

  const defaultDisassembler = () => {
    const user = getStoredUser();
    const name = (user.nickname || user.username || '').trim();
    return name ? [name] : [];
  };

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      disassemblyDate: dayjs(),
      weighmaster: '齐志江',
      disassembler: defaultDisassembler(),
    });
    setPhotoFileList([]);
    setAddModalOpen(true);
    void loadWeighingEntryOptions();
  };

  const handleEdit = (record: DisassemblyItem) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      weighDate: record.weighDate ? dayjs(record.weighDate) : undefined,
      disassemblyDate: record.disassemblyDate ? dayjs(record.disassemblyDate) : undefined,
      disassembler: record.disassembler
        ? String(record.disassembler).split(/[、,，]/).filter(Boolean)
        : [],
    });
    setPhotoFileList(urlsToFileList(record.photos));
    setAddModalOpen(true);
    void loadWeighingEntryOptions();
  };

  const columns: ColumnsType<DisassemblyItem> = [
    {
      title: <span style={{ whiteSpace: 'nowrap' }}>入场编号</span>,
      dataIndex: 'entryCode',
      width: 100,
      fixed: 'left',
      render: (val: string, record) => (
        <span
          style={{ color: '#1890ff', cursor: 'pointer' }}
          onClick={() => handleEdit(record)}
        >
          {val || '-'}
        </span>
      ),
    },
    {
      title: <span style={{ whiteSpace: 'nowrap' }}>过磅日期</span>,
      dataIndex: 'weighDate',
      width: 120,
      fixed: 'left',
    },
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
    {
      title: <span style={{ whiteSpace: 'nowrap' }}>营运</span>,
      dataIndex: 'operation',
      width: 70,
      render: renderYes,
    },
    {
      title: <span style={{ whiteSpace: 'nowrap' }}>B级</span>,
      dataIndex: 'bLevel',
      width: 70,
      render: renderYes,
    },
    {
      title: <span style={{ whiteSpace: 'nowrap' }}>压扁</span>,
      dataIndex: 'flatten',
      width: 70,
      render: renderYes,
    },
    { title: <span style={{ whiteSpace: 'nowrap' }}>铁</span>, dataIndex: 'iron', width: 80, render: renderNum },
    { title: <span style={{ whiteSpace: 'nowrap' }}>铝</span>, dataIndex: 'aluminum', width: 80, render: renderNum },
    { title: <span style={{ whiteSpace: 'nowrap' }}>三元</span>, dataIndex: 'ternary', width: 80, render: renderNum },
    { title: <span style={{ whiteSpace: 'nowrap' }}>电瓶</span>, dataIndex: 'battery', width: 80, render: renderNum },
    { title: <span style={{ whiteSpace: 'nowrap' }}>轮胎</span>, dataIndex: 'tire', width: 80, render: renderNum },
    { title: <span style={{ whiteSpace: 'nowrap' }}>拆解日期</span>, dataIndex: 'disassemblyDate', width: 120 },
    { title: <span style={{ whiteSpace: 'nowrap' }}>车辆类型</span>, dataIndex: 'vehicleType', width: 110 },
    { title: <span style={{ whiteSpace: 'nowrap' }}>车辆型号</span>, dataIndex: 'vehicleModel', width: 100 },
    {
      title: <span style={{ whiteSpace: 'nowrap' }}>照片</span>,
      dataIndex: 'photos',
      width: 120,
      render: (photos: string[]) => <PhotoThumbnails photos={photos} />,
    },
    { title: <span style={{ whiteSpace: 'nowrap' }}>拆解人员</span>, dataIndex: 'disassembler', width: 100 },
    {
      title: <span style={{ whiteSpace: 'nowrap' }}>提交人</span>,
      dataIndex: 'submitter',
      width: 100,
      render: (val: string) => <span style={{ color: '#1890ff' }}>{val || '-'}</span>,
    },
    { title: <span style={{ whiteSpace: 'nowrap' }}>提交时间</span>, dataIndex: 'submitTime', width: 170 },
    makeEditColumn<DisassemblyItem>(handleEdit),
  ];

  const handleAddSubmit = async () => {
    try {
      const values = await form.validateFields();
      const user = getStoredUser();
      const now = formatBizDateTime();
      const operator = user.nickname || user.username || '系统';
      const payload = {
        ...values,
        entryCode: values.entryCode || editing?.entryCode || `CJ${Date.now()}`,
        weighDate: values.weighDate?.format?.('YYYY-MM-DD') || values.weighDate || '',
        disassemblyDate:
          values.disassemblyDate?.format?.('YYYY-MM-DD') || values.disassemblyDate || '',
        disassembler: Array.isArray(values.disassembler)
          ? values.disassembler.join('、')
          : values.disassembler,
        photos: photoFileList.map((f) => f.url || f.thumbUrl || '').filter(Boolean),
        submitter: editing?.submitter || operator,
        submitTime: editing?.submitTime || now,
        updateTime: now,
      };
      const summary = buildChangeSummary(editing, payload);
      let saved: DisassemblyItem;
      if (editing) {
        saved = upsertLocalBizRow<DisassemblyItem>('disassembly', {
          ...payload,
          id: editing.id,
          dataId: editing.dataId,
        });
        message.success('修改成功');
      } else {
        saved = addLocalBizRow<DisassemblyItem>('disassembly', payload);
        message.success('拆解完成，已写入列表');
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
      setPhotoFileList([]);
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
              syncFn={syncJdyDisassembly}
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
            {!isMobile && (
              <Dropdown menu={{ items: moreMenuItems }}>
                <Button>
                  <MoreOutlined />
                </Button>
              </Dropdown>
            )}
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
            scroll={{ x: 2800 }}
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
        onCancel={() => {
          setEditing(null);
          setAddModalOpen(false);
        }}
        footer={null}
        width={isMobile ? '100%' : 1180}
        title={null}
        closable={false}
        centered
        styles={{ body: { padding: 0, maxHeight: '85vh', overflowY: 'auto' } }}
        destroyOnClose
      >
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          <div style={{ flex: 1, minWidth: 0, padding: isMobile ? '16px 16px 0' : '16px 28px 0' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>
                {editing ? '编辑拆解' : '拆解'}
              </span>
              <span
                onClick={() => {
                  setEditing(null);
                  setAddModalOpen(false);
                }}
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
                disassembler: defaultDisassembler(),
                photos: [],
                weighmaster: '齐志江',
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
                  extra="来自过磅查验，选择后自动带入相关字段"
                >
                  <Select
                    placeholder="请选择过磅查验编号"
                    showSearch
                    allowClear
                    loading={entryOptionsLoading}
                    optionFilterProp="label"
                    suffixIcon={<DownOutlined style={{ fontSize: 10 }} />}
                    options={entrySelectOptions}
                    onChange={handleEntryCodeChange}
                    notFoundContent={
                      entryOptionsLoading ? '加载中…' : '暂无过磅查验编号'
                    }
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

                <Form.Item label={<span style={{ fontWeight: 500 }}>司磅员</span>} name="weighmaster">
                  <DictSelect dict="staff" placeholder="请选择司磅员（基础资料）" />
                </Form.Item>

                <Form.Item label={<span style={{ fontWeight: 500 }}>营运</span>} name="operation">
                  <Input placeholder="" />
                </Form.Item>

                <Form.Item label={<span style={{ fontWeight: 500 }}>B级</span>} name="bLevel">
                  <Input placeholder="" />
                </Form.Item>

                <Form.Item label={<span style={{ fontWeight: 500 }}>压扁</span>} name="flatten">
                  <Input placeholder="" />
                </Form.Item>

                <Form.Item label={<span style={{ fontWeight: 500 }}>铁</span>} name="iron">
                  <Input placeholder="" />
                </Form.Item>

                <Form.Item label={<span style={{ fontWeight: 500 }}>铝</span>} name="aluminum">
                  <Input placeholder="" />
                </Form.Item>

                <Form.Item label={<span style={{ fontWeight: 500 }}>三元</span>} name="ternary">
                  <Input placeholder="" />
                </Form.Item>

                <Form.Item label={<span style={{ fontWeight: 500 }}>电瓶</span>} name="battery">
                  <Input placeholder="" />
                </Form.Item>

                <Form.Item label={<span style={{ fontWeight: 500 }}>轮胎</span>} name="tire">
                  <Input placeholder="" />
                </Form.Item>

                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>拆解日期</span>}
                  name="disassemblyDate"
                >
                  <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
                </Form.Item>

                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>车辆类型</span>}
                  name="vehicleType"
                >
                  <Input placeholder="" />
                </Form.Item>

                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>车辆型号</span>}
                  name="vehicleModel"
                >
                  <Input placeholder="" />
                </Form.Item>
              </div>

              <Form.Item label={<span style={{ fontWeight: 500 }}>照片</span>}>
                <QrPhotoUpload
                  fileList={photoFileList}
                  onFiles={setPhotoFileList}
                  label="拍照上传"
                  active={addModalOpen}
                  title="拆解照片上传"
                  bizKey="disassembly"
                />
              </Form.Item>

              <Form.Item label={<span style={{ fontWeight: 500 }}>拆解人员</span>} name="disassembler">
                <DictSelect dict="staff" mode="multiple" placeholder="请选择拆解人员（基础资料）" />
              </Form.Item>

              <BizFormMetaFooter
                submitter={formMeta.submitter}
                submitTime={formMeta.submitTime}
                updateTime={formMeta.updateTime}
              />

              <Form.Item style={{ marginBottom: 16, marginTop: 16 }}>
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
                  拆解完成
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
