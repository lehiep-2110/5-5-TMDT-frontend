'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App as AntdApp,
  Avatar,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Drawer,
  Dropdown,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Timeline,
  Tooltip,
  Typography,
} from 'antd';
import {
  CloseOutlined,
  DownOutlined,
  DownloadOutlined,
  PlusOutlined,
  TruckOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { api, extractErrorMessage, unwrap } from '@/lib/api';
import { formatVnd } from '@/lib/format';
import {
  OrderStatusTag,
  PaymentStatusTag,
  orderStatusLabel,
} from '@/components/status-tag';
import { getAllowedNextStatuses } from '@/lib/order-state';
import { PageHeading } from '@/components/editorial';
import type {
  OrderDetail,
  OrderStatus,
  PageEnvelope,
  PaymentStatus,
} from '@/lib/types';

const { Text } = Typography;
const PAGE_SIZE = 20;

interface AdminOrderRow {
  id: string;
  orderCode: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  totalAmount: string;
  itemCount: number;
  createdAt: string;
  userEmail: string | null;
  userFullName: string | null;
}

type StatusFilter = OrderStatus | 'ALL' | 'PAID';

interface StatusChip {
  value: StatusFilter;
  label: string;
  dot: string;
}

const STATUS_CHIPS: StatusChip[] = [
  { value: 'ALL', label: 'Tất cả', dot: '#8A8A8A' },
  { value: 'PAID', label: 'Paid', dot: '#2F855A' },
  { value: 'PENDING', label: 'Pending', dot: '#D97706' },
  { value: 'CONFIRMED', label: 'Confirmed', dot: '#F59E0B' },
  { value: 'PROCESSING', label: 'Processing', dot: '#2563EB' },
  { value: 'SHIPPING', label: 'Shipping', dot: '#0EA5E9' },
  { value: 'DELIVERED', label: 'Delivered', dot: '#059669' },
  { value: 'CANCELLED', label: 'Cancelled', dot: '#C8102E' },
];

function paymentMethodTag(method?: string): React.ReactNode {
  if (!method) return <Tag>—</Tag>;
  const map: Record<string, { label: string; bg: string; fg: string }> = {
    COD: {
      label: 'TIỀN MẶT (COD)',
      bg: 'rgba(217,119,6,0.1)',
      fg: '#D97706',
    },
    VNPAY: {
      label: 'CHUYỂN KHOẢN',
      bg: 'rgba(37,99,235,0.1)',
      fg: '#2563EB',
    },
    MOMO: {
      label: 'VÍ MOMO',
      bg: 'rgba(200,16,46,0.1)',
      fg: '#C8102E',
    },
    VISA: {
      label: 'THẺ VISA',
      bg: 'rgba(15,23,42,0.08)',
      fg: '#0F172A',
    },
  };
  const cfg = map[method] ?? {
    label: method,
    bg: 'rgba(138,138,138,0.1)',
    fg: '#8A8A8A',
  };
  return (
    <Tag
      style={{
        background: cfg.bg,
        color: cfg.fg,
        border: 'none',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.04em',
      }}
    >
      {cfg.label}
    </Tag>
  );
}

function cardStyle(): React.CSSProperties {
  return {
    background: '#fff',
    border: '1px solid var(--color-divider)',
    borderRadius: 12,
    boxShadow: '0 1px 2px rgba(26,26,26,0.03)',
  };
}

export default function AdminOrdersPage() {
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    null,
    null,
  ]);
  const [page, setPage] = useState(1);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingNext, setPendingNext] = useState<OrderStatus | null>(null);
  const [pendingNote, setPendingNote] = useState('');

  const [cancelCode, setCancelCode] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const [carrier, setCarrier] = useState<string | undefined>(undefined);
  const [trackingCode, setTrackingCode] = useState('');
  const [trackingOrderCode, setTrackingOrderCode] = useState('');

  const listQ = useQuery({
    queryKey: ['admin-orders', { statusFilter, dateRange, page }],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        page,
        limit: PAGE_SIZE,
      };
      if (statusFilter === 'PAID') {
        params.paymentStatus = 'PAID';
      } else if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      if (dateRange[0]) params.from = dateRange[0].startOf('day').toISOString();
      if (dateRange[1]) params.to = dateRange[1].endOf('day').toISOString();
      const res = await api.get('/admin/orders', { params });
      return unwrap<PageEnvelope<AdminOrderRow>>(res);
    },
  });

  const detailQ = useQuery({
    queryKey: ['admin-order-detail', selectedId],
    enabled: !!selectedId,
    queryFn: async () => {
      const res = await api.get(`/admin/orders/${selectedId}`);
      return unwrap<OrderDetail>(res);
    },
  });

  const openRow = (id: string) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      if (!selectedId || !pendingNext) throw new Error('no target');
      const res = await api.patch(`/admin/orders/${selectedId}/status`, {
        toStatus: pendingNext,
        note: pendingNote || undefined,
      });
      return unwrap<OrderDetail>(res);
    },
    onSuccess: () => {
      message.success('Đã cập nhật trạng thái');
      setConfirmOpen(false);
      setPendingNext(null);
      setPendingNote('');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({
        queryKey: ['admin-order-detail', selectedId],
      });
    },
    onError: (err) =>
      message.error(extractErrorMessage(err, 'Cập nhật thất bại')),
  });

  const quickCancelMutation = useMutation({
    mutationFn: async ({ code, reason }: { code: string; reason: string }) => {
      // Look up order id by code.
      const lookup = await api.get('/admin/orders', {
        params: { keyword: code, limit: 1 },
      });
      const rows = unwrap<PageEnvelope<AdminOrderRow>>(lookup).items;
      if (!rows.length) throw new Error(`Không tìm thấy đơn ${code}`);
      const orderId = rows[0].id;
      const res = await api.patch(`/admin/orders/${orderId}/status`, {
        toStatus: 'CANCELLED',
        note: reason || undefined,
      });
      return unwrap<OrderDetail>(res);
    },
    onSuccess: () => {
      message.success('Đã huỷ đơn');
      setCancelCode('');
      setCancelReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (err) => message.error(extractErrorMessage(err, 'Huỷ đơn thất bại')),
  });

  const trackingMutation = useMutation({
    mutationFn: async ({
      code,
      carrier,
      tracking,
    }: {
      code: string;
      carrier: string;
      tracking: string;
    }) => {
      const lookup = await api.get('/admin/orders', {
        params: { keyword: code, limit: 1 },
      });
      const rows = unwrap<PageEnvelope<AdminOrderRow>>(lookup).items;
      if (!rows.length) throw new Error(`Không tìm thấy đơn ${code}`);
      const orderId = rows[0].id;
      const res = await api.patch(`/admin/orders/${orderId}/status`, {
        toStatus: 'SHIPPING',
        note: `${carrier}: ${tracking}`,
      });
      return unwrap<OrderDetail>(res);
    },
    onSuccess: () => {
      message.success('Đã cập nhật tracking');
      setCarrier(undefined);
      setTrackingCode('');
      setTrackingOrderCode('');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (err) => message.error(extractErrorMessage(err, 'Cập nhật thất bại')),
  });

  const detail = detailQ.data;
  const nextStatuses = useMemo(
    () => (detail ? getAllowedNextStatuses(detail.status) : []),
    [detail],
  );

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <PageHeading
        title="Quản lý Đơn hàng"
        subtitle="Theo dõi, xác nhận và cập nhật trạng thái các đơn hàng trong thời gian thực."
        trailing={
          <Space>
            <Tooltip title="Sắp ra mắt">
              <Button disabled icon={<DownloadOutlined />}>
                Xuất báo cáo
              </Button>
            </Tooltip>
            <Tooltip title="Tính năng đang phát triển">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() =>
                  message.info('Tính năng đang phát triển — sẽ ra mắt sớm')
                }
              >
                Tạo đơn
              </Button>
            </Tooltip>
          </Space>
        }
      />

      {/* Filter card */}
      <div
        style={{
          ...cardStyle(),
          padding: 20,
          marginBottom: 20,
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 24,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--color-muted)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 10,
              fontWeight: 600,
            }}
          >
            Lọc theo trạng thái
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {STATUS_CHIPS.map((c) => {
              const active = statusFilter === c.value;
              return (
                <button
                  key={c.value}
                  onClick={() => {
                    setPage(1);
                    setStatusFilter(c.value);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 14px',
                    borderRadius: 999,
                    border: `1px solid ${
                      active ? 'var(--color-primary)' : 'var(--color-divider)'
                    }`,
                    background: active ? 'var(--color-primary)' : '#fff',
                    color: active ? '#fff' : 'var(--color-ink)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: active ? '#fff' : c.dot,
                    }}
                  />
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--color-muted)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 10,
              fontWeight: 600,
            }}
          >
            Khoảng thời gian
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <DatePicker
              value={dateRange[0]}
              placeholder="Từ ngày"
              onChange={(v) => {
                setPage(1);
                setDateRange([v, dateRange[1]]);
              }}
              style={{ flex: 1 }}
            />
            <DatePicker
              value={dateRange[1]}
              placeholder="Đến ngày"
              onChange={(v) => {
                setPage(1);
                setDateRange([dateRange[0], v]);
              }}
              style={{ flex: 1 }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ ...cardStyle(), padding: 8, marginBottom: 24 }}>
        <Table<AdminOrderRow>
          rowKey="id"
          loading={listQ.isLoading}
          dataSource={listQ.data?.items ?? []}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: listQ.data?.total ?? 0,
            showSizeChanger: false,
            onChange: (p) => setPage(p),
          }}
          onRow={(row) => ({
            onClick: () => openRow(row.id),
            style: { cursor: 'pointer' },
          })}
          columns={[
            {
              title: 'MÃ ĐƠN',
              dataIndex: 'orderCode',
              render: (code: string) => (
                <span
                  style={{
                    color: 'var(--color-primary)',
                    fontWeight: 700,
                  }}
                >
                  {code}
                </span>
              ),
            },
            {
              title: 'KHÁCH HÀNG',
              key: 'user',
              render: (_: unknown, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar
                    size={32}
                    icon={<UserOutlined />}
                    style={{
                      background: 'rgba(200,16,46,0.1)',
                      color: 'var(--color-primary)',
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        color: 'var(--color-ink)',
                        fontSize: 13,
                      }}
                    >
                      {row.userFullName ?? '—'}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--color-muted)',
                      }}
                    >
                      {row.userEmail ?? '—'}
                    </div>
                  </div>
                </div>
              ),
            },
            {
              title: 'NGÀY ĐẶT',
              dataIndex: 'createdAt',
              width: 150,
              render: (d: string) => dayjs(d).format('DD/MM/YYYY HH:mm'),
            },
            {
              title: 'TỔNG TIỀN',
              dataIndex: 'totalAmount',
              width: 140,
              align: 'right',
              render: (v: string) => (
                <strong
                  style={{ color: 'var(--color-ink)' }}
                >
                  {formatVnd(v)}
                </strong>
              ),
            },
            {
              title: 'THANH TOÁN',
              dataIndex: 'paymentMethod',
              width: 160,
              render: (m?: string) => paymentMethodTag(m),
            },
            {
              title: 'TRẠNG THÁI',
              dataIndex: 'status',
              width: 150,
              render: (s: OrderStatus) => <OrderStatusTag status={s} />,
            },
            {
              title: 'THAO TÁC',
              key: 'actions',
              width: 180,
              render: (_: unknown, row) => (
                <Space onClick={(e) => e.stopPropagation()}>
                  {row.status === 'PENDING' || row.status === 'CONFIRMED' ? (
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => {
                        setSelectedId(row.id);
                        setPendingNext(
                          row.status === 'PENDING'
                            ? 'CONFIRMED'
                            : 'PROCESSING',
                        );
                        setPendingNote('');
                        setConfirmOpen(true);
                      }}
                    >
                      Xác nhận
                    </Button>
                  ) : null}
                  <Button
                    size="small"
                    icon={<CloseOutlined />}
                    danger
                    disabled={
                      row.status === 'CANCELLED' ||
                      row.status === 'COMPLETED' ||
                      row.status === 'DELIVERED'
                    }
                    onClick={() => {
                      setSelectedId(row.id);
                      setPendingNext('CANCELLED');
                      setPendingNote('');
                      setConfirmOpen(true);
                    }}
                  />
                </Space>
              ),
            },
          ]}
        />
      </div>

      {/* Bottom helper panels */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}
      >
        <div style={{ ...cardStyle(), padding: 24 }}>
          <div
            className="eyebrow"
            style={{ color: 'var(--color-primary)', marginBottom: 8 }}
          >
            <CloseOutlined /> &nbsp; Huỷ đơn nhanh
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-serif), Georgia, serif',
              fontSize: 22,
              margin: '0 0 14px',
              color: 'var(--color-ink)',
            }}
          >
            Huỷ đơn hàng nhanh
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Input
              size="large"
              placeholder="Mã đơn hàng (vd: ORD-2024-xxx)"
              value={cancelCode}
              onChange={(e) => setCancelCode(e.target.value)}
            />
            <Input.TextArea
              rows={3}
              placeholder="Lý do huỷ đơn..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <Button
              type="primary"
              size="large"
              loading={quickCancelMutation.isPending}
              disabled={!cancelCode}
              onClick={() =>
                quickCancelMutation.mutate({
                  code: cancelCode.trim(),
                  reason: cancelReason.trim(),
                })
              }
            >
              Xác nhận Huỷ đơn
            </Button>
          </div>
        </div>

        <div style={{ ...cardStyle(), padding: 24 }}>
          <div
            className="eyebrow"
            style={{ color: 'var(--color-primary)', marginBottom: 8 }}
          >
            <TruckOutlined /> &nbsp; Vận chuyển
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-serif), Georgia, serif',
              fontSize: 22,
              margin: '0 0 14px',
              color: 'var(--color-ink)',
            }}
          >
            Cập nhật vận chuyển
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Input
              size="large"
              placeholder="Mã đơn hàng"
              value={trackingOrderCode}
              onChange={(e) => setTrackingOrderCode(e.target.value)}
            />
            <Select
              size="large"
              placeholder="Chọn đơn vị vận chuyển"
              value={carrier}
              onChange={setCarrier}
              options={[
                { value: 'GHN', label: 'Giao Hàng Nhanh (GHN)' },
                {
                  value: 'GHTK',
                  label: 'Giao Hàng Tiết Kiệm',
                },
                { value: 'Viettel Post', label: 'Viettel Post' },
              ]}
              style={{ width: '100%' }}
            />
            <Input
              size="large"
              placeholder="Mã vận đơn tracking..."
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
            />
            <Button
              type="primary"
              size="large"
              loading={trackingMutation.isPending}
              disabled={!trackingOrderCode || !carrier || !trackingCode}
              onClick={() =>
                trackingMutation.mutate({
                  code: trackingOrderCode.trim(),
                  carrier: carrier!,
                  tracking: trackingCode.trim(),
                })
              }
            >
              Cập nhật Tracking
            </Button>
          </div>
        </div>
      </div>

      {/* Drawer detail */}
      <Drawer
        title={detail ? `Đơn ${detail.orderCode}` : 'Chi tiết đơn'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={720}
        loading={detailQ.isLoading}
      >
        {detail ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Space wrap>
              <OrderStatusTag status={detail.status} />
              <PaymentStatusTag status={detail.paymentStatus} />
              {nextStatuses.length > 0 ? (
                <Dropdown
                  menu={{
                    items: nextStatuses.map((s) => ({
                      key: s,
                      label: orderStatusLabel(s),
                      onClick: () => {
                        setPendingNext(s);
                        setPendingNote('');
                        setConfirmOpen(true);
                      },
                    })),
                  }}
                >
                  <Button type="primary">
                    Cập nhật trạng thái <DownOutlined />
                  </Button>
                </Dropdown>
              ) : null}
            </Space>
            <Descriptions
              size="small"
              column={1}
              bordered
              title="Thông tin khách"
            >
              <Descriptions.Item label="Khách hàng">
                {detail.user?.fullName ?? '—'} ({detail.user?.email ?? '—'})
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ giao">
                {detail.addressSnapshot ? (
                  <>
                    {detail.addressSnapshot.recipientName} —{' '}
                    {detail.addressSnapshot.phone}
                    <br />
                    {detail.addressSnapshot.streetAddress},{' '}
                    {detail.addressSnapshot.ward},{' '}
                    {detail.addressSnapshot.district},{' '}
                    {detail.addressSnapshot.province}
                  </>
                ) : (
                  '—'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Thanh toán">
                {detail.paymentMethod}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày đặt">
                {dayjs(detail.createdAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú">
                {detail.note ?? '—'}
              </Descriptions.Item>
            </Descriptions>
            <Card size="small" title="Sản phẩm">
              <Table
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={detail.items}
                columns={[
                  { title: 'Sách', dataIndex: 'bookTitleSnapshot' },
                  {
                    title: 'SL',
                    dataIndex: 'quantity',
                    align: 'right',
                    width: 60,
                  },
                  {
                    title: 'Giá',
                    dataIndex: 'priceAtTime',
                    align: 'right',
                    width: 140,
                    render: (v: string) => formatVnd(v),
                  },
                ]}
                summary={() => (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={2}>
                        <strong>Tạm tính</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        {formatVnd(detail.subtotal)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={2}>
                        Phí vận chuyển
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        {formatVnd(detail.shippingFee)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={2}>
                        <strong>Tổng cộng</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <strong>{formatVnd(detail.totalAmount)}</strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </Card>
            <Card size="small" title="Lịch sử trạng thái">
              <Timeline
                items={detail.statusLogs.map((l) => ({
                  children: (
                    <>
                      <strong>
                        {l.fromStatus ? `${l.fromStatus} → ` : ''}
                        {l.toStatus}
                      </strong>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(l.createdAt).format('DD/MM/YYYY HH:mm')}
                        {l.changedByName ? ` · ${l.changedByName}` : ''}
                      </Text>
                      {l.note ? (
                        <div style={{ fontSize: 13 }}>{l.note}</div>
                      ) : null}
                    </>
                  ),
                }))}
              />
            </Card>
          </Space>
        ) : null}
      </Drawer>

      {/* Status confirm modal */}
      <Modal
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onOk={() => updateStatusMutation.mutate()}
        confirmLoading={updateStatusMutation.isPending}
        title={`Chuyển sang: ${
          pendingNext ? orderStatusLabel(pendingNext) : ''
        }?`}
        okText="Xác nhận"
        cancelText="Huỷ"
      >
        <Text>Nhập ghi chú (không bắt buộc):</Text>
        <Input.TextArea
          rows={3}
          value={pendingNote}
          onChange={(e) => setPendingNote(e.target.value)}
          style={{ marginTop: 8 }}
        />
      </Modal>
    </div>
  );
}
