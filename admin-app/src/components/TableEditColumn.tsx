import { Button } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import type { ColumnType } from 'antd/es/table';

/** 列表固定右侧「操作 / 编辑」列 */
export function makeEditColumn<T>(onEdit: (record: T) => void, width = 90): ColumnType<T> {
  return {
    title: '操作',
    key: 'action',
    width,
    fixed: 'right',
    render: (_: unknown, record: T) => (
      <Button type="link" size="small" icon={<EditOutlined />} onClick={() => onEdit(record)}>
        编辑
      </Button>
    ),
  };
}
