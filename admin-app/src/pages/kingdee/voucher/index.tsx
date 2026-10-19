import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Table,
  Input,
  Button,
  Modal,
  Form,
  Select,
  InputNumber,
  Space,
  message,
  Tag,
} from 'antd';
import {
  FilterOutlined,
  PlusOutlined,
  EditOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { formatBizDateTime, getLocalBizRows, addLocalBizRow } from '@/utils/localBizStore';
import { getStoredUser } from '@/config/apps';
import { useIsMobile } from '@/hooks/useIsMobile';
import { getJdyBusinessData, updateWeighingSyncStatus } from '@/api/jdy';

interface SyncDataItem {
  id: number;
  dataId?: string;
  code: string;
  negotiation: string;
  tonnage: number | string;
  status: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const STATUS_OPTIONS = [
  { value: '0', label: '已同步' },
  { value: '1', label: '待同步' },
] as const;

function normalizeStatus(val: string | undefined): '0' | '1' {
  if (val === '1' || val === '待同步') return '1';
  return '0';
}

export default function SyncDataPage() {
  const isMobile = useIsMobile();
  const [items, setItems] = useState<SyncDataItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [keyword, setKeyword] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getJdyBusinessData('weighing-sync', {
          pageNo,
          pageSize,
          keyword: keyword || undefined,
        });
        if (cancelled) return;
        const remote = (res.data?.records || []) as unknown as SyncDataItem[];
        const local = keyword
          ? []
          : getLocalBizRows<SyncDataItem>('weighing-sync');
        const merged = pageNo === 1 ? [...local, ...remote] : remote;
        setItems(merged);
        setTotal((res.data?.total || 0) + local.length);
      } catch {
        if (!cancelled) {
          setItems([]);
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

  const handleStatusChange = async (row: SyncDataItem, next: '0' | '1') => {
    const current = normalizeStatus(row.status);
    if (current === next) return;
    if (!row.dataId) {
      message.warning('本地新增记录暂不支持改状态，请刷新后操作简道云数据');
      return;
    }
    setSavingId(row.dataId);
    try {
      await updateWeighingSyncStatus(row.dataId, next);
      setItems((prev) =>
        prev.map((item) =>
          item.dataId === row.dataId
            ? { ...item, status: next, updateTime: formatBizDateTime() }
            : item,
        ),
      );
      message.success(next === '0' ? '已标记为已同步' : '已标记为待同步');
    } catch {
      // request 拦截器已提示
    } finally {
      setSavingId(null);
    }
  };

  const columns: ColumnsType<SyncDataItem> = useMemo(
    () => [
      { title: <span style={{ whiteSpace: 'nowrap' }}>编号</span>, dataIndex: 'code', width: 100 },
      {
        title: <span style={{ whiteSpace: 'nowrap' }}>议价/销户</span>,
        dataIndex: 'negotiation',
        width: 100,
        render: (val: string) => {
          if (!val) return '-';
          const isNegotiated = val.includes('议');
          return <Tag color={isNegotiated ? 'orange' : 'green'}>{val}</Tag>;
        },
      },
      {
        title: <span style={{ whiteSpace: 'nowrap' }}>吨位</span>,
        dataIndex: 'tonnage',
        width: 90,
        align: 'right',
        render: (val: number | string) => {
          const n = Number(val);
          return Number.isFinite(n) ? n.toFixed(2) : val ?? '-';
        },
      },
      {
        title: <span style={{ whiteSpace: 'nowrap' }}>状态</span>,
        dataIndex: 'status',
        width: 130,
        render: (val: string, row) => (
          <Select
            size="small"
            style={{ width: 108 }}
            value={normalizeStatus(val)}
            options={[...STATUS_OPTIONS]}
            loading={!!row.dataId && savingId === row.dataId}
            disabled={!row.dataId || (!!savingId && savingId !== row.dataId)}
            onChange={(v) => handleStatusChange(row, v as '0' | '1')}
          />
        ),
      },
      { title: <span style={{ whiteSpace: 'nowrap' }}>提交人</span>, dataIndex: 'submitter', width: 100 },
      { title: <span style={{ whiteSpace: 'nowrap' }}>提交时间</span>, dataIndex: 'submitTime', width: 170 },
      { title: <span style={{ whiteSpace: 'nowrap' }}>更新时间</span>, dataIndex: 'updateTime', width: 170 },
    ],
    [savingId],
  );

  const handleAdd = () => {
    form.resetFields();
    setAddModalOpen(true);
  };

  const handleAddSubmit = async () => {
    try {
      const values = await form.validateFields();
      const user = getStoredUser();
      const now = formatBizDateTime();
      addLocalBizRow<SyncDataItem>('weighing-sync', {
        code: values.code,
        negotiation: values.negotiation || '',
        tonnage: values.tonnage,
        status: values.status,
        submitter: user.nickname || user.username || '系统',
        submitTime: now,
        updateTime: now,
      });
      setReloadKey((k) => k + 1);
      message.success('已添加（本地）');
      setAddModalOpen(false);
      form.resetFields();
    } catch {
      // form validation failed
    }
  };

  return (
    <div className="page-container">
      <Card
        title="过磅同步数据"
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => setReloadKey((k) => k + 1)}
            >
              刷新
            </Button>
            {!isMobile && <Button icon={<EditOutlined />}>编辑</Button>}
          </Space>
        }
      >
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            gap: 12,
          }}
        >
          <Space wrap style={{ width: isMobile ? '100%' : undefined, marginLeft: isMobile ? 0 : 'auto' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加
            </Button>
            <Input.Search
              placeholder="搜索编号/吨位"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={(value) => {
                setSearchValue(value);
                setPageNo(1);
                setKeyword(value.trim());
              }}
              style={{ width: isMobile ? '100%' : 220, minWidth: isMobile ? 0 : 220, flex: isMobile ? 1 : undefined }}
              allowClear
            />
            {!isMobile && <Button icon={<FilterOutlined />}>筛选</Button>}
          </Space>
        </div>

        <Table
          rowKey={(r) => String(r.dataId || r.id)}
          columns={columns}
          dataSource={items}
          loading={loading}
          size={isMobile ? 'small' : 'middle'}
          scroll={{ x: 860 }}
          pagination={{
            current: pageNo,
            pageSize,
            total,
            size: isMobile ? 'small' : 'middle',
            simple: isMobile,
            showSizeChanger: !isMobile,
            showTotal: (t) => (isMobile ? `共 ${t} 条` : `共 ${t} 条（近90天 · 过磅系统→简道云开放接口）`),
            onChange: (page, size) => {
              setPageNo(page);
              setPageSize(size);
            },
          }}
        />
      </Card>

      <Modal
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        width={500}
        centered
        title="添加过磅同步数据"
        footer={[
          <Button key="cancel" onClick={() => setAddModalOpen(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleAddSubmit}>
            提交
          </Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark
          initialValues={{ code: '', negotiation: '', tonnage: null, status: '1' }}
          style={{ paddingTop: 8 }}
        >
          <Form.Item label="编号" name="code" rules={[{ required: true, message: '请输入编号' }]}>
            <Input placeholder="请输入编号" />
          </Form.Item>
          <Form.Item label="议价/销户" name="negotiation">
            <Select
              placeholder="请选择"
              allowClear
              options={[
                { value: '销', label: '销户' },
                { value: '议', label: '议价' },
              ]}
            />
          </Form.Item>
          <Form.Item label="吨位" name="tonnage" rules={[{ required: true, message: '请输入吨位' }]}>
            <InputNumber placeholder="请填写数值" style={{ width: '100%' }} min={0} precision={2} step={0.01} />
          </Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
            <Select placeholder="请选择状态" options={[...STATUS_OPTIONS]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
