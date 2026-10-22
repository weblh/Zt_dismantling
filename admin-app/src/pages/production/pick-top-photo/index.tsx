import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  message,
  Modal,
  Form,
  Select,
  Upload,
  Image,
  Input,
} from 'antd';
import {
  PlusOutlined,
  ImportOutlined,
  ExportOutlined,
  DeleteOutlined,
  PictureOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile, UploadProps } from 'antd';
import CameraUpload from '@/components/CameraUpload';
import QrPhotoUpload from '@/components/QrPhotoUpload';
import BasicFuzzyFilter, { filterBasicRows } from '@/components/BasicFuzzyFilter';
import BizRecordSidePanel from '@/components/BizRecordSidePanel';
import BizFormMetaFooter, { bizRecordKey } from '@/components/BizFormMetaFooter';
import BusinessJdySyncButtons from '@/components/BusinessJdySyncButtons';
import { makeEditColumn } from '@/components/TableEditColumn';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';
import { getJdyBusinessData, syncJdyPickTopPhoto } from '@/api/jdy';
import { appendBizDataLog } from '@/api/bizRecordMeta';
import {
  addLocalBizRow,
  formatBizDateTime,
  getLocalBizRows,
  mergeLocalRemoteRows,
  upsertLocalBizRow,
} from '@/utils/localBizStore';
import { getStoredUser } from '@/config/apps';

const BIZ_KEY = 'pick-top-photo';

interface PickTopPhotoItem {
  id: number;
  dataId?: string;
  entryCode: string;
  pickTopPhotos: string[];
  inspectionPhotos: string[];
  submitter: string;
  submitTime: string;
  updateTime?: string;
}

interface ScrappedEntryOption {
  value: string;
  label: string;
  submitter?: string;
  submitTime?: string;
  updateTime?: string;
  weighDate?: string;
  vehicleModel?: string;
  supplier?: string;
  images?: string[];
}

/** 已入库可选行（选择数据弹窗） */
interface PendingPickRow {
  key: string;
  entryCode: string;
  images: string[];
  weighDate: string;
  vehicleModel: string;
  supplier: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const FILTER_FIELDS = [
  { key: 'entryCode', label: '入场编号' },
  { key: 'submitter', label: '提交人' },
  { key: 'submitTime', label: '提交时间' },
];

const FIELD_LABELS: Record<string, string> = Object.fromEntries(
  FILTER_FIELDS.map(({ key, label }) => [key, label]),
);

function buildChangeSummary(before: PickTopPhotoItem | null, after: Record<string, unknown>) {
  if (!before) {
    return `创建挑顶照片：${after.entryCode || ''}`.trim();
  }
  const parts: string[] = [];
  Object.keys(FIELD_LABELS).forEach((key) => {
    const prevStr = String((before as unknown as Record<string, unknown>)[key] ?? '');
    const nextStr = String(after[key] ?? '');
    if (prevStr !== nextStr) {
      parts.push(`${FIELD_LABELS[key]}：${prevStr || '空'} → ${nextStr || '空'}`);
    }
  });
  const prevPick = (before.pickTopPhotos || []).length;
  const nextPick = Array.isArray(after.pickTopPhotos) ? after.pickTopPhotos.length : 0;
  if (prevPick !== nextPick) {
    parts.push(`挑顶照片：${prevPick}张 → ${nextPick}张`);
  }
  return parts.length ? parts.join('；') : '保存挑顶照片（无字段变更）';
}

const PhotoThumbnails = ({ photos }: { photos?: string[] | null }) => (
  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
    {(photos || []).map((url, index) => (
      <div
        key={index}
        style={{
          width: 36,
          height: 36,
          borderRadius: 4,
          overflow: 'hidden',
          background: '#f0f0f0',
        }}
      >
        {url ? (
          <Image src={url} width={36} height={36} style={{ objectFit: 'cover' }} />
        ) : (
          <PictureOutlined style={{ color: '#999', fontSize: 14, margin: 11 }} />
        )}
      </div>
    ))}
  </div>
);

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

export default function PickTopPhoto() {
  const isMobile = useIsMobile();
  const [dataSource, setDataSource] = useState<PickTopPhotoItem[]>([]);
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
  const [editing, setEditing] = useState<PickTopPhotoItem | null>(null);
  const [metaTick, setMetaTick] = useState(0);
  const [form] = Form.useForm();
  const [pickTopFileList, setPickTopFileList] = useState<UploadFile[]>([]);
  const [inspectionFileList, setInspectionFileList] = useState<UploadFile[]>([]);
  /** 选择数据带出的查验照片 URL（提交时必带，避免被 Upload 回写清空） */
  const [broughtInspectionUrls, setBroughtInspectionUrls] = useState<string[]>([]);
  const [entryOptionsLoading, setEntryOptionsLoading] = useState(false);
  const [scrappedEntryOptions, setScrappedEntryOptions] = useState<ScrappedEntryOption[]>([]);
  const [selectedScrapped, setSelectedScrapped] = useState<ScrappedEntryOption | null>(null);
  const [selectDataOpen, setSelectDataOpen] = useState(false);
  const [selectDataLoading, setSelectDataLoading] = useState(false);
  const [pendingPickRows, setPendingPickRows] = useState<PendingPickRow[]>([]);
  const [selectDataKeyword, setSelectDataKeyword] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getJdyBusinessData('pick-top-photo', {
          pageNo,
          pageSize,
          keyword: keyword || undefined,
        });
        if (cancelled) return;
        const remote = ((res.data?.records || []) as Record<string, unknown>[]).map((row) => ({
          id: Number(row.id),
          dataId: row.dataId ? String(row.dataId) : undefined,
          entryCode: String(row.entryCode || ''),
          pickTopPhotos: normalizeImages(row.pickTopPhotos),
          inspectionPhotos: normalizeImages(row.inspectionPhotos),
          submitter: String(row.submitter || ''),
          submitTime: String(row.submitTime || ''),
          updateTime: String(row.updateTime || ''),
        }));
        const local = keyword
          ? []
          : getLocalBizRows<PickTopPhotoItem>('pick-top-photo').map((row) => ({
              ...row,
              pickTopPhotos: normalizeImages(row.pickTopPhotos),
              inspectionPhotos: normalizeImages(row.inspectionPhotos),
            }));
        let merged =
          pageNo === 1
            ? mergeLocalRemoteRows(local, remote)
            : remote.map((r) => local.find((l) => l.id === r.id) || r);

        // 列表回填：挑顶单若缺查验照片，按入场编号从查验照片带出
        const needFillCodes = merged
          .filter((r) => !(r.inspectionPhotos || []).length && r.entryCode)
          .map((r) => String(r.entryCode).trim());
        if (needFillCodes.length) {
          const needSet = new Set(needFillCodes);
          const inspMap = new Map<string, string[]>();
          const pushInsp = (row: Record<string, unknown>) => {
            const code = String(row.entryCode || '').trim();
            if (!code || !needSet.has(code)) return;
            const imgs = normalizeImages(row.images);
            if (!imgs.length) return;
            inspMap.set(code, [...(inspMap.get(code) || []), ...imgs].slice(0, 8));
          };
          getLocalBizRows<Record<string, unknown>>('inspection-photo').forEach(pushInsp);
          try {
            for (let page = 1; page <= 5; page += 1) {
              const inspRes = await getJdyBusinessData('inspection-photo', {
                pageNo: page,
                pageSize: 100,
              });
              const records = (inspRes.data?.records || []) as Record<string, unknown>[];
              if (!records.length) break;
              records.forEach(pushInsp);
              // 当前页缺图的编号都已命中则可提前结束
              if (needFillCodes.every((c) => inspMap.has(c))) break;
              if (page * 100 >= Number(inspRes.data?.total || 0)) break;
            }
          } catch {
            // ignore
          }
          merged = merged.map((r) => {
            if ((r.inspectionPhotos || []).length || !r.entryCode) return r;
            const imgs = inspMap.get(String(r.entryCode).trim());
            if (!imgs?.length) return r;
            const next = { ...r, inspectionPhotos: imgs };
            // 同步写回本地，避免刷新后又空
            try {
              upsertLocalBizRow<PickTopPhotoItem>('pick-top-photo', next);
            } catch {
              // ignore
            }
            return next;
          });
        }

        if (cancelled) return;
        setDataSource(merged);
        setTotal(
          (res.data?.total || 0) +
            (keyword ? 0 : local.filter((l) => !remote.some((r) => r.id === l.id)).length),
        );
      } catch {
        if (!cancelled) {
          message.error('挑顶照片加载失败，请稍后重试');
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

  /** 已挑顶入场编号集合（编辑中当前编号除外，仍可选） */
  const collectPickedEntryCodes = async (keepCode?: string) => {
    const picked = new Set<string>();
    getLocalBizRows<PickTopPhotoItem>('pick-top-photo').forEach((row) => {
      const code = String(row.entryCode || '').trim();
      if (code) picked.add(code);
    });
    dataSource.forEach((row) => {
      const code = String(row.entryCode || '').trim();
      if (code) picked.add(code);
    });
    try {
      for (let page = 1; page <= 5; page += 1) {
        const res = await getJdyBusinessData('pick-top-photo', { pageNo: page, pageSize: 100 });
        const records = (res.data?.records || []) as Record<string, unknown>[];
        if (records.length === 0) break;
        records.forEach((row) => {
          const code = String(row.entryCode || '').trim();
          if (code) picked.add(code);
        });
        if (page * 100 >= Number(res.data?.total || 0)) break;
      }
    } catch {
      // 远程失败时仍用本地/当前页
    }
    const keep = String(keepCode || '').trim();
    if (keep) picked.delete(keep);
    return picked;
  };

  /** 报废车入库元数据（过磅日期/型号等，用于灰框带出） */
  const loadScrappedMetaByCode = async () => {
    const map = new Map<
      string,
      { weighDate: string; vehicleModel: string; supplier: string; submitter: string; submitTime: string }
    >();
    const push = (row: Record<string, unknown>) => {
      const code = String(row.entryCode || '').trim();
      if (!code) return;
      map.set(code, {
        weighDate: String(row.weighDate || ''),
        vehicleModel: String(row.vehicleModel || ''),
        supplier: String(row.supplier || ''),
        submitter: String(row.submitter || ''),
        submitTime: String(row.submitTime || ''),
      });
    };
    getLocalBizRows<Record<string, unknown>>('scrapped-vehicle').forEach(push);
    try {
      for (let page = 1; page <= 5; page += 1) {
        const res = await getJdyBusinessData('scrapped-vehicle', { pageNo: page, pageSize: 100 });
        const records = (res.data?.records || []) as Record<string, unknown>[];
        if (records.length === 0) break;
        records.forEach(push);
        if (page * 100 >= Number(res.data?.total || 0)) break;
      }
    } catch {
      // ignore
    }
    return map;
  };

  /**
   * 可选数据 = 查验照片（必有图）∩ 已报废入库 ∩ 尚未挑顶
   * 与简道云「选择数据」一致：列表行均带图片
   */
  const fetchUnpickedScrapped = async (keepCode?: string): Promise<PendingPickRow[]> => {
    const picked = await collectPickedEntryCodes(keepCode ?? editing?.entryCode);
    const scrappedMap = await loadScrappedMetaByCode();
    const map = new Map<string, PendingPickRow>();

    const pushInsp = (row: Record<string, unknown>) => {
      const code = String(row.entryCode || row.code || '').trim();
      if (!code || picked.has(code)) return;
      const meta = scrappedMap.get(code);
      if (!meta) return; // 必须已入库
      const imgs = normalizeImages(row.images ?? row.photos);
      if (!imgs.length) return; // 必须有图片
      const prev = map.get(code);
      map.set(code, {
        key: code,
        entryCode: code,
        images: [...(prev?.images || []), ...imgs].slice(0, 8),
        weighDate: meta.weighDate,
        vehicleModel: meta.vehicleModel,
        supplier: meta.supplier,
        submitter: String(row.submitter || meta.submitter || ''),
        submitTime: String(row.submitTime || meta.submitTime || ''),
        updateTime: String(row.updateTime || prev?.updateTime || ''),
      });
    };

    getLocalBizRows<Record<string, unknown>>('inspection-photo').forEach(pushInsp);
    try {
      for (let page = 1; page <= 5; page += 1) {
        const res = await getJdyBusinessData('inspection-photo', { pageNo: page, pageSize: 100 });
        const records = (res.data?.records || []) as Record<string, unknown>[];
        if (records.length === 0) break;
        records.forEach(pushInsp);
        if (page * 100 >= Number(res.data?.total || 0)) break;
      }
    } catch {
      // 远程失败时仍用本地查验照片
    }

    return Array.from(map.values()).sort((a, b) =>
      String(b.submitTime).localeCompare(String(a.submitTime)),
    );
  };

  const pendingToOption = (r: PendingPickRow): ScrappedEntryOption => ({
    value: r.entryCode,
    label: r.entryCode,
    submitter: r.submitter,
    submitTime: r.submitTime,
    updateTime: r.updateTime,
    weighDate: r.weighDate,
    vehicleModel: r.vehicleModel,
    supplier: r.supplier,
    images: r.images,
  });

  const loadScrappedEntryOptions = async (keepCode?: string) => {
    setEntryOptionsLoading(true);
    try {
      const rows = await fetchUnpickedScrapped(keepCode);
      setScrappedEntryOptions(rows.map(pendingToOption));
    } catch {
      message.warning('入库入场编号加载失败，可稍后重试');
      setScrappedEntryOptions([]);
    } finally {
      setEntryOptionsLoading(false);
    }
  };

  const openSelectData = async () => {
    setSelectDataOpen(true);
    setSelectDataKeyword('');
    setSelectDataLoading(true);
    try {
      const rows = await fetchUnpickedScrapped(editing?.entryCode);
      setPendingPickRows(rows);
      setScrappedEntryOptions(rows.map(pendingToOption));
    } catch {
      message.warning('可选数据加载失败');
      setPendingPickRows([]);
    } finally {
      setSelectDataLoading(false);
    }
  };

  const applyBroughtInspectionPhotos = (urls: string[]) => {
    const list = (urls || []).map((u) => String(u || '').trim()).filter(Boolean);
    setBroughtInspectionUrls(list);
    if (list.length) {
      setInspectionFileList(urlsToFileList(list));
    }
  };

  const applySelectedEntry = (row: PendingPickRow) => {
    form.setFieldsValue({ entryCode: row.entryCode });
    setSelectedScrapped(pendingToOption(row));
    // 选择数据后带出查验照片（灰框 + 表单 + 提交兜底）
    applyBroughtInspectionPhotos(row.images || []);
    setSelectDataOpen(false);
  };

  const filteredPendingPickRows = useMemo(() => {
    const raw = selectDataKeyword.trim();
    if (!raw) return pendingPickRows;
    const norm = (s: unknown) =>
      String(s ?? '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '');
    const kw = norm(raw);
    if (!kw) return pendingPickRows;
    return pendingPickRows.filter((r) => {
      const fields = [r.entryCode, r.vehicleModel, r.supplier, r.submitter, r.weighDate, r.submitTime];
      return fields.some((f) => norm(f).includes(kw)) || fields.join('').toLowerCase().includes(kw);
    });
  }, [pendingPickRows, selectDataKeyword]);

  const entrySelectOptions = useMemo(() => {
    const list = [...scrappedEntryOptions];
    const current = editing?.entryCode?.trim();
    if (current && !list.some((o) => o.value === current)) {
      list.unshift({ value: current, label: current });
    }
    return list;
  }, [scrappedEntryOptions, editing]);

  const handleEntryCodeChange = (code: string | undefined) => {
    if (!code) {
      setSelectedScrapped(null);
      setBroughtInspectionUrls([]);
      return;
    }
    const hit = scrappedEntryOptions.find((o) => o.value === code) || {
      value: code,
      label: code,
    };
    setSelectedScrapped(hit);
    applyBroughtInspectionPhotos(hit.images || []);
  };

  const handleAdd = () => {
    setEditing(null);
    setAddModalOpen(true);
    form.resetFields();
    setPickTopFileList([]);
    setInspectionFileList([]);
    setBroughtInspectionUrls([]);
    setSelectedScrapped(null);
    void loadScrappedEntryOptions();
  };

  const handleEdit = (record: PickTopPhotoItem) => {
    setEditing(record);
    form.setFieldsValue({ entryCode: record.entryCode });
    setPickTopFileList(urlsToFileList(record.pickTopPhotos));
    setInspectionFileList(urlsToFileList(record.inspectionPhotos));
    setBroughtInspectionUrls(normalizeImages(record.inspectionPhotos));
    setSelectedScrapped({ value: record.entryCode, label: record.entryCode });
    setAddModalOpen(true);
    void (async () => {
      setEntryOptionsLoading(true);
      try {
        const rows = await fetchUnpickedScrapped(record.entryCode);
        setScrappedEntryOptions(rows.map(pendingToOption));
        const hit = rows.find((r) => r.entryCode === record.entryCode);
        if (hit) {
          setSelectedScrapped(pendingToOption(hit));
        } else {
          // 编辑已挑顶记录：灰框至少带出本单信息
          setSelectedScrapped({
            value: record.entryCode,
            label: record.entryCode,
            images: record.inspectionPhotos || [],
            submitter: record.submitter,
            submitTime: record.submitTime,
            updateTime: record.updateTime,
          });
        }
      } catch {
        message.warning('入库入场编号加载失败，可稍后重试');
      } finally {
        setEntryOptionsLoading(false);
      }
    })();
  };

  const columns: ColumnsType<PickTopPhotoItem> = [
    {
      title: '入场编号',
      dataIndex: 'entryCode',
      width: 100,
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
      title: '挑顶照片',
      dataIndex: 'pickTopPhotos',
      width: 140,
      render: (photos: string[]) => <PhotoThumbnails photos={photos} />,
    },
    {
      title: '查验照片',
      dataIndex: 'inspectionPhotos',
      width: 140,
      render: (photos: string[]) => <PhotoThumbnails photos={photos} />,
    },
    {
      title: '提交人',
      dataIndex: 'submitter',
      width: 100,
      render: (val: string) => <span style={{ color: '#1890ff' }}>{val}</span>,
    },
    { title: '提交时间', dataIndex: 'submitTime', width: 170 },
    makeEditColumn<PickTopPhotoItem>(handleEdit),
  ];

  const handleAddSubmit = async () => {
    try {
      const values = await form.validateFields();
      const user = getStoredUser();
      const now = formatBizDateTime();
      const operator = user.nickname || user.username || '系统';
      // 表单上传 + 选择数据带出，去重合并（带出优先保留）
      const fromUpload = inspectionFileList
        .map((f) => f.url || f.thumbUrl || '')
        .filter(Boolean) as string[];
      const fromBrought = broughtInspectionUrls.length
        ? broughtInspectionUrls
        : selectedScrapped?.images || [];
      const inspectionPhotos = Array.from(new Set([...fromBrought, ...fromUpload].filter(Boolean)));
      const payload = {
        entryCode: values.entryCode,
        pickTopPhotos: pickTopFileList.map((f) => f.url || f.thumbUrl || '').filter(Boolean),
        inspectionPhotos,
        submitter: editing?.submitter || operator,
        submitTime: editing?.submitTime || now,
        updateTime: now,
      };
      const summary = buildChangeSummary(editing, payload);
      let saved: PickTopPhotoItem;
      if (editing) {
        saved = upsertLocalBizRow<PickTopPhotoItem>('pick-top-photo', {
          ...payload,
          id: editing.id,
          dataId: editing.dataId,
        });
        message.success('修改成功');
      } else {
        saved = addLocalBizRow<PickTopPhotoItem>('pick-top-photo', payload);
        message.success('挑顶完成');
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
      form.resetFields();
      setPickTopFileList([]);
      setInspectionFileList([]);
      setBroughtInspectionUrls([]);
      setSelectedScrapped(null);
      setPageNo(1);
      setReloadKey((k) => k + 1);
    } catch {
      message.error('请填写完整信息');
    }
  };

  const handleDelete = () => {
    if (!selectedRowKeys.length) {
      message.warning('请先选择要删除的数据');
      return;
    }
    message.info('简道云同步数据请在简道云中删除');
  };

  const inspectionUploadProps: UploadProps = {
    multiple: true,
    listType: 'picture',
    fileList: inspectionFileList,
    beforeUpload: () => false,
    onChange: ({ fileList: newFileList }) => setInspectionFileList(newFileList),
  };

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
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            padding: '8px 16px',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加
            </Button>
            <BusinessJdySyncButtons
              syncFn={syncJdyPickTopPhoto}
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

        <div style={{ padding: '0 16px' }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={displayData}
            loading={loading}
            scroll={{ x: 800 }}
            rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
            pagination={withMobilePagination(isMobile, {
              current: pageNo,
              pageSize,
              total,
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条`,
              onChange: (page, size) => {
                setPageNo(page);
                setPageSize(size);
              },
            })}
          />
        </div>
      </Card>

      <Modal
        title={null}
        open={addModalOpen}
        onCancel={() => {
          setEditing(null);
          setAddModalOpen(false);
        }}
        width={isMobile ? '100%' : 860}
        closable={false}
        centered
        styles={{ body: { padding: 0, maxHeight: '85vh', overflowY: 'auto' } }}
        footer={null}
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
                {editing ? '编辑挑顶照片' : '挑顶照片'}
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

            <Form form={form} layout="vertical" style={{ marginTop: 4 }}>
              <Form.Item
                label="入场编号"
                name="entryCode"
                rules={[{ required: true, message: '请选择入场编号' }]}
                extra="仅可选：已入库、已有查验照片且尚未挑顶的入场编号"
              >
                <Space.Compact style={{ width: '100%' }}>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="请选择或点击右侧选择数据"
                    options={entrySelectOptions}
                    showSearch
                    allowClear
                    loading={entryOptionsLoading}
                    optionFilterProp="label"
                    onChange={handleEntryCodeChange}
                    notFoundContent={
                      entryOptionsLoading
                        ? '加载中…'
                        : '暂无可选编号：需先入库并上传查验照片'
                    }
                  />
                  <Button type="primary" onClick={() => void openSelectData()}>
                    选择数据
                  </Button>
                </Space.Compact>
              </Form.Item>

              {selectedScrapped && (
                <div
                  style={{
                    border: '1px solid #f0f0f0',
                    borderRadius: 6,
                    padding: '12px 16px',
                    marginBottom: 16,
                    background: '#fafafa',
                    lineHeight: 1.8,
                  }}
                >
                  <div>
                    <span style={{ color: '#666' }}>入场编号：</span>
                    {selectedScrapped.value || '-'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ color: '#666', flexShrink: 0 }}>图片：</span>
                    {selectedScrapped.images?.length ? (
                      <PhotoThumbnails photos={selectedScrapped.images} />
                    ) : (
                      <span style={{ color: '#bbb' }}>-</span>
                    )}
                  </div>
                  <div>
                    <span style={{ color: '#666' }}>提交人：</span>
                    <span style={{ color: '#1890ff' }}>{selectedScrapped.submitter || '-'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#666' }}>提交时间：</span>
                    {selectedScrapped.submitTime || '-'}
                  </div>
                  <div>
                    <span style={{ color: '#666' }}>更新时间：</span>
                    {selectedScrapped.updateTime || '-'}
                  </div>
                  {selectedScrapped.weighDate ? (
                    <div>
                      <span style={{ color: '#666' }}>过磅日期：</span>
                      {selectedScrapped.weighDate}
                    </div>
                  ) : null}
                  {selectedScrapped.vehicleModel ? (
                    <div>
                      <span style={{ color: '#666' }}>车辆型号：</span>
                      {selectedScrapped.vehicleModel}
                    </div>
                  ) : null}
                </div>
              )}

              <Form.Item label="挑顶照片（支持拍照 / 扫码）" required>
                <QrPhotoUpload
                  fileList={pickTopFileList}
                  onFiles={setPickTopFileList}
                  label="拍照上传"
                  active={addModalOpen}
                  title="挑顶照片上传"
                  bizKey="pick-top-photo"
                />
              </Form.Item>

              <Form.Item label="查验照片（支持拍照）">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <CameraUpload
                    fileList={inspectionFileList}
                    onFiles={setInspectionFileList}
                    label="拍照上传"
                    showSelect={false}
                    extra={
                      <Upload {...inspectionUploadProps} accept="image/*" showUploadList={false}>
                        <Button icon={<PictureOutlined />}>从相册选择</Button>
                      </Upload>
                    }
                  />
                  {inspectionFileList.length > 0 && (
                    <Upload
                      {...inspectionUploadProps}
                      accept="image/*"
                      listType="picture"
                      openFileDialogOnClick={false}
                    />
                  )}
                </div>
              </Form.Item>

              <BizFormMetaFooter
                submitter={formMeta.submitter}
                submitTime={formMeta.submitTime}
                updateTime={formMeta.updateTime}
              />

              <Form.Item style={{ marginBottom: 16, marginTop: 8 }}>
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={handleAddSubmit}
                  style={{
                    background: '#52c41a',
                    borderColor: '#52c41a',
                    height: 48,
                    fontSize: 16,
                    borderRadius: 8,
                  }}
                >
                  挑顶完成
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

      <Modal
        title="选择数据"
        open={selectDataOpen}
        onCancel={() => setSelectDataOpen(false)}
        footer={null}
        width={isMobile ? '100%' : 720}
        destroyOnClose
        centered
      >
        <div style={{ marginBottom: 12 }}>
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            placeholder="搜索数据（入场编号 / 型号 / 供应商 / 提交人）"
            value={selectDataKeyword}
            onChange={(e) => setSelectDataKeyword(e.target.value)}
            onPressEnter={(e) => e.preventDefault()}
          />
        </div>
        <div style={{ marginBottom: 8, color: '#888', fontSize: 12 }}>
          仅显示：已入库 + 已有查验照片 + 尚未挑顶（每条均带图片）
        </div>
        <Table
          rowKey="key"
          size="small"
          loading={selectDataLoading}
          dataSource={filteredPendingPickRows}
          locale={{
            emptyText: selectDataLoading
              ? '加载中…'
              : selectDataKeyword.trim()
                ? `未找到「${selectDataKeyword.trim()}」相关可选数据`
                : '暂无可选数据：请先入库并上传查验照片，或均已挑顶',
          }}
          pagination={withMobilePagination(isMobile, {
            pageSize: 20,
            showSizeChanger: false,
            showTotal: (t) => `共 ${t} 条`,
          })}
          columns={[
            {
              title: '入场编号',
              dataIndex: 'entryCode',
              width: 120,
            },
            {
              title: '图片',
              dataIndex: 'images',
              width: 180,
              render: (imgs: string[]) => <PhotoThumbnails photos={imgs} />,
            },
            {
              title: '提交人',
              dataIndex: 'submitter',
              width: 100,
              render: (v: string) => (
                <span style={{ color: '#1890ff' }}>{v || '-'}</span>
              ),
            },
            {
              title: '提交时间',
              dataIndex: 'submitTime',
              width: 170,
              render: (v: string) => v || '-',
            },
            {
              title: '操作',
              width: 90,
              fixed: 'right',
              render: (_: unknown, record: PendingPickRow) => (
                <Button type="link" size="small" onClick={() => applySelectedEntry(record)}>
                  选择
                </Button>
              ),
            },
          ]}
          scroll={{ x: 680 }}
        />
      </Modal>
    </div>
  );
}
