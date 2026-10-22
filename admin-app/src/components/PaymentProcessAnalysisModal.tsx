import { useEffect, useMemo, useState } from 'react';
import { Modal, Spin, Checkbox, Space, Tag } from 'antd';
import { getPaymentProcessNodes } from '@/api/paymentApplication';

interface Props {
  open: boolean;
  onClose: () => void;
  currentNode?: string;
  processStatus?: string;
}

type FlowStatus = 'finish' | 'process' | 'wait';

type FilterKey = 'process' | 'finish' | 'wait';

function resolveStatus(
  nodeName: string,
  nodeType: string,
  currentNode?: string,
  processStatus?: string,
  mainOrder: string[] = [],
): FlowStatus {
  if (processStatus === 'completed' || processStatus === '流转完成') return 'finish';
  const current = (currentNode || '').trim();
  if (!current) {
    return nodeType === 'start' ? 'process' : 'wait';
  }
  if (nodeName === current || nodeType === current) return 'process';
  const curIdx = mainOrder.indexOf(current);
  const myIdx = mainOrder.indexOf(nodeName);
  if (nodeType === 'start') return 'finish';
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

/** 简道云风格 SVG 流程图（主链 + 右侧短链 + 底部抄送） */
function PaymentFlowSvg({
  currentNode,
  processStatus,
  filters,
}: {
  currentNode?: string;
  processStatus?: string;
  filters: FilterKey[];
}) {
  const mainOrder = [
    '流程发起节点',
    '财务审核',
    '财务总监',
    '副总经理',
    '总经理',
    '共成总经理',
    '财务上传回执单',
    '抄送节点',
    '流程结束',
  ];

  const st = (name: string, type: string) =>
    resolveStatus(name, type, currentNode, processStatus, mainOrder);

  const visible = (s: FlowStatus) => filters.includes(s);

  // 布局坐标（与简道云 V3 接近）
  const W = 520;
  const H = 780;
  const mainX = 160;
  const boxW = 150;
  const boxH = 40;
  const gap = 56;
  const startY = 36;
  const rightX = 360;
  const leftCcX = 24;

  const mainNodes = [
    { key: 'finance_audit', name: '财务审核', type: 'approve', y: startY + gap },
    { key: 'cfo', name: '财务总监', type: 'approve', y: startY + gap * 2 },
    { key: 'vice_gm', name: '副总经理', type: 'approve', y: startY + gap * 3 },
    { key: 'gm', name: '总经理', type: 'approve', y: startY + gap * 4 },
    { key: 'gc_gm', name: '共成总经理', type: 'approve', y: startY + gap * 5 },
    { key: 'upload', name: '财务上传回执单', type: 'upload', y: startY + gap * 6 },
  ];

  const startCy = startY;
  const endY = startY + gap * 8;
  const rightAuditY = startY + gap;
  const rightCcY = startY + gap * 2.2;
  const leftCcY = startY + gap * 7;

  const startSt = st('流程发起节点', 'start');
  const endSt = st('流程结束', 'end');
  const rightAuditSt = st('财务审核', 'approve');
  const rightCcSt = st('抄送节点', 'cc');
  const leftCcSt = st('抄送节点', 'cc');

  const line = '#8ec8c0';
  const arrow = (x1: number, y1: number, x2: number, y2: number, key: string) => (
    <g key={key}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={line} strokeWidth={1.5} markerEnd="url(#arrow)" />
    </g>
  );

  /** 折线：向下再拐弯 */
  const elbow = (
    points: string,
    key: string,
  ) => (
    <polyline
      key={key}
      points={points}
      fill="none"
      stroke={line}
      strokeWidth={1.5}
      markerEnd="url(#arrow)"
    />
  );

  const UserIcon = ({ x, y, color }: { x: number; y: number; color: string }) => (
    <g transform={`translate(${x}, ${y})`}>
      <circle cx={8} cy={6} r={4} fill={color} />
      <path d="M2 18c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="none" stroke={color} strokeWidth={1.6} />
    </g>
  );

  const PlaneIcon = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x}, ${y})`}>
      <path
        d="M2 10 L18 3 L14 12 L18 16 L2 10 Z"
        fill="#52c41a"
        opacity={0.9}
      />
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
    kind: 'approve' | 'cc' | 'upload';
  }) => {
    if (!visible(status)) return null;
    const stroke = STROKE[status];
    const fill = FILL[status];
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={boxW}
          height={boxH}
          rx={6}
          ry={6}
          fill={fill}
          stroke={stroke}
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
          fontFamily='Microsoft YaHei, PingFang SC, sans-serif'
        >
          {name}
        </text>
      </g>
    );
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ maxWidth: W, display: 'block', margin: '0 auto' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <marker
          id="arrow"
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

      {/* 发起 → 主链第一节点 */}
      {arrow(mainX + boxW / 2, startCy + 18, mainX + boxW / 2, mainNodes[0].y, 'l-start-main')}

      {/* 发起 → 右侧财务审核 */}
      {elbow(
        `${mainX + boxW / 2 + 18},${startCy} ${rightX + boxW / 2},${startCy} ${rightX + boxW / 2},${rightAuditY}`,
        'l-start-right',
      )}

      {/* 主链竖线 */}
      {mainNodes.slice(0, -1).map((n, i) =>
        arrow(
          mainX + boxW / 2,
          n.y + boxH,
          mainX + boxW / 2,
          mainNodes[i + 1].y,
          `l-main-${i}`,
        ),
      )}

      {/* 右侧：财务审核 → 抄送 */}
      {arrow(rightX + boxW / 2, rightAuditY + boxH, rightX + boxW / 2, rightCcY, 'l-right-cc')}

      {/* 右侧抄送 → 流程结束 */}
      {elbow(
        `${rightX + boxW / 2},${rightCcY + boxH} ${rightX + boxW / 2},${endY + 18} ${mainX + boxW / 2 + 40},${endY + 18}`,
        'l-right-end',
      )}

      {/* 上传回执 → 结束（主竖线） */}
      {arrow(
        mainX + boxW / 2,
        mainNodes[5].y + boxH,
        mainX + boxW / 2,
        endY,
        'l-upload-end',
      )}

      {/* 主竖线中段分出左侧抄送 */}
      <polyline
        points={`${mainX + boxW / 2},${leftCcY + boxH / 2} ${leftCcX + boxW},${leftCcY + boxH / 2}`}
        fill="none"
        stroke={line}
        strokeWidth={1.5}
        markerEnd="url(#arrow)"
      />

      {/* 左侧抄送回流到结束 */}
      <polyline
        points={`${leftCcX + boxW / 2},${leftCcY + boxH} ${leftCcX + boxW / 2},${endY + 18} ${mainX + boxW / 2 - 50},${endY + 18}`}
        fill="none"
        stroke={line}
        strokeWidth={1.5}
        markerEnd="url(#arrow)"
      />

      {/* 发起节点（绿圆） */}
      {visible(startSt) && (
        <g>
          <circle
            cx={mainX + boxW / 2}
            cy={startCy}
            r={16}
            fill={startSt === 'finish' ? '#52c41a' : startSt === 'process' ? '#1677ff' : '#95de64'}
            stroke="#fff"
            strokeWidth={2}
          />
          <circle cx={mainX + boxW / 2} cy={startCy} r={7} fill="#fff" opacity={0.35} />
          <text
            x={mainX + boxW / 2 + 28}
            y={startCy + 5}
            fontSize={13}
            fill="#333"
            fontFamily='Microsoft YaHei, PingFang SC, sans-serif'
          >
            流程发起节点
          </text>
        </g>
      )}

      {/* 主链审批节点 */}
      {mainNodes.map((n) => (
        <RectNode
          key={n.key}
          x={mainX}
          y={n.y}
          name={n.name}
          status={st(n.name, n.type)}
          kind={n.type === 'upload' ? 'upload' : 'approve'}
        />
      ))}

      {/* 右侧短链 */}
      <RectNode x={rightX} y={rightAuditY} name="财务审核" status={rightAuditSt} kind="approve" />
      <RectNode x={rightX} y={rightCcY} name="抄送节点" status={rightCcSt} kind="cc" />

      {/* 左侧抄送 */}
      <RectNode x={leftCcX} y={leftCcY} name="抄送节点" status={leftCcSt} kind="cc" />

      {/* 结束节点 */}
      {visible(endSt) && (
        <g>
          <ellipse
            cx={mainX + boxW / 2}
            cy={endY + 18}
            rx={48}
            ry={18}
            fill={endSt === 'finish' ? '#f6ffed' : '#f5f5f5'}
            stroke={STROKE[endSt]}
            strokeWidth={1.5}
          />
          <text
            x={mainX + boxW / 2}
            y={endY + 23}
            textAnchor="middle"
            fontSize={13}
            fill="#666"
            fontFamily='Microsoft YaHei, PingFang SC, sans-serif'
          >
            流程结束
          </text>
        </g>
      )}
    </svg>
  );
}

export default function PaymentProcessAnalysisModal({
  open,
  onClose,
  currentNode,
  processStatus,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterKey[]>(['process', 'finish', 'wait']);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // 预热流程节点接口（迁移校验）；SVG 使用固定 V3 拓扑
        await getPaymentProcessNodes();
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

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
          <Tag color="blue">V3</Tag>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      styles={{ body: { maxHeight: '78vh', overflowY: 'auto', paddingTop: 8 } }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin />
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>{legend}</div>
          <div
            style={{
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              background: '#fafbfc',
              padding: '12px 8px',
            }}
          >
            <PaymentFlowSvg
              currentNode={currentNode}
              processStatus={processStatus}
              filters={filters.length ? filters : ['process', 'finish', 'wait']}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
