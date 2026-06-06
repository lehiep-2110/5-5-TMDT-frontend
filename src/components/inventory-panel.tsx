'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App as AntdApp,
  Button,
  Card,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  List,
  Pagination,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useState } from 'react';
import { api, extractErrorMessage, unwrap } from '@/lib/api';
import { useResponsive } from '@/lib/use-responsive';

const { Title, Text } = Typography;
const PAGE_SIZE = 20;

interface InventoryItem {
  id: string;
  title: string;
  isbn: string;
  slug: string;
  stockQuantity: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  status: string;
  updatedAt: string;
}

interface InventoryResp {
  items: InventoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface StockLog {
  id: string;
  bookId: string;
  changeAmount: number;
  newQuantity: number;
  reason: string;
  orderId: string | null;
  note: string | null;
  createdAt: string;
  actor: { id: string; fullName: string } | null;
}

interface StockLogResp {
  items: StockLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface RestockFormValues {
  quantity: number;
  note?: string;
}

/**
 * Inventory management panel — table + restock drawer.
 *
 * Props:
 *  - title: panel heading.
 *  - compact: when true (auto-set on small screens), the table is swapped
 *    for a List-of-Cards layout that stacks better on narrow viewports and
 *    hides secondary columns (ISBN, threshold) below xs. If omitted, the
 *    component falls back to `useResponsive().isMobile`.
 */
export function InventoryPanel({
  title = 'Tồn kho',
  compact,
}: {
  title?: string;
  compact?: boolean;
}) {
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const { isMobile, isSmDown } = useResponsive();
  const isCompact = compact ?? isMobile;

  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm<RestockFormValues>();

  const listQ = useQuery({
    queryKey: ['inventory', { keyword, lowStockOnly, page }],
    queryFn: async () => {
      const res = await api.get('/inventory', {
        params: {
          keyword: keyword || undefined,
          lowStockOnly: lowStockOnly ? 'true' : undefined,
          page,
          limit: PAGE_SIZE,
        },
      });
      return unwrap<InventoryResp>(res);
    },
  });

  const logsQ = useQuery({
    queryKey: ['inventory-logs', selected?.id],
    enabled: !!selected,
    queryFn: async () => {
      const res = await api.get(`/inventory/${selected!.id}/logs`, {
        params: { limit: 50 },
      });
      return unwrap<StockLogResp>(res);
    },
  });

  const openRow = (row: InventoryItem) => {
    setSelected(row);
    setDrawerOpen(true);
    form.resetFields();
  };

  const restockMutation = useMutation({
    mutationFn: async (values: RestockFormValues) => {
      const res = await api.post(`/inventory/${selected!.id}/restock`, {
        quantity: values.quantity,
        note: values.note || undefined,
      });
      return unwrap(res);
    },
    onSuccess: () => {
      message.success('Đã nhập thêm kho');
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({
        queryKey: ['inventory-logs', selected?.id],
      });
    },
    onError: (err) =>
      message.error(extractErrorMessage(err, 'Nhập kho thất bại')),
  });

  return (
    <Card>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <Title level={3} style={{ margin: 0 }}>
            {title}
          </Title>
          <Space wrap style={{ width: isCompact ? '100%' : undefined }}>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Tên sách / ISBN..."
              style={{ width: isCompact ? '100%' : 280, minWidth: 200 }}
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onPressEnter={() => {
                setPage(1);
                setKeyword(keywordInput);
              }}
            />
            <Button
              onClick={() => {
                setPage(1);
                setKeyword(keywordInput);
              }}
            >
              Tìm
            </Button>
            <Space>
              <Text>Chỉ sách sắp hết</Text>
              <Switch
                checked={lowStockOnly}
                onChange={(v) => {
                  setPage(1);
                  setLowStockOnly(v);
                }}
              />
            </Space>
          </Space>
        </div>

        {isCompact ? (
          <>
            <List<InventoryItem>
              loading={listQ.isLoading}
              dataSource={listQ.data?.items ?? []}
              locale={{ emptyText: 'Không có dữ liệu' }}
              renderItem={(row) => (
                <List.Item
                  key={row.id}
                  onClick={() => openRow(row)}
                  style={{
                    cursor: 'pointer',
                    padding: '12px 4px',
                  }}
                >
                  <div style={{ width: '100%' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        gap: 8,
                      }}
                    >
                      <strong
                        style={{
                          color: row.isLowStock ? '#ff4d4f' : undefined,
                          fontSize: 14,
                          lineHeight: 1.3,
                          flex: 1,
                          minWidth: 0,
                          wordBreak: 'break-word',
                        }}
                      >
                        {row.title}
                      </strong>
                      {row.isLowStock ? (
                        <Tag color="red" style={{ margin: 0 }}>
                          Sắp hết
                        </Tag>
                      ) : (
                        <Tag color="green" style={{ margin: 0 }}>
                          Ổn
                        </Tag>
                      )}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 6,
                        fontSize: 12,
                        color: '#666',
                      }}
                    >
                      {/* Hide ISBN below xs to save space. */}
                      {!isSmDown ? (
                        <span>ISBN: {row.isbn}</span>
                      ) : (
                        <span />
                      )}
                      <span
                        style={{
                          color: row.isLowStock ? '#ff4d4f' : '#111',
                          fontWeight: 600,
                        }}
                      >
                        Tồn: {row.stockQuantity}
                        {!isSmDown ? ` / Ngưỡng: ${row.lowStockThreshold}` : ''}
                      </span>
                    </div>
                  </div>
                </List.Item>
              )}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                paddingTop: 12,
              }}
            >
              <Pagination
                current={page}
                pageSize={PAGE_SIZE}
                total={listQ.data?.total ?? 0}
                showSizeChanger={false}
                onChange={(p) => setPage(p)}
                size="small"
              />
            </div>
          </>
        ) : (
          <Table<InventoryItem>
            rowKey="id"
            loading={listQ.isLoading}
            dataSource={listQ.data?.items ?? []}
            scroll={{ x: 720 }}
            pagination={{
              current: page,
              pageSize: PAGE_SIZE,
              total: listQ.data?.total ?? 0,
              showSizeChanger: false,
              onChange: (p) => setPage(p),
            }}
            onRow={(row) => ({
              onClick: () => openRow(row),
              style: { cursor: 'pointer' },
            })}
            columns={[
              {
                title: 'Tên sách',
                dataIndex: 'title',
                render: (t: string, row) => (
                  <span
                    style={row.isLowStock ? { color: '#ff4d4f' } : undefined}
                  >
                    <strong>{t}</strong>
                  </span>
                ),
              },
              { title: 'ISBN', dataIndex: 'isbn', width: 150 },
              {
                title: 'Tồn kho',
                dataIndex: 'stockQuantity',
                align: 'right',
                width: 110,
                render: (v: number, row) => (
                  <span
                    style={row.isLowStock ? { color: '#ff4d4f' } : undefined}
                  >
                    {v}
                  </span>
                ),
              },
              {
                title: 'Ngưỡng cảnh báo',
                dataIndex: 'lowStockThreshold',
                align: 'right',
                width: 130,
              },
              {
                title: 'Trạng thái',
                key: 'lowFlag',
                width: 110,
                render: (_: unknown, row) =>
                  row.isLowStock ? (
                    <Tag color="red">Sắp hết</Tag>
                  ) : (
                    <Tag color="green">Ổn</Tag>
                  ),
              },
            ]}
          />
        )}
      </Space>

      <Drawer
        title={selected ? `Tồn kho: ${selected.title}` : 'Tồn kho'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={isCompact ? '100%' : 720}
      >
        {selected ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label="ISBN">{selected.isbn}</Descriptions.Item>
              <Descriptions.Item label="Tồn hiện tại">
                {selected.stockQuantity}
              </Descriptions.Item>
              <Descriptions.Item label="Ngưỡng cảnh báo">
                {selected.lowStockThreshold}
              </Descriptions.Item>
            </Descriptions>

            <Card size="small" title="Nhập thêm">
              <Form<RestockFormValues>
                form={form}
                layout="vertical"
                onFinish={(v) => restockMutation.mutate(v)}
              >
                <Form.Item
                  name="quantity"
                  label="Số lượng"
                  rules={[
                    { required: true, message: 'Nhập số lượng' },
                    {
                      validator: (_, v) =>
                        Number(v) > 0
                          ? Promise.resolve()
                          : Promise.reject(new Error('Phải > 0')),
                    },
                  ]}
                >
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="note" label="Ghi chú">
                  <Input.TextArea rows={2} />
                </Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={restockMutation.isPending}
                >
                  Nhập kho
                </Button>
              </Form>
            </Card>

            <Card size="small" title="Lịch sử nhập/xuất">
              <Table<StockLog>
                rowKey="id"
                size="small"
                loading={logsQ.isLoading}
                dataSource={logsQ.data?.items ?? []}
                pagination={false}
                scroll={{ x: 'max-content' }}
                columns={[
                  {
                    title: 'Thời gian',
                    dataIndex: 'createdAt',
                    render: (v: string) =>
                      dayjs(v).format('DD/MM/YYYY HH:mm'),
                  },
                  {
                    title: 'Người',
                    key: 'actor',
                    render: (_: unknown, row) =>
                      row.actor?.fullName ?? '—',
                  },
                  { title: 'Lý do', dataIndex: 'reason', width: 140 },
                  {
                    title: 'Thay đổi',
                    dataIndex: 'changeAmount',
                    align: 'right',
                    width: 90,
                    render: (v: number) => (
                      <span style={{ color: v >= 0 ? '#52c41a' : '#ff4d4f' }}>
                        {v >= 0 ? `+${v}` : v}
                      </span>
                    ),
                  },
                  {
                    title: 'Tồn sau',
                    dataIndex: 'newQuantity',
                    align: 'right',
                    width: 80,
                  },
                  {
                    title: 'Ghi chú',
                    dataIndex: 'note',
                    render: (v: string | null) => v ?? '—',
                  },
                ]}
              />
            </Card>
          </Space>
        ) : null}
      </Drawer>
    </Card>
  );
}
