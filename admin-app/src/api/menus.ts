import request from '@/utils/request';

export interface MenuNode {
  id: number;
  parentId?: number;
  name: string;
  path?: string;
  icon?: string;
  menuType?: string;
  sortOrder?: number;
  visible?: number;
  status?: number;
  children?: MenuNode[];
}

export interface MenuSavePayload {
  parentId?: number;
  name: string;
  path?: string;
  icon?: string;
  menuType?: string;
  sortOrder?: number;
  visible?: number;
  status?: number;
}

export function listMyMenus() {
  return request<MenuNode[]>({ url: '/menus/my', method: 'get' });
}

export interface MenuAccessPaths {
  allowedPaths: string[];
  protectedPaths: string[];
}

export function getMenuAccessPaths() {
  return request<MenuAccessPaths>({ url: '/menus/access-paths', method: 'get' });
}

export function listMenuTree(onlyEnabled = false) {
  return request<MenuNode[]>({
    url: '/menus/tree',
    method: 'get',
    params: { onlyEnabled },
  });
}

export function createMenu(data: MenuSavePayload) {
  return request<MenuNode>({ url: '/menus', method: 'post', data });
}

export function updateMenu(id: number, data: MenuSavePayload) {
  return request<MenuNode>({ url: `/menus/${id}`, method: 'put', data });
}

export function deleteMenu(id: number) {
  return request<null>({ url: `/menus/${id}`, method: 'delete' });
}
