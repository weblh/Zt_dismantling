import { useEffect, useMemo, useState } from 'react';
import { Select } from 'antd';
import type { SelectProps } from 'antd';
import { getDictOptions, type DictKey } from '@/utils/dictStore';
import { BIZ_KEY_TO_DICT_TYPE, hydrateBizFromDictServer } from '@/utils/dictHydrate';

const DICT_TO_BIZ: Record<DictKey, string> = {
  supplier: 'supplier',
  payee: 'payee-info',
  salesman: 'salesman',
  vehicleModel: 'vehicle-model',
  warehouse: 'warehouse',
  productName: 'product-name',
  staff: 'staff',
};

interface DictSelectProps extends Omit<SelectProps, 'options'> {
  dict: DictKey;
  /** 打开下拉时刷新字典（基础资料新增后立即可见） */
  refreshToken?: number | string | boolean;
}

/** 基础资料 / 简道云字典作为下拉选项 */
export default function DictSelect({ dict, refreshToken, ...rest }: DictSelectProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bizKey = DICT_TO_BIZ[dict];
    if (!bizKey || !BIZ_KEY_TO_DICT_TYPE[bizKey]) return;
    hydrateBizFromDictServer(bizKey).then((ok) => {
      if (ok) setTick((t) => t + 1);
    });
  }, [dict, refreshToken]);

  const options = useMemo(() => getDictOptions(dict), [dict, refreshToken, tick]);

  return (
    <Select
      showSearch
      allowClear
      optionFilterProp="label"
      placeholder="请选择"
      options={options}
      onDropdownVisibleChange={(open) => {
        if (open) {
          const bizKey = DICT_TO_BIZ[dict];
          if (bizKey) {
            hydrateBizFromDictServer(bizKey).finally(() => setTick((t) => t + 1));
          } else {
            setTick((t) => t + 1);
          }
        }
      }}
      {...rest}
    />
  );
}
