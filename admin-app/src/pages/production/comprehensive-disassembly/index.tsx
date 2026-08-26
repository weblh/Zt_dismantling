import { useState } from 'react';
import { useBizDataWithLocal } from '@/hooks/useBizDataWithLocal';
import DataScopeDropdown from '@/components/DataScopeDropdown';
import BizLinkDataModal, { mapLinkedRowToFormValues, PRODUCTION_LINK_SOURCES } from '@/components/BizLinkDataModal';
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
  Upload,
  Tag,
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
  PictureOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface ComprehensiveDisassemblyItem {
  id: number;
  entryCode: string;
  weighDate: string;
  netWeight: number;
  weighmaster: string;
  disassemblyDate: string;
  disassembler: string;
  vehicleModel: string;
  photos: string[];
  price: number;
  submitter: string;
  submitTime: string;
  updateTime: string;
}


const PhotoThumbnails = ({ photos }: { photos?: string[] | null }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {(photos || []).map((_, index) => (
      <div
        key={index}
        style={{
          width: 28,
          height: 28,
          borderRadius: 4,
          background: `linear-gradient(135deg, ${
            ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'][index % 6]
          } 0%, ${['#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#667eea'][index % 6]} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <PictureOutlined style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }} />
      </div>
    ))}
  </div>
);

const columns: ColumnsType<ComprehensiveDisassemblyItem> = [
  { title: <span style={{ whiteSpace: 'nowrap' }}>入场编号</span>, dataIndex: 'entryCode', width: 100, fixed: 'left' },
  { title: <span style={{ whiteSpace: 'nowrap' }}>过磅日期</span>, dataIndex: 'weighDate', width: 120 },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>净重</span>,
    dataIndex: 'netWeight',
    width: 90,
    render: (val: number) => <span style={{ textAlign: 'right', display: 'block' }}>{val.toFixed(2)}</span>,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>司磅员</span>,
    dataIndex: 'weighmaster',
    width: 100,
    render: (val: string) => (
      <span style={{ color: '#1890ff', cursor: 'pointer' }}>{val}</span>
    ),
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
    render: (val: number) =>
      val ? (
        <span style={{ color: '#f5222d', fontWeight: 500, textAlign: 'right', display: 'block' }}>
          {val.toLocaleString()}
        </span>
      ) : (
        <span style={{ color: '#ccc', textAlign: 'right', display: 'block' }}>—</span>
      ),
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

export default function ComprehensiveDisassembly() {
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
  } = useBizDataWithLocal<ComprehensiveDisassemblyItem>('comprehensive-disassembly');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [linkModalOpen, setLinkModalOpen] = useState(false);


  const handleAdd = () => {
    form.resetFields();
    setAddModalOpen(true);
  };

  const handleAddSubmit = async () => {
    try {
      const values = await form.validateFields();
      appendLocal({
        ...values,
        entryCode: values.entryCode || `ZH${Date.now()}`,
      } as Omit<ComprehensiveDisassemblyItem, 'id'>);
      message.success('综合拆解完成，已写入列表');
      setAddModalOpen(false);
    } catch {
      message.error('请填写完整信息');
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

  const entryCodeOptions = dataSource.map((item) => item.entryCode);

  return (
    <div className="page-container">
      <Card styles={{ body: { padding: 0 } }}>
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
            <DataScopeDropdown onChange={setDataScope} />
            <Button type="text" onClick={() => setLinkModalOpen(true)}>联动结账/划价/扣杂</Button>
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
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={onSearch}
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
            scroll={{ x: 1600 }}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            pagination={{
              current: pageNo,
              pageSize,
              total,
              showSizeChanger: true,
              showTotal: (t) => `${pageSize}条/页 · 共 ${t} 条`,
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

      {/* 添加表单弹窗 */}
      <Modal
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        footer={null}
        width={800}
        title={<span style={{ fontSize: 18, fontWeight: 500 }}>7.综合拆解</span>}
        closable
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark
          initialValues={{
            disassembler: '',
            photos: [],
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0 16px' }}>
            <Form.Item
              label={<span style={{ fontWeight: 500 }}>入场编号</span>}
              name="entryCode"
              rules={[{ required: true, message: '请选择入场编号' }]}
            >
              <Select
                placeholder="请选择"
                showSearch
                optionFilterProp="value"
                suffixIcon={<DownOutlined style={{ fontSize: 10 }} />}
                options={entryCodeOptions.map((code) => ({ value: code, label: code }))}
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

            <Form.Item label={<span style={{ fontWeight: 500 }}>综合拆解人员</span>} name="disassembler">
              <DictSelect dict="staff" placeholder="请选择拆解人员（基础资料）" />
            </Form.Item>

            <Form.Item label={<span style={{ fontWeight: 500 }}>车辆型号</span>} name="vehicleModel">
              <Input placeholder="请选择" />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontWeight: 500 }}>车辆照片</span>}
              name="photos"
              rules={[{ required: true, message: '请上传车辆照片' }]}
            >
              <Upload
                listType="picture"
                multiple
                accept="image/*"
                fileList={[]}
                beforeUpload={() => false}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#1890ff', fontSize: 14, cursor: 'pointer' }}>
                  <span style={{ color: '#1890ff' }}>选择</span>
                  <span style={{ color: '#999' }}>拖拽或单...</span>
                </div>
              </Upload>
            </Form.Item>
          </div>

          <Form.Item
            label={<span style={{ fontWeight: 500 }}>价格</span>}
            name="price"
          >
            <InputNumber
              placeholder="请填写数值"
              style={{ width: '100%' }}
              min={0}
              precision={0}
              step={100}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
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
      </Modal>

      <BizLinkDataModal
        open={linkModalOpen}
        onCancel={() => setLinkModalOpen(false)}
        sources={PRODUCTION_LINK_SOURCES}
        onSelect={(row) => {
          form.setFieldsValue(mapLinkedRowToFormValues(row));
          setLinkModalOpen(false);
          setAddModalOpen(true);
        }}
      />
    </div>
  );
}
