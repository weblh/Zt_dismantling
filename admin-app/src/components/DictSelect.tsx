import { useMemo, useState } from 'react';
import { Select } from 'antd';
import type { SelectProps } from 'antd';
import { getDictOptions, type DictKey } from '@/utils/dictStore';

interface DictSelectProps extends Omit<SelectProps, 'options'> {
  dict: DictKey;
  /** 打开下拉时刷新字典（基础资料新增后立即可见） */
  refreshToken?: number | string | boolean;
}

/** 基础资料列表作为下拉字典 */
export default function DictSelect({ dict, refreshToken, ...rest }: DictSelectProps) {
  const [tick, setTick] = useState(0);
  const options = useMemo(() => getDictOptions(dict), [dict, refreshToken, tick]);

  return (
    <Select
      showSearch
      allowClear
      optionFilterProp="label"
      placeholder="请选择"
      options={options}
      onDropdownVisibleChange={(open) => {
        if (open) setTick((t) => t + 1);
      }}
      {...rest}
    />
  );
}
