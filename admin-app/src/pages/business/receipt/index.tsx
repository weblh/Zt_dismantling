import { useEffect, useMemo, useState } from 'react';
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
  CheckCircleFilled,
  CloseCircleFilled,
  ExpandOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import DictSelect from '@/components/DictSelect';
import BusinessJdySyncButtons from '@/components/BusinessJdySyncButtons';
import { makeEditColumn } from '@/components/TableEditColumn';
import BasicFuzzyFilter, { filterBasicRows } from '@/components/BasicFuzzyFilter';
import BizRecordSidePanel from '@/components/BizRecordSidePanel';
import { findSupplierByName } from '@/utils/supplierStore';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';
import { getJdyBusinessData, syncJdyReceipt } from '@/api/jdy';
import { appendBizDataLog } from '@/api/bizRecordMeta';
import {
  addLocalBizRow,
  formatBizDateTime,
  getLocalBizRows,
  mergeLocalRemoteRows,
  upsertLocalBizRow,
} from '@/utils/localBizStore';
import { getStoredUser } from '@/config/apps';
import dayjs from 'dayjs';

const BIZ_KEY = 'receipt';

interface ReceiptItem {
  id: number;
  dataId?: string;
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

const FILTER_FIELDS = [
  { key: 'supplierName', label: '供应商名称' },
  { key: 'returnLocation', label: '回车地' },
  { key: 'contactPhone', label: '联系电话' },
  { key: 'datetime', label: '日期时间' },
  { key: 'bigTruck', label: '大板车' },
  { key: 'plateNo', label: '车牌号' },
  { key: 'remark', label: '需说明事项' },
];

const FIELD_LABELS: Record<string, string> = {
  supplierName: '供应商名称',
  returnLocation: '回车地',
  contactPhone: '联系电话',
  datetime: '日期时间',
  bigTruck: '大板车',
  plateNo: '车牌号',
  isNegotiated: '销户/议价',
  ownerIdInfo: '车主身份信息',
  drivingLicense: '行车本',
  registrationCert: '登记证书',
  remark: '需说明事项',
};

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

function receiptRecordKey(record: Pick<ReceiptItem, 'id' | 'dataId'> | null | undefined) {
  if (!record) return undefined;
  if (record.dataId) return String(record.dataId);
  if (record.id != null) return String(record.id);
  return undefined;
}

function markLabel(val: unknown) {
  if (val === true || val === 'pass' || val === '是' || val === '√') return '通过';
  if (val === false || val === 'fail' || val === '否' || val === '×') return '不通过';
  return String(val ?? '其他');
}

function buildChangeSummary(before: ReceiptItem | null, after: Record<string, unknown>) {
  if (!before) {
    return `创建业务收货：${after.supplierName || ''} ${after.plateNo || ''}`.trim();
  }
  const keys = Object.keys(FIELD_LABELS);
  const parts: string[] = [];
  keys.forEach((key) => {
    const prev = (before as unknown as Record<string, unknown>)[key];
    const next = after[key];
    const prevStr = typeof prev === 'boolean' ? markLabel(prev) : String(prev ?? '');
    const nextStr = typeof next === 'boolean' ? markLabel(next) : String(next ?? '');
    if (prevStr !== nextStr) {
      parts.push(`${FIELD_LABELS[key]}：${prevStr || '空'} → ${nextStr || '空'}`);
    }
  });
  return parts.length ? parts.join('；') : '保存业务收货（无字段变更）';
}

const baseColumns: ColumnsType<ReceiptItem> = [
  { title: '供应商名称', dataIndex: 'supplierName', width: 220, fixed: 'left', ellipsis: true },
  { title: '回车地', dataIndex: 'returnLocation', width: 120 },
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

function toPassFail(val: unknown): 'pass' | 'fail' | 'other' {
  if (val === true || val === '是' || val === '√' || val === '✓' || val === '✔' || val === 'pass') return 'pass';
  if (val === false || val === '否' || val === '×' || val === '✕' || val === '✖' || val === 'fail') return 'fail';
  return 'other';
}

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
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editing, setEditing] = useState<ReceiptItem | null>(null);
  const [metaTick, setMetaTick] = useState(0);
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
        const merged = pageNo === 1 ? mergeLocalRemoteRows(local, remote) : remote.map((r) => {
          const hit = local.find((l) => l.id === r.id);
          return hit || r;
        });
        setDataSource(merged);
        setTotal((res.data?.total || 0) + (keyword ? 0 : local.filter((l) => !remote.some((r) => r.id === l.id)).length));
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

  // 搜索框即时输入；防抖后走服务端关键字；字段筛选在当前结果上再模糊
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchValue.trim();
      if (next === keyword) return;
      setPageNo(1);
      setKeyword(next);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, keyword]);

  const displayData = useMemo(
    () => filterBasicRows(dataSource, searchValue, selectedFields),
    [dataSource, searchValue, selectedFields],
  );

  const handleAdd = () => {
    setEditing(null);
    addForm.resetFields();
    addForm.setFieldsValue({
      datetime: dayjs() as never,
      negotiateType: 'pass',
      ownerIdType: 'pass',
      drivingLicenseType: 'pass',
      registrationCertType: 'pass',
    });
    setAddModalOpen(true);
  };

  const handleEdit = (record: ReceiptItem) => {
    setEditing(record);
    addForm.setFieldsValue({
      supplierName: record.supplierName,
      returnLocation: record.returnLocation,
      contactPhone: record.contactPhone,
      datetime: record.datetime ? dayjs(record.datetime) : dayjs(),
      bigTruck: record.bigTruck,
      plateNo: record.plateNo,
      negotiateType: toPassFail(record.isNegotiated),
      ownerIdType: toPassFail(record.ownerIdInfo),
      drivingLicenseType: toPassFail(record.drivingLicense),
      registrationCertType: toPassFail(record.registrationCert),
      remark: record.remark,
    } as never);
    setAddModalOpen(true);
  };

  const columns: ColumnsType<ReceiptItem> = [...baseColumns, makeEditColumn<ReceiptItem>(handleEdit)];

  const handleAddSubmit = async () => {
    try {
      const values = await addForm.validateFields();
      const user = getStoredUser();
      const now = formatBizDateTime();
      const datetime = values.datetime ? dayjs(values.datetime).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
      const operator = user.nickname || user.username || '系统';
      const payload = {
        supplierName: values.supplierName || '',
        returnLocation: values.returnLocation || '',
        contactPhone: values.contactPhone || '',
        datetime,
        bigTruck: values.bigTruck || '大板车',
        plateNo: values.plateNo || '',
        isNegotiated: values.negotiateType === 'pass',
        ownerIdInfo: values.ownerIdType || '',
        drivingLicense: values.drivingLicenseType === 'pass',
        registrationCert: values.registrationCertType === 'pass',
        remark: values.remark || '',
        isChecked: editing?.isChecked ?? false,
        submitter: editing?.submitter || operator,
        submitTime: editing?.submitTime || now,
        updateTime: now,
      };
      const summary = buildChangeSummary(editing, payload);
      let saved: ReceiptItem;
      if (editing) {
        saved = upsertLocalBizRow<ReceiptItem>('receipt', {
          ...payload,
          id: editing.id,
          dataId: editing.dataId,
        });
        message.success('修改成功！');
      } else {
        saved = addLocalBizRow<ReceiptItem>('receipt', payload);
        message.success('提交成功！');
      }
      const recordKey = receiptRecordKey(saved);
      if (recordKey) {
        try {
          await appendBizDataLog(BIZ_KEY, recordKey, {
            action: editing ? '更新' : '创建',
            summary,
            operatorName: operator,
          });
          setMetaTick((t) => t + 1);
        } catch {
          // 日志失败不阻断主流程
        }
      }
      setPageNo(1);
      setReloadKey((k) => k + 1);
      setEditing(null);
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

  const metaRecordKey = receiptRecordKey(editing);
  const formMeta = {
    submitter: editing?.submitter || getStoredUser().nickname || getStoredUser().username || '-',
    submitTime: editing?.submitTime || '-',
    updateTime: editing?.updateTime || '-',
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
          本页读本地库，打开即可；「同步」仅拉取上次之后的增量，「重新同步所有」才全量拉取。数据全部为大板车，大板车为空的记录按大板车显示。
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
            <BusinessJdySyncButtons
              syncFn={syncJdyReceipt}
              onSynced={() => {
                setPageNo(1);
                setReloadKey((k) => k + 1);
              }}
            />
            <Button icon={<ImportOutlined />} onClick={handleImport}>
              导入
            </Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              导出
            </Button>
            <Button icon={<DeleteOutlined />} onClick={handleDelete}>
              删除
            </Button>
          </Space>
          <BasicFuzzyFilter
            fields={FILTER_FIELDS}
            keyword={searchValue}
            onKeywordChange={setSearchValue}
            selectedFields={selectedFields}
            onSelectedFieldsChange={(next) => {
              setSelectedFields(next);
              setPageNo(1);
            }}
            inputWidth={isMobile ? '100%' : 200}
          />
        </div>

        {/* 数据表格 */}
        <div style={{ background: '#fff', padding: '0 16px' }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={displayData}
            loading={loading}
            scroll={{ x: 2300 }}
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

      {/* 添加 / 编辑弹窗 */}
      <Modal
        title={null}
        open={addModalOpen}
        onCancel={() => {
          setEditing(null);
          setAddModalOpen(false);
        }}
        width={isMobile ? '100%' : 1100}
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
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          <div style={{ flex: 1, minWidth: 0, padding: '16px 24px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <span style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>
                {editing ? '编辑业务收货' : '业务收货'}
              </span>
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
                datetime: dayjs(),
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
                    label="供应商名称"
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
                    label="日期时间"
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
                    label="车牌号"
                    name="plateNo"
                    rules={[{ required: true, message: '请输入车牌号' }]}
                  >
                    <Input placeholder="请输入" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="销户/议价"
                    name="negotiateType"
                    rules={[{ required: true, message: '请选择销户/议价' }]}
                  >
                    <IconRadioGroup />
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

              {/* 系统字段：提交人 / 提交时间 / 更新时间 */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 24,
                  padding: '12px 0 20px',
                  borderTop: '1px solid #f0f0f0',
                  color: '#666',
                  fontSize: 13,
                }}
              >
                <span>
                  <span style={{ color: '#999' }}>提交人</span>
                  <span style={{ marginLeft: 8, color: '#1890ff' }}>{formMeta.submitter}</span>
                </span>
                <span>
                  <span style={{ color: '#999' }}>提交时间</span>
                  <span style={{ marginLeft: 8 }}>{formMeta.submitTime}</span>
                </span>
                <span>
                  <span style={{ color: '#999' }}>更新时间</span>
                  <span style={{ marginLeft: 8 }}>{formMeta.updateTime}</span>
                </span>
              </div>
            </Form>
          </div>

          {!isMobile && (
            <div style={{ width: 280, flexShrink: 0 }} key={`${metaRecordKey || 'new'}-${metaTick}`}>
              <BizRecordSidePanel
                bizKey={BIZ_KEY}
                recordKey={metaRecordKey}
                height={520}
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
