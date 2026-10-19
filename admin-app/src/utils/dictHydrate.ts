import { listDictItems, type DictItemInfo } from '@/api/dicts';
import { setLocalBizRows } from '@/utils/localBizStore';
import type {
  ProductNameRecord,
  SalesmanRecord,
  StaffRecord,
  VehicleModelRecord,
} from '@/utils/dictStore';
import type { SupplierRecord } from '@/utils/supplierStore';
import type { PayeeRecord } from '@/utils/payeeStore';

/** 基础资料 bizKey → 字典 typeCode */
export const BIZ_KEY_TO_DICT_TYPE: Record<string, string> = {
  salesman: 'salesman',
  supplier: 'supplier',
  'vehicle-model': 'vehicle-model',
  'product-name': 'product-name',
  'payee-info': 'payee-info',
  staff: 'staff',
};

function accountDigits(value: unknown) {
  return String(value ?? '').replace(/\D/g, '');
}

function payeeIdentity(item: DictItemInfo) {
  const extra = parseExtra(item.extraJson);
  let account = accountDigits(extra.payeeAccount || extra['收款账号'] || extra['账号']);
  if (!account && item.itemValue?.includes('|')) {
    account = accountDigits(item.itemValue.slice(item.itemValue.lastIndexOf('|') + 1));
  }
  const name = (item.itemLabel || '').trim();
  return account ? `${name}|${account}` : name || (item.itemValue || '').trim();
}

function payeeScore(item: DictItemInfo) {
  const extra = parseExtra(item.extraJson);
  let score = 0;
  if (extra._submitter && extra._submitter !== '简道云') score += 4;
  if (extra._createTime || extra._updateTime) score += 4;
  if (extra['开户行'] || extra.openingBank) score += 1;
  if (extra['银行行号'] || extra.bankCode) score += 1;
  return score;
}

function dedupeItems(items: DictItemInfo[], bizKey?: string): DictItemInfo[] {
  const map = new Map<string, DictItemInfo>();
  const ordered = [...items].sort((a, b) => {
    if (bizKey === 'payee-info') {
      const score = payeeScore(b) - payeeScore(a);
      if (score !== 0) return score;
      const time = String(parseExtra(b.extraJson)._createTime || '').localeCompare(
        String(parseExtra(a.extraJson)._createTime || ''),
      );
      if (time !== 0) return time;
    }
    const ar = a.sourceApp === 'receipt' ? 0 : 1;
    const br = b.sourceApp === 'receipt' ? 0 : 1;
    return ar - br;
  });
  for (const it of ordered) {
    // 收款人按「名称 + 账号」合并；同名不同账号保留
    const key = bizKey === 'payee-info'
      ? payeeIdentity(it)
      : (it.itemValue || it.itemLabel || '').trim();
    if (!key || map.has(key)) continue;
    map.set(key, it);
  }
  return Array.from(map.values());
}

function parseExtra(extraJson?: string): Record<string, unknown> {
  if (!extraJson) return {};
  try {
    return JSON.parse(extraJson) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function formatJdyTime(value: unknown) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    return text.replace('T', ' ').replace(/\.\d+Z?$/, '').replace('Z', '');
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function metaFromItem(item: DictItemInfo) {
  const extra = parseExtra(item.extraJson);
  return {
    submitter: String(extra._submitter || '简道云'),
    submitTime: formatJdyTime(extra._createTime),
    updateTime: formatJdyTime(extra._updateTime),
  };
}

function mapToBizRows(bizKey: string, items: DictItemInfo[]): { id: number }[] {
  const list = dedupeItems(items, bizKey);
  switch (bizKey) {
    case 'salesman':
      return list.map((it, i) => {
        const id = it.id || i + 1;
        return {
          id,
          key: String(id),
          salesman: it.itemLabel || it.itemValue,
          ...metaFromItem(it),
        } satisfies SalesmanRecord;
      });
    case 'supplier':
      return list.map((it, i) => {
        const id = it.id || i + 1;
        const extra = parseExtra(it.extraJson);
        return {
          id,
          key: String(id),
          supplierName: it.itemLabel || it.itemValue,
          contactPhone: String(extra.contactPhone || extra['联系电话'] || ''),
          ...metaFromItem(it),
        } satisfies SupplierRecord;
      });
    case 'vehicle-model':
      return list.map((it, i) => {
        const id = it.id || i + 1;
        return {
          id,
          key: String(id),
          vehicleModel: it.itemLabel || it.itemValue,
          ...metaFromItem(it),
        } satisfies VehicleModelRecord;
      });
    case 'product-name':
      return list.map((it, i) => {
        const id = it.id || i + 1;
        const extra = parseExtra(it.extraJson);
        const proportion = Number(extra.proportion ?? extra['占比'] ?? extra['比例'] ?? 0);
        return {
          id,
          key: String(id),
          productName: it.itemLabel || it.itemValue,
          proportion: Number.isFinite(proportion) ? proportion : 0,
          ...metaFromItem(it),
        } satisfies ProductNameRecord;
      });
    case 'payee-info':
      return list.map((it, i) => {
        const id = it.id || i + 1;
        const extra = parseExtra(it.extraJson);
        return {
          id,
          key: String(id),
          payeeUnit: it.itemLabel || it.itemValue,
          payeeAccount: String(extra.payeeAccount || extra['收款账号'] || ''),
          openingBank: String(extra.openingBank || extra['开户行'] || ''),
          bankCode: String(extra.bankCode || extra['银行行号'] || ''),
          ...metaFromItem(it),
        } satisfies PayeeRecord;
      });
    case 'staff':
      return list.map((it, i) => {
        const id = it.id || i + 1;
        const extra = parseExtra(it.extraJson);
        return {
          id,
          key: String(id),
          staffName: it.itemLabel || it.itemValue,
          roleType: String(extra.roleType || extra['角色'] || '生产人员'),
          ...metaFromItem(it),
        } satisfies StaffRecord;
      });
    default:
      return [];
  }
}

/** 从 sys_dict 拉取并写入本地基础资料缓存；有数据返回 true */
export async function hydrateBizFromDictServer(bizKey: string): Promise<boolean> {
  const typeCode = BIZ_KEY_TO_DICT_TYPE[bizKey];
  if (!typeCode) return false;
  try {
    const res = await listDictItems(typeCode);
    const items = res.data || [];
    if (items.length === 0) return false;
    const rows = mapToBizRows(bizKey, items);
    if (rows.length === 0) return false;
    setLocalBizRows(bizKey, rows);
    return true;
  } catch {
    return false;
  }
}

let hydrateAllPromise: Promise<void> | null = null;

/** 登录后预热全部已知字典（并发，失败忽略） */
export function hydrateAllDictsFromServer(): Promise<void> {
  if (hydrateAllPromise) return hydrateAllPromise;
  hydrateAllPromise = (async () => {
    await Promise.all(
      Object.keys(BIZ_KEY_TO_DICT_TYPE).map((bizKey) => hydrateBizFromDictServer(bizKey)),
    );
  })().finally(() => {
    hydrateAllPromise = null;
  });
  return hydrateAllPromise;
}
