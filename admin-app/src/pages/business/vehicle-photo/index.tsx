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
  DatePicker,
  Upload,
  Steps,
  Select,
} from 'antd';
import type { UploadFile, UploadProps } from 'antd';
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
  CameraOutlined,
  InboxOutlined,
  PictureOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface PhotoItem {
  id: number;
  photoDate: string;
  images: string[];
  submitter: string;
  submitTime: string;
  updateTime: string;
}

interface AddFormData {
  photoDate: string;
  images: UploadFile[];
}

const photoPlaceholderColors = [
  ['#2d3436', '#636e72', '#b2bec3'],
  ['#6c5ce7', '#a29bfe', '#dfe6e9'],
  ['#e17055', '#fab1a0', '#fdcb6e'],
  ['#00b894', '#55efc4', '#81ecec'],
  ['#0984e3', '#74b9ff', '#a29bfe'],
  ['#d63031', '#e17055', '#fd79a8'],
  ['#fdcb6e', '#ffeaa7', '#fab1a0'],
  ['#00cec9', '#81ecec', '#74b9ff'],
];

const TruckPlaceholder = ({ index }: { index: number }) => {
  const colors = photoPlaceholderColors[index % photoPlaceholderColors.length];
  return (
    <div
      style={{
        width: 88,
        height: 66,
        borderRadius: 6,
        background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid #f0f0f0',
        cursor: 'pointer',
      }}
    >
      <svg
        width="50"
        height="36"
        viewBox="0 0 60 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.9 }}
      >
        <rect x="2" y="4" width="28" height="22" rx="2" fill="#2d3436" />
        <rect x="30" y="10" width="18" height="16" rx="1" fill="#636e72" />
        <rect x="48" y="14" width="10" height="12" rx="1" fill="#b2bec3" />
        <circle cx="14" cy="28" r="5" fill="#2d3436" />
        <circle cx="14" cy="28" r="2.5" fill="#636e72" />
        <circle cx="40" cy="28" r="5" fill="#2d3436" />
        <circle cx="40" cy="28" r="2.5" fill="#636e72" />
      </svg>
      <div
        style={{
          position: 'absolute',
          bottom: 2,
          right: 4,
          fontSize: 10,
          color: '#fff',
          opacity: 0.7,
        }}
      >
        <CameraOutlined />
      </div>
    </div>
  );
};

const mockData: PhotoItem[] = Array.from({ length: 30 }).map((_, i) => {
  const day = 30 - i;
  const dateStr = `2026-06-${String(day).padStart(2, '0')}`;
  const hour = 9 + (i % 12);
  const minute = (i * 7) % 60;
  const second = (i * 13) % 60;
  const timeStr = `${dateStr} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
  return {
    id: i + 1,
    photoDate: dateStr,
    images: [`img-${i}-1`, `img-${i}-2`],
    submitter: '齐志江',
    submitTime: timeStr,
    updateTime: timeStr,
  };
});

const columns: ColumnsType<PhotoItem> = [
  {
    title: '日期时间',
    dataIndex: 'photoDate',
    width: 130,
  },
  {
    title: '图片',
    dataIndex: 'images',
    width: 200,
    render: (_: string[], record: PhotoItem) => (
      <div style={{ display: 'flex', gap: 8 }}>
        <TruckPlaceholder index={record.id * 2} />
        <TruckPlaceholder index={record.id * 2 + 1} />
      </div>
    ),
  },
  {
    title: '提交人',
    dataIndex: 'submitter',
    width: 100,
    render: (val: string) => (
      <span style={{ color: '#1890ff', cursor: 'pointer' }}>{val}</span>
    ),
  },
  {
    title: '提交时间',
    dataIndex: 'submitTime',
    width: 170,
  },
  {
    title: '更新时间',
    dataIndex: 'updateTime',
    width: 170,
  },
];

export default function VehiclePhotoPage() {
  const [dataSource, setDataSource] = useState<PhotoItem[]>(mockData);
  const [total, setTotal] = useState(426);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchValue, setSearchValue] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState(0);
  const [importMode, setImportMode] = useState('onlyAdd');
  const [importFileList, setImportFileList] = useState<UploadFile[]>([]);
  const [addForm] = Form.useForm<AddFormData>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
    setPageNo(1);
    if (!value) {
      setDataSource(mockData);
      setTotal(426);
    } else {
      const filtered = mockData.filter(
        (item) => item.submitter.includes(value) || item.photoDate.includes(value),
      );
      setDataSource(filtered);
      setTotal(filtered.length);
    }
  }, []);

  const handleAdd = () => {
    addForm.resetFields();
    setFileList([]);
    setAddModalOpen(true);
  };

  const handleAddSubmit = async () => {
    try {
      const values = await addForm.validateFields();
      console.log('提交数据:', values);
      message.success('提交成功！');
      setAddModalOpen(false);
    } catch {
      // validation failed
    }
  };

  const handleSaveDraft = () => {
    message.success('草稿保存成功！');
    setAddModalOpen(false);
  };

  const handleImport = () => {
    setImportStep(0);
    setImportMode('onlyAdd');
    setImportFileList([]);
    setImportModalOpen(true);
  };

  const handleImportFileChange: UploadProps['onChange'] = ({ fileList: newList }) => {
    setImportFileList(newList);
  };

  const handleImportBeforeUpload: UploadProps['beforeUpload'] = (file) => {
    const isValidExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    if (!isValidExcel) {
      message.error('只支持 xlsx 或 xls 格式文件!');
    }
    return false;
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

  const handleUploadChange: UploadProps['onChange'] = ({ fileList: newList }) => {
    setFileList(newList);
  };

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    const isLt20M = file.size / 1024 / 1024 < 20;
    if (!isLt20M) {
      message.error('图片大小不能超过20MB!');
    }
    return false;
  };

  const permissionMenuItems = [
    { key: 'all', label: '全部权限' },
    { key: 'dept', label: '本部门' },
    { key: 'self', label: '仅自己' },
  ];

  const uploadDraggerProps: UploadProps = {
    fileList,
    beforeUpload,
    onChange: handleUploadChange,
    accept: 'image/*',
    listType: 'picture',
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
          <Dropdown
            menu={{ items: permissionMenuItems, defaultSelectedKeys: ['all'] }}
          >
            <Button>
              全部权限 <DownOutlined />
            </Button>
          </Dropdown>
          <Button type="link" icon={<PlusOutlined />}>
            新建视图
          </Button>
          <Button type="link" icon={<EditOutlined />}>
            编辑
          </Button>
          <Button type="link" icon={<DatabaseOutlined />}>
            数据管理
          </Button>
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
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加
            </Button>
            <Button icon={<ImportOutlined />} onClick={handleImport}>
              导入
            </Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              导出
            </Button>
            <Button icon={<DeleteOutlined />} onClick={handleDelete}>
              删除
            </Button>
            <Button
              icon={<MoreOutlined />}
              type="text"
              style={{ border: 'none', padding: '0 8px' }}
            />
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
              style={{
                background: '#52c41a',
                borderColor: '#52c41a',
                color: '#fff',
              }}
            >
              筛选
            </Button>
            <ColumnWidthOutlined
              style={{ fontSize: 16, cursor: 'pointer', color: '#666' }}
            />
            <FullscreenOutlined
              style={{ fontSize: 16, cursor: 'pointer', color: '#666' }}
            />
            <MoreOutlined
              style={{ fontSize: 16, cursor: 'pointer', color: '#666' }}
            />
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
              showTotal: (t) => `共 ${t} 条`,
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
      </Card>

      {/* 添加弹窗 */}
      <Modal
        title={null}
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        width={640}
        closable={false}
        styles={{ body: { padding: 0 } }}
        footer={
          <div style={{ display: 'flex', gap: 16 }}>
            <Button
              type="primary"
              size="large"
              onClick={handleAddSubmit}
              style={{ flex: 1, background: '#00a884', borderColor: '#00a884' }}
            >
              提交
            </Button>
            <Button
              size="large"
              onClick={handleSaveDraft}
              style={{ flex: 1 }}
            >
              保存草稿
            </Button>
          </div>
        }
      >
        <div style={{ padding: '16px 32px 0' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 24,
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>
              异地车回车照片
            </span>
            <Space>
              <FullscreenOutlined
                style={{ fontSize: 16, cursor: 'pointer', color: '#666' }}
              />
              <span
                onClick={() => setAddModalOpen(false)}
                style={{
                  fontSize: 18,
                  cursor: 'pointer',
                  color: '#999',
                  lineHeight: '20px',
                }}
              >
                ×
              </span>
            </Space>
          </div>

          <Form
            form={addForm}
            layout="vertical"
            initialValues={{
              photoDate: undefined,
            }}
          >
            <Form.Item
              label="日期时间"
              name="photoDate"
              rules={[{ required: true, message: '请选择日期' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="YYYY-MM-DD"
              />
            </Form.Item>

            <Form.Item label="图片" name="images">
              <Upload.Dragger {...uploadDraggerProps} style={{ padding: '12px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: '#00a884', cursor: 'pointer', fontSize: 14 }}>
                    选择
                  </span>
                  <span style={{ color: '#999', fontSize: 13 }}>
                    拖拽或单击后粘贴图片，单张20MB以内
                  </span>
                  <PictureOutlined style={{ fontSize: 24, color: '#666' }} />
                </div>
              </Upload.Dragger>
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* 导入Excel数据弹窗 */}
      <Modal
        title={null}
        open={importModalOpen}
        onCancel={() => setImportModalOpen(false)}
        width={780}
        closable={false}
        centered
        styles={{ body: { padding: 0, maxHeight: '80vh', overflowY: 'auto' } }}
        footer={null}
      >
        <div style={{ padding: '16px 32px 24px' }}>
          {/* 标题栏 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 24,
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>
              导入 Excel 数据
            </span>
            <Space>
              <FullscreenOutlined
                style={{ fontSize: 16, cursor: 'pointer', color: '#666' }}
              />
              <span
                onClick={() => setImportModalOpen(false)}
                style={{
                  fontSize: 18,
                  cursor: 'pointer',
                  color: '#999',
                  lineHeight: '20px',
                }}
              >
                ×
              </span>
            </Space>
          </div>

          {/* 步骤条 */}
          <Steps
            current={importStep}
            items={[
              { title: '选择Excel', icon: '1' },
              { title: '预览数据', icon: '2' },
              { title: '配置表单', icon: '3' },
              { title: '导入数据', icon: '4' },
            ]}
            style={{ marginBottom: 24 }}
          />

          {/* 导入模式 */}
          <div style={{ marginBottom: 24 }}>
            <span style={{ fontSize: 14, color: '#333', marginRight: 12 }}>
              导入模式
            </span>
            <Select
              value={importMode}
              onChange={setImportMode}
              style={{ width: 200 }}
              options={[
                { value: 'onlyAdd', label: '仅新增数据' },
                { value: 'updateAndAdd', label: '更新并新增' },
                { value: 'onlyUpdate', label: '仅更新数据' },
              ]}
            />
          </div>

          {/* 提示信息 */}
          <div
            style={{
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: 4,
              padding: '16px 20px',
              marginBottom: 24,
            }}
          >
            <div style={{ color: '#333', fontSize: 13, lineHeight: 2 }}>
              <div>
                • 支持 20MB 的xlsx格式文件或 5MB 的xls格式文件，行数不超过10万行，列数不超过500列，推荐使用
                <a style={{ color: '#1890ff', cursor: 'pointer' }}>标准模板</a>
              </div>
              <div>
                • 若导入存在部门成员字段，则不能超过1万行
              </div>
              <div>
                • 更多导入说明和示例，请查看
                <a style={{ color: '#1890ff', cursor: 'pointer' }}>帮助文档</a>
              </div>
            </div>
          </div>

          {/* 文件上传区域 */}
          <Upload.Dragger
            fileList={importFileList}
            beforeUpload={handleImportBeforeUpload}
            onChange={handleImportFileChange}
            accept=".xlsx,.xls"
            style={{ padding: '24px 0' }}
          >
            <CloudUploadOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
            <div style={{ color: '#666', fontSize: 14 }}>
              将文件拖拽到此区域，或
              <a style={{ color: '#1890ff', cursor: 'pointer' }}>点击添加</a>
            </div>
          </Upload.Dragger>
        </div>
      </Modal>
    </div>
  );
}
