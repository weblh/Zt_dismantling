import request from '@/utils/request';

export interface DictTypeInfo {
  id: number;
  code: string;
  name: string;
  entryId?: string;
  source?: string;
  remark?: string;
  sortOrder?: number;
  status?: number;
  itemCount?: number;
}

export interface DictItemInfo {
  id: number;
  typeCode: string;
  itemValue: string;
  itemLabel: string;
  sortOrder?: number;
  status?: number;
  appId?: string;
  sourceApp?: string;
  jdyDataId?: string;
  extraJson?: string;
}

export interface DictSyncResult {
  message?: string;
  schemasRefreshed: number;
  formCount: number;
  masterFormCount: number;
  remoteSynced?: number;
  masterUpserted: number;
  enumUpserted: number;
  byType: Record<string, number>;
  typeCount: number;
  itemCount: number;
  stalePayeeRemoved?: number;
}

export function listDictTypes() {
  return request<DictTypeInfo[]>({ url: '/dicts/types', method: 'get' });
}

export function listDictItems(typeCode: string, keyword?: string) {
  return request<DictItemInfo[]>({
    url: '/dicts/items',
    method: 'get',
    params: { typeCode, ...(keyword ? { keyword } : {}) },
  });
}

export function syncDictsFromJdy() {
  return request<DictSyncResult>({ url: '/dicts/sync', method: 'post', timeout: 300000 });
}
