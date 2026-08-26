import { useCallback, useEffect } from 'react';
import { hydrateLocalBizRowsFromServer } from '@/utils/localBizStore';

/** 基础资料页：打开时从服务端拉取并刷新列表 */
export function useBasicDictHydrate<T extends { id: number }>(
  bizKey: string,
  listFn: () => T[],
  setRows: (rows: T[]) => void,
  setLoading?: (loading: boolean) => void,
) {
  const refresh = useCallback(async () => {
    setLoading?.(true);
    try {
      await hydrateLocalBizRowsFromServer<T>(bizKey);
      setRows(listFn());
    } finally {
      setLoading?.(false);
    }
  }, [bizKey, listFn, setRows, setLoading]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return refresh;
}
