/** 后端 API 根路径，开发/生产由 .env 注入 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://www.zszy.cc/zt_dismantling/api').replace(/\/$/, '')

/** 腾讯云 COS 文件/图片根地址 */
export const COS_BASE_URL = (
  import.meta.env.VITE_COS_BASE_URL || 'https://hcr-1300429327.cos.ap-beijing.myqcloud.com'
).replace(/\/$/, '')

export function apiUrl(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalized}`
}

/** 拼接 COS 完整访问地址；已是 http(s)/data/blob/本地临时路径则原样返回 */
export function cosUrl(path) {
  if (!path) return ''
  const trimmed = String(path).trim()
  if (/^(https?:|data:|blob:|wxfile:|file:)/i.test(trimmed)) return trimmed
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return `${COS_BASE_URL}${normalized}`
}
