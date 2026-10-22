import { useMemo, useState } from 'react';
import { Modal, Checkbox, Space, Tag } from 'antd';

interface Props {
  open: boolean;
  onClose: () => void;
  currentNode?: string;
  processStatus?: string;
}

type FlowStatus = 'finish' | 'process' | 'wait';
type FilterKey = 'process' | 'finish' | 'wait';

/**
 * 简道云成品/配件销售审批单流程 V2（截图一致）：
 * 发起 → 销售 → 库管 → 财务 → 副总经理 → 流程结束
 * 抄送从「副总经理」向右旁出
 */
export const FINISHED_PRODUCT_APPROVAL_FLOW = [
  '流程发起节点',
  '销售',
  '库管',
  '财务',
  '副总经理',
  '抄送节点',
  '流程结束',
] as const;

/** 与成品销售审批单相同的真实审批流 */
export const PART_APPROVAL_FLOW = FINISHED_PRODUCT_APPROVAL_FLOW;

function isCompleted(processStatus?: string) {
  const s = (processStatus || '').trim();
  return (
    s === 'completed' ||
    s === '流转完成' ||
    s === '已通过' ||
    s === '已完成' ||
    s === 'finish' ||
    s === '流程结束'
  );
}

function resolveStatus(
  nodeName: string,
  nodeType: string,
  currentNode?: string,
  processStatus?: string,
): FlowStatus {
  if (isCompleted(processStatus)) return 'finish';
  const current = (currentNode || '').trim();
  if (!current || current === '已完成' || current === '-' || current === '流程结束') {
    if (current === '流程结束') return nodeType === 'end' ? 'process' : 'finish';
    return nodeType === 'start' ? 'process' : 'wait';
  }
  if (nodeName === current || current.includes(nodeName) || nodeName.includes(current)) {
    return 'process';
  }
  const order = [...FINISHED_PRODUCT_APPROVAL_FLOW];
  const curIdx = order.findIndex((n) => n === current || current.includes(n) || n.includes(current));
  const myIdx = order.indexOf(nodeName as (typeof FINISHED_PRODUCT_APPROVAL_FLOW)[number]);
  if (nodeType === 'start') return curIdx > 0 || curIdx === -1 ? 'finish' : 'process';
  if (nodeType === 'end') return 'wait';
  if (curIdx >= 0 && myIdx >= 0 && myIdx < curIdx) return 'finish';
  return 'wait';
}

const STROKE: Record<FlowStatus, string> = {
  finish: '#52c41a',
  process: '#1677ff',
  wait: '#d0d5dd',
};

const FILL: Record<FlowStatus, string> = {
  finish: '#f6ffed',
  process: '#e6f4ff',
  wait: '#ffffff',
};

function FlowSvg({
  currentNode,
  processStatus,
  filters,
}: {
  currentNode?: string;
  processStatus?: string;
  filters: FilterKey[];
}) {
  const W = 420;
  const boxW = 150;
  const boxH = 40;
  const gap = 56;
  const startY = 36;
  const mainX = 80;
  const ccX = 260;

  // 主链：销售 → 库管 → 财务 → 副总经理（抄送旁出，不在主链竖排）
  const mainNodes = [
    { key: 'sales', name: '销售', type: 'approve', y: startY + gap },
    { key: 'warehouse', name: '库管', type: 'approve', y: startY + gap * 2 },
    { key: 'finance', name: '财务', type: 'approve', y: startY + gap * 3 },
    { key: 'vice_gm', name: '副总经理', type: 'approve', y: startY + gap * 4 },
  ];

  const viceGm = mainNodes[3];
  const endY = startY + gap * 5.4;
  const line = '#8ec8c0';

  const st = (name: string, type: string) =>
    resolveStatus(name, type, currentNode, processStatus);
  const visible = (s: FlowStatus) => filters.includes(s);

  const startSt = st('流程发起节点', 'start');
  const ccSt = st('抄送节点', 'cc');
  const endSt = isCompleted(processStatus)
    ? 'finish'
    : st('流程结束', 'end') === 'process'
      ? 'process'
      : st('副总经理', 'approve') === 'finish' && ccSt === 'finish'
        ? 'finish'
        : 'wait';

  const arrow = (x1: number, y1: number, x2: number, y2: number, key: string) => (
    <g key={key}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={line} strokeWidth={1.5} markerEnd="url(#fp-arrow)" />
    </g>
  );

  const UserIcon = ({ x, y, color }: { x: number; y: number; color: string }) => (
    <g transform={`translate(${x}, ${y})`}>
      <circle cx={8} cy={6} r={4} fill={color} />
      <path d="M2 18c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="none" stroke={color} strokeWidth={1.6} />
    </g>
  );

  const PlaneIcon = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x}, ${y})`}>
      <path d="M2 10 L18 3 L14 12 L18 16 L2 10 Z" fill="#52c41a" opacity={0.9} />
    </g>
  );

  const RectNode = ({
    x,
    y,
    name,
    status,
    kind,
  }: {
    x: number;
    y: number;
    name: string;
    status: FlowStatus;
    kind: 'approve' | 'cc';
  }) => {
    if (!visible(status)) return null;
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={boxW}
          height={boxH}
          rx={6}
          ry={6}
          fill={FILL[status]}
          stroke={STROKE[status]}
          strokeWidth={status === 'wait' ? 1 : 1.8}
        />
        {kind === 'cc' ? (
          <PlaneIcon x={x + 10} y={y + 12} />
        ) : (
          <UserIcon x={x + 10} y={y + 10} color={status === 'wait' ? '#91caff' : '#1677ff'} />
        )}
        <text
          x={x + 36}
          y={y + 25}
          fontSize={13}
          fill="#333"
          fontFamily="Microsoft YaHei, PingFang SC, sans-serif"
        >
          {name}
        </text>
      </g>
    );
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${endY + 50}`}
      width="100%"
      style={{ maxWidth: W, display: 'block', margin: '0 auto' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <marker
          id="fp-arrow"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill={line} />
        </marker>
      </defs>

      {/* 发起 → 销售 */}
      {arrow(mainX + boxW / 2, startY + 16, mainX + boxW / 2, mainNodes[0].y, 'l-start')}

      {/* 主链竖线：销售 → 库管 → 财务 → 副总经理 */}
      {mainNodes.slice(0, -1).map((n, i) =>
        arrow(mainX + boxW / 2, n.y + boxH, mainX + boxW / 2, mainNodes[i + 1].y, `l-${i}`),
      )}

      {/* 副总经理 → 右侧抄送 */}
      {arrow(mainX + boxW, viceGm.y + boxH / 2, ccX, viceGm.y + boxH / 2, 'l-cc')}

      {/* 副总经理 → 流程结束 */}
      {arrow(mainX + boxW / 2, viceGm.y + boxH, mainX + boxW / 2, endY, 'l-end')}

      {visible(startSt) && (
        <g>
          <circle
            cx={mainX + boxW / 2}
            cy={startY}
            r={16}
            fill={startSt === 'finish' ? '#52c41a' : startSt === 'process' ? '#1677ff' : '#95de64'}
            stroke="#fff"
            strokeWidth={2}
          />
          <circle cx={mainX + boxW / 2} cy={startY} r={7} fill="#fff" opacity={0.35} />
          <text
            x={mainX + boxW / 2 + 28}
            y={startY + 5}
            fontSize={13}
            fill="#333"
            fontFamily="Microsoft YaHei, PingFang SC, sans-serif"
          >
            流程发起节点
          </text>
        </g>
      )}

      {mainNodes.map((n) => (
        <RectNode
          key={n.key}
          x={mainX}
          y={n.y}
          name={n.name}
          status={st(n.name, n.type)}
          kind="approve"
        />
      ))}

      <RectNode x={ccX} y={viceGm.y} name="抄送节点" status={ccSt} kind="cc" />

      {visible(endSt as FlowStatus) && (
        <g>
          <ellipse
            cx={mainX + boxW / 2}
            cy={endY + 18}
            rx={48}
            ry={18}
            fill={endSt === 'finish' ? '#f6ffed' : endSt === 'process' ? '#e6f4ff' : '#f5f5f5'}
            stroke={STROKE[endSt as FlowStatus]}
            strokeWidth={1.5}
          />
          <text
            x={mainX + boxW / 2}
            y={endY + 23}
            textAnchor="middle"
            fontSize={13}
            fill="#666"
            fontFamily="Microsoft YaHei, PingFang SC, sans-serif"
          >
            流程结束
          </text>
        </g>
      )}
    </svg>
  );
}

export default function FinishedProductApprovalProcessModal({
  open,
  onClose,
  currentNode,
  processStatus,
}: Props) {
  const [filters, setFilters] = useState<FilterKey[]>(['process', 'finish', 'wait']);

  const legend = useMemo(
    () => (
      <Space wrap size={16}>
        <Checkbox
          checked={filters.includes('process')}
          onChange={(e) => {
            setFilters((prev) =>
              e.target.checked ? [...prev, 'process'] : prev.filter((k) => k !== 'process'),
            );
          }}
        >
          <Tag color="blue" style={{ marginInlineEnd: 0 }}>处理中</Tag>
        </Checkbox>
        <Checkbox
          checked={filters.includes('finish')}
          onChange={(e) => {
            setFilters((prev) =>
              e.target.checked ? [...prev, 'finish'] : prev.filter((k) => k !== 'finish'),
            );
          }}
        >
          <Tag color="green" style={{ marginInlineEnd: 0 }}>已流转</Tag>
        </Checkbox>
        <Checkbox
          checked={filters.includes('wait')}
          onChange={(e) => {
            setFilters((prev) =>
              e.target.checked ? [...prev, 'wait'] : prev.filter((k) => k !== 'wait'),
            );
          }}
        >
          <Tag style={{ marginInlineEnd: 0 }}>未流转</Tag>
        </Checkbox>
      </Space>
    ),
    [filters],
  );

  return (
    <Modal
      title={
        <Space>
          <span>流程版本</span>
          <Tag color="blue">V2</Tag>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      styles={{ body: { maxHeight: '78vh', overflowY: 'auto', paddingTop: 8 } }}
    >
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>{legend}</div>
      <div
        style={{
          border: '1px solid #f0f0f0',
          borderRadius: 8,
          background: '#fafbfc',
          padding: '12px 8px',
        }}
      >
        <FlowSvg
          currentNode={currentNode}
          processStatus={processStatus}
          filters={filters.length ? filters : ['process', 'finish', 'wait']}
        />
      </div>
    </Modal>
  );
}
