import { useState } from 'react';
import { Table, Select, Input } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { FilterOutlined, SearchOutlined, ReloadOutlined, SettingOutlined, ColumnHeightOutlined } from '@ant-design/icons';

interface TaskItem {
  key: number;
  company: string;
  executor: string;
  indicator: string;
  checkItem: string;
  status: string;
}

const taskStatusOptions = [
  { value: 'not_inspected', label: '未巡检' },
  { value: 'inspection_pending', label: '巡检待处理' },
  { value: 'inspection_responsible', label: '巡检责任' },
  { value: 'inspected', label: '已巡检' },
  { value: 'hazard_pending', label: '隐患待处理' },
  { value: 'hazard_assessing', label: '隐患待评估' },
  { value: 'hazard_unreported', label: '隐患未提报' },
];

const executorList = [
  { value: 'current', label: '当前用户', color: '#4299e1' },
  { value: 'liu', label: '刘晋', color: '#e53e3e' },
  { value: 'li', label: '李鹏', color: '#38a169' },
  { value: 'zhang', label: '张爱嘉', color: '#805ad5' },
  { value: 'huo', label: '霍鑫鑫', color: '#d69e2e' },
  { value: 'qi', label: '齐志江', color: '#3182ce' },
  { value: 'wang1', label: '王亚涛', color: '#48bb78' },
  { value: 'wang2', label: '王国强', color: '#f56565' },
  { value: 'wang3', label: '王子璇', color: '#9f7aea' },
  { value: 'gao', label: '高建彪', color: '#ed8936' },
  { value: 'zhang2', label: '张斌斌', color: '#e53e3e' },
  { value: 'yang', label: '杨耀华', color: '#38a169' },
  { value: 'wang4', label: '王真杰', color: '#3182ce' },
];

const summaryCards = [
  { key: 'inspected', label: '已巡检', count: 0, color: '#4ade80' },
  { key: 'not_inspected', label: '未巡检', count: 0, color: '#f87171' },
  { key: 'inspection_pending', label: '巡检待处理', count: 0, color: '#fbbf24' },
  { key: 'inspection_responsible', label: '巡检责任', count: 0, color: '#a78bfa' },
];

const mockData: TaskItem[] = [];

export default function InspectionTaskTrack() {
  const [company, setCompany] = useState<string>('all');
  const [executor, setExecutor] = useState<string[]>([]);
  const [executorSearch, setExecutorSearch] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [statusSearch, setStatusSearch] = useState<string>('');

  const filteredStatusOptions = statusSearch
    ? taskStatusOptions.filter(o => o.label.includes(statusSearch))
    : taskStatusOptions;

  const filteredExecutorList = executorSearch
    ? executorList.filter(o => o.label.includes(executorSearch))
    : executorList;

  const toggleExecutor = (val: string) => {
    setExecutor(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

  const filterSelectStyle: React.CSSProperties = {
    width: 100,
    background: '#0f1f35',
    borderColor: '#2c5282',
    color: '#e2e8f0',
  };

  const columns: ColumnsType<TaskItem> = [
    {
      title: '产权公司',
      dataIndex: 'company',
      width: 160,
      onHeaderCell: () => ({ style: { background: '#1e3a5f', color: '#fff', fontWeight: 600, fontSize: 13, borderRight: '1px solid #2c5282' } }),
      onCell: () => ({ style: { background: '#152a45', color: '#e2e8f0', fontSize: 13, borderBottom: '1px solid #1e3a5f', borderRight: '1px solid #1e3a5f' } }),
    },
    {
      title: '执行人',
      dataIndex: 'executor',
      width: 120,
      onHeaderCell: () => ({ style: { background: '#1e3a5f', color: '#fff', fontWeight: 600, fontSize: 13, borderRight: '1px solid #2c5282' } }),
      onCell: () => ({ style: { background: '#152a45', color: '#e2e8f0', fontSize: 13, borderBottom: '1px solid #1e3a5f', borderRight: '1px solid #1e3a5f' } }),
    },
    {
      title: '指标',
      dataIndex: 'indicator',
      width: 120,
      onHeaderCell: () => ({ style: { background: '#1e3a5f', color: '#fff', fontWeight: 600, fontSize: 13, borderRight: '1px solid #2c5282' } }),
      onCell: () => ({ style: { background: '#152a45', color: '#e2e8f0', fontSize: 13, borderBottom: '1px solid #1e3a5f', borderRight: '1px solid #1e3a5f' } }),
    },
    {
      title: '检查项',
      dataIndex: 'checkItem',
      width: 160,
      onHeaderCell: () => ({ style: { background: '#1e3a5f', color: '#fff', fontWeight: 600, fontSize: 13, borderRight: '1px solid #2c5282' } }),
      onCell: () => ({ style: { background: '#152a45', color: '#e2e8f0', fontSize: 13, borderBottom: '1px solid #1e3a5f', borderRight: '1px solid #1e3a5f' } }),
    },
    {
      title: '任务状态',
      dataIndex: 'status',
      width: 140,
      onHeaderCell: () => ({ style: { background: '#1e3a5f', color: '#fff', fontWeight: 600, fontSize: 13 } }),
      onCell: () => ({ style: { background: '#152a45', color: '#e2e8f0', fontSize: 13, borderBottom: '1px solid #1e3a5f' } }),
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
          <span style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>任务跟踪</span>
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
        gap: 12,
        padding: '12px 16px',
        background: '#0f1f35',
        borderBottom: '1px solid #1e3a5f',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#e2e8f0', fontSize: 13, whiteSpace: 'nowrap' }}>产权公司</span>
          <Select
            value={company}
            onChange={setCompany}
            style={filterSelectStyle}
            dropdownStyle={{ background: '#1a3a5c', borderColor: '#2c5282' }}
            options={[{ value: 'all', label: '全部' }]}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#e2e8f0', fontSize: 13, whiteSpace: 'nowrap' }}>执行人</span>
          <Select
            mode="multiple"
            value={executor}
            onChange={setExecutor}
            style={{ ...filterSelectStyle, width: 160 }}
            dropdownStyle={{ background: '#1a3a5c', borderColor: '#2c5282', minWidth: 220, width: 'auto', padding: 0 }}
            placeholder="全部"
            maxTagCount="responsive"
            dropdownRender={() => (
              <div>
                <div style={{ padding: '8px 12px 4px', borderBottom: '1px solid #2c5282' }}>
                  <Input
                    prefix={<SearchOutlined style={{ color: '#7a9cc6' }} />}
                    placeholder="搜索(多个关键词用空格隔开)"
                    value={executorSearch}
                    onChange={(e) => setExecutorSearch(e.target.value)}
                    style={{
                      background: '#0f1f35',
                      borderColor: '#2c5282',
                      color: '#e2e8f0',
                    }}
                  />
                </div>
                <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                  {filteredExecutorList.map((item) => {
                    const checked = executor.includes(item.value);
                    return (
                      <div
                        key={item.value}
                        onClick={() => toggleExecutor(item.value)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 12px',
                          cursor: 'pointer',
                          background: checked ? '#2c5282' : 'transparent',
                          color: '#e2e8f0',
                          fontSize: 13,
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => { if (!checked) (e.currentTarget.style.background = '#1e3a5f'); }}
                        onMouseLeave={(e) => { if (!checked) (e.currentTarget.style.background = 'transparent'); }}
                      >
                        <div style={{
                          width: 16,
                          height: 16,
                          border: checked ? 'none' : '1px solid #4a5568',
                          borderRadius: 3,
                          background: checked ? '#4299e1' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {checked && <span style={{ color: '#fff', fontSize: 10, lineHeight: 1 }}>✓</span>}
                        </div>
                        <div style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: item.color,
                          color: '#fff',
                          fontSize: 11,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {item.label.charAt(0)}
                        </div>
                        <span>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            optionLabelProp="label"
            options={executorList.map(e => ({ value: e.value, label: e.label }))}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#e2e8f0', fontSize: 13, whiteSpace: 'nowrap' }}>任务状态</span>
          <Select
            value={status || undefined}
            onChange={(val) => { setStatus(val); setStatusSearch(''); }}
            style={{ ...filterSelectStyle, width: 140 }}
            dropdownStyle={{ background: '#1a3a5c', borderColor: '#2c5282', minWidth: 180, width: 'auto', padding: 0 }}
            placeholder="请选择"
            options={filteredStatusOptions}
            dropdownRender={(menu) => (
              <div>
                <div style={{ padding: '8px 12px 4px', borderBottom: '1px solid #2c5282' }}>
                  <Input
                    prefix={<SearchOutlined style={{ color: '#7a9cc6' }} />}
                    placeholder="搜索"
                    value={statusSearch}
                    onChange={(e) => setStatusSearch(e.target.value)}
                    style={{
                      background: '#0f1f35',
                      borderColor: '#2c5282',
                      color: '#e2e8f0',
                    }}
                  />
                </div>
                {menu}
              </div>
            )}
          />
        </div>
      </div>

      {/* 统计卡片 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
        padding: '12px 16px',
      }}>
        {summaryCards.map((card) => (
          <div
            key={card.key}
            style={{
              background: 'linear-gradient(135deg, #1a3a5c 0%, #0f1f35 100%)',
              border: '1px solid #2c5282',
              borderRadius: 8,
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${card.color}40 0%, ${card.color}20 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${card.color}60`,
              flexShrink: 0,
            }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: card.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.9,
              }}>
                <span style={{ color: '#fff', fontSize: 14 }}>
                  {card.key === 'inspected' ? '✓' : card.key === 'not_inspected' ? '!' : card.key === 'inspection_pending' ? '⏱' : '◉'}
                </span>
              </div>
            </div>
            <div>
              <div style={{ color: '#a0aec0', fontSize: 12, marginBottom: 2 }}>{card.label}</div>
              <div style={{ color: card.color, fontSize: 24, fontWeight: 700, lineHeight: 1 }}>{card.count}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 表格标题 */}
      <div style={{
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 3, height: 14, background: '#4299e1', borderRadius: 2 }} />
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>明细数据</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <ReloadOutlined style={{ color: '#7a9cc6', fontSize: 14 }} />
          <SettingOutlined style={{ color: '#7a9cc6', fontSize: 14 }} />
          <ColumnHeightOutlined style={{ color: '#7a9cc6', fontSize: 14 }} />
        </div>
      </div>

      {/* 表格 */}
      <div style={{ background: '#0f1f35', padding: '0 16px 16px' }}>
        <Table
          columns={columns}
          dataSource={mockData}
          pagination={{
            total: 0,
            pageSize: 20,
            current: 1,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          scroll={{ x: 800 }}
          size="middle"
          bordered={false}
          style={{ background: '#0f1f35' }}
          onRow={() => ({ style: { background: '#152a45' } })}
          locale={{ emptyText: <div style={{ color: '#7a9cc6', padding: '60px 0', background: '#0f1f35' }}>暂无数据</div> }}
        />
      </div>
    </div>
  );
}