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

const mockData: ComprehensiveDisassemblyItem[] = [
  { id: 1, entryCode: '6G0404', weighDate: '2026-08-02', netWeight: 1.57, weighmaster: '齐志江', disassemblyDate: '2026-08-03', disassembler: '樊志强', vehicleModel: '东风', photos: ['img1', 'img2', 'img3'], price: 14600, submitter: '齐志江', submitTime: '2026-08-02 14:30:20', updateTime: '2026-08-03 08:45:00' },
  { id: 2, entryCode: '6G0414', weighDate: '2026-07-15', netWeight: 1.57, weighmaster: '齐志江', disassemblyDate: '2026-08-03', disassembler: '樊志强', vehicleModel: '东风', photos: ['img4', 'img5', 'img6'], price: 14600, submitter: '齐志江', submitTime: '2026-07-15 10:20:30', updateTime: '2026-08-03 09:10:00' },
  { id: 3, entryCode: '6F0881', weighDate: '2026-06-28', netWeight: 3.36, weighmaster: '齐志江', disassemblyDate: '2026-08-03', disassembler: '樊志强', vehicleModel: '江淮', photos: ['img7', 'img8', 'img9'], price: 14800, submitter: '齐志江', submitTime: '2026-06-28 11:05:15', updateTime: '2026-08-03 09:30:00' },
  { id: 4, entryCode: '6F0631', weighDate: '2026-06-22', netWeight: 1.10, weighmaster: '齐志江', disassemblyDate: '2026-07-31', disassembler: '樊志强', vehicleModel: '丰田', photos: ['img10', 'img11', 'img12'], price: 15000, submitter: '齐志江', submitTime: '2026-06-22 09:45:20', updateTime: '2026-07-31 10:00:00' },
  { id: 5, entryCode: '6G0274', weighDate: '2026-07-10', netWeight: 5.60, weighmaster: '齐志江', disassemblyDate: '2026-07-31', disassembler: '张绒斌', vehicleModel: '奥迪A8L', photos: ['img13', 'img14', 'img15'], price: 32000, submitter: '齐志江', submitTime: '2026-07-10 14:20:50', updateTime: '2026-07-31 10:15:00' },
  { id: 6, entryCode: '6G0438', weighDate: '2026-07-29', netWeight: 1.12, weighmaster: '齐志江', disassemblyDate: '2026-07-31', disassembler: '樊志强', vehicleModel: '长城', photos: ['img16', 'img17', 'img18'], price: 14200, submitter: '齐志江', submitTime: '2026-07-29 09:15:30', updateTime: '2026-07-31 10:30:00' },
  { id: 7, entryCode: '6G0365', weighDate: '2026-07-15', netWeight: 6.37, weighmaster: '齐志江', disassemblyDate: '2026-07-31', disassembler: '张绒斌', vehicleModel: '鲁通', photos: ['img19', 'img20', 'img21'], price: 18500, submitter: '齐志江', submitTime: '2026-07-15 11:45:20', updateTime: '2026-07-31 10:45:00' },
  { id: 8, entryCode: '6F0771', weighDate: '2026-06-26', netWeight: 1.27, weighmaster: '齐志江', disassemblyDate: '2026-07-31', disassembler: '樊志强', vehicleModel: '开瑞', photos: ['img22', 'img23', 'img24'], price: 14000, submitter: '齐志江', submitTime: '2026-06-26 16:30:15', updateTime: '2026-07-31 11:00:00' },
  { id: 9, entryCode: '6G0168', weighDate: '2026-07-07', netWeight: 1.77, weighmaster: '齐志江', disassemblyDate: '2026-07-31', disassembler: '樊志强', vehicleModel: '福田', photos: ['img25', 'img26', 'img27'], price: 14500, submitter: '齐志江', submitTime: '2026-07-07 13:25:40', updateTime: '2026-07-31 11:15:00' },
  { id: 10, entryCode: '6G0435', weighDate: '2026-07-28', netWeight: 1.01, weighmaster: '齐志江', disassemblyDate: '2026-07-30', disassembler: '樊志强', vehicleModel: '五菱', photos: ['img28', 'img29', 'img30'], price: 13800, submitter: '齐志江', submitTime: '2026-07-28 09:05:50', updateTime: '2026-07-30 09:30:00' },
  { id: 11, entryCode: 'P4545', weighDate: '2025-04-27', netWeight: 1.04, weighmaster: '翟鑫鑫', disassemblyDate: '2026-07-30', disassembler: '樊志强', vehicleModel: '驭赛', photos: ['img31', 'img32', 'img33'], price: 13500, submitter: '翟鑫鑫', submitTime: '2025-04-27 10:10:10', updateTime: '2026-07-30 08:45:00' },
  { id: 12, entryCode: '6G0436', weighDate: '2026-07-28', netWeight: 1.04, weighmaster: '齐志江', disassemblyDate: '2026-07-29', disassembler: '樊志强', vehicleModel: '大众', photos: ['img34', 'img35', 'img36'], price: 15200, submitter: '齐志江', submitTime: '2026-07-28 09:03:26', updateTime: '2026-07-29 14:00:00' },
  { id: 13, entryCode: '6G0433', weighDate: '2026-07-26', netWeight: 1.14, weighmaster: '齐志江', disassemblyDate: '2026-07-29', disassembler: '樊志强', vehicleModel: '长城', photos: ['img37', 'img38', 'img39'], price: 14200, submitter: '齐志江', submitTime: '2026-07-26 17:50:20', updateTime: '2026-07-29 14:15:00' },
  { id: 14, entryCode: '6G0006', weighDate: '2026-07-02', netWeight: 1.32, weighmaster: '齐志江', disassemblyDate: '2026-07-29', disassembler: '樊志强', vehicleModel: '雪佛兰', photos: ['img40', 'img41', 'img42'], price: 14800, submitter: '齐志江', submitTime: '2026-07-02 15:40:10', updateTime: '2026-07-29 14:30:00' },
  { id: 15, entryCode: '6G0258', weighDate: '2026-07-09', netWeight: 0.79, weighmaster: '齐志江', disassemblyDate: '2026-07-29', disassembler: '樊志强', vehicleModel: '乐驰', photos: ['img43', 'img44', 'img45'], price: 12500, submitter: '齐志江', submitTime: '2026-07-09 10:25:45', updateTime: '2026-07-29 14:45:00' },
];

const PhotoThumbnails = ({ photos }: { photos: string[] }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {photos.map((_, index) => (
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
  const [dataSource, setDataSource] = useState<ComprehensiveDisassemblyItem[]>(mockData);
  const [total, setTotal] = useState(33449);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchValue, setSearchValue] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [weighmasterSelectOpen, setWeighmasterSelectOpen] = useState(false);
  const [selectedWeighmaster, setSelectedWeighmaster] = useState('');
  const [disassemblerSelectOpen, setDisassemblerSelectOpen] = useState(false);
  const [selectedDisassembler, setSelectedDisassembler] = useState('');

  const weighmasterOptions = ['齐志江', '翟鑫鑫', '张三', '李四', '王五', '赵六'];
  const disassemblerOptions = ['樊志强', '张绒斌', '王瑞', '张三', '李四', '王五'];

  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
    setPageNo(1);
    if (!value) {
      setDataSource(mockData);
      setTotal(33449);
    } else {
      const filtered = mockData.filter(
        (item) =>
          item.entryCode.includes(value) ||
          item.weighmaster.includes(value) ||
          item.vehicleModel.includes(value),
      );
      setDataSource(filtered);
      setTotal(filtered.length);
    }
  }, []);

  const handleAdd = () => {
    form.resetFields();
    setSelectedWeighmaster('');
    setSelectedDisassembler('');
    setAddModalOpen(true);
  };

  const handleAddSubmit = () => {
    form.validateFields().then(() => {
      message.success('综合拆解完成');
      setAddModalOpen(false);
    });
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

  const entryCodeOptions = mockData.map((item) => item.entryCode);

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
              {selectedWeighmaster ? (
                <Tag
                  closable
                  onClose={() => {
                    setSelectedWeighmaster('');
                    form.setFieldValue('weighmaster', '');
                  }}
                  style={{ margin: 0, padding: '4px 8px', fontSize: 14, width: '100%', justifyContent: 'flex-start', border: '1px dashed #d9d9d9', borderRadius: 6 }}
                >
                  <UserOutlined style={{ marginRight: 4, color: '#1890ff' }} />
                  {selectedWeighmaster}
                </Tag>
              ) : (
                <Select
                  placeholder="+ 选择成员"
                  style={{ width: '100%' }}
                  open={weighmasterSelectOpen}
                  onDropdownVisibleChange={(open) => setWeighmasterSelectOpen(open)}
                  suffixIcon={<UserOutlined style={{ color: '#1890ff' }} />}
                  options={weighmasterOptions.map((name) => ({ value: name, label: name }))}
                  onChange={(val) => {
                    setSelectedWeighmaster(val);
                    form.setFieldValue('weighmaster', val);
                    setWeighmasterSelectOpen(false);
                  }}
                />
              )}
            </Form.Item>

            <Form.Item
              label={<span style={{ fontWeight: 500 }}>综合拆解日期</span>}
              name="disassemblyDate"
            >
              <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
            </Form.Item>

            <Form.Item label={<span style={{ fontWeight: 500 }}>综合拆解人员</span>} name="disassembler">
              {selectedDisassembler ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '2px 8px 2px 2px',
                    border: '1px solid #d9d9d9',
                    borderRadius: 6,
                    minHeight: 32,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: '#722ed1',
                        color: '#fff',
                        textAlign: 'center',
                        lineHeight: '22px',
                        fontSize: 12,
                      }}
                    >
                      {selectedDisassembler.charAt(0)}
                    </span>
                    <span>{selectedDisassembler}</span>
                  </div>
                  <span
                    style={{ cursor: 'pointer', color: '#999', fontSize: 14, marginLeft: 4 }}
                    onClick={() => {
                      setSelectedDisassembler('');
                      form.setFieldValue('disassembler', '');
                    }}
                  >
                    ×
                  </span>
                </div>
              ) : (
                <Select
                  placeholder="请选择"
                  style={{ width: '100%' }}
                  open={disassemblerSelectOpen}
                  onDropdownVisibleChange={(open) => setDisassemblerSelectOpen(open)}
                  suffixIcon={<UserOutlined style={{ color: '#1890ff' }} />}
                  options={disassemblerOptions.map((name) => ({ value: name, label: name }))}
                  onChange={(val) => {
                    setSelectedDisassembler(val);
                    form.setFieldValue('disassembler', val);
                    setDisassemblerSelectOpen(false);
                  }}
                />
              )}
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
    </div>
  );
}
