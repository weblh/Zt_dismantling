/** 攒碳独立 token key，避免与丰驰 HQ 同域共用 `token` 互相覆盖 */
export const TOKEN_KEY = 'zt_token'
export const USER_KEY = 'zt_user'
/** 历史 key，仅作读兼容 */
const LEGACY_TOKEN_KEY = 'token'
const LEGACY_USER_KEY = 'user'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY)
}

export function setAuth(token: string, user: unknown) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(LEGACY_TOKEN_KEY)
  localStorage.removeItem(LEGACY_USER_KEY)
}

export function getUserRaw(): string | null {
  return localStorage.getItem(USER_KEY) || localStorage.getItem(LEGACY_USER_KEY)
}
