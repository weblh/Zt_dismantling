import { useCallback, useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Modal,
  message,
} from 'antd';
import {
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';
import {
  getDingtalkEvents,
  getDingtalkEventDetail,
  type DingtalkEvent,
} from '@/api/dingtalk';

export default function DingtalkOaFormDataPage() {
  const isMobile = useIsMobile();
  const [events, setEvents] = useState<DingtalkEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailData, setDetailData] = useState('');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDingtalkEvents({ pageNo, pageSize });
      setEvents(res.data.records);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }, [pageNo, pageSize]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const showDetail = async (id: number) => {
    try {
      const res = await getDingtalkEventDetail(id);
      const data = res.data.eventData;
      try {
        setDetailData(JSON.stringify(JSON.parse(data), null, 2));
      } catch {
        setDetailData(data || '');
      }
      setDetailVisible(true);
    } catch {
      message.error('获取详情失败');
    }
  };

  const columns: ColumnsType<DingtalkEvent> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '事件ID', dataIndex: 'eventId', ellipsis: true, width: 200 },
    { title: '事件类型', dataIndex: 'eventType', width: 180 },
    {
      title: '产生时间',
      dataIndex: 'eventBornTime',
      width: 180,
      render: (val: number) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '接收时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (val: string) => (
        <Tag color={val === 'SUCCESS' ? 'green' : 'red'}>{val}</Tag>
      ),
    },
    {
      title: '操作',
      width: 80,
      render: (_, record) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => showDetail(record.id)}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Card
        title="OA表单数据"
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchEvents}>
            刷新
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={events}
          loading={loading}
          scroll={{ x: 900 }}
          pagination={withMobilePagination(isMobile, {
            current: pageNo,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, size) => {
              setPageNo(page);
              setPageSize(size);
            },
          })}
        />
      </Card>

      <Modal
        title="事件详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={1000}
      >
        <pre className="event-data-pre">{detailData}</pre>
      </Modal>
    </div>
  );
}