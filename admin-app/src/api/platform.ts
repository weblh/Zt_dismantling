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
    data: { draftSchemaJson: schemaJson },
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

export function createFormData(formId: number, dataJson: string) {
  return request<BizFormData>({
    url: `/platform/forms/${formId}/data`,
    method: 'post',
    data: { dataJson },
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
