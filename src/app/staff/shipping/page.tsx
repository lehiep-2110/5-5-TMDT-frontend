'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App as AntdApp,
  Button,
  Input,
  Pagination,
  Select,
  Table,
  Tag,
} from 'antd';
import {
  ExclamationCircleOutlined,
  FilterOutlined,
  QrcodeOutlined,
  RightOutlined,
  ShoppingCartOutlined,
  TruckOutlined,
} from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { api, extractErrorMessage, unwrap } from '@/lib/api';
import type { OrderStatus, PageEnvelope } from '@/lib/types';
import { PageHeading, StatCard } from '@/components/editorial';

// TODO phase 2 — UC-21 full implementation (staff role + carrier API)
// The current BE does not yet expose a staff-scoped shipping endpoint.
// We call the admin transition endpoint for the happy path (admin logged in).
// Staff users will receive a 403 message which is surfaced via message.error.

interface ShippingRow {
  id: string;
  orderCode: string;
  status: OrderStatus;
  totalAmount: string;
  itemCount: number;
  createdAt: string;
  userEmail: string | null;
  userFullName: string | null;
  firstBookTitle: string | null;
}

const CARRIERS = [
  { value: 'GHN', label: 'GHN (Giao Hàng Nhanh)' },
  { value: 'GHTK', label: 'Giao Hàng Tiết Kiệm' },
  { value: 'VIETTEL', label: 'Viettel Post' },
];

const PAGE_SIZE = 10;

export default function StaffShippingPage() {
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [trackingMap, setTrackingMap] = useState<Record<string, string>>({});
  const [carrierMap, setCarrierMap] = useState<Record<string, string>>({});

  const listQ = useQuery({
    queryKey: ['staff-shipping', 'PROCESSING', page],
    queryFn: async () => {
      const res = await api.get('/staff/orders', {
        params: { status: 'PROCESSING', page, limit: PAGE_SIZE },
      });
      return unwrap<PageEnvelope<ShippingRow>>(res);
    },
  });

  const rows = listQ.data?.items ?? [];
  const total = listQ.data?.total ?? 0;

  const updateMutation = useMutation({
    mutationFn: async (payload: {
      orderId: string;
      carrier: string;
      tracking: string;
    }) => {
      // TODO phase 2 — UC-21: replace with /api/staff/orders/:id/ship once BE lands.
      const res = await api.patch(
        `/admin/orders/${payload.orderId}/status`,
        {
          toStatus: 'SHIPPING',
          note: `${payload.carrier}: ${payload.tracking}`,
        },
      );
      return unwrap(res);
    },
    onSuccess: () => {
      message.success('Đã cập nhật trạng thái SHIPPING');
      queryClient.invalidateQueries({ queryKey: ['staff-shipping'] });
    },
    onError: (err) => {
      message.warning(
        'Cập nhật trạng thái SHIPPING cần quyền Admin. Gửi yêu cầu...',
      );
      message.error(extractErrorMessage(err, 'Không thể cập nhật trạng thái'));
    },
  });

  const handleSubmit = (orderId: string) => {
    const tracking = (trackingMap[orderId] ?? '').trim();
    const carrier = carrierMap[orderId] ?? 'GHN';
    if (!tracking) {
      message.warning('Vui lòng nhập mã vận đơn');
      return;
    }
    updateMutation.mutate({ orderId, carrier, tracking });
  };

  const columns = useMemo(
    () => [
      {
        title: 'CHI TIẾT ĐƠN HÀNG',
        key: 'detail',
        render: (_: unknown, row: ShippingRow) => (
          <div>
            <div
              style={{
                color: 'var(--color-primary)',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              #{row.orderCode}
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-ink)' }}>
              {row.userFullName ?? row.userEmail ?? 'Khách lẻ'}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--color-muted)',
                marginTop: 2,
              }}
            >
              {row.itemCount}x {row.firstBookTitle ?? 'Sản phẩm'}
            </div>
          </div>
        ),
      },
      {
        title: 'TRẠNG THÁI KHO',
        key: 'status',
        width: 160,
        render: () => (
          <Tag
            style={{
              background: 'rgba(47,133,90,0.1)',
              color: 'var(--color-success)',
              border: '1px solid rgba(47,133,90,0.2)',
              borderRadius: 999,
              fontWeight: 600,
              fontSize: 11,
              letterSpacing: '0.08em',
              padding: '3px 10px',
            }}
          >
            ĐÃ ĐÓNG GÓI
          </Tag>
        ),
      },
      {
        title: 'ĐỐI TÁC VẬN CHUYỂN',
        key: 'carrier',
        width: 220,
        render: (_: unknown, row: ShippingRow) => (
          <Select
            style={{ width: '100%' }}
            value={carrierMap[row.id] ?? 'GHN'}
            onChange={(v) =>
              setCarrierMap((prev) => ({ ...prev, [row.id]: v }))
            }
            options={CARRIERS}
          />
        ),
      },
      {
        title: 'MÃ VẬN ĐƠN (TRACKING)',
        key: 'tracking',
        width: 240,
        render: (_: unknown, row: ShippingRow) => (
          <Input
            placeholder="Nhập mã vận đơn..."
            value={trackingMap[row.id] ?? ''}
            onChange={(e) =>
              setTrackingMap((prev) => ({ ...prev, [row.id]: e.target.value }))
            }
          />
        ),
      },
      {
        title: 'THAO TÁC',
        key: 'action',
        width: 180,
        render: (_: unknown, row: ShippingRow) => (
          <Button
            type="primary"
            icon={<TruckOutlined />}
            loading={updateMutation.isPending}
            onClick={() => handleSubmit(row.id)}
          >
            Cập nhật SHIPPING
          </Button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [carrierMap, trackingMap, updateMutation.isPending],
  );

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--color-muted)',
          fontWeight: 600,
          marginBottom: 10,
        }}
      >
        <span>ĐƠN HÀNG</span>
        <RightOutlined style={{ fontSize: 9 }} />
        <span style={{ color: 'var(--color-ink)' }}>CẬP NHẬT VẬN CHUYỂN</span>
      </div>

      <PageHeading
        title="Cập Nhật Shipping"
        subtitle="Danh sách các đơn hàng đã đóng gói và sẵn sàng bàn giao cho đơn vị vận chuyển. Vui lòng nhập mã vận đơn để tiếp tục."
        trailing={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Tag
              style={{
                background: 'rgba(37,99,235,0.08)',
                color: '#2563EB',
                border: '1px solid rgba(37,99,235,0.2)',
                borderRadius: 999,
                padding: '4px 12px',
                fontWeight: 600,
                fontSize: 12,
                margin: 0,
              }}
            >
              {String(total).padStart(2, '0')} Đang chờ đi
            </Tag>
            <Button icon={<FilterOutlined />}>Lọc danh sách</Button>
          </div>
        }
      />

      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid var(--color-divider)',
          boxShadow: '0 1px 2px rgba(26,26,26,0.04)',
          padding: 12,
          overflow: 'hidden',
          marginBottom: 24,
        }}
      >
        <Table<ShippingRow>
          rowKey="id"
          loading={listQ.isLoading}
          dataSource={rows}
          columns={columns}
          pagination={false}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 12px 4px',
            borderTop: '1px solid var(--color-divider)',
            marginTop: 8,
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>
            Hiển thị {rows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
            {(page - 1) * PAGE_SIZE + rows.length} trên tổng số {total} đơn hàng
            chờ vận chuyển
          </span>
          <Pagination
            current={page}
            pageSize={PAGE_SIZE}
            total={total}
            showSizeChanger={false}
            onChange={setPage}
          />
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          position: 'relative',
        }}
      >
        <StatCard
          icon={<TruckOutlined />}
          label="Đã bàn giao hôm nay"
          /* Mocked stat for MVP */
          value="128"
          delta={12}
          tone="ink"
        />
        <StatCard
          icon={<ShoppingCartOutlined />}
          label="Đơn chờ mã vận đơn"
          value={total.toLocaleString('vi-VN')}
          tone="primary"
        />
        <StatCard
          icon={<ExclamationCircleOutlined />}
          label="Khiếu nại vận chuyển"
          /* Mocked stat for MVP */
          value="08"
          delta={-3}
          tone="soft"
        />
      </div>

      <button
        type="button"
        onClick={() => message.info('Tính năng quét QR sẽ sớm ra mắt')}
        style={{
          position: 'fixed',
          right: 32,
          bottom: 32,
          background: 'var(--color-primary)',
          color: '#fff',
          border: 0,
          borderRadius: 999,
          padding: '12px 22px',
          fontWeight: 600,
          fontSize: 14,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          boxShadow: '0 12px 30px rgba(200,16,46,0.35)',
        }}
      >
        <QrcodeOutlined />
        Quét mã nhanh
      </button>
    </div>
  );
}
