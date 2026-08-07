/** 生产/开发统一的 API 根路径，打包时由 .env 注入 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

/** 拼接 API 完整路径，path 不含 /api 前缀，如 /auth/login */
export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}
