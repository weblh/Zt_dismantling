import { useCallback, useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Form,
  Input,
  Tag,
  Modal,
  Select,
  Space,
  Upload,
  message,
  Tabs,
  DatePicker,
  Tooltip,
  Descriptions,
} from 'antd';
import {
  ReloadOutlined,
  SearchOutlined,
  CloudUploadOutlined,
  UploadOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';
import {
  getBankStatementItems,
  importBankStatement,
  clearBankStatementImported,
  classifyBankStatement,
  batchClassifyBankStatement,
  checkBankStatementKingdeeExists,
  pushBankStatementToKingdee,
  batchPushBankStatementToKingdee,
  VOUCHER_TYPE_OPTIONS,
  type BankStatementItem,
  type BankStatementKingdeeExistItem,
  type BankSource,
  type BankVoucherType,
} from '@/api/bank-statement';
import { useIsMobile } from '@/hooks/useIsMobile';

interface SearchForm {
  counterpartyName?: string;
  voucherType?: string;
  pushStatus?: string;
  tradeDateRange?: [dayjs.Dayjs, dayjs.Dayjs];
}

const bankSourceLabel = (source?: string) => {
  if (source === 'ICBC') return '工商银行';
  if (source === 'JINSHANG') return '晋商银行';
  return source || '-';
};

const voucherTypeLabel = (type?: string) =>
  VOUCHER_TYPE_OPTIONS.find((item) => item.value === type)?.label || type || '-';

const isKingdeePushed = (record: BankStatementItem) =>
  Boolean(record.kingdeeVoucherId) || record.kingdeeExistStatus === 1;

export default function BankStatementPage() {
  const isMobile = useIsMobile();
  const [items, setItems] = useState<BankStatementItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [bankSource, setBankSource] = useState<BankSource | 'ALL'>('ALL');
  const [searchParams, setSearchParams] = useState<SearchForm>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [pushLoadingId, setPushLoadingId] = useState<number | null>(null);
  const [batchPushLoading, setBatchPushLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importBankSource, setImportBankSource] = useState<BankSource>('ICBC');
  const [importVisible, setImportVisible] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [classifyVisible, setClassifyVisible] = useState(false);
  const [classifyTargetIds, setClassifyTargetIds] = useState<number[]>([]);
  const [classifyLoading, setClassifyLoading] = useState(false);
  const [existVisible, setExistVisible] = useState(false);
  const [existItems, setExistItems] = useState<BankStatementKingdeeExistItem[]>([]);
  const [existLoading, setExistLoading] = useState(false);
  const [existSummary, setExistSummary] = useState<string[]>([]);
  const [detail, setDetail] = useState<BankStatementItem | null>(null);
  const [form] = Form.useForm<SearchForm>();
  const [classifyForm] = Form.useForm<{
    voucherType: BankVoucherType;
    employeeName?: string;
    payeeOverride?: string;
    targetBankName?: string;
  }>();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const range = searchParams.tradeDateRange;
      const res = await getBankStatementItems({
        pageNo,
        pageSize,
        bankSource: bankSource === 'ALL' ? undefined : bankSource,
        onlyOut: true,
        counterpartyName: searchParams.counterpartyName,
        voucherType: searchParams.voucherType,
        pushStatus: searchParams.pushStatus,
        tradeDateStart: range?.[0]?.format('YYYY-MM-DD'),
        tradeDateEnd: range?.[1]?.format('YYYY-MM-DD'),
      });
      setItems(res.data.records);
      setTotal(res.data.total);
    } catch {
      message.error('加载银行流水失败');
    } finally {
      setLoading(false);
    }
  }, [pageNo, pageSize, bankSource, searchParams]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSearch = async () => {
    const values = await form.validateFields();
    setPageNo(1);
    setSearchParams(values);
  };

  const handleReset = () => {
    form.resetFields();
    setPageNo(1);
    setSearchParams({});
  };

  const openClassify = (ids: number[], seed?: BankStatementItem) => {
    setClassifyTargetIds(ids);
    classifyForm.setFieldsValue({
      voucherType: (seed?.voucherType || seed?.suggestedVoucherType || undefined) as BankVoucherType | undefined,
      employeeName: seed?.employeeName || seed?.suggestedEmployeeName || seed?.counterpartyName,
      payeeOverride: seed?.payeeOverride || seed?.counterpartyName,
      targetBankName: seed?.targetBankName,
    });
    setClassifyVisible(true);
  };

  const submitClassify = async () => {
    const values = await classifyForm.validateFields();
    setClassifyLoading(true);
    try {
      if (classifyTargetIds.length === 1) {
        await classifyBankStatement(classifyTargetIds[0], values);
      } else {
        await batchClassifyBankStatement({ ids: classifyTargetIds, ...values });
      }
      message.success('类型已保存，并已写入学习规则');
      setClassifyVisible(false);
      setSelectedRowKeys([]);
      fetchItems();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '保存类型失败');
    } finally {
      setClassifyLoading(false);
    }
  };

  const handleImport = async () => {
    const file = fileList[0]?.originFileObj;
    if (!file) {
      message.warning('请选择 Excel 文件');
      return;
    }
    setImportLoading(true);
    try {
      const res = await importBankStatement(file, importBankSource);
      message.success(
        `导入完成：新增 ${res.data.imported}，重复跳过 ${res.data.skippedDuplicate}，无效 ${res.data.skippedInvalid}（识别为${bankSourceLabel(res.data.bankSource)}）`,
      );
      setImportVisible(false);
      setFileList([]);
      setBankSource(res.data.bankSource);
      setPageNo(1);
      fetchItems();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '导入失败');
    } finally {
      setImportLoading(false);
    }
  };

  const canPush = (record: BankStatementItem) =>
    (record.direction === 'OUT' || record.voucherType === 'PART_INCOME') &&
    record.amount != null &&
    Number(record.amount) > 0 &&
    Boolean(record.voucherType) &&
    !isKingdeePushed(record);

  const handlePush = async (id: number) => {
    setPushLoadingId(id);
    try {
      const res = await pushBankStatementToKingdee(id);
      message.success(
        `写入成功：${res.data.voucherGroup || '银'}${res.data.voucherNumber || res.data.voucherId}`,
      );
      fetchItems();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '写入金蝶失败');
      fetchItems();
    } finally {
      setPushLoadingId(null);
    }
  };

  const handleBatchPush = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择流水');
      return;
    }
    const selected = items.filter((item) => selectedRowKeys.includes(item.id));
    const sources = new Set(selected.map((item) => item.bankSource));
    if (sources.size > 1) {
      message.warning('工商与晋商请分开批量写入');
      return;
    }
    const dates = new Set(
      selected
        .map((item) => (item.tradeTime ? dayjs(item.tradeTime).format('YYYY-MM-DD') : ''))
        .filter(Boolean),
    );
    if (dates.size > 1) {
      message.warning('批量写入要求交易日期相同');
      return;
    }
    const hasResidual = selected.some((item) => item.voucherType === 'RESIDUAL_FEE');
    const hasOther = selected.some((item) => item.voucherType !== 'RESIDUAL_FEE');
    if (hasResidual && hasOther) {
      message.warning('残值费记转字凭证，请与银字业务分开写入');
      return;
    }
    setBatchPushLoading(true);
    try {
      const res = await batchPushBankStatementToKingdee(selectedRowKeys);
      message.success(
        `批量写入成功：${res.data.itemCount || selectedRowKeys.length} 条，${res.data.voucherGroup || '银'}${res.data.voucherNumber || res.data.voucherId}`,
      );
      setSelectedRowKeys([]);
      fetchItems();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '批量写入失败');
      fetchItems();
    } finally {
      setBatchPushLoading(false);
    }
  };

  const openKingdeeExistCheck = async () => {
    const scopeIds = selectedRowKeys.length > 0 ? selectedRowKeys : items.map((item) => item.id);
    if (scopeIds.length === 0) {
      message.warning('请先导入或查询银行流水');
      return;
    }
    setExistVisible(true);
    setExistLoading(true);
    setExistItems([]);
    setExistSummary([]);
    try {
      const res = await checkBankStatementKingdeeExists({
        ids: scopeIds,
        bankSource: bankSource === 'ALL' ? undefined : bankSource,
      });
      const data = res.data;
      setExistItems(data?.items || []);
      setExistSummary(
        [
          `合计 ${data?.total ?? 0} 条：金蝶已存在（重复） ${data?.existsCount ?? 0} 条，不存在（不重复） ${data?.notExistsCount ?? 0} 条`,
          data?.uncheckedCount ? `未检查 ${data.uncheckedCount} 条` : '',
          data?.kingdeeEntryCount != null
            ? `本次拉取金蝶分录 ${data.kingdeeEntryCount} 条（仅匹配银行存款1002）`
            : '',
          data?.periodsQueried?.length ? `查询期间：${data.periodsQueried.join('、')}` : '',
          '说明：用途/摘要含「残值费」的支出会自动记为残值费，并按转字查重；其余按银字查重',
          selectedRowKeys.length === 0 ? '未勾选时检查当前页全部流水' : '',
        ].filter(Boolean),
      );
      message.success(
        `检查完成：已存在 ${data?.existsCount ?? 0}，不存在 ${data?.notExistsCount ?? 0}`,
      );
      fetchItems();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '检查金蝶重复失败');
    } finally {
      setExistLoading(false);
    }
  };

  const columns: ColumnsType<BankStatementItem> = [
    {
      title: '银行',
      dataIndex: 'bankSource',
      width: 100,
      render: (v: string) => (
        <Tag color={v === 'ICBC' ? 'blue' : 'purple'}>{bankSourceLabel(v)}</Tag>
      ),
    },
    {
      title: '交易时间',
      dataIndex: 'tradeTime',
      width: 170,
      render: (v?: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '对方单位',
      dataIndex: 'counterpartyName',
      width: 180,
      ellipsis: true,
      render: (v?: string, record?: BankStatementItem) => (
        <Space>
          <span>{v || '-'}</span>
          {record?.duplicateSuspect ? <Tag color="orange">疑似重复</Tag> : null}
        </Space>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 110,
      align: 'right',
      render: (v?: number, record?: BankStatementItem) => {
        if (v == null) return '-';
        const text = Number(v).toFixed(2);
        if (record?.voucherType === 'PART_INCOME' || record?.direction === 'IN') {
          return <span style={{ color: '#389e0d' }}>收 {text}</span>;
        }
        return text;
      },
    },
    {
      title: '用途/摘要',
      width: 180,
      ellipsis: true,
      render: (_, record) => record.purpose || record.summary || record.remark || '-',
    },
    {
      title: '业务类型',
      dataIndex: 'voucherType',
      width: 150,
      render: (v?: string, record?: BankStatementItem) => {
        if (v) return <Tag color="green">{voucherTypeLabel(v)}</Tag>;
        if (record?.suggestedVoucherType) {
          return (
            <Tooltip title="来自历史学习建议，可点「设类型」确认">
              <Tag color="gold">建议:{voucherTypeLabel(record.suggestedVoucherType)}</Tag>
            </Tooltip>
          );
        }
        return <Tag>未分类</Tag>;
      },
    },
    {
      title: '金蝶状态',
      width: 160,
      render: (_, record) => {
        if (record.kingdeeExistStatus === 1) {
          const word = record.kingdeeExistVoucherWord || '银';
          const no = record.kingdeeExistVoucherNo || '';
          return <Tag color="warning">金蝶已有 {word}{no}</Tag>;
        }
        if (record.kingdeeVoucherId) {
          const word = record.voucherType === 'RESIDUAL_FEE' ? '转' : '银';
          return (
            <Tag color="success">
              已写入 {word}
              {record.kingdeeVoucherNo || record.kingdeeVoucherId}
            </Tag>
          );
        }
        if (record.kingdeePushError) {
          return (
            <Tooltip title={record.kingdeePushError}>
              <Tag color="error">写入失败</Tag>
            </Tooltip>
          );
        }
        if (record.kingdeeExistStatus === 2) {
          return <Tag color="processing">金蝶未有</Tag>;
        }
        return <Tag>未写入</Tag>;
      },
    },
    {
      title: '操作',
      width: 300,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button type="link" size="small" onClick={() => setDetail(record)}>
            详情
          </Button>
          <Button
            type="link"
            size="small"
            disabled={isKingdeePushed(record)}
            onClick={() => openClassify([record.id], record)}
          >
            设类型
          </Button>
          {!record.voucherType && record.suggestedVoucherType && !isKingdeePushed(record) ? (
            <Button
              type="link"
              size="small"
              onClick={async () => {
                try {
                  await classifyBankStatement(record.id, {
                    voucherType: record.suggestedVoucherType as string,
                    employeeName: record.employeeName || record.suggestedEmployeeName,
                    payeeOverride: record.payeeOverride || record.counterpartyName,
                    targetBankName: record.targetBankName,
                  });
                  message.success('已采纳学习建议');
                  fetchItems();
                } catch {
                  // interceptor already toasts
                }
              }}
            >
              采纳建议
            </Button>
          ) : null}
          <Button
            type="link"
            size="small"
            disabled={!canPush(record)}
            loading={pushLoadingId === record.id}
            onClick={() => handlePush(record.id)}
          >
            写入金蝶
          </Button>
        </Space>
      ),
    },
  ];

  const watchedType = Form.useWatch('voucherType', classifyForm);

  return (
    <div className="page-container">
      <Card>
        <Tabs
          activeKey={bankSource}
          onChange={(key) => {
            setBankSource(key as BankSource | 'ALL');
            setPageNo(1);
            setSelectedRowKeys([]);
          }}
          items={[
            { key: 'ALL', label: '全部' },
            { key: 'ICBC', label: '工商银行' },
            { key: 'JINSHANG', label: '晋商银行' },
          ]}
        />

        <Form
          form={form}
          layout={isMobile ? 'vertical' : 'inline'}
          style={{ marginBottom: 16, rowGap: 12 }}
        >
          <Form.Item name="counterpartyName" label="对方单位">
            <Input allowClear placeholder="对方单位" style={{ width: isMobile ? '100%' : 160 }} />
          </Form.Item>
          <Form.Item name="voucherType" label="类型">
            <Select
              allowClear
              placeholder="业务类型"
              style={{ width: isMobile ? '100%' : 160 }}
              options={VOUCHER_TYPE_OPTIONS}
            />
          </Form.Item>
          <Form.Item name="pushStatus" label="状态">
            <Select
              allowClear
              placeholder="推送/分类"
              style={{ width: isMobile ? '100%' : 140 }}
              options={[
                { label: '未分类', value: 'unclassified' },
                { label: '已分类', value: 'classified' },
                { label: '未写入', value: 'unpushed' },
                { label: '已写入', value: 'pushed' },
                { label: '写入失败', value: 'error' },
              ]}
            />
          </Form.Item>
          <Form.Item name="tradeDateRange" label="交易日期">
            <DatePicker.RangePicker style={{ width: isMobile ? '100%' : undefined }} />
          </Form.Item>
          <Form.Item>
            <Space wrap>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                查询
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>

        <Space wrap style={{ width: '100%', marginBottom: 12 }}>
          <Button type="primary" icon={<UploadOutlined />} onClick={() => setImportVisible(true)}>
            导入流水
          </Button>
          <Button
            danger
            onClick={() => {
              Modal.confirm({
                title: '清空已导入银行流水？',
                content: '将删除本页全部导入记录，便于按正确文件重导。不可恢复。',
                okText: '清空',
                okButtonProps: { danger: true },
                onOk: async () => {
                  const res = await clearBankStatementImported();
                  message.success(`已清空 ${res.data.deleted ?? 0} 条`);
                  setSelectedRowKeys([]);
                  fetchItems();
                },
              });
            }}
          >
            清空导入
          </Button>
          <Button
            disabled={selectedRowKeys.length === 0}
            onClick={() => {
              const seed = items.find((item) => item.id === selectedRowKeys[0]);
              openClassify(selectedRowKeys, seed);
            }}
          >
            批量设类型
          </Button>
          <Button
            type="primary"
            icon={<CloudUploadOutlined />}
            disabled={selectedRowKeys.length === 0}
            loading={batchPushLoading}
            onClick={handleBatchPush}
          >
            {isMobile ? '批量写入' : '批量写入金蝶'}
          </Button>
          <Button icon={<CopyOutlined />} loading={existLoading} onClick={openKingdeeExistCheck}>
            {isMobile ? '检查重复' : '检查金蝶重复'}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchItems}>
            刷新
          </Button>
        </Space>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={items}
          size={isMobile ? 'small' : 'middle'}
          scroll={{ x: 1200 }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as number[]),
            getCheckboxProps: (record) => ({
              disabled: isKingdeePushed(record),
            }),
          }}
          pagination={{
            current: pageNo,
            pageSize,
            total,
            size: isMobile ? 'small' : 'middle',
            simple: isMobile,
            showSizeChanger: !isMobile,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, size) => {
              setPageNo(page);
              setPageSize(size);
            },
          }}
        />
      </Card>

      <Modal
        title="导入银行流水"
        open={importVisible}
        onCancel={() => setImportVisible(false)}
        onOk={handleImport}
        confirmLoading={importLoading}
        destroyOnClose
      >
        <Form layout="vertical">
          <Form.Item label="银行" required>
            <Select
              value={importBankSource}
              onChange={setImportBankSource}
              options={[
                { label: '工商银行', value: 'ICBC' },
                { label: '晋商银行', value: 'JINSHANG' },
              ]}
            />
          </Form.Item>
          <Form.Item
            label="Excel 文件"
            required
            extra="工商：工商*.xlsx / *historydetail*；晋商：晋商*.xlsx / *交易明细*。对方户名含「收单」的收入会自动记为配件收入；用途或摘要含「残值费」的支出会自动记为残值费（转字）。散户台账请到「散户转字号」。"
          >
            <Upload
              beforeUpload={() => false}
              maxCount={1}
              accept=".xlsx,.xls"
              fileList={fileList}
              onChange={({ fileList: next }) => setFileList(next)}
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={classifyTargetIds.length > 1 ? `批量设置类型（${classifyTargetIds.length}）` : '设置业务类型'}
        open={classifyVisible}
        onCancel={() => setClassifyVisible(false)}
        onOk={submitClassify}
        confirmLoading={classifyLoading}
        destroyOnClose
      >
        <Form form={classifyForm} layout="vertical">
          <Form.Item
            name="voucherType"
            label="业务类型"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select options={VOUCHER_TYPE_OPTIONS} placeholder="选择后按原规则生成摘要与分录" />
          </Form.Item>
          {watchedType === 'EXPENSE' ? (
            <Form.Item name="employeeName" label="员工姓名" rules={[{ required: true, message: '请填写员工姓名' }]}>
              <Input placeholder="用于摘要与员工核算维度" />
            </Form.Item>
          ) : null}
          {watchedType === 'REPAIR' || watchedType === 'MATERIAL' ? (
            <Form.Item name="payeeOverride" label="收款单位（可改）">
              <Input placeholder="默认对方单位，用于供应商匹配" />
            </Form.Item>
          ) : null}
          {watchedType === 'TRANSFER' ? (
            <Form.Item name="targetBankName" label="转入银行" rules={[{ required: true, message: '请填写转入银行' }]}>
              <Input placeholder="如：晋商银行 / 工商银行" />
            </Form.Item>
          ) : null}
        </Form>
      </Modal>

      <Modal
        title="检查金蝶重复结果"
        open={existVisible}
        onCancel={() => setExistVisible(false)}
        footer={null}
        width={980}
        destroyOnClose
      >
        {existSummary.length > 0 ? (
          <div style={{ marginBottom: 12 }}>
            {existSummary.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        ) : null}
        <Table
          rowKey="id"
          loading={existLoading}
          dataSource={existItems}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
          size={isMobile ? 'small' : 'middle'}
          scroll={{ x: 860 }}
          columns={[
            {
              title: '银行',
              dataIndex: 'bankSource',
              width: 100,
              render: (v?: string) => bankSourceLabel(v),
            },
            {
              title: '交易时间',
              dataIndex: 'tradeTime',
              width: 160,
              render: (v?: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-'),
            },
            { title: '对方单位', dataIndex: 'counterpartyName', ellipsis: true, width: 140 },
            {
              title: '业务类型',
              dataIndex: 'voucherType',
              width: 100,
              render: (v?: string) =>
                v ? (
                  <Tag color={v === 'RESIDUAL_FEE' ? 'cyan' : 'green'}>{voucherTypeLabel(v)}</Tag>
                ) : (
                  <Tag>未分类</Tag>
                ),
            },
            {
              title: '金额',
              width: 120,
              render: (_, r) =>
                r.amount != null ? `${r.amountSide || ''}${r.amountSide ? ' ' : ''}${r.amount}` : '-',
            },
            {
              title: '结果',
              width: 140,
              render: (_, r) => {
                if (r.kingdeeExistStatus === 1) {
                  return (
                    <Tag color="error">
                      重复
                      {r.kingdeeExistVoucherNo
                        ? ` ${r.kingdeeExistVoucherWord || ''}-${r.kingdeeExistVoucherNo}`
                        : ''}
                    </Tag>
                  );
                }
                if (r.kingdeeExistStatus === 2) {
                  return <Tag color="success">不重复</Tag>;
                }
                return <Tag>未检查</Tag>;
              },
            },
            {
              title: '说明',
              dataIndex: 'message',
              ellipsis: true,
              render: (v?: string) => v || '-',
            },
          ]}
        />
      </Modal>

      <Modal
        title="流水详情"
        open={Boolean(detail)}
        onCancel={() => setDetail(null)}
        footer={null}
        width={720}
      >
        {detail ? (
          <Descriptions column={isMobile ? 1 : 2} bordered size="small">
            <Descriptions.Item label="银行">{bankSourceLabel(detail.bankSource)}</Descriptions.Item>
            <Descriptions.Item label="方向">{detail.direction === 'OUT' ? '支出' : '收入'}</Descriptions.Item>
            <Descriptions.Item label="交易时间">
              {detail.tradeTime ? dayjs(detail.tradeTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="金额">{detail.amount?.toFixed?.(2) ?? detail.amount}</Descriptions.Item>
            <Descriptions.Item label="对方单位" span={2}>
              {detail.counterpartyName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="对方账号">{detail.counterpartyAccount || '-'}</Descriptions.Item>
            <Descriptions.Item label="流水号">{detail.serialNo || detail.voucherNo || '-'}</Descriptions.Item>
            <Descriptions.Item label="用途">{detail.purpose || '-'}</Descriptions.Item>
            <Descriptions.Item label="摘要">{detail.summary || '-'}</Descriptions.Item>
            <Descriptions.Item label="备注/附言" span={2}>
              {detail.remark || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="业务类型">{voucherTypeLabel(detail.voucherType)}</Descriptions.Item>
            <Descriptions.Item label="员工/收款">
              {detail.employeeName || detail.payeeOverride || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="金蝶凭证" span={2}>
              {detail.kingdeeExistStatus === 1
                ? `金蝶已有 ${detail.kingdeeExistVoucherWord || '银'}${detail.kingdeeExistVoucherNo || ''}`
                : detail.kingdeeVoucherNo
                  ? `银${detail.kingdeeVoucherNo}`
                  : detail.kingdeePushError || '未写入'}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>
    </div>
  );
}
