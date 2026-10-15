import { getLocalBizRows, addLocalBizRow, updateLocalBizRow, deleteLocalBizRows, formatBizDateTime } from './localBizStore';
import { getStoredUser } from '@/config/apps';

export interface PayeeRecord {
  id: number;
  key: string;
  payeeUnit: string;
  payeeAccount: string;
  openingBank: string;
  bankCode: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const BIZ_KEY = 'payee-info';

const SEED: PayeeRecord[] = [
  { id: 1, key: '1', payeeUnit: '李晓娟', payeeAccount: '6221881771017847710', openingBank: '中国邮政储蓄银行', bankCode: '', submitter: '赵景景', submitTime: '2026-08-05 10:03:32', updateTime: '2026-08-05 10:03:32' },
  { id: 2, key: '2', payeeUnit: '陈国平', payeeAccount: '6228411290267660810', openingBank: '农业银行', bankCode: '', submitter: '邢福荣', submitTime: '2026-08-03 09:41:11', updateTime: '2026-08-03 09:41:11' },
  { id: 3, key: '3', payeeUnit: '张杰', payeeAccount: '6212260510010775810', openingBank: '工商银行临汾开发区支行', bankCode: '', submitter: '杨涛', submitTime: '2026-08-02 18:26:28', updateTime: '2026-08-02 18:26:28' },
];

function ensureSeed() {
  if (getLocalBizRows<PayeeRecord>(BIZ_KEY).length === 0) {
    localStorage.setItem(`biz-local-${BIZ_KEY}`, JSON.stringify(SEED));
  }
}

export function listPayees(): PayeeRecord[] {
  ensureSeed();
  return getLocalBizRows<PayeeRecord>(BIZ_KEY);
}

export function createPayee(input: Pick<PayeeRecord, 'payeeUnit' | 'payeeAccount' | 'openingBank' | 'bankCode'>) {
  const user = getStoredUser();
  const now = formatBizDateTime();
  const id = Date.now();
  return addLocalBizRow<PayeeRecord>(BIZ_KEY, {
    key: String(id),
    payeeUnit: input.payeeUnit,
    payeeAccount: input.payeeAccount,
    openingBank: input.openingBank,
    bankCode: input.bankCode || '',
    submitter: user.nickname || user.username || '系统',
    submitTime: now,
    updateTime: now,
  });
}

export function updatePayee(id: number, patch: Partial<PayeeRecord>) {
  return updateLocalBizRow<PayeeRecord>(BIZ_KEY, id, { ...patch, updateTime: formatBizDateTime() });
}

export function removePayees(ids: number[]) {
  deleteLocalBizRows(BIZ_KEY, ids);
}

/** 下拉唯一值：有账号时用「单位|账号」，避免同名冲突 */
export function payeeSelectValue(p: Pick<PayeeRecord, 'payeeUnit' | 'payeeAccount'>) {
  const unit = (p.payeeUnit || '').trim();
  const account = (p.payeeAccount || '').trim();
  return account ? `${unit}|${account}` : unit;
}

export function findPayeeByUnit(payeeUnit: string) {
  return listPayees().find((p) => p.payeeUnit === payeeUnit);
}

/** 按下拉 value 查找（兼容纯单位名，或「单位|账号」） */
export function findPayeeBySelectValue(selected: string) {
  const raw = (selected || '').trim();
  if (!raw) return undefined;
  const byValue = listPayees().find((p) => payeeSelectValue(p) === raw);
  if (byValue) return byValue;
  const idx = raw.indexOf('|');
  if (idx > 0) {
    const unit = raw.slice(0, idx);
    const account = raw.slice(idx + 1);
    const hit = listPayees().find((p) => p.payeeUnit === unit && p.payeeAccount === account);
    if (hit) return hit;
  }
  return findPayeeByUnit(raw);
}
