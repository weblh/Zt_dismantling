import { useState } from 'react';
import { useBizDataWithLocal } from '@/hooks/useBizDataWithLocal';
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
  QRCode,
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
  EditOutlined,
  DatabaseOutlined,
  DownOutlined,
  SyncOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd';
import CameraUpload from '@/components/CameraUpload';
import DataScopeDropdown from '@/components/DataScopeDropdown';
import BizLinkDataModal, { mapLinkedRowToFormValues, PRODUCTION_LINK_SOURCES } from '@/components/BizLinkDataModal';

interface InspectionPhotoItem {
  id: number;
  entryCode: string;
  images: string[];
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const ImagePlaceholder = () => (
  <div
    style={{
      width: 60,
      height: 45,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: 4,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontSize: 10,
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <svg width="20" height="16" viewBox="0 0 24 16" fill="none">
      <rect x="1" y="4" width="15" height="8" rx="1" fill="#fff" fillOpacity="0.3" />
      <rect x="4" y="6" width="11" height="5" rx="0.5" fill="#fff" fillOpacity="0.5" />
      <circle cx="6" cy="14" r="2" fill="#fff" fillOpacity="0.4" />
      <circle cx="13" cy="14" r="2" fill="#fff" fillOpacity="0.4" />
      <path d="M16 8L20 6L23 8L23 12H16V8Z" fill="#fff" fillOpacity="0.3" />
    </svg>
  </div>
);

const ImageStack = ({ count = 3 }: { count?: number }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        style={{
          transform: `translateX(${i * -4}px)`,
          marginLeft: i > 0 ? -16 : 0,
        }}
      >
        <ImagePlaceholder />
      </div>
    ))}
  </div>
);

const columns: ColumnsType<InspectionPhotoItem> = [
  { title: <span style={{ whiteSpace: 'nowrap' }}>入场编号</span>, dataIndex: 'entryCode', width: 120 },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>图片</span>,
    dataIndex: 'images',
    width: 200,
    render: (val: string[]) => <ImageStack count={val.length} />,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>提交人</span>,
    dataIndex: 'submitter',
    width: 100,
    render: (val: string) => (
      <span style={{ color: '#1890ff', cursor: 'pointer' }}>{val}</span>
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

export default function InspectionPhoto() {
  const {
    dataSource,
    total,
    pageNo,
    pageSize,
    loading,
    searchValue,
    setSearchValue,
    setPageNo,
    setPageSize,
    onSearch,
    appendLocal,
    removeLocal,
    setDataScope,
  } = useBizDataWithLocal<InspectionPhotoItem>('inspection-photo');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [qrCodeOpen, setQrCodeOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);

  const handleSearch = (value: string) => {
    onSearch(value);
  };

  const handleAdd = () => {
    setAddModalOpen(true);
    form.resetFields();
    setFileList([]);
  };

  const handleAddSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (fileList.length === 0) {
        message.error('请拍照或上传至少一张查验照片');
        return;
      }
      const images = fileList.map((f) => f.url || f.thumbUrl || '').filter(Boolean);
      appendLocal({
        entryCode: values.entryCode || `CY${Date.now()}`,
        images,
      } as Omit<InspectionPhotoItem, 'id'>);
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
      appendLocal({
        entryCode: values.entryCode || `CY${Date.now()}`,
        images,
      } as Omit<InspectionPhotoItem, 'id'>);
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
    removeLocal(selectedRowKeys.map(Number));
    setSelectedRowKeys([]);
    message.success(`已删除 ${selectedRowKeys.length} 条数据`);
  };

  const handleCount = () => {
    message.info(`当前共 ${total} 条数据`);
  };

  return (
    <div className="page-container">
      <Card styles={{ body: { padding: 0 } }}>
        {/* 顶部工具栏 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #f0f0f0',
            background: '#fff',
            gap: 8,
          }}
        >
          <DataScopeDropdown onChange={setDataScope} />
          <Button type="link" onClick={() => setLinkModalOpen(true)}>联动结账/划价/扣杂</Button>
          <Button type="link" icon={<EditOutlined />}>新建视图</Button>
          <Button type="link" icon={<DatabaseOutlined />}>编辑</Button>
          <Button type="link" icon={<MoreOutlined />}>数据管理</Button>
        </div>

        {/* 操作工具栏 */}
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
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加</Button>
            <Button icon={<ImportOutlined />} onClick={handleImport}>导入</Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
            <Button icon={<DeleteOutlined />} onClick={handleDelete}>删除</Button>
          </Space>
          <Space>
            <Input.Search
              placeholder="搜索数据"
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 200 }}
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

        {/* 数据表格 */}
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
            pagination={{
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
            }}
          />
        </div>

        {/* 统计数据量按钮 */}
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

      {/* 添加表单弹窗 */}
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

          {/* 二维码提示（可选） */}
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

      <BizLinkDataModal
        open={linkModalOpen}
        onCancel={() => setLinkModalOpen(false)}
        sources={PRODUCTION_LINK_SOURCES}
        onSelect={(row) => {
          form.setFieldsValue({
            entryCode: row.code || form.getFieldValue('entryCode'),
            ...mapLinkedRowToFormValues(row),
          });
          setLinkModalOpen(false);
          setAddModalOpen(true);
        }}
      />
    </div>
  );
}
