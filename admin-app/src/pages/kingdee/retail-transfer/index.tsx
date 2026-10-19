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
  DatePicker,
} from 'antd';
import {
  ReloadOutlined,
  SearchOutlined,
  UploadOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';
import {
  getRetailTransferItems,
  importRetailTransfer,
  clearRetailTransferImported,
  checkRetailTransferKingdeeExists,
  type RetailTransferItem,
  type RetailTransferExistItem,
} from '@/api/retail-transfer';
import { useIsMobile } from '@/hooks/useIsMobile';

interface SearchForm {
  counterpartyName?: string;
  direction?: string;
  existStatus?: string;
  retailOnly?: boolean;
  tradeDateRange?: [dayjs.Dayjs, dayjs.Dayjs];
}

export default function RetailTransferPage() {
  const isMobile = useIsMobile();
  const [items, setItems] = useState<RetailTransferItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<SearchForm>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [importVisible, setImportVisible] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [existVisible, setExistVisible] = useState(false);
  const [existLoading, setExistLoading] = useState(false);
  const [existItems, setExistItems] = useState<RetailTransferExistItem[]>([]);
  const [existSummary, setExistSummary] = useState<string[]>([]);
  const [form] = Form.useForm<SearchForm>();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const range = searchParams.tradeDateRange;
      const res = await getRetailTransferItems({
        pageNo,
        pageSize,
        retailOnly: searchParams.retailOnly === true,
        counterpartyName: searchParams.counterpartyName,
        direction: searchParams.direction,
        existStatus: searchParams.existStatus,
        tradeDateStart: range?.[0]?.format('YYYY-MM-DD'),
        tradeDateEnd: range?.[1]?.format('YYYY-MM-DD'),
      });
      setItems(res.data.records);
      setTotal(res.data.total);
    } catch {
      message.error('加载散户流水失败');
    } finally {
      setLoading(false);
    }
  }, [pageNo, pageSize, searchParams]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleImport = async () => {
    const file = fileList[0]?.originFileObj;
    if (!file) {
      message.warning('请选择散户业务结账台账 Excel');
      return;
    }
    setImportLoading(true);
    try {
      const res = await importRetailTransfer(file);
      message.success(
        `导入完成：${res.data.sheetCount ? `${res.data.sheetCount} 个sheet ` : ''}新增 ${res.data.imported}，更新 ${res.data.updated ?? 0}（散户 ${res.data.retailCount}），跳过 ${res.data.skippedDuplicate}，无效 ${res.data.skippedInvalid}${res.data.sheetNames ? `；表：${res.data.sheetNames}` : ''}`,
      );
      setImportVisible(false);
      setFileList([]);
      setPageNo(1);
      fetchItems();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '导入失败');
    } finally {
      setImportLoading(false);
    }
  };

  const runReverseWrite = async () => {
    const scopeIds = selectedRowKeys.length > 0 ? selectedRowKeys : items.map((i) => i.id);
    if (scopeIds.length === 0) {
      message.warning('请先导入散户流水');
      return;
    }
    setExistVisible(true);
    setExistLoading(true);
    setExistItems([]);
    setExistSummary([]);
    try {
      const res = await checkRetailTransferKingdeeExists({
        ids: scopeIds,
        retailOnly: true,
      });
      const data = res.data;
      setExistItems(data?.items || []);
      setExistSummary(
        [
          `合计 ${data?.total ?? 0} 条：已反写转字号 ${data?.existsCount ?? 0}，未找到 ${data?.notExistsCount ?? 0}`,
          data?.kingdeeEntryCount != null ? `拉取金蝶分录 ${data.kingdeeEntryCount} 条` : '',
          data?.periodsQueried?.length ? `查询期间：${data.periodsQueried.join('、')}` : '',
          selectedRowKeys.length === 0 ? '说明：未勾选时反写当前页散户流水' : '',
        ].filter(Boolean),
      );
      message.success(`反写完成：已有 ${data?.existsCount ?? 0}，未找到 ${data?.notExistsCount ?? 0}`);
      fetchItems();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '反写失败');
    } finally {
      setExistLoading(false);
    }
  };

  const columns: ColumnsType<RetailTransferItem> = [
    {
      title: '交易时间',
      dataIndex: 'tradeTime',
      width: 170,
      render: (v?: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '方向',
      dataIndex: 'direction',
      width: 80,
      render: (v: string) =>
        v === 'OUT' ? <Tag color="orange">付款</Tag> : <Tag color="blue">收款</Tag>,
    },
    {
      title: '对方单位',
      dataIndex: 'counterpartyName',
      width: 140,
      ellipsis: true,
      render: (v?: string, r?: RetailTransferItem) => (
        <Space size={4}>
          <span>{v || '-'}</span>
          {r?.retailFlag === 1 ? <Tag color="purple">散户</Tag> : null}
        </Space>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 110,
      align: 'right',
      render: (v?: number) => (v == null ? '-' : Number(v).toFixed(2)),
    },
    {
      title: '用途/摘要',
      width: 160,
      ellipsis: true,
      render: (_, r) => r.purpose || r.summary || r.remark || '-',
    },
    {
      title: '转字号',
      width: 140,
      render: (_, r) => {
        if (r.kingdeeExistStatus === 1) {
          return (
            <Tag color="success">
              {r.kingdeeExistVoucherWord || '转'}
              {r.kingdeeExistVoucherNo || ''}
            </Tag>
          );
        }
        if (r.kingdeeExistStatus === 2) {
          return <Tag>未找到</Tag>;
        }
        return <Tag>未反写</Tag>;
      },
    },
  ];

  return (
    <div className="page-container">
      <Card title="散户转字号（对照金蝶已录转字反写）">
        <Form
          form={form}
          layout={isMobile ? 'vertical' : 'inline'}
          style={{ marginBottom: 16, rowGap: 12 }}
        >
          <Form.Item name="counterpartyName" label="对方">
            <Input allowClear placeholder="姓名" style={{ width: isMobile ? '100%' : 140 }} />
          </Form.Item>
          <Form.Item name="direction" label="方向">
            <Select
              allowClear
              style={{ width: isMobile ? '100%' : 110 }}
              options={[
                { label: '付款', value: 'OUT' },
                { label: '收款', value: 'IN' },
              ]}
            />
          </Form.Item>
          <Form.Item name="existStatus" label="反写">
            <Select
              allowClear
              style={{ width: isMobile ? '100%' : 120 }}
              options={[
                { label: '已反写', value: 'matched' },
                { label: '未反写/未找到', value: 'unmatched' },
              ]}
            />
          </Form.Item>
          <Form.Item name="retailOnly" label="范围">
            <Select
              allowClear
              placeholder="全部"
              style={{ width: isMobile ? '100%' : 120 }}
              options={[{ label: '仅散户', value: true }]}
            />
          </Form.Item>
          <Form.Item name="tradeDateRange" label="交易日期">
            <DatePicker.RangePicker style={{ width: isMobile ? '100%' : undefined }} />
          </Form.Item>
          <Form.Item>
            <Space wrap>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={async () => {
                  const values = await form.validateFields();
                  setPageNo(1);
                  setSearchParams(values);
                }}
              >
                查询
              </Button>
              <Button
                onClick={() => {
                  form.resetFields();
                  setPageNo(1);
                  setSearchParams({});
                }}
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <Space wrap style={{ width: '100%', marginBottom: 12 }}>
          <Button type="primary" icon={<UploadOutlined />} onClick={() => setImportVisible(true)}>
            导入台账
          </Button>
          <Button
            danger
            onClick={() => {
              Modal.confirm({
                title: '清空已导入散户台账？',
                content: '将删除本页全部导入记录，便于按「散户业务结账台账」重导。不可恢复。',
                okText: '清空',
                okButtonProps: { danger: true },
                onOk: async () => {
                  const res = await clearRetailTransferImported();
                  message.success(`已清空 ${res.data.deleted ?? 0} 条`);
                  setSelectedRowKeys([]);
                  fetchItems();
                },
              });
            }}
          >
            清空导入
          </Button>
          <Button icon={<CopyOutlined />} loading={existLoading} onClick={runReverseWrite}>
            对照转字反写
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
          scroll={{ x: 900 }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as number[]),
          }}
          pagination={{
            current: pageNo,
            pageSize,
            total,
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
        title="导入散户业务结账台账"
        open={importVisible}
        onCancel={() => setImportVisible(false)}
        onOk={handleImport}
        confirmLoading={importLoading}
        destroyOnClose
      >
        <p style={{ marginBottom: 12, color: '#666' }}>
          请上传「散户业务结账台账」（含多个日期 sheet）。按单车「总价」导入；对照转字时按供应商+结账日合计匹配金蝶（金蝶按日汇总入账）。工商/晋商流水请到「银行流水」导入。
        </p>
        <Upload
          beforeUpload={() => false}
          maxCount={1}
          accept=".xlsx,.xls"
          fileList={fileList}
          onChange={({ fileList: next }) => setFileList(next)}
        >
          <Button icon={<UploadOutlined />}>选择文件</Button>
        </Upload>
      </Modal>

      <Modal
        title="对照转字反写结果"
        open={existVisible}
        onCancel={() => setExistVisible(false)}
        footer={null}
        width={960}
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
          pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
          size={isMobile ? 'small' : 'middle'}
          scroll={{ x: 820 }}
          columns={[
            {
              title: '交易时间',
              dataIndex: 'tradeTime',
              width: 160,
              render: (v?: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-'),
            },
            { title: '对方', dataIndex: 'counterpartyName', width: 100, ellipsis: true },
            {
              title: '金额',
              width: 130,
              render: (_, r) =>
                r.amount != null ? `${r.amountSide || ''} ${r.amount}` : '-',
            },
            {
              title: '结果',
              width: 140,
              render: (_, r) => {
                if (r.kingdeeExistStatus === 1) {
                  return (
                    <Tag color="success">
                      {r.kingdeeExistVoucherWord || '转'}
                      {r.kingdeeExistVoucherNo || ''}
                    </Tag>
                  );
                }
                if (r.kingdeeExistStatus === 2) {
                  return <Tag color="error">未找到</Tag>;
                }
                return <Tag>未检查</Tag>;
              },
            },
            { title: '说明', dataIndex: 'message', ellipsis: true },
          ]}
        />
      </Modal>
    </div>
  );
}
