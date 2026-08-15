import request from '@/utils/request';

export interface VoucherDetailVO {
  fdate?: string;
  fyear?: string;
  fperiod?: string;
  fbillTypeID?: string;
  fvoucherNo?: string;
  fexplanation?: string;
  faccountID?: string;
  faccountName?: string;
  fcurrencyID?: string;
  famountFor?: number;
  fdebit?: number;
  fcredit?: number;
  faccountBookNumber?: string;
  fposterID?: string;
  fauditorID?: string;
}

export interface KingdeeQueryParams {
  pageNo?: number;
  pageSize?: number;
  accountId?: number;
  kingdeeUrl?: string;
  dbId?: string;
  username?: string;
  password?: string;
  formId?: string;
  accountingPeriod?: string;
  voucherNumberStart?: string;
  voucherNumberEnd?: string;
  orgCompanyCode?: string;
}

export interface KingdeeQueryRequest {
  cookie: string;
  kingdeeUrl: string;
  accountingPeriod?: string;
  voucherNumberStart?: string;
  voucherNumberEnd?: string;
  orgCompanyCode?: string;
}

export interface PageResult<T> {
  total: number;
  records: T;
}

export interface SupplierDetailVO {
  fnumber?: string;
  fname?: string;
  fshortName?: string;
  fgroupName?: string;
  fdocumentStatus?: string;
  fforbidStatus?: string;
  fcreateDate?: string;
  fuseOrgName?: string;
  fdescription?: string;
  ftaxRegisterCode?: string;
  fcontact?: string;
  ftel?: string;
  faddress?: string;
}

export interface KingdeeSupplierQueryParams {
  pageNo?: number;
  pageSize?: number;
  accountId?: number;
  kingdeeUrl?: string;
  dbId?: string;
  username?: string;
  password?: string;
  supplierNumber?: string;
  supplierName?: string;
  useOrgCode?: string;
}

export function getKingdeeVoucherPage(params: KingdeeQueryParams) {
  return request<PageResult<VoucherDetailVO[]>>({
    url: '/kingdee/voucher/page',
    method: 'get',
    params,
  });
}

export function getKingdeeSupplierPage(params: KingdeeSupplierQueryParams) {
  return request<PageResult<SupplierDetailVO[]>>({
    url: '/kingdee/supplier/page',
    method: 'get',
    params,
  });
}

export function queryKingdeeVoucher(formId: string, data: KingdeeQueryRequest) {
  return request<VoucherDetailVO[]>({
    url: `/kingdee/voucher/query?formId=${formId}`,
    method: 'post',
    data,
  });
}

export function probeKingdeeOrgField(params: {
  kingdeeUrl?: string;
  dbId?: string;
  username?: string;
  password?: string;
  formId?: string;
  year?: string;
  period?: string;
  orgCompanyCode?: string;
}) {
  return request<Record<string, unknown>>({
    url: '/kingdee/voucher/probe',
    method: 'get',
    params,
  });
}

export interface KingdeeAccountConfig {
  id: number;
  accountName: string;
  kingdeeUrl: string;
  dbId: string;
  username: string;
  password?: string;
  orgCompanyCode?: string;
  useOrgCode?: string;
  defaultFormId?: string;
  defaultAccountingPeriod?: string;
  isDefault?: number;
  status: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function getKingdeeAccounts() {
  return request<KingdeeAccountConfig[]>({ url: '/kingdee/account', method: 'get' });
}

export function getEnabledKingdeeAccounts() {
  return request<KingdeeAccountConfig[]>({ url: '/kingdee/account/enabled', method: 'get' });
}

export function getKingdeeAccount(id: number) {
  return request<KingdeeAccountConfig>({ url: `/kingdee/account/${id}`, method: 'get' });
}

export function getDefaultKingdeeAccount() {
  return request<KingdeeAccountConfig>({ url: '/kingdee/account/default', method: 'get' });
}

export function createKingdeeAccount(data: Partial<KingdeeAccountConfig> & {
  accountName: string;
  kingdeeUrl: string;
  dbId: string;
  username: string;
  password?: string;
}) {
  return request<KingdeeAccountConfig>({ url: '/kingdee/account', method: 'post', data });
}

export function updateKingdeeAccount(id: number, data: Partial<KingdeeAccountConfig> & {
  accountName: string;
  kingdeeUrl: string;
  dbId: string;
  username: string;
  password?: string;
}) {
  return request<KingdeeAccountConfig>({ url: `/kingdee/account/${id}`, method: 'put', data });
}

export function deleteKingdeeAccount(id: number) {
  return request<null>({ url: `/kingdee/account/${id}`, method: 'delete' });
}

export function toggleKingdeeAccountStatus(id: number) {
  return request<KingdeeAccountConfig>({ url: `/kingdee/account/${id}/toggle`, method: 'post' });
}

export function setDefaultKingdeeAccount(id: number) {
  return request<KingdeeAccountConfig>({ url: `/kingdee/account/${id}/default`, method: 'post' });
}

export function testKingdeeAccountLogin(id: number) {
  return request<{ success: boolean; message: string; sessionIdPreview?: string }>({
    url: `/kingdee/account/${id}/test-login`,
    method: 'post',
  });
}
