import request from '@/utils/request';
import type { UserInfo } from './auth';

export function listUsers() {
  return request<UserInfo[]>({ url: '/users', method: 'get' });
}

export function createUser(data: {
  username: string;
  password: string;
  nickname?: string;
  phone?: string;
  role?: string;
  department?: string;
  appPermissions?: string[];
}) {
  return request<UserInfo>({ url: '/users', method: 'post', data });
}

export function updateUser(
  id: number,
  data: {
    nickname?: string;
    status?: number;
    role?: string;
    phone?: string;
    department?: string;
    appPermissions?: string[];
    password?: string;
  },
) {
  return request<UserInfo>({ url: `/users/${id}`, method: 'put', data });
}
