import { useEffect, useMemo, useState } from 'react';
import { Table, Tag, Button, Space, Modal, Form, Input, Select, DatePicker, Checkbox, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import zhCN from 'antd/es/date-picker/locale/zh_CN';
import dayjs, { Dayjs } from 'dayjs';
import {
  getLocalBizRows,
  addLocalBizRow,
  updateLocalBizRow,
  deleteLocalBizRows,
  formatBizDateTime,
  hydrateLocalBizRowsFromServer,
} from '@/utils/localBizStore';
import DictSelect from '@/components/DictSelect';
import { getStoredUser } from '@/config/apps';

const { TextArea } = Input;
const BIZ_KEY = 'repair-work-order';

export interface RepairWorkOrderItem {
  id: number;
  workOrderNo: string;
  vehicleInfo: string;
  repairType: 'trailer_repair' | 'maintenance';
  repairContent: string;
  department: string;
  repairLeader: string;
  plannedCompleteTime: string;
  processRecord: string;
  createTime: string;
  actualCompleteTime?: string;
  acceptanceConfirm: boolean;
  acceptor?: string;
  acceptanceTime?: string;
  remarks?: string;
  submitter?: string;
  departmentName?: string;
  deptIds?: string;
}

const departmentOptions = [
  { value: 'maintenance', label: '维修部' },
  { value: 'fleet', label: '车队' },
  { value: 'production', label: '生产部' },
];

const repairTypeOptions = [
  { value: 'trailer_repair', label: '拖车维修' },
  { value: 'maintenance', label: '保养' },
];

export default function ProductionRepairWorkOrder() {
  const [data, setData] = useState<RepairWorkOrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [current, setCurrent] = useState<RepairWorkOrderItem | null>(null);
  const [form] = Form.useForm();
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [keyword, setKeyword] = useState('');

  const refresh = async () => {
    setLoading(true);
    try {
      await hydrateLocalBizRowsFromServer<RepairWorkOrderItem>(BIZ_KEY);
      setData(getLocalBizRows<RepairWorkOrderItem>(BIZ_KEY));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    return data.filter((item) => {
      if (dateRange[0] && dayjs(item.createTime).isBefore(dateRange[0])) return false;
      if (dateRange[1] && dayjs(item.createTime).isAfter(dateRange[1])) return false;
      if (!keyword) return true;
      const k = keyword.toLowerCase();
      return (
        item.workOrderNo.toLowerCase().includes(k) ||
        item.vehicleInfo.toLowerCase().includes(k) ||
        item.repairContent.toLowerCase().includes(k)
      );
    });
  }, [data, dateRange, keyword]);

  const openAdd = () => {
    setCurrent(null);
    form.resetFields();
    form.setFieldsValue({ repairType: 'trailer_repair', createTime: dayjs() });
    setModalOpen(true);
  };

  const openEdit = (record: RepairWorkOrderItem) => {
    setCurrent(record);
    form.setFieldsValue({
      ...record,
      plannedCompleteTime: record.plannedCompleteTime ? dayjs(record.plannedCompleteTime) : undefined,
      createTime: record.createTime ? dayjs(record.createTime) : undefined,
      actualCompleteTime: record.actualCompleteTime ? dayjs(record.actualCompleteTime) : undefined,
      acceptanceTime: record.acceptanceTime ? dayjs(record.acceptanceTime) : undefined,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const user = getStoredUser();
    const now = formatBizDateTime();
    const payload: Omit<RepairWorkOrderItem, 'id'> = {
      workOrderNo: values.workOrderNo,
      vehicleInfo: values.vehicleInfo,
      repairType: values.repairType,
      repairContent: values.repairContent,
      department: values.department,
      departmentName: departmentOptions.find((d) => d.value === values.department)?.label || values.department,
      repairLeader: values.repairLeader,
      plannedCompleteTime: values.plannedCompleteTime?.format('YYYY-MM-DD HH:mm') || '',
      processRecord: values.processRecord || '',
      createTime: values.createTime?.format('YYYY-MM-DD HH:mm') || now,
      actualCompleteTime: values.actualCompleteTime?.format('YYYY-MM-DD HH:mm') || '',
      acceptanceConfirm: values.acceptanceConfirm || false,
      acceptor: values.acceptor || '',
      acceptanceTime: values.acceptanceTime?.format('YYYY-MM-DD HH:mm') || '',
      remarks: values.remarks || '',
      submitter: user.nickname || user.username || '系统',
      deptIds: user.deptIds || '',
    };
    if (current) {
      updateLocalBizRow<RepairWorkOrderItem>(BIZ_KEY, current.id, payload as Partial<RepairWorkOrderItem>);
      message.success('修改成功');
    } else {
      addLocalBizRow<RepairWorkOrderItem>(BIZ_KEY, payload);
      message.success('提交成功');
    }
    await refresh();
    setModalOpen(false);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定删除该维修工单？',
      onOk: async () => {
        deleteLocalBizRows(BIZ_KEY, [id]);
        await refresh();
        message.success('删除成功');
      },
    });
  };

  const columns = [
    { title: '工单编号', dataIndex: 'workOrderNo', width: 140, fixed: 'left' as const },
    {
      title: '类型',
      dataIndex: 'repairType',
      width: 100,
      render: (v: string) =>
        v === 'maintenance' ? <Tag color="blue">保养</Tag> : <Tag color="orange">拖车维修</Tag>,
    },
    { title: '车辆/拖车信息', dataIndex: 'vehicleInfo', width: 180, ellipsis: true },
    { title: '维修/保养内容', dataIndex: 'repairContent', width: 200, ellipsis: true },
    { title: '维修负责人', dataIndex: 'repairLeader', width: 110 },
    { title: '计划完成时间', dataIndex: 'plannedCompleteTime', width: 160 },
    { title: '创建时间', dataIndex: 'createTime', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right' as const,
      render: (_: unknown, record: RepairWorkOrderItem) => (
        <Space>
          <Button type="link" size="small" onClick={() => { setCurrent(record); setViewOpen(true); }}>
            <EyeOutlined /> 查看
          </Button>
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            <EditOutlined /> 编辑
          </Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(record.id)}>
            <DeleteOutlined /> 删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: '#fff', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Space wrap>
          <h2 style={{ margin: 0, fontSize: 18 }}>8.维修工单</h2>
          <DatePicker.RangePicker value={dateRange} onChange={(d) => setDateRange(d || [null, null])} />
          <Input
            placeholder="搜索工单、车辆信息"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 220 }}
            allowClear
          />
          <Button icon={<SearchOutlined />}>搜索</Button>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>添加工单</Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{ pageSize: 10 }}
        bordered
      />

      <Modal
        title={current ? '编辑维修工单' : '添加维修工单'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="workOrderNo" label="工单编号" rules={[{ required: true }]}>
            <Input placeholder="如 WO-2026-001" />
          </Form.Item>
          <Form.Item name="repairType" label="工单类型" rules={[{ required: true }]}>
            <Select options={repairTypeOptions} />
          </Form.Item>
          <Form.Item name="vehicleInfo" label="车辆/拖车信息" rules={[{ required: true }]}>
            <TextArea rows={2} placeholder="车牌号、拖车编号、车型等" />
          </Form.Item>
          <Form.Item name="repairContent" label="维修/保养内容" rules={[{ required: true }]}>
            <TextArea rows={2} placeholder="请填写拖车维修或保养的具体内容" />
          </Form.Item>
          <Form.Item name="department" label="承接部门" rules={[{ required: true }]}>
            <Select options={departmentOptions} />
          </Form.Item>
          <Form.Item name="repairLeader" label="维修负责人" rules={[{ required: true }]}>
            <DictSelect dict="staff" placeholder="请选择负责人（基础资料-生产人员）" />
          </Form.Item>
          <Form.Item name="plannedCompleteTime" label="计划完成时间" rules={[{ required: true }]}>
            <DatePicker locale={zhCN} showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="processRecord" label="处理过程">
            <TextArea rows={3} placeholder="维修过程、更换配件、保养项目等" />
          </Form.Item>
          <Form.Item name="createTime" label="创建时间" rules={[{ required: true }]}>
            <DatePicker locale={zhCN} showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="actualCompleteTime" label="实际完成时间">
            <DatePicker locale={zhCN} showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="acceptanceConfirm" valuePropName="checked">
            <Checkbox>验收确认</Checkbox>
          </Form.Item>
          <Form.Item name="acceptor" label="验收人">
            <DictSelect dict="staff" placeholder="请选择验收人" />
          </Form.Item>
          <Form.Item name="acceptanceTime" label="验收时间">
            <DatePicker locale={zhCN} showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remarks" label="备注">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="维修工单详情" open={viewOpen} onCancel={() => setViewOpen(false)} footer={null} width={640}>
        {current && (
          <div style={{ lineHeight: 2 }}>
            <div><b>工单编号：</b>{current.workOrderNo}</div>
            <div><b>类型：</b>{current.repairType === 'maintenance' ? '保养' : '拖车维修'}</div>
            <div><b>车辆信息：</b>{current.vehicleInfo}</div>
            <div><b>内容：</b>{current.repairContent}</div>
            <div><b>处理过程：</b>{current.processRecord || '-'}</div>
            <div><b>负责人：</b>{current.repairLeader}</div>
            <div><b>计划完成：</b>{current.plannedCompleteTime}</div>
            <div><b>实际完成：</b>{current.actualCompleteTime || '-'}</div>
            <div><b>备注：</b>{current.remarks || '-'}</div>
          </div>
        )}
      </Modal>
    </div>
  );
}
