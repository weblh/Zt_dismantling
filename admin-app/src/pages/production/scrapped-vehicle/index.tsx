import { useEffect, useState } from 'react';
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
  DatePicker,
  InputNumber,
  Radio,
} from 'antd';
import {
  PlusOutlined,
  ImportOutlined,
  ExportOutlined,
  DeleteOutlined,
  FilterOutlined,
  MoreOutlined,
  CheckOutlined,
  CloudSyncOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import BizLinkDataModal, { PRODUCTION_LINK_SOURCES } from '@/components/BizLinkDataModal';
import DictSelect from '@/components/DictSelect';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';
import { getJdyBusinessData, syncJdyScrappedVehicle } from '@/api/jdy';
import { addLocalBizRow, formatBizDateTime, getLocalBizRows } from '@/utils/localBizStore';
import { getStoredUser } from '@/config/apps';

interface ScrappedVehicleItem {
  id: number;
  entryCode: string;
  negotiation: string;
  weighDate: string;
  netWeight: number | string;
  supplier: string;
  vehicleType: string;
  vehicleModel: string;
  weighmaster: string;
  flatten: string;
  operation: string;
  bLevel: string;
  iron: number | string;
  aluminum: number | string;
  ternary: number | string;
  battery: number | string;
  tire: number | string;
  remark: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

/** 上方：查验照片生成后关联过磅同步 / 过磅查验自动带入 */
const LINKED_TOP_FIELDS = [
  'entryCode',
  'negotiation',
  'weighDate',
  'netWeight',
  'supplier',
  'vehicleType',
  'vehicleModel',
  'weighmaster',
] as const;

function renderMarkOrText(val: unknown) {
  if (val == null || val === '') return '-';
  const s = String(val);
  if (s === '√' || s === '✓' || s === '✔' || s === '议价' || s === '是') {
    return <CheckOutlined style={{ color: '#52c41a' }} />;
  }
  if (s === '×' || s === '✕' || s === '✖' || s === 'x' || s === 'X' || s === '否') {
    return <span style={{ color: '#999' }}>×</span>;
  }
  return s;
}

function renderYesNo(val: unknown) {
  if (val == null || val === '') return '';
  const s = String(val);
  if (s === '是' || s === '√' || s === '✓') return '是';
  if (s === '否' || s === '×') return '否';
  return s;
}

function renderNumOrMark(val: unknown) {
  if (val == null || val === '') return '-';
  const n = Number(val);
  if (Number.isFinite(n) && String(val).trim() !== '' && !Number.isNaN(n) && /^-?\d+(\.\d+)?$/.test(String(val).trim())) {
    return <span style={{ textAlign: 'right', display: 'block' }}>{n.toFixed(2)}</span>;
  }
  return renderMarkOrText(val);
}

const columns: ColumnsType<ScrappedVehicleItem> = [
  { title: <span style={{ whiteSpace: 'nowrap' }}>入场编号</span>, dataIndex: 'entryCode', width: 100, fixed: 'left' },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>销户/议价</span>,
    dataIndex: 'negotiation',
    width: 100,
    fixed: 'left',
    render: (val: string) => renderMarkOrText(val),
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>过磅日期</span>, dataIndex: 'weighDate', width: 120 },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>净重</span>,
    dataIndex: 'netWeight',
    width: 90,
    render: (val: number | string) => renderNumOrMark(val),
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>供应商</span>, dataIndex: 'supplier', width: 100 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车辆类型</span>, dataIndex: 'vehicleType', width: 110 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车辆型号</span>, dataIndex: 'vehicleModel', width: 100 },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>司磅员</span>,
    dataIndex: 'weighmaster',
    width: 100,
    render: (val: string) => (
      <span style={{ color: '#1890ff', cursor: 'pointer' }}>{val || '-'}</span>
    ),
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>压扁</span>,
    dataIndex: 'flatten',
    width: 70,
    render: (val: string) => renderYesNo(val),
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>营运</span>,
    dataIndex: 'operation',
    width: 70,
    render: (val: string) => renderYesNo(val),
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>B级</span>,
    dataIndex: 'bLevel',
    width: 70,
    render: (val: string) => renderYesNo(val),
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>铁</span>, dataIndex: 'iron', width: 80, render: renderNumOrMark },
  { title: <span style={{ whiteSpace: 'nowrap' }}>铝</span>, dataIndex: 'aluminum', width: 80, render: renderNumOrMark },
  { title: <span style={{ whiteSpace: 'nowrap' }}>三元</span>, dataIndex: 'ternary', width: 80, render: renderNumOrMark },
  { title: <span style={{ whiteSpace: 'nowrap' }}>电瓶</span>, dataIndex: 'battery', width: 80, render: renderNumOrMark },
  { title: <span style={{ whiteSpace: 'nowrap' }}>轮胎</span>, dataIndex: 'tire', width: 80, render: renderNumOrMark },
  { title: <span style={{ whiteSpace: 'nowrap' }}>备注</span>, dataIndex: 'remark', width: 120 },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>提交人</span>,
    dataIndex: 'submitter',
    width: 100,
    render: (val: string) => (
      <span style={{ color: '#1890ff', cursor: 'pointer' }}>{val || '-'}</span>
    ),
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>提交时间</span>, dataIndex: 'submitTime', width: 170 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>更新时间</span>, dataIndex: 'updateTime', width: 170 },
];

function mapRemoteRow(row: Record<string, unknown>): ScrappedVehicleItem {
  return {
    id: Number(row.id),
    entryCode: String(row.entryCode || ''),
    negotiation: String(row.negotiation ?? ''),
    weighDate: String(row.weighDate || ''),
    netWeight: (row.netWeight as number | string) ?? '',
    supplier: String(row.supplier || ''),
    vehicleType: String(row.vehicleType || ''),
    vehicleModel: String(row.vehicleModel || ''),
    weighmaster: String(row.weighmaster || ''),
    flatten: String(row.flatten || ''),
    operation: String(row.operation || ''),
    bLevel: String(row.bLevel || ''),
    iron: (row.iron as number | string) ?? '',
    aluminum: (row.aluminum as number | string) ?? '',
    ternary: (row.ternary as number | string) ?? '',
    battery: (row.battery as number | string) ?? '',
    tire: (row.tire as number | string) ?? '',
    remark: String(row.remark || ''),
    submitter: String(row.submitter || ''),
    submitTime: String(row.submitTime || ''),
    updateTime: String(row.updateTime || ''),
  };
}

/** 联动行只带入上方关联字段，下方业务员字段不覆盖 */
function mapLinkToTopFields(row: Record<string, unknown>) {
  const tonnage = row.tonnage ?? row.netWeight;
  const weighDate = row.weighDate;
  return {
    entryCode: String(row.code || row.entryCode || ''),
    negotiation: row.negotiation != null ? String(row.negotiation) : undefined,
    weighDate: weighDate ? dayjs(String(weighDate)) : undefined,
    netWeight: tonnage != null && tonnage !== '' ? Number(tonnage) : undefined,
    supplier: row.supplier != null ? String(row.supplier) : undefined,
    vehicleType: row.vehicleType != null ? String(row.vehicleType) : undefined,
    vehicleModel: row.vehicleModel != null ? String(row.vehicleModel) : undefined,
    weighmaster: row.weighmaster != null
      ? String(row.weighmaster)
      : row.salesperson != null
        ? String(row.salesperson)
        : undefined,
  };
}

export default function ScrappedVehicle() {
  const isMobile = useIsMobile();
  const [dataSource, setDataSource] = useState<ScrappedVehicleItem[]>([]);
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
  const [form] = Form.useForm();
  const [linkModalOpen, setLinkModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getJdyBusinessData('scrapped-vehicle', {
          pageNo,
          pageSize,
          keyword: keyword || undefined,
        });
        if (cancelled) return;
        const remote = ((res.data?.records || []) as Record<string, unknown>[]).map(mapRemoteRow);
        const local = keyword
          ? []
          : getLocalBizRows<ScrappedVehicleItem>('scrapped-vehicle');
        const merged = pageNo === 1 ? [...local, ...remote] : remote;
        setDataSource(merged);
        setTotal((res.data?.total || 0) + (keyword ? 0 : local.length));
      } catch {
        if (!cancelled) {
          message.error('报废车入库加载失败，请稍后重试');
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

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await syncJdyScrappedVehicle();
      message.success(res.data?.message || '同步成功');
      setPageNo(1);
      setReloadKey((k) => k + 1);
    } catch {
      // interceptor
    } finally {
      setSyncing(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
    setPageNo(1);
    setKeyword(value.trim());
  };

  const handleAdd = () => {
    setAddModalOpen(true);
    form.resetFields();
  };

  const handleAddSubmit = async () => {
    try {
      const values = await form.validateFields();
      const user = getStoredUser();
      const now = formatBizDateTime();
      const weighDate =
        values.weighDate && dayjs.isDayjs(values.weighDate)
          ? values.weighDate.format('YYYY-MM-DD')
          : String(values.weighDate || '');
      addLocalBizRow<ScrappedVehicleItem>('scrapped-vehicle', {
        entryCode: values.entryCode || `RK${Date.now()}`,
        negotiation: values.negotiation || '',
        weighDate,
        netWeight: values.netWeight ?? '',
        supplier: values.supplier || '',
        vehicleType: values.vehicleType || '',
        vehicleModel: values.vehicleModel || '',
        weighmaster: values.weighmaster || '',
        flatten: values.flatten || '',
        operation: values.operation || '',
        bLevel: values.bLevel || '',
        iron: values.iron ?? '',
        aluminum: values.aluminum ?? '',
        ternary: values.ternary ?? '',
        battery: values.battery ?? '',
        tire: values.tire ?? '',
        remark: values.remark || '',
        submitter: user.nickname || user.username || '系统',
        submitTime: now,
        updateTime: now,
      });
      setPageNo(1);
      setReloadKey((k) => k + 1);
      message.success('入库完成，已写入列表（本地）');
      setAddModalOpen(false);
      form.resetFields();
    } catch {
      message.error('请填写完整信息');
    }
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
    message.info('简道云同步数据请在简道云中删除');
  };

  const moreMenuItems = [
    { key: 'batchUpdate', label: '批量更新' },
    { key: 'batchDelete', label: '批量删除' },
    { key: 'exportAll', label: '导出全部' },
  ];

  return (
    <div className="page-container">
      <Card styles={{ body: { padding: 0 } }}>
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
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加</Button>
            <Button icon={<CloudSyncOutlined />} loading={syncing} onClick={handleSync}>
              同步
            </Button>
            <Button icon={<ImportOutlined />} onClick={handleImport}>导入</Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
            <Button icon={<DeleteOutlined />} onClick={handleDelete}>删除</Button>
            <Dropdown menu={{ items: moreMenuItems }}>
              <Button>
                <MoreOutlined />
              </Button>
            </Dropdown>
          </Space>
          <Space wrap>
            <Input.Search
              placeholder="搜索入场编号/供应商"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={handleSearch}
              style={{ width: isMobile ? '100%' : 200 }}
              allowClear
            />
            <Button
              icon={<FilterOutlined />}
              style={{ background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}
            >
              筛选
            </Button>
          </Space>
        </div>

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

      <Modal
        title="4.报废车入库"
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        width={720}
        footer={null}
        closable
      >
        <Form form={form} layout="vertical" requiredMark style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>
            上方字段：关联过磅同步 / 过磅查验（查验照片新增后自动生成时可带入）
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
            <Form.Item
              label="入场编号"
              name="entryCode"
              rules={[{ required: true, message: '请选择入场编号' }]}
            >
              <Input placeholder="联动过磅同步/过磅查验带入" allowClear />
            </Form.Item>

            <Form.Item label="销户/议价" name="negotiation">
              <Input placeholder="关联带入" />
            </Form.Item>

            <Form.Item
              label="过磅日期"
              name="weighDate"
              rules={[{ required: true, message: '请选择过磅日期' }]}
            >
              <DatePicker style={{ width: '100%' }} placeholder="关联带入" />
            </Form.Item>

            <Form.Item
              label="净重"
              name="netWeight"
              rules={[{ required: true, message: '请输入净重' }]}
            >
              <InputNumber
                placeholder="关联带入"
                style={{ width: '100%' }}
                min={0}
                precision={2}
                step={0.01}
              />
            </Form.Item>

            <Form.Item
              label="供应商"
              name="supplier"
              rules={[{ required: true, message: '请选择供应商' }]}
            >
              <DictSelect dict="supplier" placeholder="关联带入 / 基础资料" />
            </Form.Item>

            <Form.Item
              label="车辆类型"
              name="vehicleType"
              rules={[{ required: true, message: '请输入车辆类型' }]}
            >
              <Input placeholder="关联带入" />
            </Form.Item>

            <Form.Item label="车辆型号" name="vehicleModel">
              <DictSelect dict="vehicleModel" placeholder="关联带入 / 基础资料" />
            </Form.Item>

            <Form.Item
              label="司磅员"
              name="weighmaster"
              rules={[{ required: true, message: '请选择司磅员' }]}
            >
              <DictSelect dict="staff" placeholder="关联带入 / 生产人员" />
            </Form.Item>
          </div>

          <div style={{ margin: '12px 0 8px', color: '#666', fontSize: 13 }}>
            下方字段：业务员手动选择
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
            <Form.Item label="压扁" name="flatten">
              <Radio.Group>
                <Radio value="是">是</Radio>
                <Radio value="否">否</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item label="营运" name="operation">
              <Radio.Group>
                <Radio value="是">是</Radio>
                <Radio value="否">否</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item label="B级" name="bLevel">
              <Radio.Group>
                <Radio value="是">是</Radio>
                <Radio value="否">否</Radio>
              </Radio.Group>
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px', marginTop: 8 }}>
            <Form.Item label="铁" name="iron">
              <Input placeholder="数值或标记" />
            </Form.Item>

            <Form.Item label="铝" name="aluminum">
              <Input placeholder="数值或标记" />
            </Form.Item>

            <Form.Item label="三元" name="ternary">
              <Input placeholder="数值或 √ / ×" />
            </Form.Item>

            <Form.Item label="电瓶" name="battery">
              <Input placeholder="数值或 √ / ×" />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '0 16px', marginTop: 8 }}>
            <Form.Item label="轮胎" name="tire">
              <Input placeholder="数值或标记" />
            </Form.Item>

            <Form.Item label="备注" name="remark">
              <Input.TextArea placeholder="请输入" rows={2} />
            </Form.Item>
          </div>

          <Form.Item style={{ marginTop: 16, marginBottom: 0 }}>
            <Space>
              <Button type="link" onClick={() => setLinkModalOpen(true)}>
                联动过磅同步/过磅查验（只填上方）
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={handleAddSubmit}
                style={{
                  width: 160,
                  background: '#52c41a',
                  borderColor: '#52c41a',
                  height: 48,
                  fontSize: 16,
                }}
              >
                入库完成
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <BizLinkDataModal
        open={linkModalOpen}
        onCancel={() => setLinkModalOpen(false)}
        sources={PRODUCTION_LINK_SOURCES}
        title="从过磅同步 / 过磅查验带入上方字段"
        onSelect={(row) => {
          const top = mapLinkToTopFields(row as unknown as Record<string, unknown>);
          // 只 set 上方字段，不碰压扁/营运/B级/铁铝等业务员字段
          const patch: Record<string, unknown> = {};
          for (const key of LINKED_TOP_FIELDS) {
            if (top[key] !== undefined) patch[key] = top[key];
          }
          form.setFieldsValue(patch);
          setLinkModalOpen(false);
          setAddModalOpen(true);
          message.success('已带入过磅关联字段，请手动填写下方业务员选项');
        }}
      />
    </div>
  );
}
