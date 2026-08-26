# -*- coding: utf-8 -*-
from pathlib import Path

p = Path(r"d:\E\project\Zt_dismantling\admin-app\src\pages\production\weighing-inspection\index.tsx")
text = p.read_text(encoding="utf-8")

start = text.find("const mockData: WeighingInspectionItem[] = [")
end = text.find("const columns: ColumnsType<WeighingInspectionItem>")
if start < 0 or end < 0:
    raise SystemExit(f"bad markers {start} {end}")
text = text[:start] + text[end:]

old = """export default function WeighingInspection() {
  const [dataSource, setDataSource] = useState<WeighingInspectionItem[]>(mockData);
  const [total, setTotal] = useState(1079);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchValue, setSearchValue] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm] = Form.useForm();

  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
    setPageNo(1);
    if (!value) {
      setDataSource(mockData);
      setTotal(1079);
    } else {
      const filtered = mockData.filter(
        (item) =>
          item.code.includes(value) ||
          item.plateNumber.includes(value) ||
          item.supplier.includes(value) ||
          item.salesperson.includes(value),
      );
      setDataSource(filtered);
      setTotal(filtered.length);
    }
  }, []);
"""

new = """export default function WeighingInspection() {
  const {
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
  } = useJdyBusinessData<WeighingInspectionItem>('weighing-inspection');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm] = Form.useForm();
"""

if old not in text:
    raise SystemExit("state block not found")
text = text.replace(old, new, 1)

text = text.replace(
    """            <Input.Search
              placeholder=\"搜索数据\"
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />""",
    """            <Input.Search
              placeholder=\"搜索数据\"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={onSearch}
              style={{ width: 200 }}
              allowClear
            />""",
)

text = text.replace(
    "dataSource={dataSource}\n            scroll={{ x: 2800 }}",
    "dataSource={dataSource}\n            loading={loading}\n            scroll={{ x: 2800 }}",
)

text = text.replace(
    """              <Form.Item name=\"code\" label=\"编号\" rules={[{ required: true, message: '请选择编号' }]}>
                <Select placeholder=\"请选择\">
                  {mockData.map(item => (
                    <Select.Option key={item.id} value={item.code}>{item.code}</Select.Option>
                  ))}
                </Select>
              </Form.Item>""",
    """              <Form.Item name=\"code\" label=\"编号\" rules={[{ required: true, message: '请输入编号' }]}>
                <Input placeholder=\"请输入\" />
              </Form.Item>""",
)

text = text.replace(
    """              <Form.Item name=\"plateNumber\" label=\"车牌号\" rules={[{ required: true, message: '请选择车牌号' }]}>
                <Select placeholder=\"请选择\">
                  {mockData.map(item => (
                    <Select.Option key={item.id} value={item.plateNumber}>{item.plateNumber}</Select.Option>
                  ))}
                </Select>
              </Form.Item>""",
    """              <Form.Item name=\"plateNumber\" label=\"车牌号\" rules={[{ required: true, message: '请输入车牌号' }]}>
                <Input placeholder=\"请输入\" />
              </Form.Item>""",
)

if "mockData" in text:
    raise SystemExit("mockData still referenced")

p.write_text(text, encoding="utf-8")
print("updated weighing-inspection ok")
