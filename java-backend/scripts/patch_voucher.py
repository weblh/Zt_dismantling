# -*- coding: utf-8 -*-
from pathlib import Path
import re

p = Path(r"d:\E\project\Zt_dismantling\admin-app\src\pages\kingdee\voucher\index.tsx")
text = p.read_text(encoding="utf-8")

# imports
text = text.replace(
    "import { useState, useEffect, useCallback } from 'react';",
    "import { useState } from 'react';\nimport { useJdyBusinessData } from '@/hooks/useJdyBusinessData';",
)

# remove mockData
start = text.find("const mockData: SyncDataItem[] = [")
end = text.find("const columns: ColumnsType<SyncDataItem>")
if start < 0 or end < 0:
    raise SystemExit("markers missing")
text = text[:start] + text[end:]

old = """export default function SyncDataPage() {
  const [items, setItems] = useState<SyncDataItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      let filteredData = [...mockData];
      if (searchValue) {
        filteredData = filteredData.filter((item) =>
          item.code.includes(searchValue),
        );
      }
      setItems(filteredData);
      setTotal(filteredData.length);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [searchValue]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    setPageNo(1);
  };
"""

new = """export default function SyncDataPage() {
  const {
    dataSource: items,
    total,
    pageNo,
    pageSize,
    loading,
    searchValue,
    setSearchValue,
    setPageNo,
    setPageSize,
    onSearch,
  } = useJdyBusinessData<SyncDataItem>('weighing-sync');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form] = Form.useForm();
"""

if old not in text:
    raise SystemExit("old block not found")
text = text.replace(old, new, 1)

# handleAddSubmit still uses setItems/setTotal - soften to local-only message
text = text.replace(
    """      setItems((prev) => [newItem, ...prev]);
      setTotal((prev) => prev + 1);
      setAddModalOpen(false);""",
    """      console.log('本地新增(未写回简道云):', newItem);
      setAddModalOpen(false);""",
)

# search
text = text.replace(
    """          <Input.Search
            placeholder="搜索数据"
            value={searchValue}
            onSearch={handleSearch}
            onChange={(e) => setSearchValue(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />""",
    """          <Input.Search
            placeholder="搜索数据"
            value={searchValue}
            onSearch={onSearch}
            onChange={(e) => setSearchValue(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />""",
)

# table dataSource
text = text.replace("dataSource={items}", "dataSource={items}\n          loading={loading}")

# pagination setters already exist via hook
if "setPageSize" not in text.split("pagination")[1][:400]:
    pass

p.write_text(text, encoding="utf-8")
print("voucher patched")
# sanity
if "mockData" in text or "useCallback" in text or "useEffect" in text:
    print("WARNING residual:", "mockData" in text, "useCallback" in text, "useEffect" in text)
