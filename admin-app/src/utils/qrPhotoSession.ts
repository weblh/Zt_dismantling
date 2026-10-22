import type { UploadFile } from 'antd';

/** 生成扫码上传会话 ID */
export function createQrPhotoSessionId() {
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export type QrPhotoUploadQuery = {
  sessionId: string;
  /** 页面标题，如「查验照片」 */
  title?: string;
  /** 业务标识，如 inspection-photo */
  bizKey?: string;
};

/**
 * 拼手机端上传页地址。
 * - 优先 VITE_PUBLIC_HOST（局域网 IPv4，如 http://192.168.110.47:5173）
 * - localhost 时也可用 VITE_PUBLIC_HOST，否则手机扫码打不开
 */
export function getQrPhotoPublicOrigin() {
  const envHost = String(import.meta.env.VITE_PUBLIC_HOST || '').trim().replace(/\/$/, '');
  if (envHost) return envHost;
  if (typeof window === 'undefined') return '';
  const { protocol, hostname, port, origin } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // 未配置公网/局域网地址时仍返回当前 origin（仅本机调试）
    return origin;
  }
  // 保证带端口
  if (port) return `${protocol}//${hostname}:${port}`;
  return origin;
}

export function buildQrPhotoUploadUrl(query: QrPhotoUploadQuery) {
  const base = getQrPhotoPublicOrigin();
  const params = new URLSearchParams();
  params.set('session', query.sessionId);
  if (query.title) params.set('title', query.title);
  if (query.bizKey) params.set('biz', query.bizKey);
  return `${base}/mobile/photo-upload?${params.toString()}`;
}

export function urlsToUploadFiles(urls: string[]): UploadFile[] {
  return (urls || []).filter(Boolean).map((url, i) => ({
    uid: `qr-${i}-${url}`,
    name: url.split('/').pop() || `img-${i}`,
    status: 'done' as const,
    url,
    thumbUrl: url,
  }));
}

/** 把服务端返回的相对路径转成可访问 URL（开发走同源 /images） */
export function resolveQrPhotoUrl(url: string) {
  if (!url) return '';
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  if (url.startsWith('/')) return url;
  return `/${url}`;
}
