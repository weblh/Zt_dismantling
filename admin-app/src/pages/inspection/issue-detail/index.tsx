import { useState } from 'react';
import { Table, DatePicker, Select, Input, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { FilterOutlined, SearchOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;

interface IssueItem {
  key: number;
  location: string;
  executor: string;
  issue: string;
  description: string;
  photos: number;
  handler: string;
  handled: boolean;
  taskType: string;
  business: string;
  risk: string;
  handlePhotos: number;
  standard: string;
}

const mockData: IssueItem[] = [
  { key: 1, location: '华成晟碳综合拆解区', executor: '高旭光', issue: '挖机爪子上方轴承漏油', description: '挖机爪子轴承出现裂纹，导致漏油', photos: 3, handler: '刘雪', handled: true, taskType: '安环类', business: '直接作业', risk: '低风险', handlePhotos: 1, standard: '红牌整改' },
  { key: 2, location: '华成晟碳综合拆解区', executor: '冯建法', issue: '电机皮带盘故障维修', description: '未按期完成', photos: 2, handler: '王真杰', handled: true, taskType: '安环类', business: '直接作业', risk: '低风险', handlePhotos: 1, standard: '红牌整改' },
  { key: 3, location: '华晟能源基础区', executor: '霍建鑫', issue: '大挖机舱门关项维修', description: '大挖机舱门关项需要维修', photos: 3, handler: '覃宜良', handled: true, taskType: '安环类', business: '直接作业', risk: '低风险', handlePhotos: 1, standard: '红牌整改' },
  { key: 4, location: '华成晟碳综合拆解区', executor: '蔡鑫磊', issue: '轮胎螺栓松动', description: '轮胎螺栓松动，需要紧固', photos: 3, handler: '张武庭', handled: true, taskType: '安环类', business: '直接作业', risk: '低风险', handlePhotos: 1, standard: '红牌整改' },
  { key: 5, location: '华晟能源塑料区', executor: '覃宜良', issue: '打包机输送带不灵活', description: '打包机输送带不灵活', photos: 3, handler: '张福成', handled: true, taskType: '安环类', business: '直接作业', risk: '低风险', handlePhotos: 1, standard: '红牌整改' },
  { key: 6, location: '华晟能源塑料区', executor: '覃宜良', issue: '提升机、黄油注油堵塞', description: '提升机、黄油注油堵塞，需要路口', photos: 3, handler: '张福成', handled: true, taskType: '安环类', business: '直接作业', risk: '低风险', handlePhotos: 1, standard: '红牌整改' },
  { key: 7, location: '华晟能源基础区', executor: '霍建鑫', issue: '1号行车车下掉落有异响，需维修', description: '', photos: 2, handler: '刘雪', handled: true, taskType: '安环类', business: '直接作业', risk: '低风险', handlePhotos: 1, standard: '红牌整改' },
  { key: 8, location: '华晟能源塑料区', executor: '霍建鑫', issue: '提升机无法打油', description: '提升机无法打油', photos: 3, handler: '张福成', handled: true, taskType: '安环类', business: '直接作业', risk: '低风险', handlePhotos: 1, standard: '红牌整改' },
  { key: 9, location: '华晟能源检查区', executor: '霍建鑫', issue: '轴承坏，需更换', description: '轴承坏，需更换', photos: 3, handler: '张福成', handled: true, taskType: '安环类', business: '直接作业', risk: '低风险', handlePhotos: 1, standard: '红牌整改' },
  { key: 10, location: '华晟能源检查区', executor: '霍建鑫', issue: '1号行车不会升降维修', description: '', photos: 3, handler: '张福成', handled: true, taskType: '安环类', business: '直接作业', risk: '低风险', handlePhotos: 1, standard: '红牌整改' },
  { key: 11, location: '华成晟碳综合拆解区', executor: '冯建法', issue: '大挖机舱门异响维修', description: '大挖机舱门异响维修', photos: 3, handler: '张福成', handled: true, taskType: '安环类', business: '直接作业', risk: '低风险', handlePhotos: 1, standard: '红牌整改' },
  { key: 12, location: '华成晟碳综合拆解区', executor: '冯建法', issue: '大挖机门窗需要修理', description: '', photos: 3, handler: '张福成', handled: true, taskType: '安环类', business: '直接作业', risk: '低风险', handlePhotos: 1, standard: '红牌整改' },
  { key: 13, location: '华成晟碳综合拆解区', executor: '冯建法', issue: '门子环需要修理', description: '', photos: 3, handler: '张福成', handled: true, taskType: '安环类', business: '直接作业', risk: '低风险', handlePhotos: 1, standard: '红牌整改' },
  { key: 14, location: '华成晟碳综合拆解区', executor: '冯建法', issue: '大挖机舱门关项维修', description: '', photos: 3, handler: '张福成', handled: true, taskType: '安环类', business: '直接作业', risk: '低风险', handlePhotos: 1, standard: '红牌整改' },
  { key: 15, location: '华晟能源塑料区', executor: '覃宜良', issue: '小挖机玻璃破碎需要更换', description: '小挖机玻璃破碎需要更换', photos: 3, handler: '张福成', handled: true, taskType: '安环类', business: '直接作业', risk: '低风险', handlePhotos: 1, standard: '红牌整改' },
  { key: 16, location: '华晟能源基础区', executor: '覃宜良', issue: '油箱磨损', description: '油箱磨损', photos: 3, handler: '张福成', handled: true, taskType: '安环类', business: '直接作业', risk: '低风险', handlePhotos: 1, standard: '红牌整改' },
  { key: 17, location: '华成晟碳综合拆解区', executor: '霍建鑫', issue: '小挖机缺轮轱需要修理', description: '', photos: 3, handler: '张福成', handled: true, taskType: '安环类', business: '直接作业', risk: '低风险', handlePhotos: 1, standard: '红牌整改' },
];

const PhotoThumb = ({ count, hasPlay }: { count: number; hasPlay?: boolean }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        style={{
          width: 36,
          height: 36,
          borderRadius: 4,
          background: `hsl(${(i * 47 + 200) % 360}, 25%, 45%)`,
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {hasPlay && i === 0 && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.3)',
            color: '#fff',
            fontSize: 10,
          }}>▶</div>
        )}
      </div>
    ))}
  </div>
);

export default function InspectionIssueDetail() {
  const [selectedRange, setSelectedRange] = useState<string>('全部');

  const columns: ColumnsType<IssueItem> = [
    {
      title: '巡检地点',
      dataIndex: 'location',
      width: 160,
      onHeaderCell: () => ({ style: { background: '#1e3a5f', color: '#fff', fontWeight: 600, fontSize: 13, borderRight: '1px solid #2c5282' } }),
      onCell: () => ({ style: { background: '#152a45', color: '#e2e8f0', fontSize: 13, borderBottom: '1px solid #1e3a5f', borderRight: '1px solid #1e3a5f' } }),
    },
    {
      title: '执行人',
      dataIndex: 'executor',
      width: 90,
      onHeaderCell: () => ({ style: { background: '#1e3a5f', color: '#fff', fontWeight: 600, fontSize: 13, borderRight: '1px solid #2c5282' } }),
      onCell: () => ({ style: { background: '#152a45', color: '#e2e8f0', fontSize: 13, borderBottom: '1px solid #1e3a5f', borderRight: '1px solid #1e3a5f' } }),
    },
    {
      title: '问题',
      dataIndex: 'issue',
      width: 170,
      onHeaderCell: () => ({ style: { background: '#1e3a5f', color: '#fff', fontWeight: 600, fontSize: 13, borderRight: '1px solid #2c5282' } }),
      onCell: () => ({ style: { background: '#152a45', color: '#e2e8f0', fontSize: 13, borderBottom: '1px solid #1e3a5f', borderRight: '1px solid #1e3a5f' } }),
    },
    {
      title: '问题描述',
      dataIndex: 'description',
      width: 200,
      onHeaderCell: () => ({ style: { background: '#1e3a5f', color: '#fff', fontWeight: 600, fontSize: 13, borderRight: '1px solid #2c5282' } }),
      onCell: (record) => ({ style: { background: '#152a45', color: '#a0aec0', fontSize: 13, borderBottom: '1px solid #1e3a5f', borderRight: '1px solid #1e3a5f', minHeight: 50 } }),
      render: (text: string) => text || '-',
    },
    {
      title: '图片',
      dataIndex: 'photos',
      width: 140,
      onHeaderCell: () => ({ style: { background: '#1e3a5f', color: '#fff', fontWeight: 600, fontSize: 13, borderRight: '1px solid #2c5282' } }),
      onCell: () => ({ style: { background: '#152a45', borderBottom: '1px solid #1e3a5f', borderRight: '1px solid #1e3a5f' } }),
      render: (count: number) => <PhotoThumb count={count} />,
    },
    {
      title: '处理人',
      dataIndex: 'handler',
      width: 80,
      onHeaderCell: () => ({ style: { background: '#1e3a5f', color: '#fff', fontWeight: 600, fontSize: 13, borderRight: '1px solid #2c5282' } }),
      onCell: () => ({ style: { background: '#152a45', color: '#e2e8f0', fontSize: 13, borderBottom: '1px solid #1e3a5f', borderRight: '1px solid #1e3a5f' } }),
    },
    {
      title: '处理',
      dataIndex: 'handled',
      width: 60,
      onHeaderCell: () => ({ style: { background: '#1e3a5f', color: '#fff', fontWeight: 600, fontSize: 13, borderRight: '1px solid #2c5282' } }),
      onCell: () => ({ style: { background: '#152a45', color: '#e2e8f0', fontSize: 13, borderBottom: '1px solid #1e3a5f', borderRight: '1px solid #1e3a5f', textAlign: 'center' } }),
      render: (handled: boolean) => (
        <span style={{ color: '#e2e8f0', fontSize: 13 }}>{handled ? '是' : '否'}</span>
      ),
    },
    {
      title: '任务类型',
      dataIndex: 'taskType',
      width: 80,
      onHeaderCell: () => ({ style: { background: '#1e3a5f', color: '#fff', fontWeight: 600, fontSize: 13, borderRight: '1px solid #2c5282' } }),
      onCell: () => ({ style: { background: '#152a45', color: '#e2e8f0', fontSize: 13, borderBottom: '1px solid #1e3a5f', borderRight: '1px solid #1e3a5f' } }),
    },
    {
      title: '业务',
      dataIndex: 'business',
      width: 100,
      onHeaderCell: () => ({ style: { background: '#1e3a5f', color: '#fff', fontWeight: 600, fontSize: 13, borderRight: '1px solid #2c5282' } }),
      onCell: () => ({ style: { background: '#152a45', borderBottom: '1px solid #1e3a5f', borderRight: '1px solid #1e3a5f' } }),
      render: (text: string) => (
        <Tag color="green" style={{ margin: 0, borderRadius: 4 }}>{text}</Tag>
      ),
    },
    {
      title: '风险评估',
      dataIndex: 'risk',
      width: 90,
      onHeaderCell: () => ({ style: { background: '#1e3a5f', color: '#fff', fontWeight: 600, fontSize: 13, borderRight: '1px solid #2c5282' } }),
      onCell: () => ({ style: { background: '#152a45', borderBottom: '1px solid #1e3a5f', borderRight: '1px solid #1e3a5f' } }),
      render: (text: string) => (
        <Tag color="blue" style={{ margin: 0, borderRadius: 4 }}>{text}</Tag>
      ),
    },
    {
      title: '处理图片',
      dataIndex: 'handlePhotos',
      width: 70,
      onHeaderCell: () => ({ style: { background: '#1e3a5f', color: '#fff', fontWeight: 600, fontSize: 13, borderRight: '1px solid #2c5282' } }),
      onCell: () => ({ style: { background: '#152a45', borderBottom: '1px solid #1e3a5f', borderRight: '1px solid #1e3a5f' } }),
      render: (count: number, record: IssueItem) => <PhotoThumb count={count} hasPlay={record.key <= 7} />,
    },
    {
      title: '达标',
      dataIndex: 'standard',
      width: 110,
      fixed: 'right',
      onHeaderCell: () => ({ style: { background: '#1e3a5f', color: '#fff', fontWeight: 600, fontSize: 13 } }),
      onCell: () => ({ style: { background: '#152a45', borderBottom: '1px solid #1e3a5f' } }),
      render: (text: string) => (
        <Tag color="red" style={{ margin: 0, borderRadius: 4, fontWeight: 500 }}>{text}</Tag>
      ),
    },
  ];

  return (
    <div className="inspection-dark-theme" style={{ background: '#0f1f35', minHeight: '100%', width: '100%', overflow: 'auto' }}>
      {/* 标题栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'linear-gradient(180deg, #1a3a5c 0%, #0f1f35 100%)',
        borderBottom: '1px solid #1e3a5f',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>巡检问题明细表</span>
          <FilterOutlined style={{ color: '#7a9cc6', fontSize: 16 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <SearchOutlined style={{ color: '#7a9cc6', fontSize: 14 }} />
          <FilterOutlined style={{ color: '#7a9cc6', fontSize: 14 }} />
          <span style={{ color: '#7a9cc6', fontSize: 14 }}>⚙</span>
        </div>
      </div>

      {/* 筛选区域 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: '#0f1f35',
        borderBottom: '1px solid #1e3a5f',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#a0aec0', fontSize: 13 }}>日期筛选</span>
          <RangePicker
            style={{ width: 280 }}
            placeholder={['开始日期', '结束日期']}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#a0aec0', fontSize: 13 }}>选择范围</span>
          <Select
            value={selectedRange}
            onChange={setSelectedRange}
            style={{ width: 140 }}
            options={[
              { value: 'all', label: '全部' },
              { value: 'today', label: '今天' },
              { value: 'week', label: '本周' },
              { value: 'month', label: '本月' },
            ]}
          />
        </div>
      </div>

      {/* 表格标题 */}
      <div style={{
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <div style={{ width: 3, height: 14, background: '#4299e1', borderRadius: 2 }} />
        <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>巡检问题明细表</span>
      </div>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={mockData}
        pagination={{
          total: 205,
          pageSize: 20,
          current: 1,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        scroll={{ x: 1400 }}
        size="middle"
        bordered={false}
        style={{ background: '#0f1f35' }}
        onRow={() => ({ style: { background: '#152a45' } })}
      />
    </div>
  );
}