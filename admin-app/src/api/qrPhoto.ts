import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import type { ApiResult } from '@/utils/request';

export type QrPhotoSessionView = {
  sessionId: string;
  title: string;
  bizKey: string;
  urls: string[];
  count: number;
  added?: string[];
};

/** 开放接口，不强制带登录 token（手机扫码可用） */
const openClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

openClient.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResult<unknown>;
    if (res == null || typeof res !== 'object' || !('code' in res)) {
      return Promise.reject(new Error('接口返回异常，请确认后端已启动并包含扫码上传接口'));
    }
    if (res.code !== 0) {
      return Promise.reject(new Error(res.message || '请求失败'));
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const msg =
      error.response?.data?.message
      || (status === 401 || status === 403
        ? '无权限访问上传接口（请确认后端已放行 /api/open/qr-photo）'
        : status === 404
          ? '上传接口不存在，请重启 Java 后端'
          : error.message || '网络错误');
    return Promise.reject(new Error(msg));
  },
);

export function createQrPhotoSession(sessionId: string, meta?: { title?: string; bizKey?: string }) {
  return openClient
    .post<ApiResult<QrPhotoSessionView>>(`/open/qr-photo/${encodeURIComponent(sessionId)}`, meta || {})
    .then((r) => r.data);
}

export function getQrPhotoSession(sessionId: string) {
  return openClient
    .get<ApiResult<QrPhotoSessionView>>(`/open/qr-photo/${encodeURIComponent(sessionId)}`)
    .then((r) => r.data);
}

export function uploadQrPhotoFiles(sessionId: string, files: File[]) {
  const form = new FormData();
  files.forEach((file) => form.append('files', file));
  return openClient
    .post<ApiResult<QrPhotoSessionView>>(
      `/open/qr-photo/${encodeURIComponent(sessionId)}/upload`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    .then((r) => r.data);
}

export function clearQrPhotoSessionApi(sessionId: string) {
  return openClient
    .delete<ApiResult<null>>(`/open/qr-photo/${encodeURIComponent(sessionId)}`)
    .then((r) => r.data);
}
