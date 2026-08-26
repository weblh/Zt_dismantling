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

export function getJdyStatus() {
  return request<JdyStatus>({ url: '/jdy/status', method: 'get' });
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

export function syncAllJdyForms() {
  return request<JdySyncResult>({ url: '/jdy/sync', method: 'post', timeout: 600000 });
}

export function syncJdyForm(entryId: string) {
  return request<number>({ url: `/jdy/sync/${entryId}`, method: 'post', timeout: 300000 });
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
  });
}

export function getJdyBusinessFields(bizKey: string) {
  return request<Record<string, unknown>>({
    url: `/jdy/business/${bizKey}/fields`,
    method: 'get',
  });
}

export function refreshJdySchemas() {
  return request<number>({ url: '/jdy/schemas/refresh', method: 'post' });
}
