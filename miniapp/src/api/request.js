import { apiUrl } from '@/config/index.js'
import { clearAuth, getToken } from '@/utils/auth.js'

let isRedirecting = false

export function request(options) {
  const { url, method = 'GET', data, header = {}, timeout = 30000 } = options
  const token = getToken()

  return new Promise((resolve, reject) => {
    uni.request({
      url: apiUrl(url),
      method,
      data,
      timeout,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...header,
      },
      success(res) {
        if (res.statusCode === 401) {
          const hadToken = !!token
          clearAuth()
          // 未登录浏览不强制跳登录；仅曾登录过期时提示
          if (hadToken && !isRedirecting) {
            isRedirecting = true
            uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
            setTimeout(() => {
              isRedirecting = false
            }, 500)
          }
          reject(new Error(hadToken ? '登录已过期' : '未登录'))
          return
        }

        if (res.statusCode === 403) {
          uni.showToast({ title: '没有访问权限', icon: 'none' })
          reject(new Error('没有访问权限'))
          return
        }

        if (res.statusCode >= 500) {
          uni.showToast({ title: '服务器错误，请稍后重试', icon: 'none' })
          reject(new Error('服务器错误'))
          return
        }

        const body = res.data
        if (!body) {
          reject(new Error('响应为空'))
          return
        }

        // 处理业务错误码
        if (body.code !== undefined && body.code !== 0) {
          const msg = body.message || body.msg || '请求失败'
          uni.showToast({ title: msg, icon: 'none' })
          reject(new Error(msg))
          return
        }

        resolve(body)
      },
      fail(err) {
        const msg = err.errMsg || '网络连接失败，请检查网络'
        uni.showToast({ title: msg, icon: 'none' })
        reject(err)
      },
    })
  })
}
