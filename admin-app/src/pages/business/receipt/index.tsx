import { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Input,
  Button,
  Space,
  message,
  Modal,
  Form,
  DatePicker,
  Radio,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  ImportOutlined,
  ExportOutlined,
  DeleteOutlined,
  HistoryOutlined,
  FilterOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ExpandOutlined,
  CloudSyncOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import DictSelect from '@/components/DictSelect';
import { findSupplierByName } from '@/utils/supplierStore';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';
import { getJdyBusinessData, syncJdyReceipt } from '@/api/jdy';
import { addLocalBizRow, formatBizDateTime, getLocalBizRows } from '@/utils/localBizStore';
import { getStoredUser } from '@/config/apps';

interface ReceiptItem {
  id: number;
  supplierName: string;
  returnLocation: string;
  contactPhone: string;
  datetime: string;
  bigTruck: string;
  plateNo: string;
  isNegotiated: boolean;
  ownerIdInfo: string;
  drivingLicense: boolean;
  registrationCert: boolean;
  remark: string;
  isChecked: boolean;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

interface AddFormData {
  supplierName: string;
  returnLocation: string;
  contactPhone: string;
  datetime: string;
  bigTruck: string;
  plateNo: string;
  negotiateType: 'pass' | 'fail' | 'other';
  ownerIdType: 'pass' | 'fail' | 'other';
  drivingLicenseType: 'pass' | 'fail' | 'other';
  registrationCertType: 'pass' | 'fail' | 'other';
  remark: string;
}

const CheckIcon = () => (
  <CheckCircleFilled style={{ color: '#52c41a', fontSize: 18 }} />
);
const CrossIcon = () => (
  <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 18 }} />
);

function renderMark(val: unknown) {
  if (val === true || val === '是' || val === '√' || val === '✓' || val === '✔') return <CheckIcon />;
  if (val === false || val === '否' || val === '×' || val === '✕' || val === '✖') return <CrossIcon />;
  if (val == null || val === '') return '-';
  return String(val);
}

const columns: ColumnsType<ReceiptItem> = [
  { title: '供应商名称', dataIndex: 'supplierName', width: 220, fixed: 'left', ellipsis: true },
  { title: '回车地', dataIndex: 'returnLocation', width: 80 },
  { title: '联系电话', dataIndex: 'contactPhone', width: 130 },
  { title: '日期时间', dataIndex: 'datetime', width: 170 },
  {
    title: '大板车',
    dataIndex: 'bigTruck',
    width: 120,
    render: (val: string) => val || '大板车',
  },
  { title: '车牌号', dataIndex: 'plateNo', width: 120 },
  {
    title: '销户/议价',
    dataIndex: 'isNegotiated',
    width: 100,
    render: (val: boolean) => renderMark(val),
  },
  {
    title: '车主身份信息',
    dataIndex: 'ownerIdInfo',
    width: 120,
    render: (val: string | boolean) => renderMark(val),
  },
  {
    title: '行车本',
    dataIndex: 'drivingLicense',
    width: 80,
    render: (val: boolean) => renderMark(val),
  },
  {
    title: '登记证书',
    dataIndex: 'registrationCert',
    width: 80,
    render: (val: boolean) => renderMark(val),
  },
  { title: '需说明事项', dataIndex: 'remark', width: 150, render: (val: string) => val || '-' },
  {
    title: '是否查验',
    dataIndex: 'isChecked',
    width: 90,
    render: (val: boolean) => (val ? '是' : '否'),
  },
  {
    title: '提交人',
    dataIndex: 'submitter',
    width: 100,
    render: (val: string) => <span style={{ color: '#1890ff', cursor: 'pointer' }}>{val}</span>,
  },
  { title: '提交时间', dataIndex: 'submitTime', width: 170 },
  { title: '更新时间', dataIndex: 'updateTime', width: 170 },
];

const iconRadioStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
};

function IconRadioGroup({
  value,
  onChange,
}: {
  value?: 'pass' | 'fail' | 'other';
  onChange?: (val: 'pass' | 'fail' | 'other') => void;
}) {
  return (
    <Radio.Group
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      style={{ display: 'flex', gap: 24 }}
    >
      <Radio value="pass" style={iconRadioStyle}>
        <CheckCircleFilled style={{ color: '#52c41a', fontSize: 18 }} />
      </Radio>
      <Radio value="fail" style={iconRadioStyle}>
        <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 18 }} />
      </Radio>
      <Radio value="other" style={iconRadioStyle}>
        其他
      </Radio>
    </Radio.Group>
  );
}

export default function ReceiptPage() {
  const isMobile = useIsMobile();
  const [dataSource, setDataSource] = useState<ReceiptItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [keyword, setKeyword] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [addForm] = Form.useForm<AddFormData>();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getJdyBusinessData('receipt', {
          pageNo,
          pageSize,
          keyword: keyword || undefined,
        });
        if (cancelled) return;
        const remote = (res.data?.records || []) as unknown as ReceiptItem[];
        const local = keyword ? [] : getLocalBizRows<ReceiptItem>('receipt');
        const merged = pageNo === 1 ? [...local, ...remote] : remote;
        setDataSource(merged);
        setTotal((res.data?.total || 0) + (keyword ? 0 : local.length));
      } catch {
        if (!cancelled) {
          message.error('业务收货加载失败，请稍后重试');
          setDataSource([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pageNo, pageSize, keyword, reloadKey]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    setPageNo(1);
    setKeyword(value.trim());
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await syncJdyReceipt();
      message.success(res.data?.message || '同步成功');
      setPageNo(1);
      setReloadKey((k) => k + 1);
    } catch {
      // interceptor
    } finally {
      setSyncing(false);
    }
  };

  const handleAdd = () => {
    addForm.resetFields();
    addForm.setFieldsValue({
      negotiateType: 'pass',
      ownerIdType: 'pass',
      drivingLicenseType: 'pass',
      registrationCertType: 'pass',
    });
    setAddModalOpen(true);
  };

  const handleAddSubmit = async () => {
    try {
      const values = await addForm.validateFields();
      const user = getStoredUser();
      const now = formatBizDateTime();
      addLocalBizRow<ReceiptItem>('receipt', {
        supplierName: values.supplierName || '',
        returnLocation: values.returnLocation || '',
        contactPhone: values.contactPhone || '',
        datetime: values.datetime || '',
        bigTruck: values.bigTruck || '大板车',
        plateNo: values.plateNo || '',
        isNegotiated: values.negotiateType === 'pass',
        ownerIdInfo: values.ownerIdType || '',
        drivingLicense: values.drivingLicenseType === 'pass',
        registrationCert: values.registrationCertType === 'pass',
        remark: values.remark || '',
        isChecked: false,
        submitter: user.nickname || user.username || '系统',
        submitTime: now,
        updateTime: now,
      });
      setPageNo(1);
      setReloadKey((k) => k + 1);
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
    message.info('导入功能');
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

  const handleHistory = () => {
    message.info('查看操作记录');
  };

  return (
    <div className="page-container">
      <Card
        styles={{ body: { padding: 0 } }}
      >
        <div
          style={{
            padding: '8px 16px',
            background: '#fffbe6',
            color: '#ad6800',
            borderBottom: '1px solid #ffe58f',
          }}
        >
          本页读本地库，打开即可；点「同步」才会从简道云拉取（约 3 万条，需等待）。数据全部为大板车，大板车为空的记录按大板车显示。
        </div>

        {/* 操作工具栏 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            padding: '8px 16px',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            gap: 8,
          }}
        >
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加
            </Button>
            <Button
              icon={<CloudSyncOutlined />}
              loading={syncing}
              onClick={handleSync}
            >
              同步
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
            <Button icon={<HistoryOutlined />} onClick={handleHistory}>
              操作记录
            </Button>
          </Space>
          <Space wrap>
            <Input.Search
              placeholder="搜索数据"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={handleSearch}
              style={{ width: isMobile ? '100%' : 200 }}
              allowClear
            />
            <Button icon={<FilterOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}>筛选</Button>
          </Space>
        </div>

        {/* 数据表格 */}
        <div style={{ background: '#fff', padding: '0 16px' }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={dataSource}
            loading={loading}
            scroll={{ x: 2200 }}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            pagination={withMobilePagination(isMobile, {
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
            })}
          />
        </div>
      </Card>

      {/* 添加弹窗 */}
      <Modal
        title={null}
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        width={720}
        closable={false}
        styles={{ body: { padding: 0 } }}
        footer={
          <div style={{ display: 'flex', gap: 16 }}>
            <Button
              type="primary"
              size="large"
              onClick={handleAddSubmit}
              style={{ flex: 1 }}
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
        <div style={{ position: 'relative', padding: '16px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>1.业务收货</span>
            <Space>
              <ExpandOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} />
              <span
                onClick={() => setAddModalOpen(false)}
                style={{ fontSize: 18, cursor: 'pointer', color: '#999', lineHeight: '20px' }}
              >
                ×
              </span>
            </Space>
          </div>

          <Form
            form={addForm}
            layout="vertical"
            initialValues={{
              supplierName: undefined,
              returnLocation: '',
              contactPhone: '',
              bigTruck: '',
              plateNo: '',
              negotiateType: 'pass',
              ownerIdType: 'pass',
              drivingLicenseType: 'pass',
              registrationCertType: 'pass',
              remark: '',
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={<span><span style={{ color: '#ff4d4f' }}>*</span>供应商名称</span>}
                  name="supplierName"
                  rules={[{ required: true, message: '请选择供应商' }]}
                >
                  <DictSelect
                    dict="supplier"
                    placeholder="请选择供应商（基础资料）"
                    style={{ width: '100%' }}
                    onChange={(v) => {
                      const s = findSupplierByName(String(v || ''));
                      if (s) {
                        addForm.setFieldsValue({
                          supplierName: s.supplierName,
                          contactPhone: s.contactPhone || addForm.getFieldValue('contactPhone'),
                        });
                      }
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="回车地" name="returnLocation">
                  <Input placeholder="请输入" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="联系电话" name="contactPhone">
                  <Input placeholder="请输入" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={<span><span style={{ color: '#ff4d4f' }}>*</span>日期时间</span>}
                  name="datetime"
                  rules={[{ required: true, message: '请选择日期' }]}
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    format="YYYY-MM-DD"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="大板车" name="bigTruck">
                  <Input placeholder="请输入" />
                </Form.Item>
              </Col>
            </Row>

            <div style={{ borderTop: '1px dashed #e8e8e8', margin: '16px 0' }} />

            <div style={{ color: '#1890ff', fontWeight: 500, marginBottom: 16 }}>车辆清单</div>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label={<span><span style={{ color: '#ff4d4f' }}>*</span>车牌号</span>}
                  name="plateNo"
                  rules={[{ required: true, message: '请输入车牌号' }]}
                >
                  <Input placeholder="请输入" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span>销户/议价</span>}>
                  <Form.Item name="negotiateType" noStyle>
                    <IconRadioGroup />
                  </Form.Item>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="车主身份信息">
                  <Form.Item name="ownerIdType" noStyle>
                    <IconRadioGroup />
                  </Form.Item>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="行车本">
                  <Form.Item name="drivingLicenseType" noStyle>
                    <IconRadioGroup />
                  </Form.Item>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="登记证书">
                  <Form.Item name="registrationCertType" noStyle>
                    <IconRadioGroup />
                  </Form.Item>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="需说明事项" name="remark">
              <Input.TextArea
                placeholder="请输入"
                rows={3}
              />
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
}
