import request from '@/utils/request';

export interface PageResult<T> {
  total: number;
  records: T;
}

export interface RetailTransferItem {
  id: number;
  tradeTime?: string;
  direction: 'OUT' | 'IN';
  amount: number;
  balance?: number;
  counterpartyAccount?: string;
  counterpartyName?: string;
  purpose?: string;
  summary?: string;
  remark?: string;
  serialNo?: string;
  retailFlag?: number;
  kingdeeVoucherId?: string;
  kingdeeVoucherNo?: string;
  kingdeeExistStatus?: number;
  kingdeeExistVoucherWord?: string;
  kingdeeExistVoucherNo?: string;
  kingdeeExistCheckedAt?: string;
}

export interface RetailTransferImportResult {
  totalRows: number;
  imported: number;
  updated?: number;
  skippedDuplicate: number;
  skippedInvalid: number;
  retailCount: number;
  sheetCount?: number;
  sheetNames?: string;
}

export interface RetailTransferExistItem {
  id: number;
  tradeTime?: string;
  counterpartyName?: string;
  amountSide?: string;
  amount?: string;
  kingdeeExistStatus?: number;
  kingdeeExistVoucherWord?: string;
  kingdeeExistVoucherNo?: string;
  message?: string;
}

export interface RetailTransferExistResult {
  total: number;
  existsCount: number;
  notExistsCount: number;
  uncheckedCount?: number;
  periodsQueried?: string[];
  kingdeeEntryCount?: number;
  items: RetailTransferExistItem[];
}

export function importRetailTransfer(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request<RetailTransferImportResult>({
    url: '/kingdee/retail-transfer/import',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function clearRetailTransferImported() {
  return request<{ deleted: number }>({
    url: '/kingdee/retail-transfer/clear-imported',
    method: 'post',
  });
}

export function getRetailTransferItems(params: {
  pageNo?: number;
  pageSize?: number;
  counterpartyName?: string;
  direction?: string;
  retailOnly?: boolean;
  existStatus?: string;
  tradeDateStart?: string;
  tradeDateEnd?: string;
}) {
  return request<PageResult<RetailTransferItem[]>>({
    url: '/kingdee/retail-transfer/items',
    method: 'get',
    params,
  });
}

export function checkRetailTransferKingdeeExists(data: {
  ids?: number[];
  accountId?: number;
  retailOnly?: boolean;
}) {
  return request<RetailTransferExistResult>({
    url: '/kingdee/retail-transfer/check-kingdee-exists',
    method: 'post',
    data,
    timeout: 120000,
  });
}
