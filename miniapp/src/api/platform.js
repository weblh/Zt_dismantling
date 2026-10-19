import request from '@/utils/request.js'

export function listApps() {
  return request({ url: '/platform/apps', method: 'GET' })
}

export function listForms(appId) {
  return request({
    url: '/platform/forms',
    method: 'GET',
    data: appId ? { appId } : undefined,
  })
}

export function getForm(id) {
  return request({ url: `/platform/forms/${id}`, method: 'GET' })
}

export function listFormData(formId, page = 1, size = 20) {
  return request({
    url: `/platform/forms/${formId}/data`,
    method: 'GET',
    data: { page, size },
  })
}

export function getFormData(id) {
  return request({ url: `/platform/data/${id}`, method: 'GET' })
}

export function createFormData(formId, dataJson) {
  return request({
    url: `/platform/forms/${formId}/data`,
    method: 'POST',
    data: { dataJson },
  })
}

export function updateFormData(id, dataJson) {
  return request({
    url: `/platform/data/${id}`,
    method: 'PUT',
    data: { dataJson },
  })
}

/** OA 流程已下线 */
export function flowSubmit() {
  return Promise.reject(new Error('流程功能已下线'))
}

export function flowApprove() {
  return Promise.reject(new Error('流程功能已下线'))
}

export function flowReject() {
  return Promise.reject(new Error('流程功能已下线'))
}

export function flowTodo() {
  return Promise.resolve({ data: [] })
}

export function flowInitiated() {
  return Promise.resolve({ data: [] })
}

export function flowProcessed() {
  return Promise.resolve({ data: [] })
}

export function flowCc() {
  return Promise.resolve({ data: [] })
}
