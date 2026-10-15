import request from '@/utils/request';

export interface DeptOption {
  value: string;
  label: string;
  dingtalkDeptId?: number;
  id?: number;
}

export interface DeptNode {
  id: number;
  dingtalkDeptId?: number;
  name: string;
  parentId?: number;
  dingtalkParentId?: number;
  sortOrder?: number;
  status?: number;
  children?: DeptNode[];
}

export interface OrgSyncResult {
  deptUpserted: number;
  deptDisabled: number;
  userUpserted: number;
  userSkipped: number;
  message?: string;
}

export function listDeptTree(includeDisabled = false) {
  return request<DeptNode[]>({
    url: '/depts/tree',
    method: 'get',
    params: { includeDisabled },
  });
}

export function listDeptOptions() {
  return request<DeptOption[]>({
    url: '/depts/options',
    method: 'get',
  });
}

export function syncDeptsFromDingTalk(syncUsers = true) {
  return request<OrgSyncResult>({
    url: '/depts/sync',
    method: 'post',
    params: { syncUsers },
  });
}
