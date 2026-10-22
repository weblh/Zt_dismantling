const STORAGE_PREFIX = 'biz-local-';

export function getLocalBizRows<T>(bizKey: string): T[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + bizKey);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

const syncTimers: Record<string, ReturnType<typeof setTimeout>> = {};

/** 防抖同步到服务端（离线时静默失败） */
function queueBizLocalServerSync<T>(bizKey: string, rows: T[]) {
  if (syncTimers[bizKey]) clearTimeout(syncTimers[bizKey]);
  syncTimers[bizKey] = setTimeout(() => {
    import('@/api/bizLocal')
      .then(({ putBizLocalRows }) => putBizLocalRows(bizKey, rows))
      .catch(() => {});
  }, 400);
}

/** 启动时从服务端拉取并合并本地缓存（服务端优先） */
export async function hydrateLocalBizRowsFromServer<T extends { id: number }>(bizKey: string): Promise<T[]> {
  try {
    const { getBizLocalRows } = await import('@/api/bizLocal');
    const res = await getBizLocalRows<T>(bizKey);
    const serverRows = res.data || [];
    if (serverRows.length > 0) {
      const local = getLocalBizRows<T>(bizKey);
      const map = new Map<number, T>();
      local.forEach((r) => map.set(r.id, r));
      serverRows.forEach((r) => map.set(r.id, r));
      const merged = Array.from(map.values());
      localStorage.setItem(STORAGE_PREFIX + bizKey, JSON.stringify(merged));
      return merged;
    }
  } catch {
    // 离线或未登录
  }
  return getLocalBizRows<T>(bizKey);
}

export function setLocalBizRows<T>(bizKey: string, rows: T[]) {
  localStorage.setItem(STORAGE_PREFIX + bizKey, JSON.stringify(rows));
  queueBizLocalServerSync(bizKey, rows);
}

export function addLocalBizRow<T extends { id: number }>(
  bizKey: string,
  row: Omit<T, 'id'> & Partial<Pick<T, 'id'>>,
): T {
  const rows = getLocalBizRows<T>(bizKey);
  const newRow = { ...row, id: row.id ?? Date.now() } as T;
  rows.unshift(newRow);
  setLocalBizRows(bizKey, rows);
  return newRow;
}

export function updateLocalBizRow<T extends { id: number }>(bizKey: string, id: number, patch: Partial<T>) {
  const rows = getLocalBizRows<T>(bizKey);
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  rows[idx] = { ...rows[idx], ...patch };
  setLocalBizRows(bizKey, rows);
  return rows[idx];
}

/** 本地有则更新，无则按原 id 新增（用于覆盖远端同步数据的本地编辑） */
export function upsertLocalBizRow<T extends { id: number }>(bizKey: string, row: T): T {
  const updated = updateLocalBizRow<T>(bizKey, row.id, row);
  if (updated) return updated;
  return addLocalBizRow<T>(bizKey, row);
}

/** 本地优先合并远端：同 id 用本地覆盖，仅本地有的行置顶 */
export function mergeLocalRemoteRows<T extends { id: number }>(local: T[], remote: T[]): T[] {
  const localById = new Map(local.map((r) => [r.id, r]));
  const remoteIds = new Set(remote.map((r) => r.id));
  const localOnly = local.filter((r) => !remoteIds.has(r.id));
  const remoteMerged = remote.map((r) => localById.get(r.id) ?? r);
  return [...localOnly, ...remoteMerged];
}

export function deleteLocalBizRows(bizKey: string, ids: number[]) {
  const rows = getLocalBizRows<{ id: number }>(bizKey);
  const next = rows.filter((r) => !ids.includes(r.id));
  setLocalBizRows(bizKey, next);
  return next.length;
}

export function formatBizDateTime(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
