import { request } from './request.js'

export function parseSchema(schemaJson) {
  if (!schemaJson) return []
  try {
    const obj = JSON.parse(schemaJson)
    return Array.isArray(obj.fields) ? obj.fields : []
  } catch {
    return []
  }
}

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

export function createFormData(formId, dataJson, startFlow = false) {
  return request({
    url: `/platform/forms/${formId}/data`,
    method: 'POST',
    data: { dataJson, startFlow },
  })
}

export function updateFormData(id, dataJson) {
  return request({
    url: `/platform/data/${id}`,
    method: 'PUT',
    data: { dataJson },
  })
}

export function flowSubmit(dataId) {
  return request({ url: `/platform/flow/submit/${dataId}`, method: 'POST' })
}

export function flowApprove(taskId, comment) {
  return request({
    url: `/platform/flow/approve/${taskId}`,
    method: 'POST',
    data: { comment },
  })
}

export function flowReject(taskId, comment) {
  return request({
    url: `/platform/flow/reject/${taskId}`,
    method: 'POST',
    data: { comment },
  })
}

export function flowTodo() {
  return request({ url: '/platform/flow/todo', method: 'GET' })
}

export function flowInitiated() {
  return request({ url: '/platform/flow/initiated', method: 'GET' })
}

export function flowProcessed() {
  return request({ url: '/platform/flow/processed', method: 'GET' })
}

export function flowCc() {
  return request({ url: '/platform/flow/cc', method: 'GET' })
}
