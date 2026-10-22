import { useCallback, useEffect, useMemo, useState } from 'react';
import { getJdyBusinessData } from '@/api/jdy';
import { getStoredUser } from '@/config/apps';
import { filterByTab, mapWorkbenchRow } from './mapFlowItem';
import { FLOW_FORMS, type FlowTabKey, type WorkbenchFlowItem } from './types';

async function fetchBiz(bizKey: (typeof FLOW_FORMS)[number]['bizKey']) {
  const res = await getJdyBusinessData(bizKey, { pageNo: 1, pageSize: 200 });
  const rows = (res.data?.records || []) as Record<string, unknown>[];
  return rows.map((row) => mapWorkbenchRow(bizKey, row));
}

export function useWorkbenchFlows() {
  const [items, setItems] = useState<WorkbenchFlowItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user = getStoredUser();
  const userNames = useMemo(
    () => [user.nickname, user.username].map((s) => (s || '').trim()).filter(Boolean),
    [user.nickname, user.username],
  );
  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const lists = await Promise.all(FLOW_FORMS.map((f) => fetchBiz(f.bizKey)));
      const merged = lists.flat().sort((a, b) => {
        const ta = a.updateTime || a.submitTime || '';
        const tb = b.updateTime || b.submitTime || '';
        return tb.localeCompare(ta);
      });
      setItems(merged);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载审批数据失败');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  /** 超管不过滤「我的」；普通用户按姓名匹配 */
  const scopeNames = isSuperAdmin ? [] : userNames;

  const counts = useMemo(
    () => ({
      todo: filterByTab(items, 'todo', scopeNames).length,
      initiated: filterByTab(items, 'initiated', scopeNames).length,
      processed: filterByTab(items, 'processed', scopeNames).length,
      cc: filterByTab(items, 'cc', []).length,
    }),
    [items, scopeNames],
  );

  const listFor = useCallback(
    (tab: Exclude<FlowTabKey, 'launch' | 'delegate'>, formName?: string | null) => {
      const filtered =
        tab === 'cc'
          ? filterByTab(items, 'cc', [])
          : filterByTab(items, tab, scopeNames);
      if (!formName) return filtered;
      return filtered.filter((it) => it.formName === formName);
    },
    [items, scopeNames],
  );

  const formNamesFor = useCallback(
    (tab: Exclude<FlowTabKey, 'launch' | 'delegate'>) => {
      const set = new Set(listFor(tab).map((it) => it.formName));
      return Array.from(set);
    },
    [listFor],
  );

  return { items, loading, error, reload, counts, listFor, formNamesFor, userNames };
}
