import { useEffect, useState } from 'react';
import { Button, Input, Select, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import PageHeaderBar from '@/components/PageHeaderBar';
import {
  listWebsiteInquiries,
  markWebsiteInquiryHandled,
  type WebsiteInquiryItem,
} from '@/api/website-inquiry';
import { useIsMobile } from '@/hooks/useIsMobile';

const CATEGORY_LABEL: Record<string, string> = {
  VEHICLE: '报废车回收',
  PARTS: '回用件采购',
  MATERIAL: '再生材料',
  OTHER: '其他咨询',
};

export default function WebsiteInquiryPage() {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<WebsiteInquiryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');

  const load = async (page = pageNo, size = pageSize) => {
    setLoading(true);
    try {
      const res = await listWebsiteInquiries({
        pageNo: page,
        pageSize: size,
        status,
        keyword: keyword.trim() || undefined,
      });
      setRows(res.data?.records || []);
      setTotal(res.data?.total || 0);
      setPageNo(page);
      setPageSize(size);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onHandled = async (id: number) => {
    await markWebsiteInquiryHandled(id);
    message.success('已标记为已处理');
    void load(pageNo, pageSize);
  };

  const columns: ColumnsType<WebsiteInquiryItem> = [
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (v) => v || '-',
    },
    {
      title: '联系人',
      dataIndex: 'contactName',
      width: 100,
    },
    {
      title: '电话',
      dataIndex: 'phone',
      width: 130,
    },
    {
      title: '单位',
      dataIndex: 'company',
      width: 140,
      ellipsis: true,
      render: (v) => v || '-',
    },
    {
      title: '类型',
      dataIndex: 'category',
      width: 110,
      render: (v: string) => CATEGORY_LABEL[v] || v,
    },
    {
      title: '询价内容',
      dataIndex: 'content',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v: string) =>
        v === 'HANDLED' ? <Tag color="green">已处理</Tag> : <Tag color="blue">待处理</Tag>,
    },
    {
      title: '操作',
      width: 110,
      fixed: isMobile ? undefined : 'right',
      render: (_, row) =>
        row.status === 'HANDLED' ? (
          '-'
        ) : (
          <Button type="link" size="small" onClick={() => void onHandled(row.id)}>
            标记已处理
          </Button>
        ),
    },
  ];

  return (
    <div>
      <PageHeaderBar title="官网询价" />
      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="状态"
          style={{ width: 120 }}
          value={status}
          onChange={setStatus}
          options={[
            { value: 'NEW', label: '待处理' },
            { value: 'HANDLED', label: '已处理' },
          ]}
        />
        <Input.Search
          allowClear
          placeholder="姓名/电话/单位/内容"
          style={{ width: isMobile ? '100%' : 240 }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={() => void load(1, pageSize)}
        />
        <Button type="primary" onClick={() => void load(1, pageSize)}>
          查询
        </Button>
      </Space>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        scroll={{ x: 1100 }}
        pagination={{
          current: pageNo,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (p, s) => void load(p, s),
        }}
      />
    </div>
  );
}
