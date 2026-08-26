import { useCallback, useEffect, useMemo, useState } from 'react';
import { Table, Spin, message } from 'antd';
import { InfoCircleOutlined, SyncOutlined, EditOutlined, SettingOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { getBizLocalRows, getJdyBusinessData } from '@/api/bizData';

interface LedgerItem {
  id: number;
  weighDate: string;
  receiveCount: number;
  receiveTonnage: number;
  dismantleCount: number;
  dismantleTonnage: number;
  stockVehicle: number;
  stockTonnage: number;
}

interface MonthlyItem {
  id: number;
  month: string;
  receiveCount: number;
  dismantleCount: number;
  stockCount: number;
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function pickDate(row: Record<string, unknown>): string {
  const raw =
    row.weighDate ||
    row.returnDate ||
    row.overweightDate ||
    row.submitTime ||
    row.createTime ||
    '';
  const d = dayjs(String(raw).replace(/\//g, '-'));
  return d.isValid() ? d.format('YYYY/MM/DD') : '';
}

function pickWeight(row: Record<string, unknown>): number {
  return num(row.tonnage ?? row.netWeight ?? row.deductNetWeight ?? row.inboundTonnage ?? 0);
}

async function loadMerged(bizKey: string): Promise<Record<string, unknown>[]> {
  const local = await getBizLocalRows<Record<string, unknown>>(bizKey)
    .then((r) => r.data || [])
    .catch(() => [] as Record<string, unknown>[]);
  const remote = await getJdyBusinessData(bizKey, { pageNo: 1, pageSize: 5000 })
    .then((r) => r.data?.records || [])
    .catch(() => [] as Record<string, unknown>[]);
  const map = new Map<string | number, Record<string, unknown>>();
  remote.forEach((row) => map.set(row.id as number, row));
  local.forEach((row) => map.set(row.id as number, row));
  return Array.from(map.values());
}

function buildDaily(
  receiveRows: Record<string, unknown>[],
  dismantleRows: Record<string, unknown>[],
): LedgerItem[] {
  const byDate: Record<string, LedgerItem> = {};
  const ensure = (date: string) => {
    if (!byDate[date]) {
      byDate[date] = {
        id: 0,
        weighDate: date,
        receiveCount: 0,
        receiveTonnage: 0,
        dismantleCount: 0,
        dismantleTonnage: 0,
        stockVehicle: 0,
        stockTonnage: 0,
      };
    }
    return byDate[date];
  };

  receiveRows.forEach((row) => {
    const date = pickDate(row);
    if (!date) return;
    const item = ensure(date);
    item.receiveCount += 1;
    item.receiveTonnage += pickWeight(row);
  });

  dismantleRows.forEach((row) => {
    const date = pickDate(row);
    if (!date) return;
    const item = ensure(date);
    item.dismantleCount += 1;
    item.dismantleTonnage += pickWeight(row);
  });

  return Object.values(byDate)
    .map((item) => ({
      ...item,
      receiveTonnage: Math.round(item.receiveTonnage * 100) / 100,
      dismantleTonnage: Math.round(item.dismantleTonnage * 100) / 100,
      stockVehicle: item.receiveCount - item.dismantleCount,
      stockTonnage: Math.round((item.receiveTonnage - item.dismantleTonnage) * 100) / 100,
    }))
    .sort((a, b) => dayjs(b.weighDate).valueOf() - dayjs(a.weighDate).valueOf())
    .map((item, idx) => ({ ...item, id: idx + 1 }));
}

function buildMonthly(daily: LedgerItem[]): MonthlyItem[] {
  const byMonth: Record<string, MonthlyItem> = {};
  daily.forEach((d) => {
    const m = dayjs(d.weighDate);
    if (!m.isValid()) return;
    const key = `${m.year()}年${String(m.month() + 1).padStart(2, '0')}月`;
    if (!byMonth[key]) {
      byMonth[key] = { id: 0, month: key, receiveCount: 0, dismantleCount: 0, stockCount: 0 };
    }
    byMonth[key].receiveCount += d.receiveCount;
    byMonth[key].dismantleCount += d.dismantleCount;
  });
  return Object.values(byMonth)
    .map((item) => ({
      ...item,
      stockCount: item.receiveCount - item.dismantleCount,
    }))
    .sort((a, b) => b.month.localeCompare(a.month))
    .map((item, idx) => ({ ...item, id: idx + 1 }));
}

const leftColumns: ColumnsType<LedgerItem> = [
  { title: '过磅日期', dataIndex: 'weighDate', width: 120, align: 'center' },
  { title: '收车数量', dataIndex: 'receiveCount', width: 100, align: 'center' },
  { title: '收车吨位', dataIndex: 'receiveTonnage', width: 100, align: 'center', render: (v: number) => v.toFixed(2) },
  { title: '拆解数量', dataIndex: 'dismantleCount', width: 100, align: 'center' },
  { title: '拆解吨位(吨)', dataIndex: 'dismantleTonnage', width: 120, align: 'center', render: (v: number) => v.toFixed(2) },
  { title: '库存车辆', dataIndex: 'stockVehicle', width: 100, align: 'center' },
  { title: '库存吨位', dataIndex: 'stockTonnage', width: 100, align: 'center', render: (v: number) => v.toFixed(2) },
];

const rightColumns: ColumnsType<MonthlyItem> = [
  { title: '过磅日期', dataIndex: 'month', width: 140, align: 'center' },
  { title: '收车数量', dataIndex: 'receiveCount', width: 100, align: 'center' },
  { title: '拆解数量', dataIndex: 'dismantleCount', width: 100, align: 'center' },
  { title: '库存数量', dataIndex: 'stockCount', width: 100, align: 'center' },
];

export default function InventoryLedger() {
  const [leftPage, setLeftPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [daily, setDaily] = useState<LedgerItem[]>([]);
  const [monthly, setMonthly] = useState<MonthlyItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [weighing, receipt, disassembly, comprehensive] = await Promise.all([
        loadMerged('weighing-inspection'),
        loadMerged('receipt'),
        loadMerged('disassembly'),
        loadMerged('comprehensive-disassembly'),
      ]);
      const receiveRows = [...weighing, ...receipt];
      const dismantleRows = [...disassembly, ...comprehensive];
      const d = buildDaily(receiveRows, dismantleRows);
      const m = buildMonthly(d);
      setDaily(d);
      setMonthly(m);
      setLeftPage(1);
      if (d.length === 0) {
        message.info('暂无业务数据，请先在管理端提交过磅/收货/拆解');
      }
    } catch {
      message.error('加载库存台账失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    return monthly.reduce(
      (acc, item) => ({
        receiveCount: acc.receiveCount + item.receiveCount,
        dismantleCount: acc.dismantleCount + item.dismantleCount,
        stockCount: acc.stockCount + item.stockCount,
      }),
      { receiveCount: 0, dismantleCount: 0, stockCount: 0 },
    );
  }, [monthly]);

  return (
    <div style={{
      minHeight: 'calc(100vh - 50px)',
      background: 'linear-gradient(135deg, #1a2942 0%, #0d1b2a 100%)',
      padding: '0 16px 16px',
      color: '#c8d6e5',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, paddingLeft: 8 }}>
          <span style={{ fontSize: 15, color: '#e8ecf1', fontWeight: 500 }}>出入库台账</span>
          <EditOutlined style={{ color: '#8a9bb4', fontSize: 14, cursor: 'pointer' }} />
          <SyncOutlined
            spin={loading}
            onClick={load}
            style={{ color: '#8a9bb4', fontSize: 14, cursor: 'pointer' }}
            title="刷新"
          />
          <SettingOutlined style={{ color: '#8a9bb4', fontSize: 14, cursor: 'pointer' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingRight: 16 }}>
          <SettingOutlined style={{ color: '#8a9bb4', fontSize: 16, cursor: 'pointer' }} />
          <EditOutlined style={{ color: '#8a9bb4', fontSize: 16, cursor: 'pointer' }} />
          <InfoCircleOutlined style={{ color: '#8a9bb4', fontSize: 16, cursor: 'pointer' }} />
        </div>
      </div>

      <Spin spinning={loading}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{
            background: 'rgba(20, 40, 70, 0.85)',
            borderRadius: 6,
            border: '1px solid rgba(70, 130, 180, 0.3)',
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              background: 'linear-gradient(90deg, rgba(30, 80, 140, 0.6) 0%, rgba(20, 50, 90, 0.3) 100%)',
              borderBottom: '1px solid rgba(70, 130, 180, 0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, color: '#e8ecf1', fontWeight: 500 }}>山西华成攒碳车辆出入库台账</span>
                <InfoCircleOutlined style={{ color: '#4a9eff', fontSize: 16 }} />
              </div>
            </div>
            <Table
              rowKey="id"
              columns={leftColumns}
              dataSource={daily}
              pagination={{
                current: leftPage,
                pageSize: 10,
                total: daily.length,
                showSizeChanger: false,
                showTotal: () => `${leftPage} / ${Math.max(1, Math.ceil(daily.length / 10))}`,
                onChange: (page) => setLeftPage(page),
              }}
              size="small"
              style={{ background: 'transparent' }}
              className="dark-table"
            />
          </div>

          <div style={{
            background: 'rgba(20, 40, 70, 0.85)',
            borderRadius: 6,
            border: '1px solid rgba(70, 130, 180, 0.3)',
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              background: 'linear-gradient(90deg, rgba(30, 80, 140, 0.6) 0%, rgba(20, 50, 90, 0.3) 100%)',
              borderBottom: '1px solid rgba(70, 130, 180, 0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, color: '#e8ecf1', fontWeight: 500 }}>月度统计表</span>
                <InfoCircleOutlined style={{ color: '#4a9eff', fontSize: 16 }} />
              </div>
              <SyncOutlined
                spin={loading}
                onClick={load}
                style={{ color: '#8a9bb4', fontSize: 14, cursor: 'pointer' }}
              />
            </div>
            <Table
              rowKey="id"
              columns={rightColumns}
              dataSource={monthly}
              pagination={false}
              size="small"
              style={{ background: 'transparent' }}
              className="dark-table"
            />
            <div style={{
              display: 'flex',
              borderTop: '1px solid rgba(70, 130, 180, 0.3)',
              background: 'rgba(30, 60, 110, 0.5)',
              fontWeight: 500,
              color: '#e8ecf1',
            }}>
              <div style={{ flex: 1, padding: '10px 12px', textAlign: 'center' }}>汇总</div>
              <div style={{ flex: 1, padding: '10px 12px', textAlign: 'center' }}>{summary.receiveCount}</div>
              <div style={{ flex: 1, padding: '10px 12px', textAlign: 'center' }}>{summary.dismantleCount}</div>
              <div style={{ flex: 1, padding: '10px 12px', textAlign: 'center' }}>{summary.stockCount}</div>
            </div>
          </div>
        </div>
      </Spin>

      <style>{`
        .dark-table .ant-table {
          background: transparent !important;
          color: #c8d6e5;
        }
        .dark-table .ant-table-thead > tr > th {
          background: rgba(30, 60, 100, 0.8) !important;
          color: #a8c0d8 !important;
          border-bottom: 1px solid rgba(70, 130, 180, 0.3) !important;
        }
        .dark-table .ant-table-tbody > tr > td {
          background: transparent !important;
          border-bottom: 1px solid rgba(70, 130, 180, 0.15) !important;
          color: #c8d6e5 !important;
        }
        .dark-table .ant-table-tbody > tr:hover > td {
          background: rgba(40, 80, 140, 0.35) !important;
        }
        .dark-table .ant-pagination-item-active {
          background: rgba(40, 100, 180, 0.5) !important;
          border-color: #4a9eff !important;
        }
      `}</style>
    </div>
  );
}
