import { useState, useMemo } from 'react';
import { Table, Tag, Button, Space, Modal, Form, Input, Select, DatePicker, Radio, Checkbox } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import zhCN from 'antd/es/date-picker/locale/zh_CN';
import dayjs, { Dayjs } from 'dayjs';

const { TextArea } = Input;

// 模拟数据
const mockData = [
  {
    id: 1,
    workOrderNo: 'WO-2024-001',
    equipmentInfo: '起重机 QD200-50，资产编号：CR-001',
    repairInfo: '起升机构异响，无法正常起吊',
    department: 'maintenance',
    repairLeader: '张三',
    plannedCompleteTime: '2024-01-15 18:00',
    faultType: 'mechanical',
    processRecord: '更换起升电机轴承，调整制动器间隙，润滑齿轮箱',
    repairResult: 'repaired',
    currentStatus: 'verified',
    createTime: '2024-01-10 09:30',
    actualCompleteTime: '2024-01-14 16:00',
    acceptanceConfirm: true,
    acceptor: '李四',
    acceptanceTime: '2024-01-14 17:00',
    remarks: '建议定期保养',
  },
  {
    id: 2,
    workOrderNo: 'WO-2024-002',
    equipmentInfo: 'PLC控制柜，型号：S7-1500，资产编号：EL-003',
    repairInfo: '通讯中断，无法与上位机通信',
    department: 'electrical',
    repairLeader: '王五',
    plannedCompleteTime: '2024-01-16 12:00',
    faultType: 'network',
    processRecord: '检查通讯模块，更换网线，重新配置IP地址',
    repairResult: 'repaired',
    currentStatus: 'completed',
    createTime: '2024-01-12 14:00',
    actualCompleteTime: '2024-01-12 18:00',
    acceptanceConfirm: false,
    acceptor: '',
    acceptanceTime: '',
    remarks: '',
  },
  {
    id: 3,
    workOrderNo: 'WO-2024-003',
    equipmentInfo: '空调系统，型号：VRV-8P，资产编号：HV-001',
    repairInfo: '制冷效果差，室外机噪音大',
    department: 'maintenance',
    repairLeader: '赵六',
    plannedCompleteTime: '2024-01-20 18:00',
    faultType: 'hardware',
    processRecord: '检查制冷剂压力，清洗冷凝器，更换风机电容',
    repairResult: 'partial',
    currentStatus: 'processing',
    createTime: '2024-01-14 10:00',
    actualCompleteTime: '',
    acceptanceConfirm: false,
    acceptor: '',
    acceptanceTime: '',
    remarks: '需更换压缩机，等待配件',
  },
  {
    id: 4,
    workOrderNo: 'WO-2024-004',
    equipmentInfo: '服务器，型号：DELL R740，资产编号：IT-001',
    repairInfo: '系统崩溃，无法启动',
    department: 'it',
    repairLeader: '孙七',
    plannedCompleteTime: '2024-01-15 20:00',
    faultType: 'software',
    processRecord: '重装操作系统，恢复数据备份，配置服务',
    repairResult: 'repaired',
    currentStatus: 'verified',
    createTime: '2024-01-13 23:30',
    actualCompleteTime: '2024-01-14 10:00',
    acceptanceConfirm: true,
    acceptor: '周八',
    acceptanceTime: '2024-01-14 11:00',
    remarks: '已恢复所有数据',
  },
];

const departmentOptions = [
  { value: 'maintenance', label: '维修部' },
  { value: 'electrical', label: '电气部' },
  { value: 'mechanical', label: '机械部' },
  { value: 'it', label: 'IT部' },
  { value: 'other', label: '其他' },
];

const faultTypeOptions = [
  { value: 'hardware', label: '硬件故障' },
  { value: 'software', label: '软件故障' },
  { value: 'network', label: '网络故障' },
  { value: 'power', label: '电源故障' },
  { value: 'mechanical', label: '机械故障' },
  { value: 'other', label: '其他故障' },
];

const repairResultOptions = [
  { value: 'repaired', label: '已修复' },
  { value: 'partial', label: '部分修复' },
  { value: 'pending', label: '待配件' },
  { value: 'unrepairable', label: '无法修复' },
];

const statusOptions = [
  { value: 'pending', label: '待接单' },
  { value: 'accepted', label: '已接单' },
  { value: 'processing', label: '处理中' },
  { value: 'completed', label: '已完成' },
  { value: 'verified', label: '已验收' },
];

const getStatusTag = (status: string) => {
  const statusMap: Record<string, { color: string; label: string }> = {
    pending: { color: 'default', label: '待接单' },
    accepted: { color: 'processing', label: '已接单' },
    processing: { color: 'blue', label: '处理中' },
    completed: { color: 'success', label: '已完成' },
    verified: { color: 'green', label: '已验收' },
  };
  const item = statusMap[status] || { color: 'default', label: status };
  return <Tag color={item.color}>{item.label}</Tag>;
};

const getResultTag = (result: string) => {
  const resultMap: Record<string, { color: string; label: string }> = {
    repaired: { color: 'success', label: '已修复' },
    partial: { color: 'warning', label: '部分修复' },
    pending: { color: 'processing', label: '待配件' },
    unrepairable: { color: 'error', label: '无法修复' },
  };
  const item = resultMap[result] || { color: 'default', label: result };
  return <Tag color={item.color}>{item.label}</Tag>;
};

export default function RepairWorkOrderList() {
  const [data, setData] = useState(mockData);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<typeof mockData[0] | null>(null);
  const [form] = Form.useForm();
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [searchKeyword, setSearchKeyword] = useState('');

  // 筛选后的数据
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // 时间筛选
      if (dateRange[0] || dateRange[1]) {
        const itemDate = dayjs(item.createTime);
        if (dateRange[0] && itemDate.isBefore(dateRange[0])) {
          return false;
        }
        if (dateRange[1] && itemDate.isAfter(dateRange[1])) {
          return false;
        }
      }
      // 关键词搜索
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        return (
          item.workOrderNo.toLowerCase().includes(keyword) ||
          item.equipmentInfo.toLowerCase().includes(keyword) ||
          item.repairInfo.toLowerCase().includes(keyword) ||
          item.repairLeader.toLowerCase().includes(keyword)
        );
      }
      return true;
    });
  }, [data, dateRange, searchKeyword]);

  const columns = [
    {
      title: '工单编号',
      dataIndex: 'workOrderNo',
      key: 'workOrderNo',
      width: 150,
      fixed: 'left' as const,
    },
    {
      title: '设备/资产信息',
      dataIndex: 'equipmentInfo',
      key: 'equipmentInfo',
      width: 160,
      ellipsis: true,
    },
    {
      title: '报修信息',
      dataIndex: 'repairInfo',
      key: 'repairInfo',
      width: 160,
      ellipsis: true,
    },
    {
      title: '承接部门',
      dataIndex: 'department',
      key: 'department',
      width: 100,
      render: (value: string) => departmentOptions.find(o => o.value === value)?.label || value,
    },
    {
      title: '维修负责人',
      dataIndex: 'repairLeader',
      key: 'repairLeader',
      width: 100,
    },
    {
      title: '故障类型',
      dataIndex: 'faultType',
      key: 'faultType',
      width: 100,
      render: (value: string) => faultTypeOptions.find(o => o.value === value)?.label || value,
    },
    {
      title: '维修结果',
      dataIndex: 'repairResult',
      key: 'repairResult',
      width: 100,
      render: (value: string) => getResultTag(value),
    },
    {
      title: '当前状态',
      dataIndex: 'currentStatus',
      key: 'currentStatus',
      width: 100,
      render: (value: string) => getStatusTag(value),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 130,
    },
    {
      title: '实际完成时间',
      dataIndex: 'actualCompleteTime',
      key: 'actualCompleteTime',
      width: 130,
      render: (value: string) => value || '-',
    },
    {
      title: '验收人',
      dataIndex: 'acceptor',
      key: 'acceptor',
      width: 100,
      render: (value: string) => value || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right' as const,
      render: (_: unknown, record: typeof mockData[0]) => (
        <Space size="middle">
          <Button type="link" size="small" onClick={() => handleView(record)}>
            <EyeOutlined /> 查看
          </Button>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            <EditOutlined /> 编辑
          </Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(record.id)}>
            <DeleteOutlined /> 删除
          </Button>
        </Space>
      ),
    },
  ];

  const handleView = (record: typeof mockData[0]) => {
    setCurrentRecord(record);
    setIsViewModalVisible(true);
  };

  const handleEdit = (record: typeof mockData[0]) => {
    setCurrentRecord(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条工单记录吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setData(data.filter(item => item.id !== id));
        Modal.success({ title: '删除成功' });
      },
    });
  };

  const handleAdd = () => {
    setCurrentRecord(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      if (currentRecord) {
        setData(data.map(item => (item.id === currentRecord.id ? { ...item, ...values } : item)));
        Modal.success({ title: '修改成功' });
      } else {
        const newRecord = {
          ...values,
          id: Date.now(),
        };
        setData([newRecord, ...data]);
        Modal.success({ title: '添加成功' });
      }
      setIsModalVisible(false);
      form.resetFields();
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setIsViewModalVisible(false);
    form.resetFields();
  };

  return (
    <div style={{ padding: 24, background: '#fff', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>维修工单列表</h2>
          <DatePicker.RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates || [null, null])}
            style={{ width: 300 }}
            placeholder={['开始日期', '结束日期']}
          />
          <Input
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索工单编号、设备信息等"
            style={{ width: 250 }}
            allowClear
          />
          <Button type="primary" icon={<SearchOutlined />}>搜索</Button>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加工单
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        scroll={{ x: 1350, y: 'calc(100vh - 200px)' }}
        pagination={{ pageSize: 10 }}
        bordered
      />

      {/* 添加/编辑弹窗 */}
      <Modal
        title={currentRecord ? '编辑维修工单' : '添加维修工单'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={700}
        footer={[
          <Button key="back" onClick={handleCancel}>取消</Button>,
          <Button key="submit" type="primary" onClick={handleOk}>确定</Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px dashed #e8e8e8' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>一、基础信息与设备档案</h3>
            <Form.Item label="工单编号" name="workOrderNo" rules={[{ required: true, message: '请输入工单编号' }]}>
              <Input placeholder="请输入工单编号" />
            </Form.Item>
            <Form.Item label="设备/资产信息" name="equipmentInfo" rules={[{ required: true, message: '请输入设备/资产信息' }]}>
              <TextArea placeholder="请输入设备名称、型号、资产编号等信息" rows={2} />
            </Form.Item>
            <Form.Item label="报修信息" name="repairInfo" rules={[{ required: true, message: '请输入报修信息' }]}>
              <TextArea placeholder="请描述故障现象、报修时间、报修人等信息" rows={2} />
            </Form.Item>
          </div>

          <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px dashed #e8e8e8' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>二、维修执行与过程记录</h3>
            <Form.Item label="承接部门" name="department" rules={[{ required: true, message: '请选择承接部门' }]}>
              <Select placeholder="请选择承接部门" options={departmentOptions} />
            </Form.Item>
            <Form.Item label="维修负责人" name="repairLeader" rules={[{ required: true, message: '请输入维修负责人' }]}>
              <Input placeholder="请输入维修负责人姓名" />
            </Form.Item>
            <Form.Item label="计划完成时间" name="plannedCompleteTime" rules={[{ required: true, message: '请选择计划完成时间' }]}>
              <DatePicker locale={zhCN} showTime={{ format: 'HH:mm' }} format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} placeholder="请选择计划完成时间" />
            </Form.Item>
            <Form.Item label="故障类型" name="faultType" rules={[{ required: true, message: '请选择故障类型' }]}>
              <Select placeholder="请选择故障类型" options={faultTypeOptions} />
            </Form.Item>
            <Form.Item label="处理过程" name="processRecord" rules={[{ required: true, message: '请输入处理过程' }]}>
              <TextArea placeholder="请详细描述维修处理过程、更换部件、调试步骤等" rows={3} />
            </Form.Item>
            <Form.Item label="维修结果" name="repairResult" rules={[{ required: true, message: '请选择维修结果' }]}>
              <Radio.Group options={repairResultOptions} />
            </Form.Item>
          </div>

          <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px dashed #e8e8e8' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>三、当前状态和时间戳</h3>
            <Form.Item label="当前状态" name="currentStatus" rules={[{ required: true, message: '请选择当前状态' }]}>
              <Radio.Group options={statusOptions} />
            </Form.Item>
            <Form.Item label="创建时间" name="createTime" rules={[{ required: true, message: '请选择创建时间' }]}>
              <DatePicker locale={zhCN} showTime={{ format: 'HH:mm' }} format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} placeholder="请选择创建时间" />
            </Form.Item>
            <Form.Item label="实际完成时间" name="actualCompleteTime">
              <DatePicker locale={zhCN} showTime={{ format: 'HH:mm' }} format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} placeholder="请选择实际完成时间" />
            </Form.Item>
          </div>

          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>四、验收与附加信息</h3>
            <Form.Item label="验收确认" name="acceptanceConfirm" valuePropName="checked">
              <Checkbox>本人已验收，确认维修结果符合要求</Checkbox>
            </Form.Item>
            <Form.Item label="验收人" name="acceptor">
              <Input placeholder="请输入验收人姓名" />
            </Form.Item>
            <Form.Item label="验收时间" name="acceptanceTime">
              <DatePicker locale={zhCN} showTime={{ format: 'HH:mm' }} format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} placeholder="请选择验收时间" />
            </Form.Item>
            <Form.Item label="备注" name="remarks">
              <TextArea placeholder="请输入其他备注信息" rows={2} />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* 查看弹窗 */}
      <Modal
        title="查看维修工单详情"
        open={isViewModalVisible}
        onCancel={handleCancel}
        width={700}
        footer={[
          <Button key="close" onClick={handleCancel}>关闭</Button>,
        ]}
      >
        {currentRecord && (
          <div style={{ maxHeight: 600, overflow: 'auto' }}>
            <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px dashed #e8e8e8' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>一、基础信息与设备档案</h3>
              <div style={{ display: 'flex', marginBottom: 8 }}>
                <span style={{ width: 100, fontWeight: 500 }}>工单编号：</span>
                <span>{currentRecord.workOrderNo}</span>
              </div>
              <div style={{ display: 'flex', marginBottom: 8 }}>
                <span style={{ width: 100, fontWeight: 500 }}>设备/资产信息：</span>
                <span>{currentRecord.equipmentInfo}</span>
              </div>
              <div style={{ display: 'flex', marginBottom: 8 }}>
                <span style={{ width: 100, fontWeight: 500 }}>报修信息：</span>
                <span>{currentRecord.repairInfo}</span>
              </div>
            </div>

            <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px dashed #e8e8e8' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>二、维修执行与过程记录</h3>
              <div style={{ display: 'flex', marginBottom: 8 }}>
                <span style={{ width: 100, fontWeight: 500 }}>承接部门：</span>
                <span>{departmentOptions.find(o => o.value === currentRecord.department)?.label || currentRecord.department}</span>
              </div>
              <div style={{ display: 'flex', marginBottom: 8 }}>
                <span style={{ width: 100, fontWeight: 500 }}>维修负责人：</span>
                <span>{currentRecord.repairLeader}</span>
              </div>
              <div style={{ display: 'flex', marginBottom: 8 }}>
                <span style={{ width: 100, fontWeight: 500 }}>计划完成时间：</span>
                <span>{currentRecord.plannedCompleteTime}</span>
              </div>
              <div style={{ display: 'flex', marginBottom: 8 }}>
                <span style={{ width: 100, fontWeight: 500 }}>故障类型：</span>
                <span>{faultTypeOptions.find(o => o.value === currentRecord.faultType)?.label || currentRecord.faultType}</span>
              </div>
              <div style={{ display: 'flex', marginBottom: 8 }}>
                <span style={{ width: 100, fontWeight: 500 }}>处理过程：</span>
                <span>{currentRecord.processRecord}</span>
              </div>
              <div style={{ display: 'flex', marginBottom: 8 }}>
                <span style={{ width: 100, fontWeight: 500 }}>维修结果：</span>
                {getResultTag(currentRecord.repairResult)}
              </div>
            </div>

            <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px dashed #e8e8e8' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>三、当前状态和时间戳</h3>
              <div style={{ display: 'flex', marginBottom: 8 }}>
                <span style={{ width: 100, fontWeight: 500 }}>当前状态：</span>
                {getStatusTag(currentRecord.currentStatus)}
              </div>
              <div style={{ display: 'flex', marginBottom: 8 }}>
                <span style={{ width: 100, fontWeight: 500 }}>创建时间：</span>
                <span>{currentRecord.createTime}</span>
              </div>
              <div style={{ display: 'flex', marginBottom: 8 }}>
                <span style={{ width: 100, fontWeight: 500 }}>实际完成时间：</span>
                <span>{currentRecord.actualCompleteTime || '-'}</span>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>四、验收与附加信息</h3>
              <div style={{ display: 'flex', marginBottom: 8 }}>
                <span style={{ width: 100, fontWeight: 500 }}>验收确认：</span>
                <span>{currentRecord.acceptanceConfirm ? '已确认' : '未确认'}</span>
              </div>
              <div style={{ display: 'flex', marginBottom: 8 }}>
                <span style={{ width: 100, fontWeight: 500 }}>验收人：</span>
                <span>{currentRecord.acceptor || '-'}</span>
              </div>
              <div style={{ display: 'flex', marginBottom: 8 }}>
                <span style={{ width: 100, fontWeight: 500 }}>验收时间：</span>
                <span>{currentRecord.acceptanceTime || '-'}</span>
              </div>
              <div style={{ display: 'flex', marginBottom: 8 }}>
                <span style={{ width: 100, fontWeight: 500 }}>备注：</span>
                <span>{currentRecord.remarks || '-'}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
