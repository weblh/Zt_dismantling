import { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Input,
  Button,
  Space,
  message,
  Modal,
  Form,
  Select,
  QRCode,
  Image,
} from 'antd';
import {
  PlusOutlined,
  ImportOutlined,
  ExportOutlined,
  DeleteOutlined,
  FilterOutlined,
  ColumnWidthOutlined,
  FullscreenOutlined,
  MoreOutlined,
  SyncOutlined,
  CloudSyncOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd';
import CameraUpload from '@/components/CameraUpload';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';
import { getJdyBusinessData, syncJdyInspectionPhoto } from '@/api/jdy';
import { addLocalBizRow, formatBizDateTime, getLocalBizRows } from '@/utils/localBizStore';
import { getStoredUser } from '@/config/apps';

interface InspectionPhotoItem {
  id: number;
  entryCode: string;
  plateNumber?: string;
  images: string[];
  submitter: string;
  submitTime: string;
  updateTime: string;
}

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

const columns: ColumnsType<InspectionPhotoItem> = [
  { title: <span style={{ whiteSpace: 'nowrap' }}>入场编号</span>, dataIndex: 'entryCode', width: 120 },
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
];

const entryCodeOptions = [
  { value: '6G0439', label: '6G0439' },
  { value: '6G0438', label: '6G0438' },
  { value: '6G0437', label: '6G0437' },
  { value: '6G0436', label: '6G0436' },
  { value: '6G0435', label: '6G0435' },
  { value: '6G0434', label: '6G0434' },
  { value: '6G0433', label: '6G0433' },
  { value: '6G0432', label: '6G0432' },
  { value: '6G0431', label: '6G0431' },
  { value: '6G0430', label: '6G0430' },
  { value: '6G0429', label: '6G0429' },
];

const plateNumberOptions = [
  { value: '鲁A12345', label: '鲁A12345' },
  { value: '鲁B67890', label: '鲁B67890' },
  { value: '京A11111', label: '京A11111' },
  { value: '沪A22222', label: '沪A22222' },
  { value: '粤B33333', label: '粤B33333' },
];

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
  const [keyword, setKeyword] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [qrCodeOpen, setQrCodeOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

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
        const merged = pageNo === 1 ? [...local, ...remote] : remote;
        setDataSource(merged);
        setTotal((res.data?.total || 0) + (keyword ? 0 : local.length));
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

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await syncJdyInspectionPhoto();
      message.success(res.data?.message || '同步成功');
      setPageNo(1);
      setReloadKey((k) => k + 1);
    } catch {
      // interceptor
    } finally {
      setSyncing(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
    setPageNo(1);
    setKeyword(value.trim());
  };

  const handleAdd = () => {
    setAddModalOpen(true);
    form.resetFields();
    setFileList([]);
  };

  const appendLocalRow = (values: { entryCode?: string; plateNumber?: string }, images: string[]) => {
    const user = getStoredUser();
    const now = formatBizDateTime();
    addLocalBizRow<InspectionPhotoItem>('inspection-photo', {
      entryCode: values.entryCode || `CY${Date.now()}`,
      plateNumber: values.plateNumber || '',
      images,
      submitter: user.nickname || user.username || '系统',
      submitTime: now,
      updateTime: now,
    });
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
      appendLocalRow(values, images);
      message.success('提交成功，已写入列表');
      setAddModalOpen(false);
      form.resetFields();
      setFileList([]);
    } catch {
      message.error('请填写完整信息');
    }
  };

  const handleSaveDraft = async () => {
    try {
      const values = await form.validateFields();
      if (fileList.length === 0) {
        message.warning('草稿保存不完整：请添加照片');
        setAddModalOpen(false);
        return;
      }
      const images = fileList.map((f) => f.url || f.thumbUrl || '').filter(Boolean);
      appendLocalRow(values, images);
      message.success('保存草稿成功');
      setAddModalOpen(false);
      form.resetFields();
      setFileList([]);
    } catch {
      message.warning('草稿保存不完整');
      setAddModalOpen(false);
    }
  };

  const handleImport = () => {
    message.info('导入功能开发中');
  };

  const handleExport = () => {
    message.success('导出成功');
  };

  const handleDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的数据');
      return;
    }
    message.info('简道云同步数据请在简道云中删除');
  };

  const handleCount = () => {
    message.info(`当前共 ${total} 条数据`);
  };

  return (
    <div className="page-container">
      <Card styles={{ body: { padding: 0 } }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加</Button>
            <Button icon={<CloudSyncOutlined />} loading={syncing} onClick={handleSync}>同步</Button>
            <Button icon={<ImportOutlined />} onClick={handleImport}>导入</Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
            <Button icon={<DeleteOutlined />} onClick={handleDelete}>删除</Button>
          </Space>
          <Space wrap>
            <Input.Search
              placeholder="搜索数据"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={handleSearch}
              style={{ width: isMobile ? '100%' : 200 }}
              allowClear
            />
            <Button
              icon={<FilterOutlined />}
              style={{ background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}
            >
              筛选
            </Button>
            <FullscreenOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} />
            <ColumnWidthOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} />
            <MoreOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} />
          </Space>
        </div>

        <div style={{ background: '#fff', padding: '0 16px' }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={dataSource}
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
            onClick={handleCount}
          >
            统计数据量
          </Button>
        </div>
      </Card>

      <Modal
        title="添加查验照片"
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        width={720}
        footer={[
          <Button key="cancel" onClick={() => setAddModalOpen(false)}>取消</Button>,
          <Button key="draft" onClick={handleSaveDraft}>保存草稿</Button>,
          <Button key="submit" type="primary" onClick={handleAddSubmit}>提交</Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark
          style={{ marginTop: 16 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
            <Form.Item
              label="入场编号"
              name="entryCode"
              rules={[{ required: true, message: '请选择入场编号' }]}
            >
              <Select
                placeholder="请选择"
                options={entryCodeOptions}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>

            <Form.Item
              label="车牌号"
              name="plateNumber"
              rules={[{ required: true, message: '请选择车牌号' }]}
            >
              <Select
                placeholder="请选择"
                options={plateNumberOptions}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>

            <Form.Item label="查验照片" required>
              <CameraUpload fileList={fileList} onFiles={setFileList} label="拍照上传查验照片" />
            </Form.Item>
          </div>

          {qrCodeOpen && (
            <div
              style={{
                position: 'absolute',
                right: 24,
                top: 80,
                background: '#fff',
                padding: 16,
                borderRadius: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                textAlign: 'center',
                zIndex: 1000,
                width: 160,
              }}
            >
              <QRCode value="https://example.com/upload" size={120} />
              <div style={{ marginTop: 8, fontSize: 12, color: '#666', lineHeight: 1.5 }}>
                扫描二维码，在手机上
                <br />
                选择图片上传
              </div>
            </div>
          )}
        </Form>
      </Modal>

    </div>
  );
}
