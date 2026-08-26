# -*- coding: utf-8 -*-
"""Generic patcher: replace mockData listing pages with useJdyBusinessData."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(r"d:\E\project\Zt_dismantling\admin-app\src\pages")

PAGES = [
    {
        "path": ROOT / "production/scrapped-vehicle/index.tsx",
        "bizKey": "scrapped-vehicle",
        "typeName": "ScrappedVehicleItem",
        "component": "ScrappedVehicle",
    },
    {
        "path": ROOT / "production/pick-top-photo/index.tsx",
        "bizKey": "pick-top-photo",
        "typeName": "PickTopPhotoItem",
        "component": "PickTopPhoto",
    },
    {
        "path": ROOT / "production/disassembly/index.tsx",
        "bizKey": "disassembly",
        "typeName": "DisassemblyItem",
        "component": "Disassembly",
    },
    {
        "path": ROOT / "production/comprehensive-disassembly/index.tsx",
        "bizKey": "comprehensive-disassembly",
        "typeName": "ComprehensiveDisassemblyItem",
        "component": "ComprehensiveDisassembly",
    },
    {
        "path": ROOT / "business/settlement/index.tsx",
        "bizKey": "settlement",
        "typeName": "SettlementItem",
        "component": "SettlementPage",
    },
    {
        "path": ROOT / "business/price-change/index.tsx",
        "bizKey": "price-change",
        "typeName": "PriceChangeItem",
        "component": "PriceChangePage",
    },
    {
        "path": ROOT / "business/payment-application/index.tsx",
        "bizKey": "payment-application",
        "typeName": "PaymentApplicationItem",
        "component": "PaymentApplicationPage",
    },
    {
        "path": ROOT / "kingdee/voucher/index.tsx",
        "bizKey": "weighing-sync",
        "typeName": "SyncDataItem",
        "component": "SyncDataPage",
    },
]


def ensure_imports(text: str) -> str:
    if "useJdyBusinessData" in text:
        return text
    needle = "from 'react';"
    if needle in text:
        return text.replace(
            needle,
            "from 'react';\nimport { useJdyBusinessData } from '@/hooks/useJdyBusinessData';",
            1,
        )
    needle2 = 'from "react";'
    if needle2 in text:
        return text.replace(
            needle2,
            'from "react";\nimport { useJdyBusinessData } from "@/hooks/useJdyBusinessData";',
            1,
        )
    return text


def remove_mock_array(text: str, type_name: str) -> str:
    start = text.find("const mockData: " + type_name + "[] = [")
    if start < 0:
        start = text.find("const mockData = [")
    if start < 0:
        raise RuntimeError("mock array not found for " + type_name)
    i = text.find("[", start)
    depth = 0
    end = None
    for idx in range(i, len(text)):
        ch = text[idx]
        if ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                end = idx + 1
                if end < len(text) and text[end] == ";":
                    end += 1
                break
    if end is None:
        raise RuntimeError("cannot find end of mock array")
    while end < len(text) and text[end] in "\r\n":
        end += 1
    return text[:start] + text[end:]


def patch_component(text: str, cfg: dict) -> str:
    component = cfg["component"]
    type_name = cfg["typeName"]
    biz_key = cfg["bizKey"]

    hook_block = (
        "export default function " + component + "() {\n"
        "  const {\n"
        "    dataSource,\n"
        "    total,\n"
        "    pageNo,\n"
        "    pageSize,\n"
        "    loading,\n"
        "    searchValue,\n"
        "    setSearchValue,\n"
        "    setPageNo,\n"
        "    setPageSize,\n"
        "    onSearch,\n"
        "  } = useJdyBusinessData<" + type_name + ">('" + biz_key + "');\n"
    )

    pattern = (
        r"export default function " + re.escape(component) + r"\(\) \{\n"
        r"(?:  const \[loading, setLoading\] = useState\(false\);\n)?"
        r"  const \[dataSource, setDataSource\] = useState<"
        + re.escape(type_name)
        + r"\[\]>\(mockData\);\n"
        r"(?:  const \[total, setTotal\] = useState\([^)]+\);\n)?"
        r"(?:  const \[pageNo, setPageNo\] = useState\([^)]+\);\n)?"
        r"(?:  const \[pageSize, setPageSize\] = useState\([^)]+\);\n)?"
        r"(?:  const \[loading, setLoading\] = useState\(false\);\n)?"
        r"(?:  const \[searchValue, setSearchValue\] = useState\([^)]+\);\n)?"
    )
    new_text, n = re.subn(pattern, hook_block, text, count=1)
    if n == 0:
        # voucher page may load mock via useEffect
        pattern2 = (
            r"export default function " + re.escape(component) + r"\(\) \{\n"
            r"(?:  const \[dataSource, setDataSource\] = useState<"
            + re.escape(type_name)
            + r"\[\]>\(\[\]\);\n)?"
            r"(?:  const \[dataSource, setDataSource\] = useState<"
            + re.escape(type_name)
            + r"\[\]>\(mockData\);\n)?"
        )
        raise RuntimeError("cannot patch state for " + component + "\nhead=\n" + text[text.find("export default function " + component): text.find("export default function " + component) + 500])
    text = new_text

    text = re.sub(
        r"\n  const handleSearch = useCallback\(\(value: string\) => \{.*?\}, \[[^\]]*\]\);\n",
        "\n",
        text,
        count=1,
        flags=re.S,
    )

    # remove voucher-style fake load effects that set mockData
    text = re.sub(
        r"\n  useEffect\(\(\) => \{[^}]*setDataSource\(mockData\)[^}]*\}, \[[^\]]*\]\);\n",
        "\n",
        text,
        count=1,
        flags=re.S,
    )
    text = re.sub(
        r"\n  const fetchData = useCallback\(async \(\) => \{.*?\}, \[[^\]]*\]\);\n",
        "\n",
        text,
        count=1,
        flags=re.S,
    )
    text = re.sub(
        r"\n  useEffect\(\(\) => \{\n    fetchData\(\);\n  \}, \[fetchData\]\);\n",
        "\n",
        text,
        count=1,
    )

    text = text.replace(
        "onChange={(e) => handleSearch(e.target.value)}",
        "onChange={(e) => setSearchValue(e.target.value)}\n              onSearch={onSearch}",
    )
    text = text.replace("onSearch={handleSearch}", "onSearch={onSearch}")

    if "loading={loading}" not in text:
        text = text.replace(
            "dataSource={dataSource}",
            "dataSource={dataSource}\n            loading={loading}",
            1,
        )

    text = text.replace("dataSource={mockData.slice", "dataSource={dataSource.slice")
    text = text.replace("mockData.map(", "dataSource.map(")
    text = text.replace("mockData.filter(", "dataSource.filter(")
    text = text.replace("mockData.slice(", "dataSource.slice(")
    text = re.sub(r"const entryCodeOptions = mockData\.map", "const entryCodeOptions = dataSource.map", text)
    return text


def main():
    for cfg in PAGES:
        path: Path = cfg["path"]
        print("patching", path)
        text = path.read_text(encoding="utf-8")
        if "useJdyBusinessData" in text and "mockData" not in text:
            print("  already patched")
            continue
        text = ensure_imports(text)
        if "mockData" in text:
            text = remove_mock_array(text, cfg["typeName"])
        try:
            text = patch_component(text, cfg)
        except RuntimeError as e:
            print("  FAIL", e)
            continue
        if re.search(r"\bmockData\b", text):
            text = text.replace("mockData", "dataSource")
        path.write_text(text, encoding="utf-8")
        print("  ok")


if __name__ == "__main__":
    main()
