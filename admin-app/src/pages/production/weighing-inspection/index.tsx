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
  Select,
  DatePicker,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  ImportOutlined,
  ExportOutlined,
  DeleteOutlined,
  FilterOutlined,
  CloudSyncOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import DictSelect from '@/components/DictSelect';
import { getStoredUser } from '@/config/apps';
import { addLocalBizRow, deleteLocalBizRows, formatBizDateTime, getLocalBizRows } from '@/utils/localBizStore';
import { getJdyBusinessData, syncJdyWeighingInspection } from '@/api/jdy';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';

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
  { title: <span style={{ whiteSpace: 'nowrap' }}>吨位</span>, dataIndex: 'tonnage', width: 80, align: 'right', render: formatAmount },
  { title: <span style={{ whiteSpace: 'nowrap' }}>压扁</span>, dataIndex: 'flatten', width: 70, align: 'center' },
  { title: <span style={{ whiteSpace: 'nowrap' }}>营运</span>, dataIndex: 'operation', width: 70, align: 'center' },
  { title: <span style={{ whiteSpace: 'nowrap' }}>B级</span>, dataIndex: 'bLevel', width: 70, align: 'center' },
  { title: <span style={{ whiteSpace: 'nowrap' }}>铁</span>, dataIndex: 'iron', width: 80, align: 'right', render: formatAmount },
  { title: <span style={{ whiteSpace: 'nowrap' }}>铝</span>, dataIndex: 'aluminum', width: 80, align: 'right', render: formatAmount },
  { title: <span style={{ whiteSpace: 'nowrap' }}>三元</span>, dataIndex: 'ternary', width: 80, align: 'right', render: formatAmount },
  { title: <span style={{ whiteSpace: 'nowrap' }}>电瓶</span>, dataIndex: 'battery', width: 80, align: 'right', render: formatAmount },
  { title: <span style={{ whiteSpace: 'nowrap' }}>轮胎</span>, dataIndex: 'tire', width: 80, align: 'right', render: formatAmount },
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

const VEHICLE_TYPE_OPTIONS = [
  { value: '2厢40', bg: '#ffccc7' },
  { value: '3厢50', bg: '#ffd8bf' },
  { value: '三厢B级75', bg: '#ffe7ba' },
  { value: '三厢BBA85', bg: '#fff1b8' },
  { value: '面包30', bg: '#f4ffb8' },
  { value: '大面包50', bg: '#d9f7be' },
  { value: '旅行车', bg: '#b5f5ec' },
  { value: '小商务40', bg: '#bae0ff' },
  { value: '商务55', bg: '#d6e4ff' },
  { value: '越野55', bg: '#efdbff' },
  { value: '小越野40', bg: '#ffd6e7' },
  { value: '单排30', bg: '#ffccc7' },
  { value: '双排30', bg: '#ffd8bf' },
  { value: '皮卡40', bg: '#ffe7ba' },
  { value: '轻卡30', bg: '#d9f7be' },
  { value: '客车', bg: '#b5f5ec' },
  { value: '中型客车', bg: '#bae0ff' },
  { value: '重型货车', bg: '#d6e4ff' },
  { value: '摩托20', bg: '#fff1b8' },
  { value: '三轮摩托20', bg: '#ffe58f' },
  { value: '五轮农用车30', bg: '#bae7ff' },
  { value: '箱货40', bg: '#d3adf7' },
  { value: '二轮蹦蹦20', bg: '#ffadd2' },
  { value: '油罐车', bg: '#ffbb96' },
  { value: '自行车15', bg: '#ffd591' },
  { value: '奥拓40', bg: '#ffe58f' },
  { value: '其他', bg: '#d9d9d9' },
];

const SCORE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({ value: n, label: String(n) }));

function formatAmount(val: unknown) {
  if (val == null || val === '') return '';
  const n = Number(val);
  return Number.isFinite(n) ? n.toFixed(2) : String(val);
}

function VehicleTypeField({ value, onChange }: { value?: string; onChange?: (v: string) => void }) {
  return (
    <div className="weigh-chip-grid">
      {VEHICLE_TYPE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`weigh-chip${value === opt.value ? ' is-active' : ''}`}
          style={{ background: opt.bg }}
          onClick={() => onChange?.(opt.value)}
        >
          {opt.value}
        </button>
      ))}
    </div>
  );
}

function FlagField({ value, onChange }: { value?: string; onChange?: (v: string) => void }) {
  return (
    <div className="weigh-flag-row">
      {(['是', '否'] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          className={`weigh-flag${opt === '否' ? ' is-no' : ''}${value === opt ? ' is-active' : ''}`}
          onClick={() => onChange?.(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function MarkField({ value, onChange }: { value?: string; onChange?: (v: string) => void }) {
  return (
    <div className="weigh-mark-row">
      <button
        type="button"
        className={`weigh-mark is-yes${value === '是' ? ' is-active' : ''}`}
        onClick={() => onChange?.('是')}
        aria-label="是"
      >
        <CheckOutlined />
      </button>
      <button
        type="button"
        className={`weigh-mark is-no${value === '否' ? ' is-active' : ''}`}
        onClick={() => onChange?.('否')}
        aria-label="否"
      >
        <CloseOutlined />
      </button>
    </div>
  );
}

function ScoreSelect(props: React.ComponentProps<typeof Select>) {
  return (
    <Select
      placeholder="请选择"
      options={SCORE_OPTIONS}
      labelRender={(item) => <span className="weigh-score-tag">{item.label}</span>}
      optionRender={(opt) => <span className="weigh-score-tag">{String(opt.label ?? '')}</span>}
      {...props}
    />
  );
}

export default function WeighingInspection() {
  const isMobile = useIsMobile();
  const [dataSource, setDataSource] = useState<WeighingInspectionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [keyword, setKeyword] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formExpanded, setFormExpanded] = useState(false);
  const [addForm] = Form.useForm();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getJdyBusinessData('weighing-inspection', {
          pageNo,
          pageSize,
          keyword: keyword || undefined,
        });
        if (cancelled) return;
        const remote = (res.data?.records || []) as unknown as WeighingInspectionItem[];
        const local = keyword ? [] : getLocalBizRows<WeighingInspectionItem>('weighing-inspection');
        const merged = pageNo === 1 ? [...local, ...remote] : remote;
        setDataSource(merged);
        setTotal((res.data?.total || 0) + (keyword ? 0 : local.length));
      } catch {
        if (!cancelled) {
          message.error('过磅查验加载失败，请稍后重试');
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

  const onSearch = (value: string) => {
    setSearchValue(value);
    setPageNo(1);
    setKeyword(value.trim());
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await syncJdyWeighingInspection();
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
    setAddModalOpen(true);
  };

  const handleAddSubmit = async () => {
    try {
      const values = await addForm.validateFields();
      const user = getStoredUser();
      const now = formatBizDateTime();
      addLocalBizRow<WeighingInspectionItem>('weighing-inspection', {
        code: values.code || '',
        negotiation: values.negotiation || '',
        weighDate: values.weighDate?.format?.('YYYY-MM-DD') || values.weighDate || '',
        plateNumber: values.plateNumber || '',
        returnDate: values.returnDate?.format?.('YYYY-MM-DD') || values.returnDate || '',
        vehicleType: values.vehicleType || '',
        vehicleModel: values.vehicleModel || '',
        supplier: values.supplier || '',
        salesperson: values.salesperson || '',
        returnLocation: values.returnLocation || '',
        tonnage: Number(values.tonnage || 0),
        flatten: values.flatten || '',
        operation: values.operation || '',
        bLevel: values.bLevel || '',
        iron: Number(values.iron || 0),
        aluminum: Number(values.aluminum || 0),
        ternary: Number(values.ternary || 0),
        battery: Number(values.battery || 0),
        tire: Number(values.tire || 0),
        remark: values.remark || '',
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

  const handleExport = () => {
    message.success('导出成功');
  };

  const handleDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的数据');
      return;
    }
    deleteLocalBizRows('weighing-inspection', selectedRowKeys.map(Number));
    setReloadKey((k) => k + 1);
    message.success(`已删除 ${selectedRowKeys.length} 条数据`);
    setSelectedRowKeys([]);
  };

  const handleImport = () => {
    message.info('导入功能开发中');
  };

  return (
    <div className="page-container">
      <Card styles={{ body: { padding: 0 } }}>
        {/* 操作工具栏 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '8px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加</Button>
            <Button icon={<CloudSyncOutlined />} loading={syncing} onClick={handleSync}>同步</Button>
            <Button icon={<ImportOutlined />} onClick={handleImport}>导入</Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
            <Button icon={<DeleteOutlined />} onClick={handleDelete}>删除</Button>
          </Space>
          <Space wrap>
            <Input.Search
              placeholder="搜索数据"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={onSearch}
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
            scroll={{ x: 2800 }}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            pagination={withMobilePagination(isMobile, {
              current: pageNo,
              pageSize,
              total,
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
            })}
          />
        </div>
      </Card>

      {/* 添加过磅查验弹窗 */}
      <Modal
        title={null}
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        width={isMobile ? '100%' : formExpanded ? 'min(1280px, calc(100vw - 48px))' : 1040}
        closable={false}
        centered
        styles={{ body: { padding: 0, maxHeight: '85vh', overflowY: 'auto', overflowX: 'hidden' } }}
        footer={null}
      >
        <div style={{ padding: isMobile ? '16px 16px 24px' : '16px 28px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>过磅查验</span>
            <Space>
              {!isMobile && (
                formExpanded
                  ? <FullscreenExitOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} onClick={() => setFormExpanded(false)} />
                  : <FullscreenOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} onClick={() => setFormExpanded(true)} />
              )}
              <span onClick={() => setAddModalOpen(false)} style={{ fontSize: 18, cursor: 'pointer', color: '#999', lineHeight: '20px' }}>×</span>
            </Space>
          </div>

          <Form form={addForm} layout="vertical" className="weigh-form">
            <div className="weigh-grid">
              <Form.Item name="code" label="编号" rules={[{ required: true, message: '请输入编号' }]}>
                <Input placeholder="请输入" />
              </Form.Item>

              <Form.Item name="negotiation" label="销户/议价" rules={[{ required: true, message: '请输入销户/议价' }]}>
                <Input placeholder="请输入" />
              </Form.Item>

              <Form.Item name="weighDate" label="过磅日期" rules={[{ required: true, message: '请选择过磅日期' }]}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="请选择日期" />
              </Form.Item>

              <Form.Item name="plateNumber" label="车牌号" rules={[{ required: true, message: '请输入车牌号' }]}>
                <Input placeholder="请输入" />
              </Form.Item>

              <Form.Item name="returnDate" label="回车日期" rules={[{ required: true, message: '请选择回车日期' }]}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="请选择日期" />
              </Form.Item>
            </div>

            <Form.Item name="vehicleType" label="车辆类型" rules={[{ required: true, message: '请选择车辆类型' }]}>
              <VehicleTypeField />
            </Form.Item>

            <div className="weigh-grid">
              <Form.Item name="vehicleModel" label="车辆型号" rules={[{ required: true, message: '请选择车辆型号' }]}>
                <DictSelect dict="vehicleModel" placeholder="请选择车辆型号（基础资料）" />
              </Form.Item>

              <Form.Item name="supplier" label="供应商">
                <DictSelect dict="supplier" placeholder="请选择供应商（基础资料）" />
              </Form.Item>

              <Form.Item name="salesperson" label="业务员">
                <DictSelect dict="salesman" placeholder="请选择业务员（基础资料）" />
              </Form.Item>

              <Form.Item name="returnLocation" label="回车地">
                <Input placeholder="请输入" />
              </Form.Item>

              <Form.Item name="tonnage" label="吨位" rules={[{ required: true, message: '请输入吨位' }]}>
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="flatten" label="压扁">
                <FlagField />
              </Form.Item>

              <Form.Item name="operation" label="营运">
                <FlagField />
              </Form.Item>

              <Form.Item name="bLevel" label="B级">
                <FlagField />
              </Form.Item>
            </div>

            <div className="weigh-section-title">车辆情况</div>

            <div className="weigh-grid">
              <Form.Item name="iron" label="铁">
                <ScoreSelect />
              </Form.Item>

              <Form.Item name="aluminum" label="铝">
                <ScoreSelect />
              </Form.Item>

              <Form.Item name="ternary" label="三元" rules={[{ required: true, message: '请选择三元' }]}>
                <MarkField />
              </Form.Item>

              <Form.Item name="battery" label="电瓶" rules={[{ required: true, message: '请选择电瓶' }]}>
                <MarkField />
              </Form.Item>
            </div>

            <div className="weigh-grid-remark">
              <Form.Item name="tire" label="轮胎">
                <ScoreSelect />
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
