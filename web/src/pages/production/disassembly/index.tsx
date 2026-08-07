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
  SyncOutlined,
  PictureOutlined,
  UserOutlined,
  InboxOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface DisassemblyItem {
  id: number;
  entryCode: string;
  weighDate: string;
  netWeight: number;
  weighmaster: string;
  operation: string;
  bLevel: string;
  flatten: string;
  iron: number;
  aluminum: number;
  ternary: number;
  battery: number;
  tire: number;
  disassemblyDate: string;
  vehicleType: string;
  vehicleModel: string;
  photos: string[];
  disassembler: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const mockData: DisassemblyItem[] = [
  { id: 1, entryCode: '6F0631', weighDate: '2026-06-22', netWeight: 1.10, weighmaster: '齐志江', operation: '', bLevel: '', flatten: '', iron: 0.80, aluminum: 0.18, ternary: 0.08, battery: 0.04, tire: 0.02, disassemblyDate: '2026-06-23', vehicleType: '2厢40', vehicleModel: '现代', photos: ['img1', 'img2', 'img3'], disassembler: '张三', submitter: '齐志江', submitTime: '2026-06-23 10:30:20', updateTime: '2026-06-23 10:30:20' },
  { id: 2, entryCode: '6G0274', weighDate: '2026-07-10', netWeight: 5.60, weighmaster: '齐志江', operation: '是', bLevel: '', flatten: '', iron: 3.80, aluminum: 0.90, ternary: 0.50, battery: 0.20, tire: 0.15, disassemblyDate: '2026-07-11', vehicleType: '三厢BBA85', vehicleModel: '奥迪', photos: ['img4', 'img5', 'img6'], disassembler: '李四', submitter: '齐志江', submitTime: '2026-07-11 14:20:50', updateTime: '2026-07-11 14:20:50' },
  { id: 3, entryCode: '6G0438', weighDate: '2026-07-29', netWeight: 1.12, weighmaster: '齐志江', operation: '', bLevel: '', flatten: '', iron: 0.75, aluminum: 0.18, ternary: 0.12, battery: 0.03, tire: 0.02, disassemblyDate: '2026-07-30', vehicleType: '3厢50', vehicleModel: '长城', photos: ['img7', 'img8', 'img9'], disassembler: '王五', submitter: '齐志江', submitTime: '2026-07-30 09:15:30', updateTime: '2026-07-30 09:15:30' },
  { id: 4, entryCode: '6G0365', weighDate: '2026-07-15', netWeight: 6.37, weighmaster: '齐志江', operation: '是', bLevel: '', flatten: '', iron: 4.30, aluminum: 1.05, ternary: 0.55, battery: 0.25, tire: 0.18, disassemblyDate: '2026-07-16', vehicleType: '中型客车', vehicleModel: '别克', photos: ['img10', 'img11', 'img12'], disassembler: '赵六', submitter: '齐志江', submitTime: '2026-07-16 11:45:20', updateTime: '2026-07-16 11:45:20' },
  { id: 5, entryCode: '6F0771', weighDate: '2026-06-26', netWeight: 1.27, weighmaster: '齐志江', operation: '是', bLevel: '', flatten: '', iron: 0.90, aluminum: 0.22, ternary: 0.10, battery: 0.05, tire: 0.03, disassemblyDate: '2026-06-27', vehicleType: '3厢50', vehicleModel: '大众', photos: ['img13', 'img14', 'img15'], disassembler: '孙七', submitter: '齐志江', submitTime: '2026-06-27 16:30:15', updateTime: '2026-06-27 16:30:15' },
  { id: 6, entryCode: '6G0168', weighDate: '2026-07-07', netWeight: 1.77, weighmaster: '齐志江', operation: '是', bLevel: '', flatten: '', iron: 1.20, aluminum: 0.30, ternary: 0.15, battery: 0.07, tire: 0.05, disassemblyDate: '2026-07-08', vehicleType: '商务55', vehicleModel: '丰田', photos: ['img16', 'img17', 'img18'], disassembler: '周八', submitter: '齐志江', submitTime: '2026-07-08 13:25:40', updateTime: '2026-07-08 13:25:40' },
  { id: 7, entryCode: 'P4545', weighDate: '2025-04-27', netWeight: 1.04, weighmaster: '翟鑫鑫', operation: '是', bLevel: '', flatten: '', iron: 0.70, aluminum: 0.17, ternary: 0.08, battery: 0.03, tire: 0.02, disassemblyDate: '2025-04-28', vehicleType: '面包30', vehicleModel: '五菱', photos: ['img19', 'img20', 'img21'], disassembler: '吴九', submitter: '翟鑫鑫', submitTime: '2025-04-28 10:10:10', updateTime: '2025-04-28 10:10:10' },
  { id: 8, entryCode: '6G0435', weighDate: '2026-07-28', netWeight: 1.01, weighmaster: '齐志江', operation: '', bLevel: '', flatten: '', iron: 0.65, aluminum: 0.16, ternary: 0.06, battery: 0.02, tire: 0.01, disassemblyDate: '2026-07-29', vehicleType: '面包30', vehicleModel: '五菱', photos: ['img22', 'img23', 'img24'], disassembler: '郑十', submitter: '齐志江', submitTime: '2026-07-29 09:05:50', updateTime: '2026-07-29 09:05:50' },
  { id: 9, entryCode: '6G0436', weighDate: '2026-07-28', netWeight: 1.04, weighmaster: '齐志江', operation: '', bLevel: '', flatten: '', iron: 0.70, aluminum: 0.18, ternary: 0.08, battery: 0.04, tire: 0.02, disassemblyDate: '2026-07-29', vehicleType: '3厢50', vehicleModel: '大众', photos: ['img25', 'img26', 'img27'], disassembler: '钱十一', submitter: '齐志江', submitTime: '2026-07-29 09:03:26', updateTime: '2026-07-29 09:03:26' },
  { id: 10, entryCode: '6G0433', weighDate: '2026-07-26', netWeight: 1.14, weighmaster: '齐志江', operation: '', bLevel: '', flatten: '', iron: 0.80, aluminum: 0.22, ternary: 0.09, battery: 0.05, tire: 0.03, disassemblyDate: '2026-07-27', vehicleType: '3厢50', vehicleModel: '长城', photos: ['img28', 'img29', 'img30'], disassembler: '冯十二', submitter: '齐志江', submitTime: '2026-07-27 17:50:20', updateTime: '2026-07-27 17:50:20' },
  { id: 11, entryCode: '6G0432', weighDate: '2026-07-25', netWeight: 1.26, weighmaster: '齐志江', operation: '是', bLevel: '', flatten: '', iron: 0.85, aluminum: 0.25, ternary: 0.10, battery: 0.06, tire: 0.04, disassemblyDate: '2026-07-26', vehicleType: '3厢50', vehicleModel: '大众', photos: ['img31', 'img32', 'img33'], disassembler: '陈十三', submitter: '齐志江', submitTime: '2026-07-26 15:10:26', updateTime: '2026-07-26 15:10:26' },
  { id: 12, entryCode: '6G0431', weighDate: '2026-07-22', netWeight: 1.05, weighmaster: '齐志江', operation: '', bLevel: '', flatten: '', iron: 0.70, aluminum: 0.18, ternary: 0.07, battery: 0.03, tire: 0.02, disassemblyDate: '2026-07-23', vehicleType: '2厢40', vehicleModel: '众泰', photos: ['img34', 'img35', 'img36'], disassembler: '褚十四', submitter: '齐志江', submitTime: '2026-07-23 14:13:15', updateTime: '2026-07-23 14:13:15' },
  { id: 13, entryCode: '6G0430', weighDate: '2026-07-22', netWeight: 1.31, weighmaster: '齐志江', operation: '是', bLevel: '', flatten: '', iron: 0.90, aluminum: 0.28, ternary: 0.12, battery: 0.05, tire: 0.04, disassemblyDate: '2026-07-23', vehicleType: '3厢50', vehicleModel: '福特', photos: ['img37', 'img38', 'img39'], disassembler: '卫十五', submitter: '齐志江', submitTime: '2026-07-23 14:11:48', updateTime: '2026-07-23 14:11:48' },
  { id: 14, entryCode: '6G0429', weighDate: '2026-07-22', netWeight: 1.08, weighmaster: '齐志江', operation: '', bLevel: '', flatten: '', iron: 0.72, aluminum: 0.20, ternary: 0.08, battery: 0.04, tire: 0.02, disassemblyDate: '2026-07-23', vehicleType: '3厢50', vehicleModel: '现代', photos: ['img40', 'img41', 'img42'], disassembler: '蒋十六', submitter: '齐志江', submitTime: '2026-07-23 14:10:45', updateTime: '2026-07-23 14:10:45' },
  { id: 15, entryCode: '6G0428', weighDate: '2026-07-21', netWeight: 1.19, weighmaster: '齐志江', operation: '是', bLevel: '是', flatten: '', iron: 0.88, aluminum: 0.24, ternary: 0.14, battery: 0.07, tire: 0.05, disassemblyDate: '2026-07-22', vehicleType: '三厢BBA85', vehicleModel: '宝马', photos: ['img43', 'img44', 'img45'], disassembler: '沈十七', submitter: '齐志江', submitTime: '2026-07-22 10:30:22', updateTime: '2026-07-22 10:30:22' },
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

const columns: ColumnsType<DisassemblyItem> = [
  { title: <span style={{ whiteSpace: 'nowrap' }}>入场编号</span>, dataIndex: 'entryCode', width: 100, fixed: 'left' },
  { title: <span style={{ whiteSpace: 'nowrap' }}>过磅日期</span>, dataIndex: 'weighDate', width: 120, fixed: 'left' },
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
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>营运</span>,
    dataIndex: 'operation',
    width: 70,
    render: (val: string) => val === '是' ? '是' : '',
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>B级</span>,
    dataIndex: 'bLevel',
    width: 70,
    render: (val: string) => val === '是' ? '是' : '',
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>压扁</span>,
    dataIndex: 'flatten',
    width: 70,
    render: (val: string) => val === '是' ? '是' : '',
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>铁</span>,
    dataIndex: 'iron',
    width: 80,
    render: (val: number) => <span style={{ textAlign: 'right', display: 'block' }}>{val.toFixed(2)}</span>,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>铝</span>,
    dataIndex: 'aluminum',
    width: 80,
    render: (val: number) => <span style={{ textAlign: 'right', display: 'block' }}>{val.toFixed(2)}</span>,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>三元</span>,
    dataIndex: 'ternary',
    width: 80,
    render: (val: number) => <span style={{ textAlign: 'right', display: 'block' }}>{val.toFixed(2)}</span>,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>电瓶</span>,
    dataIndex: 'battery',
    width: 80,
    render: (val: number) => <span style={{ textAlign: 'right', display: 'block' }}>{val.toFixed(2)}</span>,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>轮胎</span>,
    dataIndex: 'tire',
    width: 80,
    render: (val: number) => <span style={{ textAlign: 'right', display: 'block' }}>{val.toFixed(2)}</span>,
  },
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
    render: (val: string) => (
      <span style={{ color: '#1890ff', cursor: 'pointer' }}>{val}</span>
    ),
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>提交时间</span>, dataIndex: 'submitTime', width: 170 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>更新时间</span>, dataIndex: 'updateTime', width: 170 },
];

export default function Disassembly() {
  const [dataSource, setDataSource] = useState<DisassemblyItem[]>(mockData);
  const [total, setTotal] = useState(33446);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchValue, setSearchValue] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [weighmasterSelectOpen, setWeighmasterSelectOpen] = useState(false);
  const [disassemblerSelectOpen, setDisassemblerSelectOpen] = useState(false);
  const [selectedWeighmaster, setSelectedWeighmaster] = useState('');
  const [selectedDisassembler, setSelectedDisassembler] = useState('');

  const weighmasterOptions = ['齐志江', '翟鑫鑫', '张三', '李四', '王五', '赵六'];
  const disassemblerOptions = ['王瑞', '张三', '李四', '王五', '赵六', '孙七'];

  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
    setPageNo(1);
    if (!value) {
      setDataSource(mockData);
      setTotal(33446);
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
      message.success('拆解完成');
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
            scroll={{ x: 3200 }}
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

      {/* 添加表单弹窗 */}
      <Modal
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        footer={null}
        width={800}
        title={<span style={{ fontSize: 18, fontWeight: 500 }}>6.拆解</span>}
        closable
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark
          initialValues={{
            disassembler: [],
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

            <Form.Item label={<span style={{ fontWeight: 500 }}>司磅员</span>} name="weighmaster">
              {selectedWeighmaster ? (
                <Tag
                  closable
                  onClose={() => {
                    setSelectedWeighmaster('');
                    form.setFieldValue('weighmaster', '');
                  }}
                  style={{ margin: 0, padding: '4px 8px', fontSize: 14 }}
                >
                  <UserOutlined style={{ marginRight: 4 }} />
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

            <Form.Item label={<span style={{ fontWeight: 500 }}>拆解日期</span>} name="disassemblyDate">
              <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
            </Form.Item>

            <Form.Item label={<span style={{ fontWeight: 500 }}>车辆类型</span>} name="vehicleType">
              <Input placeholder="" />
            </Form.Item>

            <Form.Item label={<span style={{ fontWeight: 500 }}>车辆型号</span>} name="vehicleModel">
              <Input placeholder="" />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontWeight: 500 }}>照片</span>}
              name="photos"
              rules={[{ required: true, message: '请上传照片' }]}
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

          <Form.Item label={<span style={{ fontWeight: 500 }}>拆解人员</span>} name="disassembler">
            {selectedDisassembler ? (
              <Tag
                closable
                onClose={() => {
                  setSelectedDisassembler('');
                  form.setFieldValue('disassembler', []);
                }}
                style={{ margin: 0, padding: '4px 8px', fontSize: 14 }}
              >
                <span style={{ display: 'inline-block', width: 20, height: 20, borderRadius: '50%', background: '#722ed1', color: '#fff', textAlign: 'center', lineHeight: '20px', fontSize: 12, marginRight: 4 }}>
                  {selectedDisassembler.charAt(0)}
                </span>
                {selectedDisassembler}
              </Tag>
            ) : (
              <Select
                mode="multiple"
                placeholder=""
                style={{ width: '100%' }}
                open={disassemblerSelectOpen}
                onDropdownVisibleChange={(open) => setDisassemblerSelectOpen(open)}
                suffixIcon={<UserOutlined style={{ color: '#1890ff' }} />}
                options={disassemblerOptions.map((name) => ({ value: name, label: name }))}
                onChange={(val) => {
                  if (Array.isArray(val) && val.length > 0) {
                    setSelectedDisassembler(val[val.length - 1]);
                    form.setFieldValue('disassembler', val);
                  }
                }}
                maxCount={1}
              />
            )}
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
              拆解完成
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
