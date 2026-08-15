import React, { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Modal,
  Form,
  Select,
  DatePicker,
  Tag,
  message,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  ImportOutlined,
  ExportOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  HistoryOutlined,
  RollbackOutlined,
  SearchOutlined,
  FilterOutlined,
  ColumnHeightOutlined,
  SettingOutlined,
  MoreOutlined,
  InboxOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { productLibrary, type ProductItem } from '../productLibrary';

interface InboundItem {
  key: string;
  inboundType: string;
  inboundWarehouse: string;
  productType: string;
  detail: string;
  total: string;
  inboundTonnage: number;
  inboundTime: string;
  inboundStaff: string;
  department: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

interface ProductDetailRow {
  key: string;
  relatedProduct: string;
  productType: string;
  detail: string;
  tonnage: number | string;
}

const inboundTypeOptions = ['生产入库', '回收入库', '调拨入库'];
const warehouseOptions = ['成品库', '三元库', '废旧鞋帽库'];
const productTypeOptions = [
  '废钢',
  '废铜',
  '废铝',
  '废塑料',
  '废轮胎',
  '废电瓶',
  '废电机',
  '小件',
  '底盘料',
  '撕碎料',
  '橡胶',
  '有色金属',
];

const staffList = ['李闯闯', '张鹤鸣', '王操作员', '范亚飞'];
const departmentList = ['财经运营部', '仓储部', '生产部'];

const mockData: InboundItem[] = [
  { key: '1', inboundType: '生产入库', inboundWarehouse: '成品库', productType: '撕碎料', detail: '后尾牌', total: '74', inboundTonnage: 0.244, inboundTime: '2026-04-30 18:16:59', inboundStaff: '李闯闯', department: '财经运营部', submitter: '李闯闯', submitTime: '2025-05-03 10:22:22', updateTime: '2025-05-03 10:22:22' },
  { key: '2', inboundType: '生产入库', inboundWarehouse: '成品库', productType: '撕碎料', detail: '后尾牌', total: '74', inboundTonnage: 0.244, inboundTime: '2026-04-30 18:16:59', inboundStaff: '李闯闯', department: '财经运营部', submitter: '李闯闯', submitTime: '2025-05-03 10:22:22', updateTime: '2025-05-03 10:22:22' },
  { key: '3', inboundType: '生产入库', inboundWarehouse: '成品库', productType: '撕碎料', detail: '后视镜', total: '15', inboundTonnage: 0.257, inboundTime: '2026-04-30 18:16:59', inboundStaff: '李闯闯', department: '财经运营部', submitter: '李闯闯', submitTime: '2025-05-03 10:22:22', updateTime: '2025-05-03 10:22:22' },
  { key: '4', inboundType: '生产入库', inboundWarehouse: '成品库', productType: '撕碎料', detail: '后尾牌', total: '1', inboundTonnage: 0.154, inboundTime: '2026-04-30 18:16:59', inboundStaff: '李闯闯', department: '财经运营部', submitter: '李闯闯', submitTime: '2025-05-03 10:22:22', updateTime: '2025-05-03 10:22:22' },
  { key: '5', inboundType: '生产入库', inboundWarehouse: '成品库', productType: '撕碎料', detail: '方向盘', total: '1', inboundTonnage: 0.154, inboundTime: '2026-04-30 18:16:59', inboundStaff: '李闯闯', department: '财经运营部', submitter: '李闯闯', submitTime: '2025-05-03 10:22:22', updateTime: '2025-05-03 10:22:22' },
  { key: '6', inboundType: '生产入库', inboundWarehouse: '成品库', productType: '撕碎料', detail: '安全气囊', total: '1', inboundTonnage: 0.427, inboundTime: '2026-04-30 18:16:59', inboundStaff: '李闯闯', department: '财经运营部', submitter: '李闯闯', submitTime: '2025-05-03 10:22:22', updateTime: '2025-05-03 10:22:22' },
  { key: '7', inboundType: '生产入库', inboundWarehouse: '成品库', productType: '撕碎料', detail: '座椅', total: '1', inboundTonnage: 0.007, inboundTime: '2026-04-30 18:16:59', inboundStaff: '李闯闯', department: '财经运营部', submitter: '李闯闯', submitTime: '2025-05-03 10:22:22', updateTime: '2025-05-03 10:22:22' },
  { key: '8', inboundType: '生产入库', inboundWarehouse: '成品库', productType: '废钢', detail: '变速箱钢', total: '20', inboundTonnage: 20.51, inboundTime: '2026-04-30 18:16:59', inboundStaff: '李闯闯', department: '财经运营部', submitter: '李闯闯', submitTime: '2025-05-03 10:22:22', updateTime: '2025-05-03 10:22:22' },
  { key: '9', inboundType: '生产入库', inboundWarehouse: '成品库', productType: '废钢', detail: '合金圆钢', total: '1', inboundTonnage: 20, inboundTime: '2026-04-30 18:16:59', inboundStaff: '李闯闯', department: '财经运营部', submitter: '李闯闯', submitTime: '2025-05-03 10:22:22', updateTime: '2025-05-03 10:22:22' },
  { key: '10', inboundType: '生产入库', inboundWarehouse: '成品库', productType: '废钢', detail: '收废钢', total: '1', inboundTonnage: 22.01, inboundTime: '2026-04-30 18:16:59', inboundStaff: '李闯闯', department: '财经运营部', submitter: '李闯闯', submitTime: '2025-05-03 10:22:22', updateTime: '2025-05-03 10:22:22' },
  { key: '11', inboundType: '生产入库', inboundWarehouse: '成品库', productType: '废塑料', detail: '小车饰板', total: '1', inboundTonnage: 22.01, inboundTime: '2026-04-30 18:16:59', inboundStaff: '李闯闯', department: '财经运营部', submitter: '李闯闯', submitTime: '2025-05-03 10:22:22', updateTime: '2025-05-03 10:22:22' },
  { key: '12', inboundType: '生产入库', inboundWarehouse: '成品库', productType: '废塑料', detail: 'ABS+TPU饰板', total: '1', inboundTonnage: 7.69, inboundTime: '2026-04-30 18:16:59', inboundStaff: '李闯闯', department: '财经运营部', submitter: '李闯闯', submitTime: '2025-05-03 10:22:22', updateTime: '2025-05-03 10:22:22' },
  { key: '13', inboundType: '生产入库', inboundWarehouse: '成品库', productType: '废塑料', detail: '聚酯车用件(保险杠)', total: '1', inboundTonnage: 6, inboundTime: '2026-04-30 18:16:59', inboundStaff: '李闯闯', department: '财经运营部', submitter: '李闯闯', submitTime: '2025-05-03 10:22:22', updateTime: '2025-05-03 10:22:22' },
  { key: '14', inboundType: '生产入库', inboundWarehouse: '成品库', productType: '废塑料', detail: '排气件饰板', total: '1', inboundTonnage: 13, inboundTime: '2026-04-30 18:16:59', inboundStaff: '李闯闯', department: '财经运营部', submitter: '李闯闯', submitTime: '2025-05-03 10:22:22', updateTime: '2025-05-03 10:22:22' },
  { key: '15', inboundType: '生产入库', inboundWarehouse: '成品库', productType: '废塑料', detail: '挡泥板', total: '1', inboundTonnage: 3.94, inboundTime: '2026-04-30 18:16:59', inboundStaff: '李闯闯', department: '财经运营部', submitter: '李闯闯', submitTime: '2025-05-03 10:22:22', updateTime: '2025-05-03 10:22:22' },
  { key: '16', inboundType: '生产入库', inboundWarehouse: '成品库', productType: '橡胶', detail: '轮胎', total: '1', inboundTonnage: 1.63, inboundTime: '2026-04-30 18:16:59', inboundStaff: '李闯闯', department: '财经运营部', submitter: '李闯闯', submitTime: '2025-05-03 10:22:22', updateTime: '2025-05-03 10:22:22' },
  { key: '17', inboundType: '生产入库', inboundWarehouse: '成品库', productType: '铝件', detail: '铝水箱', total: '1', inboundTonnage: 0.5, inboundTime: '2026-04-30 18:16:59', inboundStaff: '李闯闯', department: '财经运营部', submitter: '李闯闯', submitTime: '2025-05-03 10:22:22', updateTime: '2025-05-03 10:22:22' },
  { key: '18', inboundType: '生产入库', inboundWarehouse: '成品库', productType: '铝件', detail: '铝压块', total: '1', inboundTonnage: 4.5, inboundTime: '2026-04-30 18:16:59', inboundStaff: '李闯闯', department: '财经运营部', submitter: '李闯闯', submitTime: '2025-05-03 10:22:22', updateTime: '2025-05-03 10:22:22' },
  { key: '19', inboundType: '生产入库', inboundWarehouse: '成品库', productType: '铝件', detail: '废铝（铝）', total: '1', inboundTonnage: 1.1, inboundTime: '2026-04-30 18:16:59', inboundStaff: '李闯闯', department: '财经运营部', submitter: '李闯闯', submitTime: '2025-05-03 10:22:22', updateTime: '2025-05-03 10:22:22' },
  { key: '20', inboundType: '生产入库', inboundWarehouse: '成品库', productType: '铝件', detail: '铝活塞', total: '1', inboundTonnage: 1, inboundTime: '2026-04-30 18:16:59', inboundStaff: '李闯闯', department: '财经运营部', submitter: '李闯闯', submitTime: '2025-05-03 10:22:22', updateTime: '2025-05-03 10:22:22' },
  { key: '21', inboundType: '生产入库', inboundWarehouse: '成品库', productType: '铝件', detail: '齿轮室', total: '1', inboundTonnage: 2.5, inboundTime: '2026-04-30 18:16:59', inboundStaff: '李闯闯', department: '财经运营部', submitter: '李闯闯', submitTime: '2025-05-03 10:22:22', updateTime: '2025-05-03 10:22:22' },
];

export default function ProductInbound() {
  const [form] = Form.useForm();
  const [formVisible, setFormVisible] = useState(false);
  const [selectModalVisible, setSelectModalVisible] = useState(false);
  const [selectTargetKey, setSelectTargetKey] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [librarySelectedKeys, setLibrarySelectedKeys] = useState<React.Key[]>([]);
  const [data, setData] = useState<InboundItem[]>(mockData);
  const [searchText, setSearchText] = useState('');
  const [librarySearchText, setLibrarySearchText] = useState('');
  const [productRows, setProductRows] = useState<ProductDetailRow[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>(['张鹤鸣']);
  const [selectedDept, setSelectedDept] = useState<string[]>(['财经运营部']);

  const filteredData = data.filter(
    (item) =>
      item.productType.includes(searchText) ||
      item.detail.includes(searchText) ||
      item.inboundType.includes(searchText)
  );

  const filteredLibrary = productLibrary.filter(
    (item) =>
      item.productType.includes(librarySearchText) ||
      item.detail.includes(librarySearchText)
  );

  const columns: ColumnsType<InboundItem> = [
    {
      title: '入库类型',
      dataIndex: 'inboundType',
      width: 100,
      sorter: (a, b) => a.inboundType.localeCompare(b.inboundType),
    },
    {
      title: '入库仓库',
      dataIndex: 'inboundWarehouse',
      width: 110,
      sorter: (a, b) => a.inboundWarehouse.localeCompare(b.inboundWarehouse),
    },
    {
      title: '产品类型',
      dataIndex: 'productType',
      width: 100,
      sorter: (a, b) => a.productType.localeCompare(b.productType),
    },
    {
      title: '明细',
      dataIndex: 'detail',
      width: 130,
      sorter: (a, b) => a.detail.localeCompare(b.detail),
    },
    {
      title: '合计',
      dataIndex: 'total',
      width: 60,
      align: 'right',
    },
    {
      title: '入库吨位',
      dataIndex: 'inboundTonnage',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.inboundTonnage - b.inboundTonnage,
      render: (text: number) => text.toFixed(3),
    },
    {
      title: '入库时间',
      dataIndex: 'inboundTime',
      width: 160,
      sorter: (a, b) => a.inboundTime.localeCompare(b.inboundTime),
    },
    {
      title: '入库员',
      dataIndex: 'inboundStaff',
      width: 100,
      render: (text: string) => <a style={{ color: '#1890ff' }}>{text}</a>,
    },
    {
      title: '库管归属部门',
      dataIndex: 'department',
      width: 130,
    },
    {
      title: '提交人',
      dataIndex: 'submitter',
      width: 100,
      render: (text: string) => <a style={{ color: '#1890ff' }}>{text}</a>,
    },
    {
      title: '提交时间',
      dataIndex: 'submitTime',
      width: 160,
      sorter: (a, b) => a.submitTime.localeCompare(b.submitTime),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      width: 160,
      sorter: (a, b) => a.updateTime.localeCompare(b.updateTime),
    },
  ];

  const handleAdd = () => {
    form.resetFields();
    setProductRows([]);
    setSelectedStaff(['张鹤鸣']);
    setSelectedDept(['财经运营部']);
    setFormVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const now = new Date();
      const timeStr = now.toISOString().slice(0, 16).replace('T', ' ');
      const newItems: InboundItem[] = productRows.map((row) => ({
        key: Date.now().toString() + row.key,
        inboundType: values.inboundType,
        inboundWarehouse: values.inboundWarehouse,
        productType: row.productType,
        detail: row.detail,
        total: String(row.tonnage || ''),
        inboundTonnage: Number(row.tonnage) || 0,
        inboundTime: values.inboundTime ? values.inboundTime.format('YYYY-MM-DD HH:mm:ss') : timeStr,
        inboundStaff: selectedStaff.join('、'),
        department: selectedDept.join('、'),
        submitter: '当前用户',
        submitTime: timeStr,
        updateTime: timeStr,
      }));
      setData([...newItems, ...data]);
      setFormVisible(false);
      message.success('添加成功');
    } catch {
      message.warning('请完善表单信息');
    }
  };

  const handleCancel = () => {
    setFormVisible(false);
  };

  const handleDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的记录');
      return;
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 条记录吗？`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        setData(data.filter((item) => !selectedRowKeys.includes(item.key)));
        setSelectedRowKeys([]);
        message.success('删除成功');
      },
    });
  };

  const addProductRow = () => {
    setProductRows([
      ...productRows,
      {
        key: Date.now().toString(),
        relatedProduct: '',
        productType: '',
        detail: '',
        tonnage: '',
      },
    ]);
  };

  const addProductRowsFromLibrary = () => {
    const newRows: ProductDetailRow[] = librarySelectedKeys.map((key) => {
      const item = productLibrary.find((p) => p.key === key);
      if (item) {
        return {
          key: Date.now().toString() + '-' + item.key,
          relatedProduct: item.key,
          productType: item.productType,
          detail: item.detail,
          tonnage: '',
        };
      }
      return null;
    }).filter(Boolean) as ProductDetailRow[];
    setProductRows([...productRows, ...newRows]);
    setLibrarySelectedKeys([]);
    setSelectModalVisible(false);
    setSelectTargetKey(null);
    message.success(`已添加 ${newRows.length} 条产品`);
  };

  const removeProductRow = (key: string) => {
    setProductRows(productRows.filter((r) => r.key !== key));
  };

  const updateProductRow = (key: string, field: string, value: string | number) => {
    setProductRows(
      productRows.map((r) => (r.key === key ? { ...r, [field]: value } : r))
    );
  };

  const openSelectModal = (rowKey: string) => {
    setSelectTargetKey(rowKey);
    setLibrarySelectedKeys([]);
    setSelectModalVisible(true);
  };

  const handleSelectConfirm = () => {
    if (selectTargetKey) {
      const selectedItem = productLibrary.find((p) => p.key === librarySelectedKeys[0]);
      if (selectedItem) {
        setProductRows(
          productRows.map((r) =>
            r.key === selectTargetKey
              ? {
                  ...r,
                  relatedProduct: selectedItem.key,
                  productType: selectedItem.productType,
                  detail: selectedItem.detail,
                }
              : r
          )
        );
      }
      setSelectModalVisible(false);
      setSelectTargetKey(null);
      setLibrarySelectedKeys([]);
    } else {
      addProductRowsFromLibrary();
    }
  };

  const handleSelectCancel = () => {
    setSelectModalVisible(false);
    setSelectTargetKey(null);
    setLibrarySelectedKeys([]);
  };

  const productDetailColumns: ColumnsType<ProductDetailRow> = [
    {
      title: '',
      key: 'index',
      width: 50,
      render: (_t, _r, idx) => idx + 1,
    },
    {
      title: '关联产品',
      dataIndex: 'relatedProduct',
      width: 80,
      render: (_t, record) => (
        <Button
          type="text"
          icon={<InboxOutlined />}
          style={{ color: '#1890ff', padding: 0 }}
          onClick={() => openSelectModal(record.key)}
        />
      ),
    },
    {
      title: '产品类型',
      dataIndex: 'productType',
      width: 120,
      render: (text, record) => (
        <Input
          placeholder="请输入"
          value={text}
          onChange={(e) => updateProductRow(record.key, 'productType', e.target.value)}
          size="small"
        />
      ),
    },
    {
      title: '明细',
      dataIndex: 'detail',
      width: 140,
      render: (text, record) => (
        <Input
          placeholder="请输入"
          value={text}
          onChange={(e) => updateProductRow(record.key, 'detail', e.target.value)}
          size="small"
        />
      ),
    },
    {
      title: '入库吨位',
      dataIndex: 'tonnage',
      width: 120,
      render: (text, record) => (
        <InputNumber
          placeholder="请输入"
          value={text === '' ? undefined : Number(text)}
          onChange={(val) => updateProductRow(record.key, 'tonnage', val ?? '')}
          style={{ width: '100%' }}
          size="small"
          min={0}
          step={0.01}
        />
      ),
    },
    {
      title: '',
      key: 'action',
      width: 40,
      render: (_t, record) => (
        <MinusCircleOutlined
          style={{ color: '#ff4d4f', cursor: 'pointer' }}
          onClick={() => removeProductRow(record.key)}
        />
      ),
    },
  ];

  const libraryColumns: ColumnsType<ProductItem> = [
    {
      title: '产品类型',
      dataIndex: 'productType',
      width: 100,
    },
    {
      title: '明细',
      dataIndex: 'detail',
      width: 150,
    },
  ];

  return (
    <div className="page-container">
      <div
        style={{
          background: '#fff',
          padding: '10px 16px',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Space size={4}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加
            </Button>
            <Button icon={<ImportOutlined />}>导入</Button>
            <Button icon={<ExportOutlined />}>导出</Button>
            <Button icon={<DeleteOutlined />} onClick={handleDelete}>
              删除
            </Button>
            <Button icon={<ThunderboltOutlined />}>批量操作</Button>
            <Button icon={<HistoryOutlined />}>操作记录</Button>
            <Button icon={<RollbackOutlined />}>数据回收站</Button>
          </Space>
          <Space size={8}>
            <Input
              placeholder="搜索数据"
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              style={{ width: 200 }}
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button icon={<FilterOutlined />}>筛选</Button>
            <Button type="text" icon={<ColumnHeightOutlined />} />
            <Button type="text" icon={<SettingOutlined />} />
            <Button type="text" icon={<MoreOutlined />} />
          </Space>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 4, overflow: 'hidden' }}>
          <Table
            columns={columns}
            dataSource={filteredData}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total) => `共 ${total} 条`,
            }}
            size="middle"
            rowKey="key"
            scroll={{ x: 1600 }}
          />
        </div>
      </div>

      <Modal
        title="产成品入库单"
        open={formVisible}
        onCancel={handleCancel}
        footer={null}
        width={760}
        centered
      >
        <Form form={form} layout="vertical" style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 }}>
          <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1890ff', marginBottom: 12 }}>入库基本信息</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item
                label="入库类型"
                name="inboundType"
                rules={[{ required: true, message: '请选择入库类型' }]}
              >
                <Select
                  placeholder="请选择入库类型"
                  options={inboundTypeOptions.map((o) => ({ value: o, label: o }))}
                />
              </Form.Item>
              <Form.Item
                label="入库仓库"
                name="inboundWarehouse"
                rules={[{ required: true, message: '请选择入库仓库' }]}
              >
                <Select
                  placeholder="请选择入库仓库"
                  options={warehouseOptions.map((o) => ({ value: o, label: o }))}
                />
              </Form.Item>
            </div>
          </div>

          <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1890ff', marginBottom: 12 }}>入库产品信息</div>
            <Table
              columns={productDetailColumns}
              dataSource={productRows}
              pagination={false}
              size="small"
              rowKey="key"
              bordered
              locale={{ emptyText: '暂无数据，请点击下方添加' }}
            />
            <Space style={{ marginTop: 12 }}>
              <Button type="link" icon={<PlusOutlined />} onClick={addProductRow}>
                添加
              </Button>
              <Button type="link">快速填报</Button>
            </Space>
            <div style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 8, color: '#333' }}>合计</div>
              <InputNumber
                style={{ width: 200 }}
                placeholder="请输入合计吨位"
                min={0}
                step={0.01}
              />
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1890ff', marginBottom: 12 }}>入库确认</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <Form.Item
                label="入库时间"
                name="inboundTime"
                rules={[{ required: true, message: '请选择入库时间' }]}
              >
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                  placeholder="请选择入库时间"
                />
              </Form.Item>
              <Form.Item label="入库员" required>
                <Space wrap>
                  {staffList.map((staff) => (
                    <Tag.CheckableTag
                      key={staff}
                      checked={selectedStaff.includes(staff)}
                      onChange={() => {
                        setSelectedStaff(
                          selectedStaff.includes(staff)
                            ? selectedStaff.filter((s) => s !== staff)
                            : [...selectedStaff, staff]
                        );
                      }}
                      style={{ borderRadius: 4, padding: '4px 8px' }}
                    >
                      {staff}
                    </Tag.CheckableTag>
                  ))}
                </Space>
              </Form.Item>
              <Form.Item label="库管归属部门" required>
                <Space wrap>
                  {departmentList.map((dept) => (
                    <Tag.CheckableTag
                      key={dept}
                      checked={selectedDept.includes(dept)}
                      onChange={() => {
                        setSelectedDept(
                          selectedDept.includes(dept)
                            ? selectedDept.filter((s) => s !== dept)
                            : [...selectedDept, dept]
                        );
                      }}
                      style={{ borderRadius: 4, padding: '4px 8px' }}
                    >
                      {dept}
                    </Tag.CheckableTag>
                  ))}
                </Space>
              </Form.Item>
            </div>
          </div>
        </Form>
        <div style={{ textAlign: 'left', marginTop: 8 }}>
          <Button
            type="primary"
            onClick={handleSubmit}
            style={{ backgroundColor: '#13c2c2', borderColor: '#13c2c2' }}
          >
            提交
          </Button>
        </div>
      </Modal>

      {/* 选择产品数据弹窗 */}
      <Modal
        title="选择数据"
        open={selectModalVisible}
        onCancel={handleSelectCancel}
        width={640}
        centered
        footer={[
          <Button key="cancel" onClick={handleSelectCancel}>
            取消
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handleSelectConfirm}
            disabled={librarySelectedKeys.length === 0}
          >
            确定
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 12 }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button type="primary" icon={<PlusOutlined />}>
              添加
            </Button>
            <Space>
              <Input
                placeholder="搜索数据"
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                style={{ width: 200 }}
                allowClear
                value={librarySearchText}
                onChange={(e) => setLibrarySearchText(e.target.value)}
              />
              <Button icon={<FilterOutlined />}>筛选</Button>
            </Space>
          </Space>
        </div>
        <Table
          columns={libraryColumns}
          dataSource={filteredLibrary}
          rowSelection={{
            selectedRowKeys: librarySelectedKeys,
            onChange: setLibrarySelectedKeys,
            type: selectTargetKey ? 'radio' : 'checkbox',
          }}
          pagination={{
            pageSize: 100,
            showSizeChanger: true,
            pageSizeOptions: ['50', '100', '200'],
            showTotal: (total) => `共 ${total} 条`,
          }}
          size="middle"
          rowKey="key"
          scroll={{ y: 400 }}
        />
      </Modal>
    </div>
  );
}
