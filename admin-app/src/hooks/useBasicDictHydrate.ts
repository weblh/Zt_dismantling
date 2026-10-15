import { useCallback, useEffect } from 'react';
import { hydrateLocalBizRowsFromServer } from '@/utils/localBizStore';
import { hydrateBizFromDictServer } from '@/utils/dictHydrate';

/** 基础资料页：优先用简道云字典，再合并 biz_local */
export function useBasicDictHydrate<T extends { id: number }>(
  bizKey: string,
  listFn: () => T[],
  setRows: (rows: T[]) => void,
  setLoading?: (loading: boolean) => void,
) {
  const refresh = useCallback(async () => {
    setLoading?.(true);
    try {
      const fromDict = await hydrateBizFromDictServer(bizKey);
      if (!fromDict) {
        await hydrateLocalBizRowsFromServer<T>(bizKey);
      }
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
