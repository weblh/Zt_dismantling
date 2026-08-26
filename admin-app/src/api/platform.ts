import request from '@/utils/request';

export interface BizApp {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export interface BizForm {
  id: number;
  appId: number;
  code: string;
  name: string;
  schemaJson?: string;
  draftSchemaJson?: string;
  version?: number;
  status?: number;
  sourceEntryId?: string;
  flowEnabled?: number;
  menuGroup?: string;
  sortOrder?: number;
}

export interface BizFormData {
  id: number;
  formId: number;
  dataUuid: string;
  dataJson: string;
  flowState?: string;
  processInstanceId?: string;
  creatorUserId?: number;
  creatorName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FormField {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  options?: unknown[];
  children?: FormField[];
}

export function parseSchema(schemaJson?: string): FormField[] {
  if (!schemaJson) return [];
  try {
    const obj = JSON.parse(schemaJson);
    return Array.isArray(obj.fields) ? obj.fields : [];
  } catch {
    return [];
  }
}

export function listApps() {
  return request<BizApp[]>({ url: '/platform/apps', method: 'get' });
}

export function listForms(appId?: number) {
  return request<BizForm[]>({
    url: '/platform/forms',
    method: 'get',
    params: appId ? { appId } : undefined,
  });
}

export function getForm(id: number) {
  return request<BizForm>({ url: `/platform/forms/${id}`, method: 'get' });
}

export function saveForm(data: Partial<BizForm>) {
  return request<BizForm>({ url: '/platform/forms', method: 'post', data });
}

export function saveDraft(id: number, schemaJson: string) {
  return request<BizForm>({
    url: `/platform/forms/${id}/draft`,
    method: 'put',
    data: { schemaJson },
  });
}

export function publishForm(id: number) {
  return request<BizForm>({ url: `/platform/forms/${id}/publish`, method: 'post' });
}

export function listFormData(formId: number, page = 1, size = 20) {
  return request<{ total: number; records: BizFormData[] }>({
    url: `/platform/forms/${formId}/data`,
    method: 'get',
    params: { page, size },
  });
}

export function getFormData(id: number) {
  return request<BizFormData>({ url: `/platform/data/${id}`, method: 'get' });
}

export function createFormData(formId: number, dataJson: string, startFlow = false) {
  return request<BizFormData>({
    url: `/platform/forms/${formId}/data`,
    method: 'post',
    data: { dataJson, startFlow },
  });
}

export function updateFormData(id: number, dataJson: string) {
  return request<BizFormData>({
    url: `/platform/data/${id}`,
    method: 'put',
    data: { dataJson },
  });
}

export function deleteFormData(id: number) {
  return request<null>({ url: `/platform/data/${id}`, method: 'delete' });
}

export function migrateFromJdy(includeData = true, dataLimitPerForm = 500) {
  return request<Record<string, unknown>>({
    url: '/platform/migrate/jdy',
    method: 'post',
    params: { includeData, dataLimitPerForm },
    timeout: 600000,
  });
}

export function flowSubmit(dataId: number) {
  return request<Record<string, unknown>>({ url: `/platform/flow/submit/${dataId}`, method: 'post' });
}

export function flowApprove(taskId: string, comment?: string) {
  return request({ url: `/platform/flow/approve/${taskId}`, method: 'post', data: { comment } });
}

export function flowReject(taskId: string, comment?: string) {
  return request({ url: `/platform/flow/reject/${taskId}`, method: 'post', data: { comment } });
}

export function flowTodo() {
  return request<Record<string, unknown>[]>({ url: '/platform/flow/todo', method: 'get' });
}

export function flowInitiated() {
  return request<Record<string, unknown>[]>({ url: '/platform/flow/initiated', method: 'get' });
}

export function flowProcessed() {
  return request<Record<string, unknown>[]>({ url: '/platform/flow/processed', method: 'get' });
}

export function flowCc() {
  return request<Record<string, unknown>[]>({ url: '/platform/flow/cc', method: 'get' });
}

export function listAcl(formId: number) {
  return request({ url: `/platform/forms/${formId}/acl`, method: 'get' });
}

export function saveAcl(formId: number, rule: Record<string, unknown>) {
  return request({ url: `/platform/forms/${formId}/acl`, method: 'post', data: rule });
}

export function listPrintTemplates(formId: number) {
  return request({ url: `/platform/forms/${formId}/print-templates`, method: 'get' });
}

export function savePrintTemplate(data: Record<string, unknown>) {
  return request({ url: '/platform/print-templates', method: 'post', data });
}

export function renderPrint(dataId: number, templateId: number) {
  return request<{ html: string }>({ url: `/platform/data/${dataId}/print/${templateId}`, method: 'get' });
}

export function listDashboards(appId?: number) {
  return request({ url: '/platform/dashboards', method: 'get', params: appId ? { appId } : undefined });
}

export function saveDashboard(data: Record<string, unknown>) {
  return request({ url: '/platform/dashboards', method: 'post', data });
}

export function dashboardStats(id: number) {
  return request<Record<string, unknown>>({ url: `/platform/dashboards/${id}/stats`, method: 'get' });
}
