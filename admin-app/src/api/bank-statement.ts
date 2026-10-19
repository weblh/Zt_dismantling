import request from '@/utils/request';

export interface PageResult<T> {
  total: number;
  records: T;
}

export type BankSource = 'ICBC' | 'JINSHANG';
export type BankDirection = 'OUT' | 'IN';
export type BankVoucherType =
  | 'EXPENSE'
  | 'REPAIR'
  | 'MATERIAL'
  | 'TAX'
  | 'TRANSFER'
  | 'PART_INCOME'
  | 'RESIDUAL_FEE';

export interface BankStatementItem {
  id: number;
  bankSource: BankSource;
  tradeTime?: string;
  direction: BankDirection;
  amount: number;
  balance?: number;
  counterpartyAccount?: string;
  counterpartyName?: string;
  purpose?: string;
  summary?: string;
  remark?: string;
  receiptInfo?: string;
  voucherNo?: string;
  counterpartyBankNo?: string;
  counterpartyBankName?: string;
  serialNo?: string;
  currency?: string;
  fingerprint?: string;
  voucherType?: BankVoucherType | string;
  employeeName?: string;
  payeeOverride?: string;
  targetBankName?: string;
  suggestedVoucherType?: BankVoucherType | string;
  suggestedEmployeeName?: string;
  kingdeeVoucherId?: string;
  kingdeeVoucherNo?: string;
  kingdeePushError?: string;
  /** 0未检查 1金蝶已存在 2不存在 */
  kingdeeExistStatus?: number;
  kingdeeExistVoucherWord?: string;
  kingdeeExistVoucherNo?: string;
  kingdeeExistCheckedAt?: string;
  duplicateSuspect?: boolean;
  createdAt?: string;
}

export interface BankStatementKingdeeExistItem {
  id: number;
  bankSource?: string;
  tradeTime?: string;
  serialNo?: string;
  counterpartyName?: string;
  /** 查重时按摘要自动识别的业务类型，如 RESIDUAL_FEE */
  voucherType?: string;
  amountSide?: string;
  amount?: string;
  kingdeeExistStatus?: number;
  kingdeeExistVoucherWord?: string;
  kingdeeExistVoucherNo?: string;
  message?: string;
}

export interface BankStatementKingdeeExistResult {
  total: number;
  existsCount: number;
  notExistsCount: number;
  uncheckedCount?: number;
  periodsQueried?: string[];
  kingdeeEntryCount?: number;
  items: BankStatementKingdeeExistItem[];
}

export interface BankStatementImportResult {
  bankSource: BankSource;
  totalRows: number;
  imported: number;
  skippedDuplicate: number;
  skippedInvalid: number;
}

export interface BankStatementDuplicateGroup {
  groupType: string;
  bankSource: BankSource;
  counterpartyName?: string;
  amount?: number;
  tradeDate?: string;
  items: BankStatementItem[];
}

export interface KingdeeVoucherSaveResult {
  savedMode?: 'created' | 'appended' | 'synced';
  voucherId: string;
  voucherNumber: string;
  explanation?: string;
  voucherGroup?: string;
  itemCount?: number;
}

export const VOUCHER_TYPE_OPTIONS = [
  { label: '费用报销', value: 'EXPENSE' },
  { label: '修理费备品备件', value: 'REPAIR' },
  { label: '采购材料', value: 'MATERIAL' },
  { label: '税费', value: 'TAX' },
  { label: '倒户', value: 'TRANSFER' },
  { label: '配件收入', value: 'PART_INCOME' },
  { label: '残值费', value: 'RESIDUAL_FEE' },
];

export function importBankStatement(file: File, bankSource?: BankSource) {
  const formData = new FormData();
  formData.append('file', file);
  return request<BankStatementImportResult>({
    url: '/kingdee/bank-statement/import',
    method: 'post',
    params: bankSource ? { bankSource } : undefined,
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function clearBankStatementImported() {
  return request<{ deleted: number }>({
    url: '/kingdee/bank-statement/clear-imported',
    method: 'post',
  });
}

export function getBankStatementItems(params: {
  pageNo?: number;
  pageSize?: number;
  bankSource?: string;
  direction?: string;
  counterpartyName?: string;
  voucherType?: string;
  pushStatus?: string;
  onlyOut?: boolean;
  tradeDateStart?: string;
  tradeDateEnd?: string;
  duplicateSuspectOnly?: boolean;
}) {
  return request<PageResult<BankStatementItem[]>>({
    url: '/kingdee/bank-statement/items',
    method: 'get',
    params,
  });
}

export function getBankStatementDetail(id: number) {
  return request<BankStatementItem>({
    url: `/kingdee/bank-statement/items/${id}`,
    method: 'get',
  });
}

export function classifyBankStatement(
  id: number,
  data: {
    voucherType: string;
    employeeName?: string;
    payeeOverride?: string;
    targetBankName?: string;
  },
) {
  return request<BankStatementItem>({
    url: `/kingdee/bank-statement/items/${id}/classify`,
    method: 'put',
    data,
  });
}

export function batchClassifyBankStatement(data: {
  ids: number[];
  voucherType: string;
  employeeName?: string;
  payeeOverride?: string;
  targetBankName?: string;
}) {
  return request<{ count: number }>({
    url: '/kingdee/bank-statement/items/batch-classify',
    method: 'post',
    data,
  });
}

export function getBankStatementDuplicates(bankSource?: string) {
  return request<BankStatementDuplicateGroup[]>({
    url: '/kingdee/bank-statement/duplicates',
    method: 'get',
    params: bankSource ? { bankSource } : undefined,
  });
}

/** 对齐租赁：检查金蝶银行存款分录是否已存在 */
export function checkBankStatementKingdeeExists(data: {
  ids?: number[];
  accountId?: number;
  bankSource?: string;
  accountingPeriods?: string[];
}) {
  return request<BankStatementKingdeeExistResult>({
    url: '/kingdee/bank-statement/check-kingdee-exists',
    method: 'post',
    data,
    timeout: 120000,
  });
}

export function pushBankStatementToKingdee(id: number, accountId?: number) {
  return request<KingdeeVoucherSaveResult>({
    url: `/kingdee/bank-statement/items/${id}/push-kingdee-voucher`,
    method: 'post',
    params: accountId != null ? { accountId } : undefined,
  });
}

export function batchPushBankStatementToKingdee(ids: number[], accountId?: number) {
  return request<KingdeeVoucherSaveResult>({
    url: '/kingdee/bank-statement/items/batch-push-kingdee-voucher',
    method: 'post',
    params: accountId != null ? { accountId } : undefined,
    data: { ids },
  });
}
