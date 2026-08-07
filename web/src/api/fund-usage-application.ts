import request from '@/utils/request';

export interface PageResult<T> {
  total: number;
  records: T;
}

export interface FundUsageApplicationItem {
  id: number;
  applicationId: number;
  rowIndex: number;
  businessId: string;
  submitterName: string;
  department: string;
  approvalResult: string;
  paymentType: string;
  paymentReason: string;
  paymentMethod: string;
  amount: number;
  payeeName: string;
  payeeAccount: string;
  bankName: string;
  bankCode: string;
  kingdeeVoucherId?: string;
  kingdeeVoucherNo?: string;
  kingdeePushError?: string;
  createdAt?: string;
  applicationItemCount?: number;
}

export interface FundUsageApplication {
  id: number;
  processInstanceId: string;
  businessId: string;
  title: string;
  submitterId?: string;
  submitterName: string;
  department: string;
  originatorDept: string;
  paymentType: string;
  paymentReason: string;
  totalAmount: number;
  totalAmountUpper?: string;
  attachmentInfo?: string;
  approvalResult: string;
  approvalUrl?: string;
  submitTime: string;
  finishTime: string;
  createdAt: string;
  items?: FundUsageApplicationItem[];
}

export function getFundUsageApplications(params: {
  pageNo?: number;
  pageSize?: number;
  businessId?: string;
  submitterName?: string;
  paymentType?: string;
}) {
  return request<PageResult<FundUsageApplication[]>>({
    url: '/business/fund-usage-application',
    method: 'get',
    params,
  });
}

export function getFundUsageApplicationItems(params: {
  pageNo?: number;
  pageSize?: number;
  businessId?: string;
  submitterName?: string;
  paymentType?: string;
}) {
  return request<PageResult<FundUsageApplicationItem[]>>({
    url: '/business/fund-usage-application/items',
    method: 'get',
    params,
  });
}

export function getFundUsageApplicationItemDetail(id: number) {
  return request<FundUsageApplicationItem>({
    url: `/business/fund-usage-application/items/${id}`,
    method: 'get',
  });
}

export function getApplicationItems(applicationId: number) {
  return request<FundUsageApplicationItem[]>({
    url: `/business/fund-usage-application/applications/${applicationId}/items`,
    method: 'get',
  });
}

export function getFundUsageApplicationDetail(id: number) {
  return request<FundUsageApplication>({
    url: `/business/fund-usage-application/${id}`,
    method: 'get',
  });
}

export function reparseFundUsageApplications() {
  return request<number>({
    url: '/business/fund-usage-application/reparse',
    method: 'post',
  });
}

export interface KingdeeVoucherSaveResult {
  savedMode?: 'created' | 'appended';
  voucherId: string;
  voucherNumber: string;
  explanation: string;
  voucherGroup: string;
  itemCount?: number;
}

export function pushFundUsageItemToKingdee(id: number, accountId?: number) {
  return request<KingdeeVoucherSaveResult>({
    url: `/business/fund-usage-application/items/${id}/push-kingdee-voucher`,
    method: 'post',
    params: accountId != null ? { accountId } : undefined,
  });
}

export function batchPushFundUsageItemsToKingdee(ids: number[], accountId?: number) {
  return request<KingdeeVoucherSaveResult>({
    url: '/business/fund-usage-application/items/batch-push-kingdee-voucher',
    method: 'post',
    data: { ids },
    params: accountId != null ? { accountId } : undefined,
  });
}

export function pushFundUsageApplicationToKingdee(applicationId: number, accountId?: number) {
  return request<KingdeeVoucherSaveResult>({
    url: `/business/fund-usage-application/applications/${applicationId}/push-kingdee-voucher`,
    method: 'post',
    params: accountId != null ? { accountId } : undefined,
  });
}
