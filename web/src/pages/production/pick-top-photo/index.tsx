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
  PictureOutlined,
  InboxOutlined,
  SelectOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile, UploadProps } from 'antd';

interface PickTopPhotoItem {
  id: number;
  entryCode: string;
  pickTopPhotos: string[];
  inspectionPhotos: string[];
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const mockData: PickTopPhotoItem[] = [
  { id: 1, entryCode: '6G0439', pickTopPhotos: ['img1', 'img2', 'img3'], inspectionPhotos: ['img4', 'img5', 'img6'], submitter: '齐志江', submitTime: '2026-07-30 09:30:20', updateTime: '2026-07-30 09:30:20' },
  { id: 2, entryCode: '6G0438', pickTopPhotos: ['img7', 'img8', 'img9'], inspectionPhotos: ['img10', 'img11', 'img12'], submitter: '齐志江', submitTime: '2026-07-29 16:03:07', updateTime: '2026-07-29 16:03:07' },
  { id: 3, entryCode: '6G0437', pickTopPhotos: ['img13', 'img14', 'img15'], inspectionPhotos: ['img16', 'img17', 'img18'], submitter: '齐志江', submitTime: '2026-07-29 15:59:50', updateTime: '2026-07-29 15:59:50' },
  { id: 4, entryCode: '6G0435', pickTopPhotos: ['img19', 'img20', 'img21'], inspectionPhotos: ['img22', 'img23', 'img24'], submitter: '齐志江', submitTime: '2026-07-29 09:58:50', updateTime: '2026-07-29 09:58:50' },
  { id: 5, entryCode: '6G0436', pickTopPhotos: ['img25', 'img26', 'img27'], inspectionPhotos: ['img28', 'img29', 'img30'], submitter: '齐志江', submitTime: '2026-07-29 09:58:26', updateTime: '2026-07-29 09:58:26' },
  { id: 6, entryCode: '6G0434', pickTopPhotos: ['img31', 'img32', 'img33'], inspectionPhotos: ['img34', 'img35', 'img36'], submitter: '齐志江', submitTime: '2026-07-26 18:03:02', updateTime: '2026-07-26 18:03:02' },
  { id: 7, entryCode: '6G0433', pickTopPhotos: ['img37', 'img38', 'img39'], inspectionPhotos: ['img40', 'img41', 'img42'], submitter: '齐志江', submitTime: '2026-07-26 17:57:50', updateTime: '2026-07-26 17:57:50' },
  { id: 8, entryCode: '6G0432', pickTopPhotos: ['img43', 'img44', 'img45'], inspectionPhotos: ['img46', 'img47', 'img48'], submitter: '齐志江', submitTime: '2026-07-25 15:19:43', updateTime: '2026-07-25 15:19:43' },
  { id: 9, entryCode: '6G0111', pickTopPhotos: ['img49', 'img50', 'img51'], inspectionPhotos: ['img52', 'img53', 'img54'], submitter: '齐志江', submitTime: '2026-07-24 12:07:12', updateTime: '2026-07-24 12:07:12' },
  { id: 10, entryCode: '6G0431', pickTopPhotos: ['img55', 'img56', 'img57'], inspectionPhotos: ['img58', 'img59', 'img60'], submitter: '齐志江', submitTime: '2026-07-22 14:13:37', updateTime: '2026-07-22 14:13:37' },
  { id: 11, entryCode: '6G0430', pickTopPhotos: ['img61', 'img62', 'img63'], inspectionPhotos: ['img64', 'img65', 'img66'], submitter: '齐志江', submitTime: '2026-07-22 14:12:15', updateTime: '2026-07-22 14:12:15' },
  { id: 12, entryCode: '6G0429', pickTopPhotos: ['img67', 'img68', 'img69'], inspectionPhotos: ['img70', 'img71', 'img72'], submitter: '齐志江', submitTime: '2026-07-22 14:11:30', updateTime: '2026-07-22 14:11:30' },
  { id: 13, entryCode: '6G0428', pickTopPhotos: ['img73', 'img74', 'img75'], inspectionPhotos: ['img76', 'img77', 'img78'], submitter: '齐志江', submitTime: '2026-07-21 16:05:00', updateTime: '2026-07-21 16:05:00' },
  { id: 14, entryCode: '6G0427', pickTopPhotos: ['img79', 'img80', 'img81'], inspectionPhotos: ['img82', 'img83', 'img84'], submitter: '齐志江', submitTime: '2026-07-20 10:30:22', updateTime: '2026-07-20 10:30:22' },
  { id: 15, entryCode: '6G0426', pickTopPhotos: ['img85', 'img86', 'img87'], inspectionPhotos: ['img88', 'img89', 'img90'], submitter: '齐志江', submitTime: '2026-07-19 09:15:44', updateTime: '2026-07-19 09:15:44' },
];

const PhotoThumbnails = ({ photos }: { photos: string[] }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {photos.map((_, index) => (
      <div
        key={index}
        style={{
          width: 36,
          height: 36,
          borderRadius: 4,
          background: `linear-gradient(135deg, ${
            ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'][index % 6]
          } 0%, ${['#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#667eea'][index % 6]} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <PictureOutlined style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }} />
      </div>
    ))}
  </div>
);

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
];

const columns: ColumnsType<PickTopPhotoItem> = [
  { title: <span style={{ whiteSpace: 'nowrap' }}>入场编号</span>, dataIndex: 'entryCode', width: 100 },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>挑顶照片</span>,
    dataIndex: 'pickTopPhotos',
    width: 140,
    render: (photos: string[]) => <PhotoThumbnails photos={photos} />,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>查验照片</span>,
    dataIndex: 'inspectionPhotos',
    width: 140,
    render: (photos: string[]) => <PhotoThumbnails photos={photos} />,
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

export default function PickTopPhoto() {
  const [dataSource, setDataSource] = useState<PickTopPhotoItem[]>(mockData);
  const [total, setTotal] = useState(327);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchValue, setSearchValue] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [pickTopFileList, setPickTopFileList] = useState<UploadFile[]>([]);
  const [inspectionFileList, setInspectionFileList] = useState<UploadFile[]>([]);
  const [qrCodeOpen, setQrCodeOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<PickTopPhotoItem | null>(null);
  const [selectDataModalOpen, setSelectDataModalOpen] = useState(false);

  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
    setPageNo(1);
    if (!value) {
      setDataSource(mockData);
      setTotal(327);
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
    setPickTopFileList([]);
    setInspectionFileList([]);
    setSelectedData(null);
  };

  const handleAddSubmit = async () => {
    try {
      const values = await form.validateFields();
      message.success('挑顶完成');
      setAddModalOpen(false);
      form.resetFields();
      setPickTopFileList([]);
      setInspectionFileList([]);
      setSelectedData(null);
    } catch {
      message.error('请填写完整信息');
    }
  };

  const pickTopUploadProps: UploadProps = {
    multiple: true,
    listType: 'picture',
    fileList: pickTopFileList,
    beforeUpload: () => false,
    onChange: ({ fileList: newFileList }) => setPickTopFileList(newFileList),
    onPreview: () => {},
  };

  const inspectionUploadProps: UploadProps = {
    multiple: true,
    listType: 'picture',
    fileList: inspectionFileList,
    beforeUpload: () => false,
    onChange: ({ fileList: newFileList }) => setInspectionFileList(newFileList),
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

  const moreMenuItems = [
    { key: 'batchUpdate', label: '批量更新' },
    { key: 'batchDelete', label: '批量删除' },
    { key: 'exportAll', label: '导出全部' },
  ];

  const topMenuItems = [
    { key: 'permission', label: '全部权限' },
    { key: 'view', label: '新建视图' },
    { key: 'edit', label: '编辑' },
    { key: 'dataManagement', label: '数据管理' },
  ];

  return (
    <div className="page-container" style={{ padding: 0, background: '#f5f5f5', minHeight: '100%' }}>
      <Card style={{ margin: 0, borderRadius: 0 }} bodyStyle={{ padding: 0 }} title={null}>
        {/* 顶部工具栏 */}
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
            <Dropdown menu={{ items: topMenuItems.slice(0, 1) }}>
              <Button type="text">
                全部权限 <DownOutlined style={{ fontSize: 10 }} />
              </Button>
            </Dropdown>
            <Button type="text" icon={<EditOutlined />}>新建视图</Button>
            <Button type="text" icon={<DatabaseOutlined />}>数据管理</Button>
          </Space>
          <Space>
            <FullscreenOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} />
            <MoreOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} />
          </Space>
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
            <Dropdown menu={{ items: moreMenuItems }}>
              <Button>
                <MoreOutlined />
              </Button>
            </Dropdown>
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
            scroll={{ x: 800 }}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            pagination={{
              current: pageNo,
              pageSize,
              total,
              showSizeChanger: true,
              showTotal: (t) => `${t} 条/共 ${t} 条`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (page, size) => {
                setPageNo(page);
                setPageSize(size);
              },
              onShowSizeChange: (page, size) => {
                setPageNo(page);
                setPageSize(size);
              },
              showSizeChanger: true,
              showQuickJumper: false,
              showLessItems: false,
              className: 'custom-pagination',
              position: ['bottom'],
              render: (currentPage, pageSize, total) => {
                return (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div>
                      <span style={{ marginRight: 8 }}>≡</span>
                      <span style={{ marginRight: 8 }}>|⇤</span>
                      <span style={{ marginRight: 16 }}>
                        {pageSize} 条/页
                      </span>
                      <span>共 {total} 条</span>
                    </div>
                    <Space>
                      <Button
                        type="link"
                        icon={<SyncOutlined />}
                        onClick={() => message.success('统计数据量')}
                      >
                        统计数据量
                      </Button>
                    </Space>
                  </div>
                );
              },
            }}
          />
        </div>
      </Card>

      {/* 添加表单弹窗 */}
      <Modal
        title="5.挑顶照片"
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        width={720}
        footer={null}
        closable
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark
          style={{ marginTop: 8 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
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

            <Form.Item label="挑顶照片" name="pickTopPhotos">
              <Upload
                {...pickTopUploadProps}
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

          {/* 选择数据 */}
          <Form.Item
            label={<span style={{ fontWeight: 500 }}>选择数据</span>}
            name="selectedData"
            rules={[{ required: true, message: '请选择数据' }]}
          >
            <div
              style={{
                border: '1px solid #d9d9d9',
                borderRadius: 6,
                padding: '8px 12px',
                cursor: 'pointer',
                background: '#fafafa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 40,
              }}
              onClick={() => setSelectDataModalOpen(true)}
            >
              <SelectOutlined style={{ color: '#1890ff', marginRight: 4 }} />
              <span style={{ color: '#1890ff' }}>选择数据</span>
            </div>
          </Form.Item>

          {/* 已选择数据展示 */}
          <div
            style={{
              border: '1px solid #f0f0f0',
              borderRadius: 6,
              padding: '12px 16px',
              background: '#fafafa',
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', marginBottom: 8 }}>
              <span style={{ color: '#666', width: 80 }}>入场编号</span>
              <span style={{ color: '#333' }}>{selectedData?.entryCode || '暂无内容'}</span>
            </div>
            <div style={{ display: 'flex', marginBottom: 8 }}>
              <span style={{ color: '#666', width: 80 }}>图片</span>
              <span style={{ color: '#333' }}>{selectedData?.pickTopPhotos ? `${selectedData.pickTopPhotos.length}张图片` : '暂无内容'}</span>
            </div>
            <div style={{ display: 'flex', marginBottom: 8 }}>
              <span style={{ color: '#666', width: 80 }}>提交人</span>
              <span style={{ color: '#333' }}>{selectedData?.submitter || '暂无内容'}</span>
            </div>
            <div style={{ display: 'flex', marginBottom: 8 }}>
              <span style={{ color: '#666', width: 80 }}>提交时间</span>
              <span style={{ color: '#333' }}>{selectedData?.submitTime || '暂无内容'}</span>
            </div>
            <div style={{ display: 'flex' }}>
              <span style={{ color: '#666', width: 80 }}>更新时间</span>
              <span style={{ color: '#333' }}>{selectedData?.updateTime || '暂无内容'}</span>
            </div>
          </div>

          {/* 查验照片 */}
          <Form.Item label={<span style={{ fontWeight: 500 }}>查验照片</span>} name="inspectionPhotos">
            <Upload
              {...inspectionUploadProps}
              accept="image/*"
              style={{ width: '100%' }}
            >
              <div
                style={{
                  minHeight: 48,
                  border: '1px dashed #d9d9d9',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#fafafa',
                  color: '#999',
                  cursor: 'pointer',
                }}
              >
                {inspectionFileList.length === 0 ? '暂无内容' : '点击上传'}
              </div>
            </Upload>
          </Form.Item>

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

          <Form.Item style={{ marginTop: 16, marginBottom: 0 }}>
            <Button
              type="primary"
              size="large"
              onClick={handleAddSubmit}
              style={{
                width: 160,
                background: '#52c41a',
                borderColor: '#52c41a',
                height: 48,
                fontSize: 16,
              }}
            >
              挑顶完成
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 选择数据弹窗 */}
      <Modal
        title="选择数据"
        open={selectDataModalOpen}
        onCancel={() => setSelectDataModalOpen(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setSelectDataModalOpen(false)}>取消</Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={() => {
              if (selectedData) {
                setSelectDataModalOpen(false);
              } else {
                message.warning('请先选择一条数据');
              }
            }}
          >
            确定
          </Button>,
        ]}
      >
        <Table
          rowKey="id"
          columns={[
            { title: '入场编号', dataIndex: 'entryCode', width: 120 },
            { title: '提交人', dataIndex: 'submitter', width: 100 },
            { title: '提交时间', dataIndex: 'submitTime', width: 170 },
            { title: '更新时间', dataIndex: 'updateTime', width: 170 },
          ]}
          dataSource={mockData.slice(0, 10)}
          pagination={false}
          rowSelection={{
            type: 'radio',
            selectedRowKeys: selectedData ? [selectedData.id] : [],
            onChange: (keys, rows) => {
              if (rows.length > 0) {
                setSelectedData(rows[0]);
                form.setFieldsValue({ selectedData: rows[0].entryCode });
              }
            },
          }}
          onRow={(record) => ({
            onClick: () => {
              setSelectedData(record);
              form.setFieldsValue({ selectedData: record.entryCode });
            },
          })}
        />
      </Modal>
    </div>
  );
}
