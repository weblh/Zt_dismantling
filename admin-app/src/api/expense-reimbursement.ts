import request from '@/utils/request';

export interface PageResult<T> {
  total: number;
  records: T;
}

export interface AttachmentFile {
  fileId: string;
  spaceId?: string;
  fileName: string;
  fileType?: string;
  fileSize?: number;
  previewable?: boolean;
}

export interface ExpenseReimbursementItem {
  id: number;
  reimbursementId: number;
  rowIndex: number;
  processInstanceId: string;
  businessId: string;
  title: string;
  submitterId: string;
  submitterName: string;
  department: string;
  reason: string;
  approvalResult: string;
  expenseType: string;
  expenseDate: string;
  amount: number;
  description: string;
  invoiceInfo: string;
  attachmentInfo: string;
  attachments?: AttachmentFile[];
  totalAmount?: number;
  bankAccount?: string;
  bankName?: string;
  companyName?: string;
  createdAt: string;
  kingdeeVoucherId?: string;
  kingdeeVoucherNo?: string;
  kingdeePushError?: string;
  reimbursementItemCount?: number;
}

export function getExpenseReimbursementItems(params: {
  pageNo?: number;
  pageSize?: number;
  businessId?: string;
  submitterName?: string;
  expenseType?: string;
}) {
  return request<PageResult<ExpenseReimbursementItem[]>>({
    url: '/business/expense-reimbursement/items',
    method: 'get',
    params,
  });
}

export function getExpenseReimbursementItemDetail(id: number) {
  return request<ExpenseReimbursementItem>({
    url: `/business/expense-reimbursement/items/${id}`,
    method: 'get',
  });
}

export function getReimbursementItems(reimbursementId: number) {
  return request<ExpenseReimbursementItem[]>({
    url: `/business/expense-reimbursement/reimbursements/${reimbursementId}/items`,
    method: 'get',
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

export function pushExpenseReimbursementToKingdee(id: number, accountId?: number) {
  return request<KingdeeVoucherSaveResult>({
    url: `/business/expense-reimbursement/items/${id}/push-kingdee-voucher`,
    method: 'post',
    params: accountId != null ? { accountId } : undefined,
  });
}

export function batchPushExpenseReimbursementToKingdee(ids: number[], accountId?: number) {
  return request<KingdeeVoucherSaveResult>({
    url: '/business/expense-reimbursement/items/batch-push-kingdee-voucher',
    method: 'post',
    data: { ids },
    params: accountId != null ? { accountId } : undefined,
  });
}

export function pushReimbursementToKingdee(reimbursementId: number, accountId?: number) {
  return request<KingdeeVoucherSaveResult>({
    url: `/business/expense-reimbursement/reimbursements/${reimbursementId}/push-kingdee-voucher`,
    method: 'post',
    params: accountId != null ? { accountId } : undefined,
  });
}
