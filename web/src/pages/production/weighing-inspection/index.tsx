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
  Divider,
  Radio,
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
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface WeighingInspectionItem {
  id: number;
  code: string;
  negotiation: string;
  weighDate: string;
  plateNumber: string;
  returnDate: string;
  vehicleType: string;
  vehicleModel: string;
  supplier: string;
  salesperson: string;
  returnLocation: string;
  tonnage: number;
  flatten: string;
  operation: string;
  bLevel: string;
  iron: number;
  aluminum: number;
  ternary: number;
  battery: number;
  tire: number;
  remark: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const mockData: WeighingInspectionItem[] = [
  {
    id: 1, code: 'Y01348', negotiation: '销户', weighDate: '2024-06-02',
    plateNumber: '陕K3Z664', returnDate: '2024-05-31', vehicleType: '3厢',
    vehicleModel: '雪铁龙', supplier: '陕西回收有限公司', salesperson: '张经理',
    returnLocation: '西安', tonnage: 2.35, flatten: '否', operation: '否',
    bLevel: '否', iron: 1.8, aluminum: 0.35, ternary: 0.12, battery: 0.08,
    tire: 0.15, remark: '车况良好', submitter: '李经理', submitTime: '2024-06-02 14:30:00',
    updateTime: '2024-06-02 14:30:00',
  },
  {
    id: 2, code: 'F02908', negotiation: '议价', weighDate: '2024-06-02',
    plateNumber: '陕K800M2', returnDate: '2024-05-31', vehicleType: '双排',
    vehicleModel: '黑豹', supplier: '山西回收有限公司', salesperson: '王经理',
    returnLocation: '太原', tonnage: 3.85, flatten: '否', operation: '否',
    bLevel: '否', iron: 2.8, aluminum: 0.55, ternary: 0.25, battery: 0.15,
    tire: 0.2, remark: '正常', submitter: '李经理', submitTime: '2024-06-02 11:20:00',
    updateTime: '2024-06-02 11:20:00',
  },
  {
    id: 3, code: 'Y01347', negotiation: '销户', weighDate: '2024-06-02',
    plateNumber: '陕KR056K', returnDate: '2024-05-31', vehicleType: '皮卡',
    vehicleModel: '江铃', supplier: '河北废品回收公司', salesperson: '赵经理',
    returnLocation: '石家庄', tonnage: 2.95, flatten: '否', operation: '否',
    bLevel: '否', iron: 2.2, aluminum: 0.42, ternary: 0.18, battery: 0.12,
    tire: 0.18, remark: '', submitter: '李经理', submitTime: '2024-06-02 16:45:00',
    updateTime: '2024-06-02 16:45:00',
  },
  {
    id: 4, code: 'F02907', negotiation: '议价', weighDate: '2024-06-02',
    plateNumber: '陕KKP381', returnDate: '2024-05-31', vehicleType: '越野',
    vehicleModel: '北京', supplier: '太原回收厂', salesperson: '孙经理',
    returnLocation: '太原', tonnage: 2.8, flatten: '否', operation: '否',
    bLevel: '否', iron: 2.1, aluminum: 0.38, ternary: 0.16, battery: 0.1,
    tire: 0.16, remark: 'SUV', submitter: '李经理', submitTime: '2024-06-02 10:15:00',
    updateTime: '2024-06-02 10:15:00',
  },
  {
    id: 5, code: 'F02906', negotiation: '议价', weighDate: '2024-06-02',
    plateNumber: '陕K740F7', returnDate: '2024-05-31', vehicleType: '3厢',
    vehicleModel: '奇瑞', supplier: '晋南物资回收', salesperson: '周经理',
    returnLocation: '临汾', tonnage: 2.45, flatten: '否', operation: '否',
    bLevel: '否', iron: 1.85, aluminum: 0.36, ternary: 0.14, battery: 0.09,
    tire: 0.15, remark: '', submitter: '李经理', submitTime: '2024-06-02 15:30:00',
    updateTime: '2024-06-02 15:30:00',
  },
  {
    id: 6, code: 'F02905', negotiation: '议价', weighDate: '2024-06-02',
    plateNumber: '陕KLN811', returnDate: '2024-05-31', vehicleType: '3厢',
    vehicleModel: '雪佛兰', supplier: '长治回收公司', salesperson: '陈经理',
    returnLocation: '长治', tonnage: 2.55, flatten: '否', operation: '否',
    bLevel: '否', iron: 1.95, aluminum: 0.38, ternary: 0.15, battery: 0.1,
    tire: 0.15, remark: '车况一般', submitter: '李经理', submitTime: '2024-06-02 09:00:00',
    updateTime: '2024-06-02 09:00:00',
  },
  {
    id: 7, code: 'F02904', negotiation: '议价', weighDate: '2024-06-02',
    plateNumber: '鲁PAA534', returnDate: '2024-05-31', vehicleType: '3厢',
    vehicleModel: '江淮', supplier: '大同再生资源', salesperson: '吴经理',
    returnLocation: '大同', tonnage: 2.25, flatten: '否', operation: '否',
    bLevel: '否', iron: 1.7, aluminum: 0.32, ternary: 0.12, battery: 0.08,
    tire: 0.12, remark: '', submitter: '李经理', submitTime: '2024-06-02 13:20:00',
    updateTime: '2024-06-02 13:20:00',
  },
  {
    id: 8, code: 'F02903', negotiation: '议价', weighDate: '2024-06-02',
    plateNumber: '陕L3693U', returnDate: '2024-05-31', vehicleType: '3厢',
    vehicleModel: '丰田', supplier: '晋中回收中心', salesperson: '郑经理',
    returnLocation: '晋中', tonnage: 2.6, flatten: '否', operation: '否',
    bLevel: '否', iron: 2.0, aluminum: 0.4, ternary: 0.15, battery: 0.1,
    tire: 0.15, remark: '已检验', submitter: '李经理', submitTime: '2024-06-02 16:00:00',
    updateTime: '2024-06-02 16:00:00',
  },
  {
    id: 9, code: 'F02902', negotiation: '议价', weighDate: '2024-06-02',
    plateNumber: '陕LX511E', returnDate: '2024-05-31', vehicleType: '面包',
    vehicleModel: '五菱', supplier: '忻州废品回收', salesperson: '冯经理',
    returnLocation: '忻州', tonnage: 1.95, flatten: '否', operation: '否',
    bLevel: '否', iron: 1.5, aluminum: 0.28, ternary: 0.08, battery: 0.06,
    tire: 0.1, remark: '面包车', submitter: '李经理', submitTime: '2024-06-02 11:45:00',
    updateTime: '2024-06-02 11:45:00',
  },
  {
    id: 10, code: 'Y01346', negotiation: '销户', weighDate: '2024-06-01',
    plateNumber: '陕A88888', returnDate: '2024-05-30', vehicleType: '3厢',
    vehicleModel: '大众', supplier: '阳泉再生资源', salesperson: '许经理',
    returnLocation: '阳泉', tonnage: 2.7, flatten: '否', operation: '否',
    bLevel: '否', iron: 2.1, aluminum: 0.42, ternary: 0.16, battery: 0.11,
    tire: 0.16, remark: '车况良好', submitter: '李经理', submitTime: '2024-06-01 15:10:00',
    updateTime: '2024-06-01 15:10:00',
  },
];

const columns: ColumnsType<WeighingInspectionItem> = [
  { title: <span style={{ whiteSpace: 'nowrap' }}>编号</span>, dataIndex: 'code', width: 100, fixed: 'left' },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>销户/议价</span>,
    dataIndex: 'negotiation',
    width: 100,
    fixed: 'left',
    render: (val: string) => (
      <span style={{ color: val === '议价' ? '#fa8c16' : '#52c41a' }}>
        {val === '议价' ? '议价' : '×'}
      </span>
    ),
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>过磅日期</span>, dataIndex: 'weighDate', width: 110 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车牌号</span>, dataIndex: 'plateNumber', width: 130 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>回车日期</span>, dataIndex: 'returnDate', width: 110 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车辆类型</span>, dataIndex: 'vehicleType', width: 100 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车辆型号</span>, dataIndex: 'vehicleModel', width: 90 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>供应商</span>, dataIndex: 'supplier', width: 160, ellipsis: true },
  { title: <span style={{ whiteSpace: 'nowrap' }}>业务员</span>, dataIndex: 'salesperson', width: 90 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>回车地</span>, dataIndex: 'returnLocation', width: 80 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>吨位</span>, dataIndex: 'tonnage', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: <span style={{ whiteSpace: 'nowrap' }}>压扁</span>, dataIndex: 'flatten', width: 70, align: 'center' },
  { title: <span style={{ whiteSpace: 'nowrap' }}>营运</span>, dataIndex: 'operation', width: 70, align: 'center' },
  { title: <span style={{ whiteSpace: 'nowrap' }}>B级</span>, dataIndex: 'bLevel', width: 70, align: 'center' },
  { title: <span style={{ whiteSpace: 'nowrap' }}>铁</span>, dataIndex: 'iron', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: <span style={{ whiteSpace: 'nowrap' }}>铝</span>, dataIndex: 'aluminum', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: <span style={{ whiteSpace: 'nowrap' }}>三元</span>, dataIndex: 'ternary', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: <span style={{ whiteSpace: 'nowrap' }}>电瓶</span>, dataIndex: 'battery', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: <span style={{ whiteSpace: 'nowrap' }}>轮胎</span>, dataIndex: 'tire', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: <span style={{ whiteSpace: 'nowrap' }}>备注</span>, dataIndex: 'remark', width: 150, ellipsis: true },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>提交人</span>,
    dataIndex: 'submitter',
    width: 100,
    render: (val: string) => <span style={{ color: '#1890ff', cursor: 'pointer' }}>{val}</span>,
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>提交时间</span>, dataIndex: 'submitTime', width: 170 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>更新时间</span>, dataIndex: 'updateTime', width: 170 },
];

export default function WeighingInspection() {
  const [dataSource, setDataSource] = useState<WeighingInspectionItem[]>(mockData);
  const [total, setTotal] = useState(1079);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchValue, setSearchValue] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm] = Form.useForm();

  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
    setPageNo(1);
    if (!value) {
      setDataSource(mockData);
      setTotal(1079);
    } else {
      const filtered = mockData.filter(
        (item) =>
          item.code.includes(value) ||
          item.plateNumber.includes(value) ||
          item.supplier.includes(value) ||
          item.salesperson.includes(value),
      );
      setDataSource(filtered);
      setTotal(filtered.length);
    }
  }, []);

  const handleAdd = () => {
    addForm.resetFields();
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

  const handleImport = () => {
    message.info('导入功能开发中');
  };

  const permissionMenuItems = [
    { key: 'all', label: '查看所有数据' },
    { key: 'dept', label: '本部门' },
    { key: 'self', label: '仅自己' },
  ];

  return (
    <div className="page-container" style={{ padding: 0, background: '#f5f5f5', minHeight: '100%' }}>
      <Card style={{ margin: 0, borderRadius: 0 }} bodyStyle={{ padding: 0 }} title={null}>
        {/* 顶部工具栏 */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #f0f0f0', background: '#fff', gap: 8 }}>
          <Dropdown menu={{ items: permissionMenuItems, defaultSelectedKeys: ['all'] }}>
            <Button>全部权限 <DownOutlined /></Button>
          </Dropdown>
          <Button type="link" icon={<EditOutlined />}>编辑</Button>
          <Button type="link" icon={<DatabaseOutlined />}>数据管理</Button>
        </div>

        {/* 操作工具栏 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
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
            <Button icon={<FilterOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}>筛选</Button>
            <ColumnWidthOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} />
            <FullscreenOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} />
            <MoreOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} />
          </Space>
        </div>

        {/* 数据表格 */}
        <div style={{ background: '#fff', padding: '0 16px' }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={dataSource}
            scroll={{ x: 2800 }}
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
      </Card>

      {/* 添加过磅查验弹窗 */}
      <Modal
        title={null}
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        width={720}
        closable={false}
        centered
        styles={{ body: { padding: 0, maxHeight: '85vh', overflowY: 'auto' } }}
        footer={null}
      >
        <div style={{ padding: '16px 32px 24px' }}>
          {/* 标题栏 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>过磅查验</span>
            <Space>
              <FullscreenOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} />
              <span onClick={() => setAddModalOpen(false)} style={{ fontSize: 18, cursor: 'pointer', color: '#999', lineHeight: '20px' }}>×</span>
            </Space>
          </div>

          <Form form={addForm} layout="vertical">
            {/* 基本信息 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
              <Form.Item name="code" label="编号" rules={[{ required: true, message: '请选择编号' }]}>
                <Select placeholder="请选择">
                  {mockData.map(item => (
                    <Select.Option key={item.id} value={item.code}>{item.code}</Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="negotiation" label="销户/议价" rules={[{ required: true, message: '请输入销户/议价' }]}>
                <Input placeholder="请输入" />
              </Form.Item>

              <Form.Item name="weighDate" label="过磅日期" rules={[{ required: true, message: '请选择过磅日期' }]}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="请选择日期" />
              </Form.Item>

              <Form.Item name="plateNumber" label="车牌号" rules={[{ required: true, message: '请选择车牌号' }]}>
                <Select placeholder="请选择">
                  {mockData.map(item => (
                    <Select.Option key={item.id} value={item.plateNumber}>{item.plateNumber}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </div>

            <Form.Item name="returnDate" label="回车日期" rules={[{ required: true, message: '请选择回车日期' }]} style={{ maxWidth: 260 }}>
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="请选择日期" />
            </Form.Item>

            {/* 车辆类型 */}
            <Form.Item name="vehicleType" label="车辆类型" rules={[{ required: true, message: '请选择车辆类型' }]}>
              <Radio.Group>
                <Space direction="vertical" size={[8, 8]}>
                  <Space wrap>
                    <Radio value="2厢40">2厢40</Radio>
                    <Radio value="3厢50">3厢50</Radio>
                    <Radio value="三厢B级75">三厢B级75</Radio>
                    <Radio value="三厢BBA85">三厢BBA85</Radio>
                    <Radio value="面包30">面包30</Radio>
                    <Radio value="大面包50">大面包50</Radio>
                  </Space>
                  <Space wrap>
                    <Radio value="旅行车">旅行车</Radio>
                    <Radio value="小商务40">小商务40</Radio>
                    <Radio value="商务55">商务55</Radio>
                    <Radio value="越野55">越野55</Radio>
                    <Radio value="小越野40">小越野40</Radio>
                    <Radio value="单排30">单排30</Radio>
                    <Radio value="双排30">双排30</Radio>
                  </Space>
                  <Space wrap>
                    <Radio value="皮卡40">皮卡40</Radio>
                    <Radio value="轻卡30">轻卡30</Radio>
                    <Radio value="客车">客车</Radio>
                    <Radio value="中型客车">中型客车</Radio>
                    <Radio value="重型货车">重型货车</Radio>
                    <Radio value="摩托20">摩托20</Radio>
                  </Space>
                  <Space wrap>
                    <Radio value="三轮摩托20">三轮摩托20</Radio>
                    <Radio value="五轮农用车30">五轮农用车30</Radio>
                    <Radio value="箱货40">箱货40</Radio>
                    <Radio value="二轮蹦蹦20">二轮蹦蹦20</Radio>
                    <Radio value="油罐车">油罐车</Radio>
                    <Radio value="自行车15">自行车15</Radio>
                  </Space>
                  <Space wrap>
                    <Radio value="奥拓40">奥拓40</Radio>
                    <Radio value="其他">其他</Radio>
                  </Space>
                </Space>
              </Radio.Group>
            </Form.Item>

            {/* 车辆型号等信息 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
              <Form.Item name="vehicleModel" label="车辆型号" rules={[{ required: true, message: '请选择车辆型号' }]}>
                <Select placeholder="请选择">
                  <Select.Option value="长城">长城</Select.Option>
                  <Select.Option value="奥迪">奥迪</Select.Option>
                  <Select.Option value="五菱">五菱</Select.Option>
                  <Select.Option value="大众">大众</Select.Option>
                  <Select.Option value="吉利">吉利</Select.Option>
                  <Select.Option value="福特">福特</Select.Option>
                  <Select.Option value="丰田">丰田</Select.Option>
                  <Select.Option value="雪佛兰">雪佛兰</Select.Option>
                  <Select.Option value="奇瑞">奇瑞</Select.Option>
                  <Select.Option value="江淮">江淮</Select.Option>
                  <Select.Option value="东风">东风</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item name="supplier" label="供应商">
                <Input placeholder="请输入" />
              </Form.Item>

              <Form.Item name="salesperson" label="业务员">
                <Select placeholder="请选择">
                  <Select.Option value="张经理">张经理</Select.Option>
                  <Select.Option value="王经理">王经理</Select.Option>
                  <Select.Option value="赵经理">赵经理</Select.Option>
                  <Select.Option value="孙经理">孙经理</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item name="returnLocation" label="回车地">
                <Input placeholder="请输入" />
              </Form.Item>
            </div>

            {/* 吨位与状态 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
              <Form.Item name="tonnage" label="吨位" rules={[{ required: true, message: '请输入吨位' }]}>
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="flatten" label="压扁">
                <Radio.Group>
                  <Radio value="是">是</Radio>
                  <Radio value="否">否</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item name="operation" label="营运">
                <Radio.Group>
                  <Radio value="是">是</Radio>
                  <Radio value="否">否</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item name="bLevel" label="B级">
                <Radio.Group>
                  <Radio value="是">是</Radio>
                  <Radio value="否">否</Radio>
                </Radio.Group>
              </Form.Item>
            </div>

            {/* 车辆情况 */}
            <Divider orientation="left" style={{ borderColor: '#1890ff', fontSize: 14, fontWeight: 500 }}>
              车辆情况
            </Divider>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
              <Form.Item name="iron" label="铁">
                <Select placeholder="请选择">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <Select.Option key={n} value={n}>{n}</Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="aluminum" label="铝">
                <Select placeholder="请选择">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <Select.Option key={n} value={n}>{n}</Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="ternary" label="三元" rules={[{ required: true, message: '请选择三元' }]}>
                <Radio.Group>
                  <Radio value="是">是</Radio>
                  <Radio value="否">否</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item name="battery" label="电瓶" rules={[{ required: true, message: '请选择电瓶' }]}>
                <Radio.Group>
                  <Radio value="是">是</Radio>
                  <Radio value="否">否</Radio>
                </Radio.Group>
              </Form.Item>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '0 16px' }}>
              <Form.Item name="tire" label="轮胎">
                <Select placeholder="请选择">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <Select.Option key={n} value={n}>{n}</Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={2} placeholder="请输入备注内容" />
              </Form.Item>
            </div>

            {/* 底部按钮 */}
            <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
              <Button
                type="primary"
                size="large"
                onClick={handleAddSubmit}
                style={{ flex: 1, background: '#00a884', borderColor: '#00a884', height: 44 }}
              >
                提交
              </Button>
              <Button
                size="large"
                onClick={handleSaveDraft}
                style={{ flex: 1, height: 44 }}
              >
                保存草稿
              </Button>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
}
