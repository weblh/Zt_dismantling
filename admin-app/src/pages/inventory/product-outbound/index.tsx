import DictSelect from '@/components/DictSelect';
import React, { useState } from 'react';
import { useBizDataWithLocal } from '@/hooks/useBizDataWithLocal';
import { getStoredUser } from '@/config/apps';
import { formatBizDateTime } from '@/utils/localBizStore';
import { useDepartmentOptions } from '@/config/departments';
import {
  Table,
  Button,
  Space,
  Input,
  Modal,
  Form,
  Select,
  DatePicker,
  message,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  ImportOutlined,
  ExportOutlined,
  DeleteOutlined,
  HistoryOutlined,
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
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';

interface OutboundItem {
  id: number;
  outboundType: string;
  outboundWarehouse: string;
  productType: string;
  detail: string;
  outboundTonnage: number;
  outboundTime: string;
  outboundStaff: string;
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

const outboundTypeOptions = ['销售出库', '调拨出库', '报损出库'];
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



export default function ProductOutbound() {
  const isMobile = useIsMobile();
  const departmentOptions = useDepartmentOptions();
  const [form] = Form.useForm();
  const [formVisible, setFormVisible] = useState(false);
  const [selectModalVisible, setSelectModalVisible] = useState(false);
  const [selectTargetKey, setSelectTargetKey] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [librarySelectedKeys, setLibrarySelectedKeys] = useState<React.Key[]>([]);
  const [librarySearchText, setLibrarySearchText] = useState('');
  const [productRows, setProductRows] = useState<ProductDetailRow[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [selectedDept, setSelectedDept] = useState<string[]>([]);
  const {
    dataSource,
    total,
    pageNo,
    pageSize,
    loading,
    searchValue,
    setSearchValue,
    onSearch,
    setPageNo,
    setPageSize,
    appendLocal,
    removeLocal,
  } = useBizDataWithLocal<OutboundItem>('product-outbound');

  const filteredData = dataSource;


  const filteredLibrary = productLibrary.filter(
    (item) =>
      item.productType.includes(librarySearchText) ||
      item.detail.includes(librarySearchText)
  );

  const columns: ColumnsType<OutboundItem> = [
    {
      title: '出库类型',
      dataIndex: 'outboundType',
      width: 100,
      sorter: (a, b) => a.outboundType.localeCompare(b.outboundType),
    },
    {
      title: '出库仓库',
      dataIndex: 'outboundWarehouse',
      width: 110,
      sorter: (a, b) => a.outboundWarehouse.localeCompare(b.outboundWarehouse),
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
      title: '出库吨位',
      dataIndex: 'outboundTonnage',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.outboundTonnage - b.outboundTonnage,
      render: (text: number) => text.toFixed(3),
    },
    {
      title: '出库时间',
      dataIndex: 'outboundTime',
      width: 160,
      sorter: (a, b) => a.outboundTime.localeCompare(b.outboundTime),
    },
    {
      title: '出库员',
      dataIndex: 'outboundStaff',
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
    const user = getStoredUser();
    const me = user.nickname || user.username || '';
    form.resetFields();
    setProductRows([]);
    setSelectedStaff(me ? [me] : []);
    setSelectedDept(user.department ? [user.department] : []);
    setFormVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const now = formatBizDateTime();
      const user = getStoredUser();
      const me = user.nickname || user.username || '系统';
      if (productRows.length === 0) {
        message.warning('请至少添加一条产品明细');
        return;
      }
      productRows.forEach((row) => {
        appendLocal({
          outboundType: values.outboundType,
          outboundWarehouse: values.outboundWarehouse,
          productType: row.productType,
          detail: row.detail,
          outboundTonnage: Number(row.tonnage) || 0,
          outboundTime: values.outboundTime ? values.outboundTime.format('YYYY-MM-DD HH:mm:ss') : now,
          outboundStaff: selectedStaff.join('、'),
          department: selectedDept.join('、') || user.department || '',
          submitter: me,
          submitTime: now,
          updateTime: now,
        } as Omit<OutboundItem, 'id'>);
      });
      setFormVisible(false);
      message.success('添加成功');
    } catch {
      message.warning('请完善表单信息');
    }
  };

  const handleSaveDraft = () => {
    message.success('草稿已保存');
    setFormVisible(false);
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
        removeLocal(selectedRowKeys.map(Number));
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
      width: 100,
      render: (_t, record) => (
        <Button
          type="text"
          icon={<InboxOutlined />}
          style={{ color: '#1890ff', padding: 0 }}
          onClick={() => openSelectModal(record.key)}
        >
          选择数据
        </Button>
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
      title: '出库吨位',
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
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <Space size={4} wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加
            </Button>
            <Button icon={<ImportOutlined />}>导入</Button>
            <Button icon={<ExportOutlined />}>导出</Button>
            <Button icon={<DeleteOutlined />} onClick={handleDelete}>
              删除
            </Button>
            <Button icon={<HistoryOutlined />}>操作记录</Button>
          </Space>
          <Space size={8} wrap>
            <Input.Search
              placeholder="搜索数据"
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              style={{ width: isMobile ? '100%' : 200 }}
              allowClear
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={onSearch}
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
            loading={loading}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            pagination={withMobilePagination(isMobile, {
              current: pageNo,
              pageSize,
              total,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (t) => `共 ${t} 条`,
              onChange: (p, ps) => {
                setPageNo(p);
                setPageSize(ps);
              },
            })}
            size="middle"
            rowKey="id"
            scroll={{ x: 1600 }}
          />
        </div>
      </div>

      <Modal
        title="产成品出库单"
        open={formVisible}
        onCancel={handleCancel}
        footer={null}
        width={760}
        centered
      >
        <Form form={form} layout="vertical" style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 }}>
          <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1890ff', marginBottom: 12 }}>出库基本信息</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item
                label="出库类型"
                name="outboundType"
                rules={[{ required: true, message: '请选择出库类型' }]}
              >
                <Select
                  placeholder="请选择出库类型"
                  options={outboundTypeOptions.map((o) => ({ value: o, label: o }))}
                />
              </Form.Item>
              <Form.Item
                label="出库仓库"
                name="outboundWarehouse"
                rules={[{ required: true, message: '请选择出库仓库' }]}
              >
                <DictSelect dict="warehouse" placeholder="请选择出库仓库（基础资料）" />
              </Form.Item>
            </div>
          </div>

          <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1890ff', marginBottom: 12 }}>出库产品信息</div>
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
                style={{ width: isMobile ? '100%' : 200 }}
                placeholder="请输入合计吨位"
                min={0}
                step={0.01}
              />
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1890ff', marginBottom: 12 }}>出库确认</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <Form.Item
                label="出库时间"
                name="outboundTime"
                rules={[{ required: true, message: '请选择出库时间' }]}
              >
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                  placeholder="请选择出库时间"
                />
              </Form.Item>
              <Form.Item label="出库员" required>
                <Select
                  mode="tags"
                  style={{ width: '100%' }}
                  placeholder="选择或输入人员"
                  value={selectedStaff}
                  onChange={setSelectedStaff}
                  options={(selectedStaff.length ? selectedStaff : []).map((s) => ({ value: s, label: s }))}
                />
              </Form.Item>
              <Form.Item label="库管归属部门" required>
                <Select
                  mode="multiple"
                  style={{ width: '100%' }}
                  placeholder="选择部门"
                  value={selectedDept}
                  onChange={setSelectedDept}
                  options={departmentOptions}
                />
              </Form.Item>
            </div>
          </div>
        </Form>
        <div style={{ textAlign: 'left', marginTop: 8 }}>
          <Space>
            <Button
              type="primary"
              onClick={handleSubmit}
              style={{ backgroundColor: '#13c2c2', borderColor: '#13c2c2' }}
            >
              提交
            </Button>
            <Button onClick={handleSaveDraft}>保存草稿</Button>
          </Space>
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
                style={{ width: isMobile ? '100%' : 200 }}
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
          pagination={withMobilePagination(isMobile, {
            pageSize: 100,
            showSizeChanger: true,
            pageSizeOptions: ['50', '100', '200'],
            showTotal: (total) => `共 ${total} 条`,
          })}
          size="middle"
          rowKey="key"
          scroll={{ x: 600, y: 400 }}
        />
      </Modal>
    </div>
  );
}
