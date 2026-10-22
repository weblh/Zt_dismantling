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

/** auto=有本地数据则增量、无数据则全量；full=强制全量（仅当前菜单对应表单，与空库同步相同） */
export type JdyBusinessSyncMode = 'auto' | 'full';

function postBusinessSync(url: string, mode: JdyBusinessSyncMode = 'auto') {
  return request<JdySyncResult>({
    url,
    method: 'post',
    params: { mode },
    timeout: 600000,
  });
}

/** 业务收货：从简道云拉取并写入本地库 */
export function syncJdyReceipt(mode: JdyBusinessSyncMode = 'auto') {
  return postBusinessSync('/jdy/business/receipt/sync', mode);
}

/** 报废车入库：从简道云拉取并写入本地库 */
export function syncJdyScrappedVehicle(mode: JdyBusinessSyncMode = 'auto') {
  return postBusinessSync('/jdy/business/scrapped-vehicle/sync', mode);
}

/** 挑顶照片：从简道云拉取并写入本地库 */
export function syncJdyPickTopPhoto(mode: JdyBusinessSyncMode = 'auto') {
  return postBusinessSync('/jdy/business/pick-top-photo/sync', mode);
}

/** 拆解：从简道云拉取并写入本地库 */
export function syncJdyDisassembly(mode: JdyBusinessSyncMode = 'auto') {
  return postBusinessSync('/jdy/business/disassembly/sync', mode);
}

/** 综合拆解：从简道云拉取并写入本地库 */
export function syncJdyComprehensiveDisassembly(mode: JdyBusinessSyncMode = 'auto') {
  return postBusinessSync('/jdy/business/comprehensive-disassembly/sync', mode);
}

/** 查验照片：从简道云拉取并写入本地库 */
export function syncJdyInspectionPhoto(mode: JdyBusinessSyncMode = 'auto') {
  return postBusinessSync('/jdy/business/inspection-photo/sync', mode);
}

/** 过磅查验：从简道云拉取并写入本地库 */
export function syncJdyWeighingInspection(mode: JdyBusinessSyncMode = 'auto') {
  return postBusinessSync('/jdy/business/weighing-inspection/sync', mode);
}

/** 业务结账：从简道云拉取并写入本地库 */
export function syncJdySettlement(mode: JdyBusinessSyncMode = 'auto') {
  return postBusinessSync('/jdy/business/settlement/sync', mode);
}

/** 业务结账付款申请：从简道云拉取并写入本地库（含图片落盘） */
export function syncJdyPaymentApplication(mode: JdyBusinessSyncMode = 'auto') {
  return postBusinessSync('/jdy/business/payment-application/sync', mode);
}

/** 成品销售审批单：从简道云拉取并写入本地库 */
export function syncJdyFinishedProductApproval(mode: JdyBusinessSyncMode = 'auto') {
  return postBusinessSync('/jdy/business/finished-product-approval/sync', mode);
}

/** 成品销售台账：从简道云拉取并写入本地库 */
export function syncJdyFinishedProductLedger(mode: JdyBusinessSyncMode = 'auto') {
  return postBusinessSync('/jdy/business/finished-product-ledger/sync', mode);
}

/** 配件销售审批单：从简道云拉取并写入本地库 */
export function syncJdyPartApproval(mode: JdyBusinessSyncMode = 'auto') {
  return postBusinessSync('/jdy/business/part-approval/sync', mode);
}

/** 配件销售台账：从简道云拉取并写入本地库 */
export function syncJdyPartLedger(mode: JdyBusinessSyncMode = 'auto') {
  return postBusinessSync('/jdy/business/part-ledger/sync', mode);
}

/** 手续-回收证明：从简道云拉取并写入本地库 */
export function syncJdyRecycleCertificate(mode: JdyBusinessSyncMode = 'auto') {
  return postBusinessSync('/jdy/business/recycle-certificate/sync', mode);
}

/** 手续-山西华成攒碳回收证明台账：从简道云拉取并写入本地库 */
export function syncJdyRecycleCertificateDaily(mode: JdyBusinessSyncMode = 'auto') {
  return postBusinessSync('/jdy/business/recycle-certificate-daily/sync', mode);
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

export type SalesBizKey =
  | 'finished-product-approval'
  | 'finished-product-ledger'
  | 'part-approval'
  | 'part-ledger';

/** 销售类单据下一编号（成品/配件审批单与台账） */
export function getNextSalesCode(bizKey: SalesBizKey, date?: string) {
  return request<{
    bizKey: string;
    code: string;
    prefix: string;
    seq: number;
    date: string;
  }>({
    url: `/jdy/business/${bizKey}/next-code`,
    method: 'get',
    params: date ? { date } : undefined,
  });
}

export function getJdyBusinessFields(bizKey: string) {
  return request<Record<string, unknown>>({
    url: `/jdy/business/${bizKey}/fields`,
    method: 'get',
  });
}

/** 过磅同步数据：从简道云拉取历史到本地（日常新数据走地磅直写开放接口） */
export function syncJdyWeighingSync(mode: JdyBusinessSyncMode = 'auto') {
  return postBusinessSync('/jdy/business/weighing-sync/sync', mode);
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

export interface SalesStatRow {
  key: string;
  productName: string;
  netWeight: number;
  totalPrice: number;
}

export interface SalesStatisticsResult {
  salesType: 'finished' | 'part';
  today: SalesStatRow[];
  month: SalesStatRow[];
  year: SalesStatRow[];
  range?: SalesStatRow[];
}

/** 成品销售统计（本日/本月/本年，来自审批单+台账视图） */
export function getFinishedSalesStatistics(params?: {
  productName?: string;
  startDate?: string;
  endDate?: string;
}) {
  return request<SalesStatisticsResult>({
    url: '/jdy/sales-statistics/finished',
    method: 'get',
    params,
  });
}

/** 配件销售统计（本日/本月/本年，来自审批单+台账视图） */
export function getPartSalesStatistics(params?: {
  productName?: string;
  startDate?: string;
  endDate?: string;
}) {
  return request<SalesStatisticsResult>({
    url: '/jdy/sales-statistics/part',
    method: 'get',
    params,
  });
}
