'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, Empty, Pagination, Skeleton, Space, Table, Tabs, Tag } from 'antd';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';
import { api, unwrap } from '@/lib/api';
import { AuthGuard } from '@/components/layout/auth-guard';
import { OrderStatusTag } from '@/components/status-tag';
import { PageHeading } from '@/components/editorial';
import { formatVnd } from '@/lib/format';
import { useResponsive } from '@/lib/use-responsive';
import type { OrderStatus, OrderSummary, PageEnvelope } from '@/lib/types';

const PAGE_LIMIT = 20;

type FilterKey =
  | 'ALL'
  | 'PROCESSING_GROUP'
  | 'SHIPPING'
  | 'DELIVERED'
  | 'CANCELLED';

// Map a tab to BE status filter (single status). For "Đang xử lý" we use
// CONFIRMED as the main pending/processing stage in the COD flow.
const TAB_TO_STATUS: Record<FilterKey, OrderStatus | undefined> = {
  ALL: undefined,
  PROCESSING_GROUP: 'CONFIRMED',
  SHIPPING: 'SHIPPING',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

function OrdersInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobile } = useResponsive();

  const activeTab = (searchParams.get('tab') as FilterKey) || 'ALL';
  const [page, setPage] = useState(1);

  const statusFilter = TAB_TO_STATUS[activeTab];

  const { data, isLoading } = useQuery({
    queryKey: ['orders', activeTab, page],
    queryFn: async () => {
      const res = await api.get('/orders', {
        params: {
          status: statusFilter,
          page,
          limit: PAGE_LIMIT,
        },
      });
      return unwrap<PageEnvelope<OrderSummary>>(res);
    },
  });

  const setTab = (tab: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set('tab', tab);
    setPage(1);
    router.push(`/orders?${next.toString()}`);
  };

  return (
    <div>
      <PageHeading
        eyebrow="Đơn hàng"
        title="Đơn hàng của tôi"
        subtitle="Theo dõi trạng thái đơn hàng và lịch sử mua sắm của bạn tại The Editorial."
      />
      <Card style={{ borderRadius: 16 }}>
      <Tabs
        activeKey={activeTab}
        onChange={setTab}
        items={[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'PROCESSING_GROUP', label: 'Đang xử lý' },
          { key: 'SHIPPING', label: 'Đang giao' },
          { key: 'DELIVERED', label: 'Đã giao' },
          { key: 'CANCELLED', label: 'Đã huỷ' },
        ]}
      />

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <>
          {isMobile ? (
            (data?.items ?? []).length === 0 ? (
              <Empty description="Chưa có đơn hàng nào." />
            ) : (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {(data?.items ?? []).map((row) => (
                  <OrderCard key={row.id} order={row} />
                ))}
              </Space>
            )
          ) : (
            <Table<OrderSummary>
              rowKey="id"
              dataSource={data?.items ?? []}
              pagination={false}
              locale={{ emptyText: 'Chưa có đơn hàng nào.' }}
              columns={[
                {
                  title: 'Mã đơn',
                  dataIndex: 'orderCode',
                  render: (code: string, row) => (
                    <Link href={`/orders/${row.id}`}>
                      <strong>{code}</strong>
                    </Link>
                  ),
                },
                {
                  title: 'Ngày đặt',
                  dataIndex: 'createdAt',
                  render: (d: string) => dayjs(d).format('DD/MM/YYYY HH:mm'),
                },
                {
                  title: 'Số sản phẩm',
                  dataIndex: 'itemCount',
                  align: 'center',
                  render: (c: number) => <Tag>{c}</Tag>,
                },
                {
                  title: 'Tổng tiền',
                  dataIndex: 'totalAmount',
                  align: 'right',
                  render: (v: string) => <strong>{formatVnd(v)}</strong>,
                },
                {
                  title: 'Trạng thái',
                  dataIndex: 'status',
                  render: (s: OrderStatus) => <OrderStatusTag status={s} />,
                },
                {
                  title: '',
                  key: 'action',
                  align: 'right',
                  render: (_: unknown, row) => (
                    <Link href={`/orders/${row.id}`}>Xem chi tiết</Link>
                  ),
                },
              ]}
            />
          )}
          <div
            style={{
              marginTop: 16,
              display: 'flex',
              justifyContent: isMobile ? 'center' : 'flex-end',
            }}
          >
            <Pagination
              current={page}
              pageSize={PAGE_LIMIT}
              total={data?.total ?? 0}
              showSizeChanger={false}
              onChange={setPage}
            />
          </div>
        </>
      )}
      </Card>
    </div>
  );
}

/* Compact card view for the orders list on phone. */
function OrderCard({ order }: { order: OrderSummary }) {
  return (
    <Link
      href={`/orders/${order.id}`}
      style={{
        display: 'block',
        background: '#fff',
        border: '1px solid var(--color-divider)',
        borderRadius: 12,
        padding: 14,
        color: 'inherit',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <strong style={{ color: 'var(--color-ink)' }}>{order.orderCode}</strong>
        <OrderStatusTag status={order.status} />
      </div>
      <div
        style={{
          color: 'var(--color-muted)',
          fontSize: 13,
          marginBottom: 8,
        }}
      >
        {dayjs(order.createdAt).format('DD/MM/YYYY HH:mm')} · {order.itemCount}{' '}
        sản phẩm
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span
          style={{
            color: 'var(--color-primary)',
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          {formatVnd(order.totalAmount)}
        </span>
        <span style={{ color: 'var(--color-primary)', fontSize: 13 }}>
          Xem chi tiết →
        </span>
      </div>
    </Link>
  );
}

export default function OrdersPage() {
  return (
    <AuthGuard role="CUSTOMER">
      <Suspense fallback={<Skeleton active paragraph={{ rows: 8 }} />}>
        <OrdersInner />
      </Suspense>
    </AuthGuard>
  );
}
