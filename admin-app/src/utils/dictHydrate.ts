import { listDictItems, type DictItemInfo } from '@/api/dicts';
import { setLocalBizRows } from '@/utils/localBizStore';
import type {
  ProductNameRecord,
  SalesmanRecord,
  StaffRecord,
  VehicleModelRecord,
  WarehouseRecord,
} from '@/utils/dictStore';
import type { SupplierRecord } from '@/utils/supplierStore';
import type { PayeeRecord } from '@/utils/payeeStore';

/** 基础资料 bizKey → 字典 typeCode */
export const BIZ_KEY_TO_DICT_TYPE: Record<string, string> = {
  salesman: 'salesman',
  supplier: 'supplier',
  'vehicle-model': 'vehicle-model',
  warehouse: 'warehouse',
  'product-name': 'product-name',
  'payee-info': 'payee-info',
  staff: 'staff',
};

function dedupeItems(items: DictItemInfo[], bizKey?: string): DictItemInfo[] {
  const map = new Map<string, DictItemInfo>();
  // receipt 优先，后到的 pricing 不覆盖同键
  const ordered = [...items].sort((a, b) => {
    const ar = a.sourceApp === 'receipt' ? 0 : 1;
    const br = b.sourceApp === 'receipt' ? 0 : 1;
    return ar - br;
  });
  for (const it of ordered) {
    // 收款人：按「名称|账号」或简道云行 ID 去重，同名不同账号都保留
    let key = (it.itemValue || it.itemLabel || '').trim();
    if (bizKey === 'payee-info') {
      const extra = parseExtra(it.extraJson);
      const account = String(extra.payeeAccount || extra['收款账号'] || '').trim();
      key =
        (it.jdyDataId && `${it.sourceApp || ''}:${it.jdyDataId}`) ||
        (account ? `${it.itemLabel || ''}|${account}` : '') ||
        key;
    }
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

function metaFromItem(item: DictItemInfo) {
  return {
    submitter: '简道云',
    submitTime: '',
    updateTime: '',
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
    case 'warehouse':
      return list.map((it, i) => {
        const id = it.id || i + 1;
        return {
          id,
          key: String(id),
          warehouseName: it.itemLabel || it.itemValue,
          ...metaFromItem(it),
        } satisfies WarehouseRecord;
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
