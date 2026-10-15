import request from '@/utils/request';

export interface JdyStatus {
  configured: boolean;
  appId: string;
  corpId?: string;
  agentId?: string;
  apiKeyMasked?: string;
  scheduledEnabled?: boolean;
  formCount: number;
  dataCount: number;
  message: string;
}

export interface JdySyncResult {
  formCount: number;
  successForms: number;
  failedForms: number;
  upsertedRows: number;
  message: string;
}

export interface SourceBreakdownItem {
  source: string;
  code?: string;
  appId?: string;
  value: number;
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

export type JdySyncSource = 'receipt' | 'pricing';

export function getJdyStatus(source?: JdySyncSource) {
  return request<JdyStatus>({
    url: '/jdy/status',
    method: 'get',
    params: source ? { source } : undefined,
  });
}

/** source=receipt|pricing 仅同步对应应用；不传则双应用 */
export function syncAllJdyForms(source?: JdySyncSource) {
  return request<JdySyncResult>({
    url: '/jdy/sync',
    method: 'post',
    params: source ? { source } : undefined,
    timeout: 600000,
  });
}

export function getBusinessOverview(params?: { startDate?: string; endDate?: string; year?: number }) {
  return request<BusinessOverviewData>({
    url: '/jdy/dashboard/business-overview',
    method: 'get',
    params,
    timeout: 180000,
  });
}
