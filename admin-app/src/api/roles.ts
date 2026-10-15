import request from '@/utils/request';

export interface RoleInfo {
  id: number;
  code: string;
  name: string;
  remark?: string;
  status?: number;
  menuIds?: number[];
}

export interface RoleSavePayload {
  code: string;
  name: string;
  remark?: string;
  status?: number;
  menuIds?: number[];
}

export function listRoles() {
  return request<RoleInfo[]>({ url: '/roles', method: 'get' });
}

export function listAssignableRoles() {
  return request<RoleInfo[]>({ url: '/roles/assignable', method: 'get' });
}

export function createRole(data: RoleSavePayload) {
  return request<RoleInfo>({ url: '/roles', method: 'post', data });
}

export function updateRole(id: number, data: Partial<RoleSavePayload>) {
  return request<RoleInfo>({ url: `/roles/${id}`, method: 'put', data });
}

export function deleteRole(id: number) {
  return request<null>({ url: `/roles/${id}`, method: 'delete' });
}
