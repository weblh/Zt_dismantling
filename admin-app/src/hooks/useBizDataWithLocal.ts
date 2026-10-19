import { useCallback, useEffect, useState } from 'react';
import { getLocalBizRows, addLocalBizRow, deleteLocalBizRows, formatBizDateTime, hydrateLocalBizRowsFromServer } from '@/utils/localBizStore';
import { getStoredUser } from '@/config/apps';
import type { DataScope } from '@/components/DataScopeDropdown';

function parseDeptTokens(raw?: string): string[] {
  if (!raw) return [];
  return String(raw)
    .replace(/[\[\]"]/g, '')
    .split(/[,，;；\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function matchDeptScope(row: Record<string, unknown>, userDeptIds: string, userDepartment?: string): boolean {
  const tokens = parseDeptTokens(userDeptIds);
  const rowDeptIds = String(row.deptIds || row.deptId || '');
  const rowDeptName = String(row.department || row.departmentName || row.deptName || '');
  if (tokens.length > 0 && rowDeptIds) {
    return tokens.some((t) => rowDeptIds.includes(t));
  }
  if (userDepartment && rowDeptName) {
    return rowDeptName.includes(userDepartment) || userDepartment.includes(rowDeptName);
  }
  // 无部门信息时：本部门范围回退为「本人」以免误看全部
  const me = getStoredUser().nickname || getStoredUser().username || '';
  const submitter = String(row.submitter || '');
  return !!me && (submitter === me || submitter.includes(me));
}

function applyScopeFilter<T>(rows: T[], dataScope: DataScope, me: string, user: ReturnType<typeof getStoredUser>): T[] {
  if (dataScope === 'self' && me) {
    return rows.filter((row) => {
      const submitter = String((row as Record<string, unknown>).submitter || '');
      return submitter === me || submitter.includes(me);
    });
  }
  if (dataScope === 'dept') {
    return rows.filter((row) => matchDeptScope(row as Record<string, unknown>, user.deptIds || '', user.department));
  }
  return rows;
}

export function useBizDataWithLocal<T extends { id: number }>(
  bizKey: string,
  options?: { dataScope?: DataScope },
) {
  const [dataSource, setDataSource] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [keyword, setKeyword] = useState('');
  const [dataScope, setDataScope] = useState<DataScope>(options?.dataScope || 'all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const user = getStoredUser();
    const me = user.nickname || user.username || '';
    try {
      await hydrateLocalBizRowsFromServer<T>(bizKey);
      let local = getLocalBizRows<T>(bizKey);
      if (keyword) {
        local = local.filter((row) => JSON.stringify(row).toLowerCase().includes(keyword.toLowerCase()));
      }
      local = applyScopeFilter(local, dataScope, me, user);
      const start = (pageNo - 1) * pageSize;
      setDataSource(local.slice(start, start + pageSize));
      setTotal(local.length);
    } finally {
      setLoading(false);
    }
  }, [bizKey, pageNo, pageSize, keyword, dataScope]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSearch = (value: string) => {
    setSearchValue(value);
    setPageNo(1);
    setKeyword(value.trim());
  };

  const appendLocal = useCallback(
    (row: Omit<T, 'id'> & Partial<Pick<T, 'id'>>) => {
      const user = getStoredUser();
      const now = formatBizDateTime();
      const withMeta = {
        ...row,
        submitter: (row as Record<string, unknown>).submitter || user.nickname || user.username || '系统',
        submitTime: (row as Record<string, unknown>).submitTime || now,
        updateTime: (row as Record<string, unknown>).updateTime || now,
        deptIds: (row as Record<string, unknown>).deptIds || user.deptIds || '',
        department: (row as Record<string, unknown>).department || user.department || '',
      } as Omit<T, 'id'> & Partial<Pick<T, 'id'>>;
      addLocalBizRow<T>(bizKey, withMeta);
      fetchData();
    },
    [bizKey, fetchData],
  );

  const removeLocal = useCallback(
    (ids: number[]) => {
      deleteLocalBizRows(bizKey, ids);
      fetchData();
    },
    [bizKey, fetchData],
  );

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
    appendLocal,
    removeLocal,
    dataScope,
    setDataScope,
    allRows: () => getLocalBizRows<T>(bizKey),
  };
}
