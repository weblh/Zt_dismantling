import request from '@/utils/request';

export interface JdyStatus {
  configured: boolean;
  appId: string;
  corpId: string;
  agentId: string;
  apiKeyMasked: string;
  scheduledEnabled: boolean;
  formCount: number;
  dataCount: number;
  message: string;
}

export interface JdyForm {
  id: number;
  appId: string;
  entryId: string;
  formName: string;
  status: number;
  dataCount: number;
  lastSyncAt?: string;
  lastSyncMessage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JdyFormData {
  id: number;
  appId: string;
  entryId: string;
  dataId: string;
  formName: string;
  creatorName?: string;
  creatorUsername?: string;
  jdyCreateTime?: string;
  jdyUpdateTime?: string;
  rawData?: string;
  syncedAt?: string;
  updatedAt?: string;
}

export interface JdySyncResult {
  formCount: number;
  successForms: number;
  failedForms: number;
  upsertedRows: number;
  message: string;
}

export interface PageResult<T> {
  total: number;
  records: T;
}

export type JdySyncSource = 'receipt' | 'pricing';

export function getJdyStatus(source?: JdySyncSource) {
  return request<JdyStatus>({
    url: '/jdy/status',
    method: 'get',
    params: source ? { source } : undefined,
  });
}

export function updateJdyConfig(data: {
  apiKey: string;
  appId?: string;
  corpId?: string;
  agentId?: string;
  scheduledEnabled?: boolean;
}) {
  return request<null>({ url: '/jdy/config', method: 'post', data });
}

export function refreshJdyForms() {
  return request<JdyForm[]>({ url: '/jdy/forms/refresh', method: 'post' });
}

export function getJdyForms() {
  return request<JdyForm[]>({ url: '/jdy/forms', method: 'get' });
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

export function syncJdyForm(entryId: string) {
  return request<number>({ url: `/jdy/sync/${entryId}`, method: 'post', timeout: 300000 });
}

/** 业务收货：从简道云拉取并写入本地库 */
export function syncJdyReceipt() {
  return request<JdySyncResult>({
    url: '/jdy/business/receipt/sync',
    method: 'post',
    timeout: 600000,
  });
}

/** 报废车入库：从简道云拉取并写入本地库 */
export function syncJdyScrappedVehicle() {
  return request<JdySyncResult>({
    url: '/jdy/business/scrapped-vehicle/sync',
    method: 'post',
    timeout: 600000,
  });
}

/** 查验照片：从简道云拉取并写入本地库 */
export function syncJdyInspectionPhoto() {
  return request<JdySyncResult>({
    url: '/jdy/business/inspection-photo/sync',
    method: 'post',
    timeout: 600000,
  });
}

/** 过磅查验：从简道云拉取并写入本地库 */
export function syncJdyWeighingInspection() {
  return request<JdySyncResult>({
    url: '/jdy/business/weighing-inspection/sync',
    method: 'post',
    timeout: 600000,
  });
}

export function getJdyFormData(params: {
  entryId?: string;
  pageNo?: number;
  pageSize?: number;
}) {
  return request<PageResult<JdyFormData[]>>({
    url: '/jdy/data',
    method: 'get',
    params,
  });
}

export function getJdyFormDataDetail(id: number) {
  return request<JdyFormData>({ url: `/jdy/data/${id}`, method: 'get' });
}

export function getJdyBusinessData(
  bizKey: string,
  params?: { pageNo?: number; pageSize?: number; keyword?: string },
) {
  return request<PageResult<Record<string, unknown>[]>>({
    url: `/jdy/business/${bizKey}`,
    method: 'get',
    params,
    timeout: bizKey === 'weighing-sync' ? 300000 : undefined,
  });
}

export function getJdyBusinessFields(bizKey: string) {
  return request<Record<string, unknown>>({
    url: `/jdy/business/${bizKey}/fields`,
    method: 'get',
  });
}

/** 过磅同步状态：0=已同步，1=待同步 */
export function updateWeighingSyncStatus(dataId: string, status: '0' | '1') {
  return request<null>({
    url: `/jdy/business/weighing-sync/${encodeURIComponent(dataId)}/status`,
    method: 'put',
    data: { status },
  });
}

export function refreshJdySchemas() {
  return request<number>({ url: '/jdy/schemas/refresh', method: 'post' });
}

export interface JdySyncLog {
  id: number;
  sync_type: string;
  entry_id?: string;
  form_name?: string;
  form_count?: number;
  success_forms?: number;
  failed_forms?: number;
  upserted_rows?: number;
  message?: string;
  status?: string;
  started_at?: string;
  finished_at?: string;
}

export function getJdySyncLogs(limit = 20) {
  return request<JdySyncLog[]>({ url: '/jdy/sync/logs', method: 'get', params: { limit } });
}
