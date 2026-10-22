import { useEffect, useState } from 'react';
import { Modal, Table, Tabs, Button, message, Tag, Input, Space } from 'antd';
import { getLocalBizRows, hydrateLocalBizRowsFromServer, mergeLocalRemoteRows } from '@/utils/localBizStore';
import { getJdyBusinessData } from '@/api/jdy';
import { useIsMobile } from '@/hooks/useIsMobile';

export type LinkBizKey = 'weighing-sync' | 'settlement' | 'weighing-inspection' | 'receipt';

/** 生产模块联动默认数据源（含大磅同步数据） */
export const PRODUCTION_LINK_SOURCES: LinkBizKey[] = [
  'weighing-sync',
  'settlement',
  'weighing-inspection',
  'receipt',
];

export interface LinkedBizRow {
  id: number;
  source: LinkBizKey;
  code?: string;
  negotiation?: string;
  plateNumber?: string;
  weighDate?: string;
  returnDate?: string;
  vehicleType?: string;
  vehicleModel?: string;
  supplier?: string;
  salesperson?: string;
  returnLocation?: string;
  tonnage?: number | string;
  iron?: number | string;
  aluminum?: number | string;
  ternary?: number | string;
  battery?: number | string;
  kgDiff?: number | string;
  deductNetWeight?: number | string;
  deductBattery?: number | string;
  goodCondition?: number | string;
  deductTwoBox?: number | string;
  deductBreadBox?: number | string;
  deductIronRing?: number | string;
  deductDiesel?: number | string;
  selfDelivery?: number | string;
  deductSmallParts?: number | string;
  unitPrice?: number | string;
  totalPrice?: number | string;
  remark?: string;
  supplierName?: string;
  plateNo?: string;
  settlementStatus?: string;
  [key: string]: unknown;
}

interface BizLinkDataModalProps {
  open: boolean;
  onCancel: () => void;
  onSelect: (row: LinkedBizRow) => void;
  /** 默认提供业务结账数据 */
  sources?: LinkBizKey[];
  title?: string;
  /**
   * 业务结账过滤：
   * - unsettled：仅未结账（付款申请「选择数据」用）
   * - settled：仅已结账
   * - all / 不传：全部
   */
  settlementStatusFilter?: 'unsettled' | 'settled' | 'all';
  /** 仅显示已填单价（业务结账编辑后有单价）的记录 */
  requireUnitPrice?: boolean;
}

function isUnsettled(row: LinkedBizRow) {
  const s = String(row.settlementStatus ?? '').trim();
  if (!s) return true;
  return s === 'unsettled' || s === '未结账' || s === '0';
}

function isSettled(row: LinkedBizRow) {
  const s = String(row.settlementStatus ?? '').trim();
  return s === 'settled' || s === '已结账' || s === '1';
}

function hasUnitPrice(row: LinkedBizRow) {
  const n = Number(String(row.unitPrice ?? '').replace(/,/g, '').trim());
  return Number.isFinite(n) && n > 0;
}

async function loadSource(
  bizKey: LinkBizKey,
  settlementStatusFilter?: 'unsettled' | 'settled' | 'all',
  requireUnitPrice?: boolean,
): Promise<LinkedBizRow[]> {
  let rows: LinkedBizRow[] = [];

  if (bizKey === 'settlement') {
    // 优先读简道云镜像列表，再与本地草稿合并（避免只读 biz_local 导致空表）
    try {
      const res = await getJdyBusinessData('settlement', { pageNo: 1, pageSize: 100 });
      const remote = ((res.data?.records || []) as LinkedBizRow[]).map((r) => ({
        ...r,
        source: 'settlement' as const,
      }));
      const local = getLocalBizRows<LinkedBizRow>('settlement').map((r) => ({
        ...r,
        source: 'settlement' as const,
      }));
      rows = mergeLocalRemoteRows(local, remote);
      // 若还有更多页，继续拉（最多 5 页，避免一次过重）
      const total = res.data?.total || remote.length;
      const pages = Math.min(Math.ceil(total / 100), 5);
      for (let p = 2; p <= pages; p++) {
        const more = await getJdyBusinessData('settlement', { pageNo: p, pageSize: 100 });
        const moreRows = ((more.data?.records || []) as LinkedBizRow[]).map((r) => ({
          ...r,
          source: 'settlement' as const,
        }));
        rows = mergeLocalRemoteRows(rows, moreRows);
      }
    } catch {
      await hydrateLocalBizRowsFromServer<LinkedBizRow>(bizKey);
      rows = getLocalBizRows<LinkedBizRow>(bizKey).map((r) => ({ ...r, source: bizKey }));
    }
  } else {
    await hydrateLocalBizRowsFromServer<LinkedBizRow>(bizKey);
    rows = getLocalBizRows<LinkedBizRow>(bizKey).map((r) => {
      const row = { ...r, source: bizKey };
      if (bizKey === 'receipt') {
        row.supplier = String(r.supplierName || r.supplier || '');
        row.plateNumber = String(r.plateNo || r.plateNumber || '');
      }
      return row;
    });
  }

  if (bizKey === 'settlement' && settlementStatusFilter === 'unsettled') {
    rows = rows.filter(isUnsettled);
  } else if (bizKey === 'settlement' && settlementStatusFilter === 'settled') {
    rows = rows.filter(isSettled);
  }
  if (bizKey === 'settlement' && requireUnitPrice) {
    rows = rows.filter(hasUnitPrice);
  }

  return rows;
}

const weighingSyncColumns = [
  { title: '编号', dataIndex: 'code', width: 100 },
  { title: '议价/销户', dataIndex: 'negotiation', width: 90 },
  { title: '吨位', dataIndex: 'tonnage', width: 80 },
  { title: '状态', dataIndex: 'status', width: 80 },
  { title: '提交时间', dataIndex: 'submitTime', width: 150 },
];

const settlementColumns = [
  {
    title: '结账情况',
    dataIndex: 'settlementStatus',
    width: 90,
    render: (val: string) =>
      isSettled({ settlementStatus: val } as LinkedBizRow) ? (
        <Tag color="green">已结账</Tag>
      ) : (
        <Tag color="red">未结账</Tag>
      ),
  },
  { title: '编号', dataIndex: 'code', width: 100 },
  { title: '回车日期', dataIndex: 'returnDate', width: 110 },
  { title: '过磅日期', dataIndex: 'weighDate', width: 110 },
  { title: '车牌号', dataIndex: 'plateNumber', width: 110 },
  { title: '车辆类型', dataIndex: 'vehicleType', width: 90 },
  { title: '车辆型号', dataIndex: 'vehicleModel', width: 90 },
  { title: '供应商', dataIndex: 'supplier', width: 140, ellipsis: true },
  { title: '吨位', dataIndex: 'tonnage', width: 80 },
  { title: '扣净重', dataIndex: 'deductNetWeight', width: 80 },
  { title: '扣电瓶', dataIndex: 'deductBattery', width: 80 },
  { title: '单价', dataIndex: 'unitPrice', width: 90 },
  { title: '总价', dataIndex: 'totalPrice', width: 100 },
];

const columns = [
  { title: '编号', dataIndex: 'code', width: 100 },
  { title: '车牌号', dataIndex: 'plateNumber', width: 110 },
  { title: '过磅日期', dataIndex: 'weighDate', width: 110 },
  { title: '供应商', dataIndex: 'supplier', width: 140, ellipsis: true },
  { title: '吨位', dataIndex: 'tonnage', width: 80 },
  { title: '扣净重', dataIndex: 'deductNetWeight', width: 80 },
  { title: '扣电瓶', dataIndex: 'deductBattery', width: 80 },
  { title: '单价', dataIndex: 'unitPrice', width: 90 },
  { title: '总价', dataIndex: 'totalPrice', width: 100 },
];

function columnsForSource(key: LinkBizKey) {
  if (key === 'weighing-sync') return weighingSyncColumns;
  if (key === 'settlement') return settlementColumns;
  return columns;
}

function fuzzyHit(row: LinkedBizRow, keyword: string) {
  const needle = keyword.trim().toLowerCase();
  if (!needle) return true;
  return Object.entries(row).some(([k, v]) => {
    if (k === 'id' || k === 'source') return false;
    return String(v ?? '')
      .toLowerCase()
      .includes(needle);
  });
}

export default function BizLinkDataModal({
  open,
  onCancel,
  onSelect,
  sources = ['settlement'],
  title = '联动业务数据（业务结账）',
  settlementStatusFilter = 'all',
  requireUnitPrice = false,
}: BizLinkDataModalProps) {
  const isMobile = useIsMobile();
  const [active, setActive] = useState<LinkBizKey>(sources[0] || 'settlement');
  const [loading, setLoading] = useState(false);
  const [rowsMap, setRowsMap] = useState<Record<string, LinkedBizRow[]>>({});
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    if (!open) return;
    setKeyword('');
    setActive(sources[0] || 'settlement');
    setLoading(true);
    Promise.all(
      sources.map(async (key) => [key, await loadSource(key, settlementStatusFilter, requireUnitPrice)] as const),
    )
      .then((entries) => {
        const next: Record<string, LinkedBizRow[]> = {};
        entries.forEach(([k, rows]) => {
          next[k] = rows;
        });
        setRowsMap(next);
      })
      .finally(() => setLoading(false));
  }, [open, sources.join(','), settlementStatusFilter, requireUnitPrice]);

  const tabItems = sources.map((key) => {
    const all = rowsMap[key] || [];
    const dataSource = all.filter((r) => fuzzyHit(r, keyword));
    return {
      key,
      label:
        key === 'weighing-sync'
          ? '过磅同步（大磅）'
          : key === 'settlement'
            ? settlementStatusFilter === 'unsettled'
              ? '业务结账（未结账）'
              : settlementStatusFilter === 'settled'
                ? '业务结账（已结账）'
                : '业务结账'
            : key === 'weighing-inspection'
              ? '过磅查验'
              : '业务收货',
      children: (
        <Table
          rowKey="id"
          size="small"
          loading={loading}
          dataSource={dataSource}
          locale={{
            emptyText:
              settlementStatusFilter === 'unsettled' && requireUnitPrice
                ? '暂无可选数据：需未结账且已填写单价（请先在业务结账编辑并保存单价）'
                : settlementStatusFilter === 'unsettled'
                  ? '暂无未结账数据，请先在「业务结账」同步或确认存在未结账记录'
                  : '暂无数据',
          }}
          pagination={{
            pageSize: isMobile ? 5 : 10,
            simple: isMobile,
            size: 'small',
            showTotal: (t) => `共 ${t} 条`,
          }}
          scroll={{ x: 1200 }}
          columns={[
            ...columnsForSource(key),
            {
              title: '操作',
              width: 90,
              fixed: 'right' as const,
              render: (_: unknown, row: LinkedBizRow) => (
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    onSelect(row);
                    message.success('已带入联动数据');
                  }}
                >
                  带入
                </Button>
              ),
            },
          ]}
        />
      ),
    };
  });

  return (
    <Modal title={title} open={open} onCancel={onCancel} footer={null} width={980} destroyOnHidden>
      <Space style={{ marginBottom: 12, width: '100%', justifyContent: 'flex-end' }}>
        <Input.Search
          allowClear
          placeholder="搜索数据"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ width: isMobile ? '100%' : 220 }}
        />
      </Space>
      <Tabs
        activeKey={active}
        onChange={(k) => setActive(k as LinkBizKey)}
        items={tabItems}
        size={isMobile ? 'small' : 'middle'}
      />
    </Modal>
  );
}

/** 将联动行映射到过磅查验等表单常用字段 */
export function mapLinkedRowToFormValues(row: LinkedBizRow) {
  return {
    code: row.code,
    negotiation: row.negotiation,
    plateNumber: row.plateNumber,
    vehicleType: row.vehicleType,
    vehicleModel: row.vehicleModel,
    supplier: row.supplier,
    salesperson: row.salesperson,
    returnLocation: row.returnLocation,
    tonnage: row.tonnage,
    iron: row.iron,
    aluminum: row.aluminum,
    ternary: row.ternary,
    battery: row.battery,
    kgDiff: row.kgDiff,
    deductNetWeight: row.deductNetWeight,
    deductBattery: row.deductBattery,
    goodCondition: row.goodCondition,
    deductTwoBox: row.deductTwoBox,
    deductBreadBox: row.deductBreadBox,
    deductIronRing: row.deductIronRing,
    deductDiesel: row.deductDiesel,
    selfDelivery: row.selfDelivery,
    deductSmallParts: row.deductSmallParts,
    unitPrice: row.unitPrice,
    totalPrice: row.totalPrice,
    remark: row.remark ? String(row.remark) : undefined,
  };
}
