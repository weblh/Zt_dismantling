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
  Image,
} from 'antd';
import {
  PlusOutlined,
  ImportOutlined,
  ExportOutlined,
  DeleteOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd';
import QrPhotoUpload from '@/components/QrPhotoUpload';
import BusinessJdySyncButtons from '@/components/BusinessJdySyncButtons';
import BasicFuzzyFilter, { filterBasicRows } from '@/components/BasicFuzzyFilter';
import BizRecordSidePanel from '@/components/BizRecordSidePanel';
import BizFormMetaFooter, { bizRecordKey } from '@/components/BizFormMetaFooter';
import { makeEditColumn } from '@/components/TableEditColumn';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';
import { getJdyBusinessData, syncJdyInspectionPhoto } from '@/api/jdy';
import { appendBizDataLog } from '@/api/bizRecordMeta';
import {
  addLocalBizRow,
  formatBizDateTime,
  getLocalBizRows,
  mergeLocalRemoteRows,
  upsertLocalBizRow,
} from '@/utils/localBizStore';
import { getStoredUser } from '@/config/apps';

const BIZ_KEY = 'inspection-photo';

interface InspectionPhotoItem {
  id: number;
  dataId?: string;
  entryCode: string;
  plateNumber?: string;
  images: string[];
  submitter: string;
  submitTime: string;
  updateTime: string;
}

interface InspectionOption {
  value: string;
  label: string;
  plateNumber: string;
}

const FILTER_FIELDS = [
  { key: 'entryCode', label: '入场编号' },
  { key: 'plateNumber', label: '车牌号' },
];

const ImageStack = ({ urls }: { urls?: string[] }) => {
  const list = (urls || []).filter(Boolean);
  if (list.length === 0) {
    return <span style={{ color: '#999' }}>-</span>;
  }
  const preview = list.slice(0, 3);
  return (
    <Image.PreviewGroup items={list}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {preview.map((url, i) => (
          <Image
            key={`${url}-${i}`}
            src={url}
            width={60}
            height={45}
            style={{
              objectFit: 'cover',
              borderRadius: 4,
              marginLeft: i > 0 ? -12 : 0,
              border: '1px solid #f0f0f0',
            }}
          />
        ))}
        {list.length > 3 && (
          <span style={{ marginLeft: 4, color: '#666', fontSize: 12 }}>+{list.length - 3}</span>
        )}
      </div>
    </Image.PreviewGroup>
  );
};

function normalizeImages(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        return String(obj.url || obj.previewUrl || '');
      }
      return '';
    }).filter(Boolean);
  }
  return [];
}

export default function InspectionPhoto() {
  const isMobile = useIsMobile();
  const [dataSource, setDataSource] = useState<InspectionPhotoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editing, setEditing] = useState<InspectionPhotoItem | null>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [entryOptions, setEntryOptions] = useState<InspectionOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [metaTick, setMetaTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getJdyBusinessData('inspection-photo', {
          pageNo,
          pageSize,
          keyword: keyword || undefined,
        });
        if (cancelled) return;
        const remote = ((res.data?.records || []) as Record<string, unknown>[]).map((row) => ({
          id: Number(row.id),
          dataId: row.dataId ? String(row.dataId) : undefined,
          entryCode: String(row.entryCode || ''),
          plateNumber: String(row.plateNumber || ''),
          images: normalizeImages(row.images),
          submitter: String(row.submitter || ''),
          submitTime: String(row.submitTime || ''),
          updateTime: String(row.updateTime || ''),
        }));
        const local = keyword
          ? []
          : getLocalBizRows<InspectionPhotoItem>('inspection-photo').map((row) => ({
              ...row,
              images: normalizeImages(row.images),
            }));
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
          message.error('查验照片加载失败，请稍后重试');
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

  const loadEntryOptions = async () => {
    setOptionsLoading(true);
    try {
      const map = new Map<string, InspectionOption>();
      const push = (row: Record<string, unknown>) => {
        const code = String(row.code || row.entryCode || '').trim();
        if (!code) return;
        map.set(code, {
          value: code,
          label: code,
          plateNumber: String(row.plateNumber || ''),
        });
      };
      getLocalBizRows<Record<string, unknown>>('weighing-inspection').forEach(push);
      const res = await getJdyBusinessData('weighing-inspection', { pageNo: 1, pageSize: 500 });
      ((res.data?.records || []) as Record<string, unknown>[]).forEach(push);
      setEntryOptions(Array.from(map.values()));
    } catch {
      setEntryOptions([]);
    } finally {
      setOptionsLoading(false);
    }
  };

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    setFileList([]);
    setAddModalOpen(true);
    void loadEntryOptions();
  };

  const handleEdit = (record: InspectionPhotoItem) => {
    setEditing(record);
    form.setFieldsValue({
      entryCode: record.entryCode,
      plateNumber: record.plateNumber,
    });
    setFileList(
      (record.images || []).map((url, i) => ({
        uid: `${i}-${url}`,
        name: `img-${i}`,
        status: 'done' as const,
        url,
      })),
    );
    setAddModalOpen(true);
    void loadEntryOptions();
  };

  const columns: ColumnsType<InspectionPhotoItem> = [
    {
      title: <span style={{ whiteSpace: 'nowrap' }}>入场编号</span>,
      dataIndex: 'entryCode',
      width: 120,
      render: (val: string, record) => (
        <a onClick={() => handleEdit(record)} style={{ color: '#1890ff' }}>{val || '-'}</a>
      ),
    },
    {
      title: <span style={{ whiteSpace: 'nowrap' }}>图片</span>,
      dataIndex: 'images',
      width: 220,
      render: (val: string[]) => <ImageStack urls={val} />,
    },
    {
      title: <span style={{ whiteSpace: 'nowrap' }}>提交人</span>,
      dataIndex: 'submitter',
      width: 100,
      render: (val: string) => (
        <span style={{ color: '#1890ff', cursor: 'pointer' }}>{val || '-'}</span>
      ),
    },
    { title: <span style={{ whiteSpace: 'nowrap' }}>提交时间</span>, dataIndex: 'submitTime', width: 170 },
    { title: <span style={{ whiteSpace: 'nowrap' }}>更新时间</span>, dataIndex: 'updateTime', width: 170 },
    makeEditColumn<InspectionPhotoItem>(handleEdit),
  ];

  const saveRow = async (
    values: { entryCode?: string; plateNumber?: string },
    images: string[],
  ) => {
    const user = getStoredUser();
    const now = formatBizDateTime();
    const operator = user.nickname || user.username || '系统';
    const payload = {
      entryCode: values.entryCode || editing?.entryCode || `CY${Date.now()}`,
      plateNumber: values.plateNumber || '',
      images,
      submitter: editing?.submitter || operator,
      submitTime: editing?.submitTime || now,
      updateTime: now,
      dataId: editing?.dataId,
    };
    let saved: InspectionPhotoItem;
    if (editing) {
      saved = upsertLocalBizRow<InspectionPhotoItem>('inspection-photo', { ...payload, id: editing.id });
    } else {
      saved = addLocalBizRow<InspectionPhotoItem>('inspection-photo', payload);
    }
    const recordKey = bizRecordKey(saved);
    if (recordKey) {
      try {
        await appendBizDataLog(BIZ_KEY, recordKey, {
          action: editing ? '更新' : '创建',
          summary: editing
            ? `更新查验照片：${payload.entryCode}`
            : `创建查验照片：${payload.entryCode}`,
          operatorName: operator,
        });
        setMetaTick((t) => t + 1);
      } catch {
        // ignore
      }
    }
    setPageNo(1);
    setReloadKey((k) => k + 1);
  };

  const handleAddSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (fileList.length === 0) {
        message.error('请拍照或上传至少一张查验照片');
        return;
      }
      const images = fileList.map((f) => f.url || f.thumbUrl || '').filter(Boolean);
      await saveRow(values, images);
      message.success(editing ? '修改成功' : '提交成功，已写入列表');
      setEditing(null);
      setAddModalOpen(false);
      form.resetFields();
      setFileList([]);
    } catch {
      // validation
    }
  };

  const handleSaveDraft = async () => {
    try {
      const values = await form.validateFields();
      if (fileList.length === 0) {
        message.warning('草稿保存不完整：请添加照片');
        return;
      }
      const images = fileList.map((f) => f.url || f.thumbUrl || '').filter(Boolean);
      await saveRow(values, images);
      message.success(editing ? '修改成功' : '保存草稿成功');
      setEditing(null);
      setAddModalOpen(false);
      form.resetFields();
      setFileList([]);
    } catch {
      message.warning('草稿保存不完整');
    }
  };

  const handleImport = () => message.info('导入功能开发中');
  const handleExport = () => message.success('导出成功');
  const handleDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的数据');
      return;
    }
    message.info('简道云同步数据请在简道云中删除');
  };

  const metaRecordKey = bizRecordKey(editing);
  const formMeta = {
    submitter: editing?.submitter || getStoredUser().nickname || getStoredUser().username || '-',
    submitTime: editing?.submitTime || '-',
    updateTime: editing?.updateTime || '-',
  };

  const entrySelectOptions = useMemo(() => {
    const list = [...entryOptions];
    const current = editing?.entryCode?.trim();
    if (current && !list.some((o) => o.value === current)) {
      list.unshift({
        value: current,
        label: current,
        plateNumber: editing?.plateNumber || '',
      });
    }
    return list;
  }, [entryOptions, editing]);

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
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加</Button>
            <BusinessJdySyncButtons
              syncFn={syncJdyInspectionPhoto}
              onSynced={() => {
                setPageNo(1);
                setReloadKey((k) => k + 1);
              }}
            />
            <Button icon={<ImportOutlined />} onClick={handleImport}>导入</Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
            <Button icon={<DeleteOutlined />} onClick={handleDelete}>删除</Button>
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
            scroll={{ x: 720 }}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            pagination={withMobilePagination(isMobile, {
              current: pageNo,
              pageSize,
              total,
              showSizeChanger: true,
              showTotal: (t) => `${Math.floor(pageSize * (pageNo - 1))}条/共 ${t} 条`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (page, size) => {
                setPageNo(page);
                setPageSize(size);
              },
              onShowSizeChange: (page, size) => {
                setPageNo(page);
                setPageSize(size);
              },
            })}
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '12px 0',
            borderTop: '1px solid #f0f0f0',
            background: '#fff',
          }}
        >
          <Button
            icon={<SyncOutlined />}
            style={{ color: '#1890ff', borderColor: '#1890ff' }}
            onClick={() => message.info(`当前共 ${total} 条数据`)}
          >
            统计数据量
          </Button>
        </div>
      </Card>

      <Modal
        title={null}
        open={addModalOpen}
        onCancel={() => {
          setEditing(null);
          setAddModalOpen(false);
        }}
        width={isMobile ? '100%' : 1100}
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
                {editing ? '编辑查验照片' : '添加查验照片'}
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

            <Form form={form} layout="vertical" requiredMark>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0 16px' }}>
                <Form.Item
                  label="入场编号"
                  name="entryCode"
                  rules={[{ required: true, message: '请选择入场编号' }]}
                >
                  <Select
                    placeholder="请选择过磅查验编号"
                    options={entrySelectOptions}
                    showSearch
                    optionFilterProp="label"
                    loading={optionsLoading}
                    onChange={(code: string) => {
                      const hit = entrySelectOptions.find((o) => o.value === code);
                      if (hit?.plateNumber) {
                        form.setFieldsValue({ plateNumber: hit.plateNumber });
                      }
                    }}
                  />
                </Form.Item>

                <Form.Item
                  label="车牌号"
                  name="plateNumber"
                  rules={[{ required: true, message: '请输入车牌号' }]}
                >
                  <Select
                    placeholder="请选择或由编号带出"
                    options={entrySelectOptions
                      .filter((o) => o.plateNumber)
                      .map((o) => ({ value: o.plateNumber, label: o.plateNumber }))}
                    showSearch
                    allowClear
                    optionFilterProp="label"
                  />
                </Form.Item>
              </div>

              <Form.Item label="查验照片" required>
                <QrPhotoUpload
                  fileList={fileList}
                  onFiles={setFileList}
                  label="拍照上传查验照片"
                  active={addModalOpen}
                  title="查验照片上传"
                  bizKey="inspection-photo"
                />
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
