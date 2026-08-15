import { useState, useCallback } from 'react';
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
  Upload,
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
  PictureOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile, UploadProps } from 'antd';

interface InspectionPhotoItem {
  id: number;
  entryCode: string;
  images: string[];
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const mockData: InspectionPhotoItem[] = [
  {
    id: 1, entryCode: '6G0439', submitter: '齐志江',
    submitTime: '2026-07-30 09:29:32', updateTime: '2026-07-30 09:29:32',
    images: ['car1', 'car2', 'car3'],
  },
  {
    id: 2, entryCode: '6G0438', submitter: '齐志江',
    submitTime: '2026-07-29 16:02:50', updateTime: '2026-07-29 16:02:50',
    images: ['car4', 'car5', 'car6'],
  },
  {
    id: 3, entryCode: '6G0437', submitter: '齐志江',
    submitTime: '2026-07-29 15:59:23', updateTime: '2026-07-29 15:59:23',
    images: ['car7', 'car8', 'car9'],
  },
  {
    id: 4, entryCode: '6G0435', submitter: '齐志江',
    submitTime: '2026-07-29 09:57:55', updateTime: '2026-07-29 09:57:55',
    images: ['car10', 'car11', 'car12'],
  },
  {
    id: 5, entryCode: '6G0436', submitter: '齐志江',
    submitTime: '2026-07-29 09:57:31', updateTime: '2026-07-29 09:57:31',
    images: ['car13', 'car14', 'car15'],
  },
  {
    id: 6, entryCode: '6G0434', submitter: '齐志江',
    submitTime: '2026-07-26 18:02:49', updateTime: '2026-07-26 18:02:49',
    images: ['car16', 'car17', 'car18'],
  },
  {
    id: 7, entryCode: '6G0433', submitter: '齐志江',
    submitTime: '2026-07-26 17:57:20', updateTime: '2026-07-26 17:57:20',
    images: ['car19', 'car20', 'car21'],
  },
  {
    id: 8, entryCode: '6G0432', submitter: '齐志江',
    submitTime: '2026-07-25 15:19:26', updateTime: '2026-07-25 15:19:26',
    images: ['car22', 'car23', 'car24'],
  },
  {
    id: 9, entryCode: '6G0431', submitter: '齐志江',
    submitTime: '2026-07-22 14:13:15', updateTime: '2026-07-22 14:13:15',
    images: ['car25', 'car26', 'car27'],
  },
  {
    id: 10, entryCode: '6G0430', submitter: '齐志江',
    submitTime: '2026-07-22 14:11:48', updateTime: '2026-07-22 14:11:48',
    images: ['car28', 'car29', 'car30'],
  },
  {
    id: 11, entryCode: '6G0429', submitter: '齐志江',
    submitTime: '2026-07-22 14:10:45', updateTime: '2026-07-22 14:10:45',
    images: ['car31', 'car32', 'car33'],
  },
  {
    id: 12, entryCode: '6G0428', submitter: '齐志江',
    submitTime: '2026-07-21 10:30:22', updateTime: '2026-07-21 10:30:22',
    images: ['car34', 'car35', 'car36'],
  },
  {
    id: 13, entryCode: '6G0427', submitter: '齐志江',
    submitTime: '2026-07-20 16:45:11', updateTime: '2026-07-20 16:45:11',
    images: ['car37', 'car38', 'car39'],
  },
  {
    id: 14, entryCode: '6G0426', submitter: '齐志江',
    submitTime: '2026-07-19 11:20:33', updateTime: '2026-07-19 11:20:33',
    images: ['car40', 'car41', 'car42'],
  },
  {
    id: 15, entryCode: '6G0425', submitter: '齐志江',
    submitTime: '2026-07-18 09:15:44', updateTime: '2026-07-18 09:15:44',
    images: ['car43', 'car44', 'car45'],
  },
  {
    id: 16, entryCode: '6G0424', submitter: '齐志江',
    submitTime: '2026-07-17 15:30:55', updateTime: '2026-07-17 15:30:55',
    images: ['car46', 'car47', 'car48'],
  },
  {
    id: 17, entryCode: '6G0423', submitter: '齐志江',
    submitTime: '2026-07-16 14:20:12', updateTime: '2026-07-16 14:20:12',
    images: ['car49', 'car50', 'car51'],
  },
  {
    id: 18, entryCode: '6G0422', submitter: '齐志江',
    submitTime: '2026-07-15 10:45:26', updateTime: '2026-07-15 10:45:26',
    images: ['car52', 'car53', 'car54'],
  },
  {
    id: 19, entryCode: '6G0421', submitter: '齐志江',
    submitTime: '2026-07-14 16:00:38', updateTime: '2026-07-14 16:00:38',
    images: ['car55', 'car56', 'car57'],
  },
  {
    id: 20, entryCode: '6G0420', submitter: '齐志江',
    submitTime: '2026-07-13 13:25:49', updateTime: '2026-07-13 13:25:49',
    images: ['car58', 'car59', 'car60'],
  },
];

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
  const [dataSource, setDataSource] = useState<InspectionPhotoItem[]>(mockData);
  const [total, setTotal] = useState(1079);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchValue, setSearchValue] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [qrCodeOpen, setQrCodeOpen] = useState(false);

  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
    setPageNo(1);
    if (!value) {
      setDataSource(mockData);
      setTotal(1079);
    } else {
      const filtered = mockData.filter(
        (item) =>
          item.entryCode.includes(value) ||
          item.submitter.includes(value),
      );
      setDataSource(filtered);
      setTotal(filtered.length);
    }
  }, []);

  const handleAdd = () => {
    setAddModalOpen(true);
    form.resetFields();
    setFileList([]);
  };

  const handleAddSubmit = async () => {
    try {
      const values = await form.validateFields();
      message.success('提交成功');
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
      message.success('保存草稿成功');
      setAddModalOpen(false);
      form.resetFields();
      setFileList([]);
    } catch {
      message.warning('草稿保存不完整');
      setAddModalOpen(false);
    }
  };

  const uploadProps: UploadProps = {
    multiple: true,
    listType: 'picture',
    fileList,
    beforeUpload: () => false,
    onChange: ({ fileList: newFileList }) => setFileList(newFileList),
    onPreview: () => {},
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
    message.success(`已删除 ${selectedRowKeys.length} 条数据`);
    setSelectedRowKeys([]);
  };

  const handleCount = () => {
    message.info(`当前共 ${total} 条数据`);
  };

  const permissionMenuItems = [
    { key: 'all', label: '查看所有数据' },
    { key: 'dept', label: '本部门' },
    { key: 'self', label: '仅自己' },
  ];

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
          <Dropdown menu={{ items: permissionMenuItems, defaultSelectedKeys: ['all'] }}>
            <Button>全部权限 <DownOutlined /></Button>
          </Dropdown>
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

            <Form.Item
              label="图片"
              name="images"
              valuePropName="fileList"
              getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
              rules={[{ required: true, message: '请上传图片' }]}
            >
              <Upload
                {...uploadProps}
                accept="image/*"
                style={{ width: '100%' }}
              >
                <div
                  style={{
                    padding: '8px 12px',
                    border: '1px dashed #d9d9d9',
                    borderRadius: 6,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#fafafa',
                  }}
                >
                  <Space>
                    <span style={{ color: '#1890ff', fontWeight: 500 }}>选择</span>
                    <span style={{ color: '#999', fontSize: 12 }}>拖拽或单击后粘贴...</span>
                  </Space>
                  <PictureOutlined
                    style={{ fontSize: 18, color: '#52c41a', cursor: 'pointer' }}
                    onMouseEnter={() => setQrCodeOpen(true)}
                    onMouseLeave={() => setQrCodeOpen(false)}
                  />
                </div>
              </Upload>
            </Form.Item>
          </div>

          {/* 二维码提示 */}
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
