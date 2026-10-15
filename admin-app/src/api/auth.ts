import request from '@/utils/request';

export interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  role?: string;
  appPermissions?: string[];
  dingtalkUserId?: string;
  avatar?: string;
  phone?: string;
  deptIds?: string;
  department?: string;
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

export function getDingtalkQrConfig() {
  return request<{
    clientId: string;
    corpId: string;
    state: string;
    redirectUri: string;
    authUrl: string;
  }>({ url: '/auth/dingtalk/qr-config', method: 'get' });
}

export function dingtalkQrCallback(data: { code: string; state?: string }) {
  return request<LoginResult>({
    url: '/auth/dingtalk/qr-callback',
    method: 'post',
    data,
  });
}

export function dingtalkFreeLogin(data: { authCode: string }) {
  return request<LoginResult>({
    url: '/auth/dingtalk/free-login',
    method: 'post',
    data,
  });
}
