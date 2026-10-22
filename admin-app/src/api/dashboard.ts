import request from '@/utils/request';
import type { JdyStatus } from '@/api/jdy';

export interface SourceBreakdownItem {
  source: string;
  code?: string;
  appId?: string;
  value: number;
}

export interface DashboardKpiCard {
  title: string;
  value: number;
  unit: string;
  sub: string;
  color: string;
  glow?: string;
  icon?: string;
  bizKey?: string;
  bySource?: SourceBreakdownItem[];
}

export interface ProductionTrendItem {
  month: string;
  receipt: number;
  disassembly: number;
  weight: number;
}

export interface ProductionSummary {
  totalReceipt: number;
  totalDisassembly: number;
  totalWeight: number;
  avgPrice: number;
}

export interface StaffRankingItem {
  name: string;
  monthly: number;
  amount: number;
}

export interface SalesTrendItem {
  month: string;
  amount: number;
  count: number;
}

export interface ProductInboundItem {
  name: string;
  value: number;
  color: string;
}

export interface WarehouseStockItem {
  warehouse: string;
  shredding: number;
  scrapSteel: number;
  chassis: number;
  copper: number;
  aluminum: number;
  plastic: number;
  smallParts: number;
  rubber: number;
}

export interface InOutCompareItem {
  product: string;
  inbound: number;
  outbound: number;
  unit: string;
}

export interface ActivityItem {
  time: string;
  type: string;
  text: string;
  color: string;
}

export interface NegotiationStats {
  negotiated: number;
  cancelled: number;
  total: number;
  negotiatedRatio: number;
  receiptNegotiated: number;
  receiptCancelled: number;
  inspectionNegotiated: number;
  inspectionCancelled: number;
  inboundNegotiated: number;
  inboundCancelled: number;
  source?: string;
}

export interface SourcePeriodItem {
  source?: string;
  code?: string;
  year: number;
  month: number;
}

export interface SourcePeriodStats {
  receipt?: {
    receipt?: SourcePeriodItem;
    pricing?: SourcePeriodItem;
    total?: SourcePeriodItem;
  };
  inbound?: {
    receipt?: SourcePeriodItem;
    pricing?: SourcePeriodItem;
    total?: SourcePeriodItem;
  };
}

export interface SalesSummary {
  monthAmount: number;
  yearAmount: number;
  monthWan: number;
  yearWan: number;
  monthCount: number;
  yearCount: number;
  monthBySource?: SourceBreakdownItem[];
  yearBySource?: SourceBreakdownItem[];
}

export interface PartCategoryItem {
  name: string;
  amount: number;
  wan: number;
}

export interface PartStats {
  yearAmount: number;
  monthAmount: number;
  yearWan: number;
  monthWan: number;
  yearWeight: number;
  monthWeight: number;
  yearCount: number;
  monthCount: number;
  categoryYear: PartCategoryItem[];
  categoryMonth: PartCategoryItem[];
}

export interface DigitalDashboardData {
  overviewRows?: BusinessOverviewRow[];
  kpiCards: DashboardKpiCard[];
  productionTrend: ProductionTrendItem[];
  productionSummary: ProductionSummary;
  staffRanking: StaffRankingItem[];
  staffRankingMonth?: StaffRankingItem[];
  staffRankingYear?: StaffRankingItem[];
  negotiationStats?: NegotiationStats;
  sourcePeriodStats?: SourcePeriodStats;
  salesSummary?: SalesSummary;
  partStats?: PartStats;
  /** @deprecated 已下线：产品入库分析 */
  productInbound?: ProductInboundItem[];
  /** @deprecated 已下线：仓库库存 */
  warehouseStock?: WarehouseStockItem[];
  salesTrend: SalesTrendItem[];
  /** @deprecated 已下线：出入库对比 */
  inOutCompare?: InOutCompareItem[];
  activities?: ActivityItem[];
  year: number;
  rangeLabel?: string;
  localDataCount?: number;
  dataSource: string;
  jdyStatus?: JdyStatus;
}

export interface BusinessOverviewStat {
  label: string;
  value: number;
  isCircle: boolean;
  bizKey?: string;
  bySource?: SourceBreakdownItem[];
}

export interface BusinessOverviewRow {
  title: string;
  stats: BusinessOverviewStat[];
}

export interface BusinessOverviewData {
  title: string;
  year: number;
  rows: BusinessOverviewRow[];
  dataSource: string;
  jdyStatus?: JdyStatus;
}

export interface DashboardQueryParams {
  year?: number;
  startDate?: string;
  endDate?: string;
}

export function getDigitalDashboard(params?: DashboardQueryParams) {
  return request<DigitalDashboardData>({
    url: '/jdy/dashboard/digital',
    method: 'get',
    params,
    timeout: 180000,
  });
}

export function getBusinessOverview(params?: DashboardQueryParams) {
  return request<BusinessOverviewData>({
    url: '/jdy/dashboard/business-overview',
    method: 'get',
    params,
    timeout: 180000,
  });
}
