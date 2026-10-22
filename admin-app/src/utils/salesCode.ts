import dayjs, { type Dayjs } from 'dayjs';
import { getNextSalesCode, type SalesBizKey } from '@/api/jdy';

/** 成品销售审批单：YYYYMMDD + 5 位日流水 */
const PLAIN_BIZ: SalesBizKey[] = ['finished-product-approval'];
/** 台账 / 配件：XS + YYYYMMDD + 3 位日流水 */
const XS_BIZ: SalesBizKey[] = [
  'finished-product-ledger',
  'part-approval',
  'part-ledger',
];

export function salesCodeDateKey(value?: string | Dayjs | null): string {
  if (!value) return dayjs().format('YYYYMMDD');
  const d = dayjs.isDayjs(value) ? value : dayjs(value);
  return d.isValid() ? d.format('YYYYMMDD') : dayjs().format('YYYYMMDD');
}

function ruleOf(bizKey: SalesBizKey): { prefix: (ymd: string) => string; width: number } {
  if (PLAIN_BIZ.includes(bizKey)) {
    return { prefix: (ymd) => ymd, width: 5 };
  }
  if (XS_BIZ.includes(bizKey)) {
    return { prefix: (ymd) => `XS${ymd}`, width: 3 };
  }
  throw new Error(`不支持的销售表单编号: ${bizKey}`);
}

/** 根据已有编号列表计算下一号（用于合并本地未落库记录） */
export function nextSalesCodeFromList(
  bizKey: SalesBizKey,
  existingCodes: Array<string | undefined | null>,
  date?: string | Dayjs | null,
): string {
  const ymd = salesCodeDateKey(date);
  const { prefix, width } = ruleOf(bizKey);
  const head = prefix(ymd);
  let max = 0;
  const re = new RegExp(`^${head.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+)$`);
  for (const code of existingCodes) {
    if (!code) continue;
    const m = String(code).trim().match(re);
    if (m) {
      const n = Number(m[1]);
      if (!Number.isNaN(n)) max = Math.max(max, n);
    }
  }
  return `${head}${String(max + 1).padStart(width, '0')}`;
}

/**
 * 取下一销售编号：优先后端（对齐本地库），再与本地列表取较大序号，避免同页多次添加撞号。
 */
export async function resolveNextSalesCode(
  bizKey: SalesBizKey,
  existingCodes: Array<string | undefined | null>,
  date?: string | Dayjs | null,
): Promise<string> {
  const ymd = salesCodeDateKey(date);
  let fromApi = '';
  try {
    const res = await getNextSalesCode(bizKey, ymd);
    fromApi = String(res.data?.code || '').trim();
  } catch {
    // 后端不可用时回退本地推算
  }
  const fromLocal = nextSalesCodeFromList(bizKey, existingCodes, ymd);
  if (!fromApi) return fromLocal;
  // 取数值更大的那个（同一前缀）
  const { prefix } = ruleOf(bizKey);
  const head = prefix(ymd);
  const seq = (code: string) => {
    if (!code.startsWith(head)) return 0;
    return Number(code.slice(head.length)) || 0;
  };
  return seq(fromApi) >= seq(fromLocal) ? fromApi : fromLocal;
}
