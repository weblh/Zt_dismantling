import { useEffect, useState } from 'react';
import { Modal, Table, Tabs, Button, message } from 'antd';
import { getJdyBusinessData } from '@/api/jdy';
import { getLocalBizRows } from '@/utils/localBizStore';

export type LinkBizKey = 'settlement' | 'price-change' | 'weighing-inspection' | 'receipt';

/** 生产模块联动默认数据源 */
export const PRODUCTION_LINK_SOURCES: LinkBizKey[] = [
  'settlement',
  'price-change',
  'weighing-inspection',
  'receipt',
];

export interface LinkedBizRow {
  id: number;
  source: LinkBizKey;
  code?: string;
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
  [key: string]: unknown;
}

interface BizLinkDataModalProps {
  open: boolean;
  onCancel: () => void;
  onSelect: (row: LinkedBizRow) => void;
  /** 默认同时提供结账与划价（修改价格） */
  sources?: LinkBizKey[];
  title?: string;
}

async function loadSource(bizKey: LinkBizKey): Promise<LinkedBizRow[]> {
  const local = getLocalBizRows<LinkedBizRow>(bizKey).map((r) => ({ ...r, source: bizKey }));
  try {
    const res = await getJdyBusinessData(bizKey, { pageNo: 1, pageSize: 200 });
    const remote = ((res.data.records || []) as LinkedBizRow[]).map((r) => {
      // 收货字段名兼容
      const row = { ...r, source: bizKey };
      if (bizKey === 'receipt') {
        row.supplier = String(r.supplierName || r.supplier || '');
        row.plateNumber = String(r.plateNo || r.plateNumber || '');
      }
      return row;
    });
    const ids = new Set(remote.map((r) => r.id));
    return [...local.filter((r) => !ids.has(r.id)), ...remote];
  } catch {
    return local.map((r) => {
      if (bizKey === 'receipt') {
        return {
          ...r,
          supplier: String(r.supplierName || r.supplier || ''),
          plateNumber: String(r.plateNo || r.plateNumber || ''),
        };
      }
      return r;
    });
  }
}

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

export default function BizLinkDataModal({
  open,
  onCancel,
  onSelect,
  sources = ['settlement', 'price-change'],
  title = '联动业务数据（结账 / 划价 / 扣杂）',
}: BizLinkDataModalProps) {
  const [active, setActive] = useState<LinkBizKey>(sources[0] || 'settlement');
  const [loading, setLoading] = useState(false);
  const [rowsMap, setRowsMap] = useState<Record<string, LinkedBizRow[]>>({});

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all(sources.map(async (key) => [key, await loadSource(key)] as const))
      .then((entries) => {
        const next: Record<string, LinkedBizRow[]> = {};
        entries.forEach(([k, rows]) => {
          next[k] = rows;
        });
        setRowsMap(next);
      })
      .finally(() => setLoading(false));
  }, [open, sources.join(',')]);

  const tabItems = sources.map((key) => ({
    key,
    label:
      key === 'settlement'
        ? '业务结账'
        : key === 'price-change'
          ? '划价/修改价格（含扣杂）'
          : key === 'weighing-inspection'
            ? '过磅查验'
            : '业务收货',
    children: (
      <Table
        rowKey="id"
        size="small"
        loading={loading}
        dataSource={rowsMap[key] || []}
        pagination={{ pageSize: 8 }}
        scroll={{ x: 1000 }}
        columns={[
          ...columns,
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
  }));

  return (
    <Modal title={title} open={open} onCancel={onCancel} footer={null} width={980} destroyOnClose>
      <Tabs activeKey={active} onChange={(k) => setActive(k as LinkBizKey)} items={tabItems} />
    </Modal>
  );
}

/** 将联动行映射到过磅查验等表单常用字段 */
export function mapLinkedRowToFormValues(row: LinkedBizRow) {
  return {
    code: row.code,
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
