import request from '@/utils/request';

export interface DingtalkStatus {
  connected: boolean;
  clientId: string;
  configured: boolean;
  message: string;
}

export interface DingtalkEvent {
  id: number;
  eventId: string;
  eventType: string;
  eventBornTime: number;
  eventData: string;
  status: string;
  createdAt: string;
}

export interface DingtalkFormConfig {
  id: number;
  formId: string;
  formName: string;
  status: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface PageResult<T> {
  total: number;
  records: T;
}

export function getDingtalkStatus() {
  return request<DingtalkStatus>({ url: '/dingtalk/status', method: 'get' });
}

export function updateDingtalkConfig(data: {
  clientId: string;
  clientSecret: string;
  autoStart?: boolean;
}) {
  return request<null>({ url: '/dingtalk/config', method: 'post', data });
}

export function startDingtalkStream() {
  return request<null>({ url: '/dingtalk/start', method: 'post' });
}

export function stopDingtalkStream() {
  return request<null>({ url: '/dingtalk/stop', method: 'post' });
}

export function getDingtalkEvents(params: { pageNo?: number; pageSize?: number; eventType?: string }) {
  return request<PageResult<DingtalkEvent[]>>({
    url: '/dingtalk/events',
    method: 'get',
    params,
  });
}

export function getDingtalkEventDetail(id: number) {
  return request<DingtalkEvent>({ url: `/dingtalk/events/${id}`, method: 'get' });
}

export function getDingtalkFormConfigs() {
  return request<DingtalkFormConfig[]>({ url: '/dingtalk/form-config', method: 'get' });
}

export function createDingtalkFormConfig(data: {
  formId: string;
  formName?: string;
  status?: number;
  description?: string;
}) {
  return request<DingtalkFormConfig>({ url: '/dingtalk/form-config', method: 'post', data });
}

export function updateDingtalkFormConfig(id: number, data: {
  formId: string;
  formName?: string;
  status?: number;
  description?: string;
}) {
  return request<DingtalkFormConfig>({ url: `/dingtalk/form-config/${id}`, method: 'put', data });
}

export function deleteDingtalkFormConfig(id: number) {
  return request<null>({ url: `/dingtalk/form-config/${id}`, method: 'delete' });
}

export function toggleDingtalkFormConfigStatus(id: number) {
  return request<DingtalkFormConfig>({ url: `/dingtalk/form-config/${id}/toggle`, method: 'post' });
}
