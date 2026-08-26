import request from '@/utils/request';

/** 从服务端拉取某业务键的本地扩展数据 */
export function getBizLocalRows<T>(bizKey: string) {
  return request<T[]>({
    url: `/biz-local/${encodeURIComponent(bizKey)}/rows`,
    method: 'get',
  });
}

/** 将本地扩展数据全量同步到服务端 */
export function putBizLocalRows<T>(bizKey: string, rows: T[]) {
  return request<null>({
    url: `/biz-local/${encodeURIComponent(bizKey)}/rows`,
    method: 'put',
    data: rows,
  });
}
