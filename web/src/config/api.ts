/** 生产/开发统一的 API 根路径，打包时由 .env 注入 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

/** 腾讯云 COS 文件/图片根地址 */
export const COS_BASE_URL = (
  import.meta.env.VITE_COS_BASE_URL || 'https://hcr-1300429327.cos.ap-beijing.myqcloud.com'
).replace(/\/$/, '');

/** 拼接 API 完整路径，path 不含 /api 前缀，如 /auth/login */
export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

/** 拼接 COS 完整访问地址；已是 http(s)/data/blob 则原样返回 */
export function cosUrl(path?: string | null): string {
  if (!path) return '';
  const trimmed = path.trim();
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${COS_BASE_URL}${normalized}`;
}
