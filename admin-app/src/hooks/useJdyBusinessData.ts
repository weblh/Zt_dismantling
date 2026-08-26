import { useCallback, useEffect, useState } from 'react';
import { getJdyBusinessData } from '@/api/jdy';

export function useJdyBusinessData<T extends { id: number }>(bizKey: string) {
  const [dataSource, setDataSource] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [keyword, setKeyword] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getJdyBusinessData(bizKey, {
        pageNo,
        pageSize,
        keyword: keyword || undefined,
      });
      setDataSource((res.data.records || []) as unknown as T[]);
      setTotal(res.data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [bizKey, pageNo, pageSize, keyword]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSearch = (value: string) => {
    setSearchValue(value);
    setPageNo(1);
    setKeyword(value.trim());
  };

  return {
    dataSource,
    total,
    pageNo,
    pageSize,
    loading,
    searchValue,
    setSearchValue,
    setPageNo,
    setPageSize,
    onSearch,
    reload: fetchData,
  };
}
