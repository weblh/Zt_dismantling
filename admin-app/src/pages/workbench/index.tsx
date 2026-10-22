import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquareOutlined,
  ClockCircleOutlined,
  FolderOpenOutlined,
  PlayCircleOutlined,
  SendOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { Spin, message } from 'antd';
import { useWorkbenchFlows } from './useWorkbenchFlows';
import type { FlowTabKey } from './types';
import './workbench.css';

const ACTIONS: {
  key: FlowTabKey;
  label: string;
  icon: ReactNode;
  tone: string;
  showDot?: boolean;
}[] = [
  { key: 'initiated', label: '我发起的', icon: <PlayCircleOutlined />, tone: 'blue' },
  { key: 'processed', label: '我处理的', icon: <CheckSquareOutlined />, tone: 'cyan' },
  { key: 'cc', label: '抄送我的', icon: <ShareAltOutlined />, tone: 'sky', showDot: true },
  { key: 'launch', label: '发起流程', icon: <SendOutlined />, tone: 'indigo' },
  { key: 'delegate', label: '待办委托', icon: <FolderOpenOutlined />, tone: 'teal' },
];

export default function Workbench() {
  const navigate = useNavigate();
  const { counts, loading } = useWorkbenchFlows();

  const goFlow = (tab: FlowTabKey) => {
    if (tab === 'delegate') {
      message.info('待办委托功能即将开放');
      return;
    }
    navigate(`/workbench/flow?tab=${tab}`, { state: { tabTitle: '流程中心' } });
  };

  return (
    <div className="wb-hub">
      <div className="wb-hub-title">工作台</div>
      <Spin spinning={loading}>
        <div className="wb-entry-bar">
          <div className="wb-todo-card" onClick={() => goFlow('todo')} role="button" tabIndex={0}>
            <div className="wb-todo-icon">
              <ClockCircleOutlined />
            </div>
            <div>
              <div className="wb-todo-label">我的待办</div>
              <div className="wb-todo-count">{counts.todo}</div>
            </div>
          </div>
          <div className="wb-actions">
            {ACTIONS.map((a) => (
              <button key={a.key} type="button" className="wb-action" onClick={() => goFlow(a.key)}>
                <span className={`wb-action-icon ${a.tone}`}>
                  {a.icon}
                  {a.showDot && counts.cc > 0 ? <span className="wb-action-dot" /> : null}
                </span>
                <span className="wb-action-label">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Spin>
      <p className="wb-hub-hint">
        点击「我的待办」进入流程中心，可查看审批详情，或直接发起业务结账付款申请、成品/配件销售审批等流程。
      </p>
    </div>
  );
}
