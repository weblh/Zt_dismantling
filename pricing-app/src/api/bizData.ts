import request from '@/utils/request';

export function getBizLocalRows<T = Record<string, unknown>>(bizKey: string) {
  return request<T[]>({
    url: `/biz-local/${encodeURIComponent(bizKey)}/rows`,
    method: 'get',
  });
}

export function putBizLocalRows<T>(bizKey: string, rows: T[]) {
  return request<null>({
    url: `/biz-local/${encodeURIComponent(bizKey)}/rows`,
    method: 'put',
    data: rows,
  });
}

export function getJdyBusinessData(
  bizKey: string,
  params?: { pageNo?: number; pageSize?: number; keyword?: string },
) {
  return request<{ records: Record<string, unknown>[]; total: number }>({
    url: `/jdy/business/${bizKey}`,
    method: 'get',
    params,
  });
}
