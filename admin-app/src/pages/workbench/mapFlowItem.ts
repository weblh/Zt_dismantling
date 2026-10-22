import {
  FLOW_FORMS,
  isCompletedStatus,
  isProcessingStatus,
  statusDisplay,
  type WorkbenchBizKey,
  type WorkbenchFlowItem,
} from './types';

function str(v: unknown) {
  if (v == null) return '';
  return String(v).trim();
}

function field(label: string, value: unknown) {
  const v = str(value);
  return { label, value: v || '-' };
}

function mapPayment(row: Record<string, unknown>): WorkbenchFlowItem {
  const processStatus = str(row.processStatus) || 'processing';
  const dataId = str(row.dataId);
  const id = dataId || `pay-${row.id}`;
  return {
    id,
    bizKey: 'payment-application',
    formName: '业务结账付款申请',
    dataId: dataId || undefined,
    title: '业务结账付款申请',
    statusLabel: statusDisplay(processStatus, str(row.currentNode)),
    processStatus,
    currentNode: str(row.currentNode),
    currentHandler: str(row.currentHandler),
    submitter: str(row.submitter) || str(row.applicant),
    applicant: str(row.applicant),
    submitTime: str(row.submitTime) || str(row.date) || str(row.updateTime),
    updateTime: str(row.updateTime) || str(row.submitTime),
    fields: [
      field('日期', row.date),
      field('申请人', row.applicant),
      field('部门单选', row.department),
      field('合计金额(小写)', row.totalAmount),
      field('合计金额(大写)', row.totalAmountCapital),
      field('车辆数量', row.vehicleCount),
    ],
    raw: row,
  };
}

function mapSales(row: Record<string, unknown>, bizKey: WorkbenchBizKey, formName: string): WorkbenchFlowItem {
  const processStatus = str(row.processStatus) || 'processing';
  const dataId = str(row.dataId);
  const id = dataId || `${bizKey}-${row.id || row.key}`;
  return {
    id,
    bizKey,
    formName,
    dataId: dataId || undefined,
    title: formName,
    statusLabel: statusDisplay(processStatus, str(row.currentNode)),
    processStatus,
    currentNode: str(row.currentNode),
    currentHandler: str(row.currentHandler),
    submitter: str(row.submitter),
    applicant: str(row.submitter),
    submitTime: str(row.submitTime) || str(row.deliveryDate),
    updateTime: str(row.updateTime) || str(row.submitTime),
    fields: [
      field('编号', row.code),
      field('出货日期', row.deliveryDate),
      field('过磅同步日期', row.syncDate),
      field('车号', row.carNo),
      field('收货单位', row.receiver),
      field('仓库', row.warehouse),
    ],
    raw: row,
  };
}

export function mapWorkbenchRow(bizKey: WorkbenchBizKey, row: Record<string, unknown>): WorkbenchFlowItem {
  if (bizKey === 'payment-application') return mapPayment(row);
  const meta = FLOW_FORMS.find((f) => f.bizKey === bizKey);
  return mapSales(row, bizKey, meta?.formName || bizKey);
}

export function matchesUserName(name: string, userNames: string[]) {
  const n = (name || '').trim();
  if (!n || userNames.length === 0) return false;
  return userNames.some((u) => u && (n === u || n.includes(u) || u.includes(n)));
}

export function filterByTab(
  items: WorkbenchFlowItem[],
  tab: 'todo' | 'initiated' | 'processed' | 'cc',
  userNames: string[],
) {
  if (tab === 'todo') {
    return items.filter((it) => {
      if (!isProcessingStatus(it.processStatus)) return false;
      if (!it.currentHandler) return true;
      return matchesUserName(it.currentHandler, userNames) || userNames.length === 0;
    });
  }
  if (tab === 'initiated') {
    if (userNames.length === 0) return items;
    return items.filter(
      (it) => matchesUserName(it.submitter, userNames) || matchesUserName(it.applicant, userNames),
    );
  }
  if (tab === 'processed') {
    return items.filter((it) => {
      const done = isCompletedStatus(it.processStatus) || !isProcessingStatus(it.processStatus);
      if (!done) return false;
      // 我处理过：当前负责人/提交人匹配，或暂无用户信息时展示全部已结束
      if (userNames.length === 0) return true;
      return (
        matchesUserName(it.currentHandler, userNames) ||
        matchesUserName(it.submitter, userNames) ||
        matchesUserName(it.applicant, userNames)
      );
    });
  }
  // cc：已完成单据作为可查阅抄送（本系统无独立抄送表）
  return items.filter((it) => isCompletedStatus(it.processStatus));
}
