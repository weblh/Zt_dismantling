import { request } from './request.js'

export function loginByPhone(phone, password) {
  return request({
    url: '/auth/phone-login',
    method: 'POST',
    data: { phone, password },
  })
}

/** 钉钉同步账号：手机号自助设密并登录 */
export function activateByPhone(phone, password) {
  return request({
    url: '/auth/phone-activate',
    method: 'POST',
    data: { phone, password },
  })
}

export function loginByWechat(code) {
  return request({
    url: '/auth/wechat/login',
    method: 'POST',
    data: { code },
  })
}

export function bindWechat(code, phone, password) {
  return request({
    url: '/auth/wechat/bind',
    method: 'POST',
    data: { code, phone, password },
  })
}

/** 已登录用户绑定当前微信 */
export function bindWechatCurrent(code) {
  return request({
    url: '/auth/wechat/bind-current',
    method: 'POST',
    data: { code },
  })
}
