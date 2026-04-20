'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, Pagination, Skeleton, Table, Tabs, Tag } from 'antd';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';
import { api, unwrap } from '@/lib/api';
import { AuthGuard } from '@/components/layout/auth-guard';
import { OrderStatusTag } from '@/components/status-tag';
import { PageHeading } from '@/components/editorial';
import { formatVnd } from '@/lib/format';
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
                render: (d: string) =>
                  dayjs(d).format('DD/MM/YYYY HH:mm'),
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
                render: (v: string) => (
                  <strong>{formatVnd(v)}</strong>
                ),
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
          <div
            style={{
              marginTop: 16,
              display: 'flex',
              justifyContent: 'flex-end',
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

export default function OrdersPage() {
  return (
    <AuthGuard role="CUSTOMER">
      <Suspense fallback={<Skeleton active paragraph={{ rows: 8 }} />}>
        <OrdersInner />
      </Suspense>
    </AuthGuard>
  );
}
