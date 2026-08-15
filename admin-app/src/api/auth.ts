import request from '@/utils/request';

export interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  role?: string;
  appPermissions?: string[];
}

export interface LoginResult {
  token: string;
  user: UserInfo;
}

export function login(data: { username: string; password: string }) {
  return request<LoginResult>({
    url: '/auth/login',
    method: 'post',
    data,
  });
}

export function logout() {
  return request<null>({ url: '/auth/logout', method: 'get' });
}
