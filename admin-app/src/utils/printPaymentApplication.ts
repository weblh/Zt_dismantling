/** 将付款申请记录格式化为可打印的表格 HTML 并调起浏览器打印 */

export interface PrintPaymentDetail {
  serialNo?: number | string;
  vehicleVin?: string;
  overweightDate?: string;
  plateNo?: string;
  vehicleType?: string;
  vehicleModel?: string;
  supplier?: string;
  salesman?: string;
  returnLocation?: string;
  tonnage?: string | number;
  unitPrice?: string | number;
  totalPrice?: string | number;
  remark?: string;
}

export interface PrintPaymentRecord {
  date?: string;
  applicant?: string;
  department?: string;
  details?: PrintPaymentDetail[];
  totalAmount?: string | number;
  totalAmountCapital?: string;
  vehicleCount?: number | string;
  totalTonnage?: string | number;
  paymentAccount?: string;
  paymentMethod?: string;
  payeeName1?: string;
  payeeAccount1?: string;
  bankName1?: string;
  bankAccount1?: string;
  payeeName2?: string;
  payeeAccount2?: string;
  bankName2?: string;
  bankAccount2?: string;
  paymentReason?: string;
  submitter?: string;
  submitTime?: string;
  updateTime?: string;
  processStatus?: string;
  currentNode?: string;
  currentHandler?: string;
}

function esc(v: unknown) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function accountLabel(v?: string) {
  if (v === 'big' || v === '大账户') return '大账户';
  if (v === 'small' || v === '小账户') return '小账户';
  return v || '-';
}

function methodLabel(v?: string) {
  const map: Record<string, string> = { cash: '现金', bank: '电汇', transfer: '承兑' };
  return map[v || ''] || v || '-';
}

function statusLabel(v?: string) {
  if (v === 'completed' || v === '流转完成') return '流转完成';
  return v ? '处理中' : '-';
}

export function printPaymentApplication(record: PrintPaymentRecord) {
  const details = record.details || [];
  const detailRows = details
    .map(
      (d, i) => `
    <tr>
      <td>${esc(d.serialNo ?? i + 1)}</td>
      <td>${esc(d.vehicleVin)}</td>
      <td>${esc(d.overweightDate)}</td>
      <td>${esc(d.plateNo)}</td>
      <td>${esc(d.vehicleType)}</td>
      <td>${esc(d.vehicleModel)}</td>
      <td>${esc(d.supplier)}</td>
      <td>${esc(d.salesman)}</td>
      <td>${esc(d.returnLocation)}</td>
      <td>${esc(d.tonnage)}</td>
      <td>${esc(d.unitPrice)}</td>
      <td>${esc(d.totalPrice)}</td>
      <td>${esc(d.remark)}</td>
    </tr>`,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>业务结账付款申请 - ${esc(record.date)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: "Microsoft YaHei", SimSun, sans-serif; color: #222; margin: 24px; font-size: 13px; }
    h1 { font-size: 20px; text-align: center; margin: 0 0 16px; }
    .meta { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .meta th, .meta td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
    .meta th { background: #f5f5f5; width: 120px; font-weight: 600; }
    .details { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
    .details th, .details td { border: 1px solid #333; padding: 4px 6px; text-align: center; }
    .details th { background: #f0f0f0; }
    .section { margin: 12px 0 6px; font-weight: 600; }
    @media print {
      body { margin: 12px; }
      button { display: none !important; }
    }
  </style>
</head>
<body>
  <h1>业务结账付款申请</h1>
  <table class="meta">
    <tr><th>日期</th><td>${esc(record.date)}</td><th>申请人</th><td>${esc(record.applicant)}</td></tr>
    <tr><th>部门</th><td>${esc(record.department)}</td><th>付款事由</th><td>${esc(record.paymentReason)}</td></tr>
    <tr><th>合计金额(小写)</th><td>${esc(record.totalAmount)}</td><th>合计金额(大写)</th><td>${esc(record.totalAmountCapital)}</td></tr>
    <tr><th>车辆数量</th><td>${esc(record.vehicleCount)}</td><th>总吨位</th><td>${esc(record.totalTonnage)}</td></tr>
    <tr><th>付款账户</th><td>${esc(accountLabel(record.paymentAccount))}</td><th>付款方式</th><td>${esc(methodLabel(record.paymentMethod))}</td></tr>
    <tr><th>收款单位1</th><td>${esc(record.payeeName1)}</td><th>收款账号1</th><td>${esc(record.payeeAccount1)}</td></tr>
    <tr><th>开户行1</th><td>${esc(record.bankName1)}</td><th>银行账号1</th><td>${esc(record.bankAccount1)}</td></tr>
    <tr><th>提交人</th><td>${esc(record.submitter)}</td><th>提交时间</th><td>${esc(record.submitTime)}</td></tr>
    <tr><th>更新时间</th><td>${esc(record.updateTime)}</td><th>流程状态</th><td>${esc(statusLabel(record.processStatus))}</td></tr>
    <tr><th>当前节点</th><td>${esc(record.currentNode || '-')}</td><th>当前负责人</th><td>${esc(record.currentHandler || '-')}</td></tr>
  </table>
  <div class="section">付款明细</div>
  <table class="details">
    <thead>
      <tr>
        <th>序号</th><th>编号</th><th>过磅日期</th><th>车牌号</th><th>车辆类型</th><th>车辆型号</th>
        <th>供应商</th><th>业务员</th><th>回车地</th><th>吨位</th><th>单价</th><th>总价</th><th>备注</th>
      </tr>
    </thead>
    <tbody>
      ${detailRows || '<tr><td colspan="13">暂无明细</td></tr>'}
    </tbody>
  </table>
  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'noopener,noreferrer,width=1024,height=768');
  if (!win) {
    throw new Error('无法打开打印窗口，请允许浏览器弹窗');
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
