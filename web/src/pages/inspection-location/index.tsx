import { useState, useMemo } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, DatePicker, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, EnvironmentOutlined, QrcodeOutlined, SearchOutlined } from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';
import dayjs, { Dayjs } from 'dayjs';

const { TextArea } = Input;


// 模拟数据
const mockData = [
  {
    id: 1,
    name: '拆解车间',
    code: 'LOC-001',
    responsiblePerson: '张三',
    phone: '13800138001',
    inspectionTime: '2024-01-20 10:30',
    status: 'normal',
    inspectionContent: '设备运行正常，无异常情况',
    photos: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=industrial%20workshop%20equipment%20inspection&image_size=square'],
  },
  {
    id: 2,
    name: '磅房',
    code: 'LOC-002',
    responsiblePerson: '李四',
    phone: '13800138002',
    inspectionTime: '2024-01-19 14:00',
    status: 'abnormal',
    inspectionContent: '发现设备异响，已记录并上报维修',
    photos: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=industrial%20machine%20noise%20problem&image_size=square', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=equipment%20maintenance%20report&image_size=square'],
  },
  {
    id: 3,
    name: '代管仓后院',
    code: 'LOC-003',
    responsiblePerson: '王五',
    phone: '13800138003',
    inspectionTime: '2024-01-18 09:00',
    status: 'normal',
    inspectionContent: '电力设备运行正常，各项指标符合标准',
    photos: [],
  },
  {
    id: 4,
    name: '后院库房',
    code: 'LOC-004',
    responsiblePerson: '赵六',
    phone: '13800138004',
    inspectionTime: '2024-01-17 16:30',
    status: 'normal',
    inspectionContent: '物料存放整齐，消防设施完好',
    photos: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=warehouse%20storage%20materials&image_size=square'],
  },
  {
    id: 5,
    name: '启航院',
    code: 'LOC-005',
    responsiblePerson: '孙七',
    phone: '13800138005',
    inspectionTime: '2024-01-15 11:00',
    status: 'abnormal',
    inspectionContent: '部分区域卫生状况不佳，已通知保洁清理',
    photos: [],
  },
];

export default function InspectionLocationList() {
  const [data, setData] = useState(mockData);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [isQrModalVisible, setIsQrModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<typeof mockData[0] | null>(null);
  const [form] = Form.useForm();
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);

  // 筛选后的数据
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // 时间筛选
      if (dateRange[0] || dateRange[1]) {
        const itemDate = dayjs(item.inspectionTime);
        if (dateRange[0] && itemDate.isBefore(dateRange[0])) {
          return false;
        }
        if (dateRange[1] && itemDate.isAfter(dateRange[1])) {
          return false;
        }
      }
      return true;
    });
  }, [data, dateRange]);

  // 重置筛选
  const handleReset = () => {
    setDateRange([null, null]);
  };

  const columns = [
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: '巡检时间',
      dataIndex: 'inspectionTime',
      key: 'inspectionTime',
      width: 160,
    },
    {
      title: '巡检状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value: string) => (
        <span style={{ color: value === 'normal' ? '#52c41a' : '#ff4d4f', fontWeight: 500 }}>
          {value === 'normal' ? '正常' : '异常'}
        </span>
      ),
    },
    {
      title: '巡检内容',
      dataIndex: 'inspectionContent',
      key: 'inspectionContent',
      width: 250,
      ellipsis: true,
    },
    {
      title: '现场照片',
      dataIndex: 'photos',
      key: 'photos',
      width: 100,
      render: (photos: string[]) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          {photos && photos.length > 0 ? (
            photos.map((photo, index) => (
              <img
                key={index}
                src={photo}
                alt={`照片${index + 1}`}
                style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
              />
            ))
          ) : (
            <span style={{ color: '#999', fontSize: '12px' }}>无照片</span>
          )}
        </div>
      ),
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
      content: '确定要删除这个巡检地点吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setData(data.filter(item => item.id !== id));
        message.success('删除成功');
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
        message.success('修改成功');
      } else {
        const newRecord = {
          ...values,
          id: Date.now(),
          inspectionCount: 0,
          lastInspectionTime: '',
        };
        setData([newRecord, ...data]);
        message.success('添加成功');
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <EnvironmentOutlined style={{ fontSize: 20, color: '#1677ff' }} />
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>巡检地点管理</h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon={<QrcodeOutlined />} onClick={() => setIsQrModalVisible(true)}>
            巡检表单二维码
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加地点
          </Button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'center' }}>
        <DatePicker.RangePicker
          value={dateRange}
          onChange={(dates) => setDateRange(dates || [null, null])}
          style={{ width: 300 }}
          placeholder={['开始日期', '结束日期']}
        />
        <Button onClick={handleReset}>重置</Button>
        <Button type="primary" icon={<SearchOutlined />}>搜索</Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        scroll={{ x: 1000, y: 'calc(100vh - 200px)' }}
        pagination={{ pageSize: 10 }}
        bordered
      />

      {/* 添加/编辑弹窗 */}
      <Modal
        title={currentRecord ? '编辑巡检地点' : '添加巡检地点'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={600}
        footer={[
          <Button key="back" onClick={handleCancel}>取消</Button>,
          <Button key="submit" type="primary" onClick={handleOk}>确定</Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="联系电话" name="phone" rules={[{ required: true, message: '请输入联系电话' }]}>
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item label="巡检时间" name="inspectionTime" rules={[{ required: true, message: '请选择巡检时间' }]}>
            <Input placeholder="请选择巡检时间" />
          </Form.Item>
          <Form.Item label="巡检状态" name="status" rules={[{ required: true, message: '请选择巡检状态' }]}>
            <Select 
              placeholder="请选择巡检状态" 
              options={[
                { value: 'normal', label: '正常' },
                { value: 'abnormal', label: '异常' },
              ]} 
            />
          </Form.Item>
          <Form.Item label="巡检内容" name="inspectionContent" rules={[{ required: true, message: '请输入巡检内容' }]}>
            <TextArea placeholder="请描述巡检的具体内容、发现的问题等" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 查看弹窗 */}
      <Modal
        title="查看巡检地点详情"
        open={isViewModalVisible}
        onCancel={handleCancel}
        width={600}
        footer={[
          <Button key="close" onClick={handleCancel}>关闭</Button>,
        ]}
      >
        {currentRecord && (
          <div>
            <div style={{ display: 'flex', marginBottom: 12 }}>
              <span style={{ width: 100, fontWeight: 500 }}>联系电话：</span>
              <span>{currentRecord.phone}</span>
            </div>
            <div style={{ display: 'flex', marginBottom: 12 }}>
              <span style={{ width: 100, fontWeight: 500 }}>巡检时间：</span>
              <span>{currentRecord.inspectionTime}</span>
            </div>
            <div style={{ display: 'flex', marginBottom: 12 }}>
              <span style={{ width: 100, fontWeight: 500 }}>巡检状态：</span>
              <span style={{ color: currentRecord.status === 'normal' ? '#52c41a' : '#ff4d4f', fontWeight: 500 }}>
                {currentRecord.status === 'normal' ? '正常' : '异常'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ width: 100, fontWeight: 500, marginBottom: 8 }}>巡检内容：</span>
              <span>{currentRecord.inspectionContent || '-'}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* 二维码弹窗 */}
      <Modal
        title="巡检表单二维码"
        open={isQrModalVisible}
        onCancel={() => setIsQrModalVisible(false)}
        width={400}
        footer={[
          <Button key="close" onClick={() => setIsQrModalVisible(false)}>关闭</Button>,
        ]}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
          <QRCodeSVG value={`${window.location.origin}/mobile/inspection-form`} size={200} />
          <p style={{ marginTop: '16px', fontSize: '14px', color: '#666' }}>扫描二维码填写巡检表单</p>
          <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
            访问地址：{window.location.origin}/mobile/inspection-form
          </p>
        </div>
      </Modal>
    </div>
  );
}
