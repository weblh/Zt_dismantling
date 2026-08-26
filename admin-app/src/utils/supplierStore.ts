import { getLocalBizRows, addLocalBizRow, updateLocalBizRow, deleteLocalBizRows, formatBizDateTime } from './localBizStore';
import { getStoredUser } from '@/config/apps';

export interface SupplierRecord {
  id: number;
  key: string;
  supplierName: string;
  contactPhone: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const BIZ_KEY = 'supplier';

const SEED: SupplierRecord[] = [
  { id: 1, key: '1', supplierName: '靳俊峰', contactPhone: '13800000001', submitter: '系统', submitTime: '2026-08-05 16:41:00', updateTime: '2026-08-05 16:41:00' },
  { id: 2, key: '2', supplierName: '崔晓鑫', contactPhone: '13800000002', submitter: '系统', submitTime: '2026-08-05 09:06:28', updateTime: '2026-08-05 09:06:28' },
  { id: 3, key: '3', supplierName: '刘科峰', contactPhone: '', submitter: '系统', submitTime: '2026-08-04 17:31:26', updateTime: '2026-08-04 17:31:26' },
];

function ensureSeed() {
  if (getLocalBizRows<SupplierRecord>(BIZ_KEY).length === 0) {
    localStorage.setItem(`biz-local-${BIZ_KEY}`, JSON.stringify(SEED));
  }
}

export function listSuppliers(): SupplierRecord[] {
  ensureSeed();
  return getLocalBizRows<SupplierRecord>(BIZ_KEY);
}

export function createSupplier(input: Pick<SupplierRecord, 'supplierName' | 'contactPhone'>) {
  const user = getStoredUser();
  const now = formatBizDateTime();
  const id = Date.now();
  return addLocalBizRow<SupplierRecord>(BIZ_KEY, {
    key: String(id),
    supplierName: input.supplierName,
    contactPhone: input.contactPhone || '',
    submitter: user.nickname || user.username || '系统',
    submitTime: now,
    updateTime: now,
  });
}

export function updateSupplier(id: number, patch: Partial<SupplierRecord>) {
  return updateLocalBizRow<SupplierRecord>(BIZ_KEY, id, { ...patch, updateTime: formatBizDateTime() });
}

export function removeSuppliers(ids: number[]) {
  deleteLocalBizRows(BIZ_KEY, ids);
}

export function findSupplierByName(name: string) {
  return listSuppliers().find((s) => s.supplierName === name);
}
