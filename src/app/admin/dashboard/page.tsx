'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Card,
  Segmented,
  Skeleton,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import {
  ArrowRightOutlined,
  BookOutlined,
  DollarCircleOutlined,
  DownloadOutlined,
  MoreOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { api, unwrap } from '@/lib/api';
import { formatVnd } from '@/lib/format';
import { BookCover } from '@/components/book-cover';
import { PageHeading, StatCard } from '@/components/editorial';
import type {
  BookListItem,
  OrderStatus,
  PageEnvelope,
  PaymentStatus,
} from '@/lib/types';

interface AdminOrderRow {
  id: string;
  orderCode: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: string;
  createdAt: string;
  userEmail: string | null;
  userFullName: string | null;
}

interface InventoryLowItem {
  id: string;
  title: string;
  isbn: string;
  slug: string;
  stockQuantity: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  primaryImage?: string | null;
}

interface InventoryResp {
  items: InventoryLowItem[];
  total: number;
}

// Seeded bar heights so hydration stays stable.
const BAR_HEIGHTS_30 = [
  42, 58, 71, 35, 63, 84, 55, 48, 66, 52, 75, 60, 43, 70, 88, 54, 61, 72, 47,
  68, 80, 52, 65, 78, 50, 62, 74, 58, 83, 69,
];
const BAR_HEIGHTS_7 = [52, 68, 73, 58, 80, 64, 85];

const SERIF: React.CSSProperties = {
  fontFamily: 'var(--font-serif), Georgia, serif',
  fontWeight: 700,
  color: 'var(--color-ink)',
};

function cardStyle(): React.CSSProperties {
  return {
    background: '#fff',
    border: '1px solid var(--color-divider)',
    borderRadius: 12,
    boxShadow: '0 1px 2px rgba(26,26,26,0.03)',
  };
}

export default function AdminDashboardPage() {
  const [chartRange, setChartRange] = useState<'7' | '30'>('30');

  // Total orders
  const ordersTotalQ = useQuery({
    queryKey: ['admin-dashboard', 'orders-total'],
    queryFn: async () => {
      const res = await api.get('/admin/orders', { params: { limit: 1 } });
      return unwrap<PageEnvelope<AdminOrderRow>>(res);
    },
  });

  // New customers
  const customersQ = useQuery({
    queryKey: ['admin-dashboard', 'customers-total'],
    queryFn: async () => {
      const res = await api.get('/admin/users', {
        params: { role: 'CUSTOMER', limit: 1 },
      });
      return unwrap<PageEnvelope<unknown>>(res);
    },
  });

  // Paid orders — used for revenue + AOV (client-side aggregation).
  const paidOrdersQ = useQuery({
    queryKey: ['admin-dashboard', 'paid-orders'],
    queryFn: async () => {
      const res = await api.get('/admin/orders', {
        params: { paymentStatus: 'PAID', limit: 100 },
      });
      return unwrap<PageEnvelope<AdminOrderRow>>(res);
    },
  });

  const revenue = useMemo(() => {
    const items = paidOrdersQ.data?.items ?? [];
    return items.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  }, [paidOrdersQ.data]);
  const avgOrder = useMemo(() => {
    const items = paidOrdersQ.data?.items ?? [];
    if (!items.length) return 0;
    return revenue / items.length;
  }, [paidOrdersQ.data, revenue]);

  // Low stock alerts
  const lowStockQ = useQuery({
    queryKey: ['admin-dashboard', 'low-stock'],
    queryFn: async () => {
      const res = await api.get('/inventory', {
        params: { lowStockOnly: 'true', limit: 5 },
      });
      return unwrap<InventoryResp>(res);
    },
  });

  // Top selling
  const topSellingQ = useQuery({
    queryKey: ['admin-dashboard', 'top-selling'],
    queryFn: async () => {
      const res = await api.get('/books', {
        params: { sort: 'bestselling', limit: 3 },
      });
      return unwrap<PageEnvelope<BookListItem>>(res);
    },
  });

  const topTableQ = useQuery({
    queryKey: ['admin-dashboard', 'top-table'],
    queryFn: async () => {
      const res = await api.get('/books', {
        params: { sort: 'bestselling', limit: 10 },
      });
      return unwrap<PageEnvelope<BookListItem>>(res);
    },
  });

  const bars = chartRange === '7' ? BAR_HEIGHTS_7 : BAR_HEIGHTS_30;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <PageHeading
        title="Chào buổi sáng, Quản trị viên"
        subtitle="Đây là những gì đang diễn ra với cửa hàng của bạn hôm nay."
      />

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard
          icon={<DollarCircleOutlined />}
          label="Doanh thu"
          value={formatVnd(revenue)}
          // TODO phase 2 real analytics
          delta={12.5}
          tone="primary"
        />
        <StatCard
          icon={<ShoppingCartOutlined />}
          label="Đơn hàng"
          value={ordersTotalQ.data?.total ?? 0}
          // TODO phase 2 real analytics
          delta={8.2}
          tone="ink"
        />
        <StatCard
          icon={<UserOutlined />}
          label="Khách mới"
          value={customersQ.data?.total ?? 0}
          // TODO phase 2 real analytics
          delta={-2.4}
          tone="soft"
        />
        <StatCard
          icon={<BookOutlined />}
          label="Giá trị TB đơn"
          value={formatVnd(avgOrder)}
          // TODO phase 2 real analytics
          delta={5.1}
          tone="primary"
        />
      </div>

      {/* Chart + right column */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '7fr 3fr',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Revenue chart */}
        <div style={{ ...cardStyle(), padding: 24 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <div>
              <div
                className="eyebrow"
                style={{ color: 'var(--color-muted)', marginBottom: 6 }}
              >
                Doanh thu
              </div>
              <h2 style={{ ...SERIF, fontSize: 24, margin: 0 }}>
                Biểu đồ doanh thu {chartRange === '7' ? '7' : '30'} ngày
              </h2>
            </div>
            <Segmented
              value={chartRange}
              onChange={(v) => setChartRange(v as '7' | '30')}
              options={[
                { label: '7 ngày', value: '7' },
                { label: '30 ngày', value: '30' },
              ]}
            />
          </div>
          <div
            style={{
              marginTop: 20,
              height: 240,
              display: 'flex',
              alignItems: 'flex-end',
              gap: chartRange === '7' ? 18 : 6,
              padding: '0 4px',
              borderBottom: '1px solid var(--color-divider)',
              paddingBottom: 8,
            }}
          >
            {bars.map((h, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${h}%`,
                  background:
                    i === bars.length - 1
                      ? 'var(--color-primary)'
                      : 'linear-gradient(180deg, #1A1A1A 0%, #4A4A4A 100%)',
                  borderRadius: 4,
                  transition: 'height 0.3s ease',
                }}
              />
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 10,
              color: 'var(--color-muted)',
              fontSize: 11,
              letterSpacing: '0.04em',
            }}
          >
            <span>
              {chartRange === '7' ? 'T2' : 'Ngày 1'}
            </span>
            <span>
              {chartRange === '7' ? 'CN' : `Ngày ${bars.length}`}
            </span>
          </div>
          <div
            style={{
              marginTop: 12,
              fontSize: 12,
              color: 'var(--color-muted)',
            }}
          >
            {/* TODO phase 2 real chart with recharts/nivo + live analytics */}
            Biểu đồ mang tính minh hoạ — số liệu thực sẽ có trong phase 2.
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Low stock */}
          <div style={{ ...cardStyle(), padding: 20 }}>
            <div
              className="eyebrow"
              style={{ color: 'var(--color-primary)', marginBottom: 12 }}
            >
              Cảnh báo tồn kho
            </div>
            {lowStockQ.isLoading ? (
              <Skeleton
                active
                title={{ width: '60%' }}
                paragraph={{ rows: 3, width: ['100%', '100%', '80%'] }}
              />
            ) : lowStockQ.data?.items.length ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {lowStockQ.data.items.slice(0, 5).map((b) => (
                  <div
                    key={b.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <BookCover
                      src={b.primaryImage}
                      alt={b.title}
                      width={36}
                      height={48}
                      borderRadius={4}
                      iconSize={16}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--color-ink)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {b.title}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--color-muted)',
                        }}
                      >
                        {b.isbn}
                      </div>
                    </div>
                    <span
                      style={{
                        background: 'rgba(200,16,46,0.08)',
                        color: 'var(--color-primary)',
                        borderRadius: 999,
                        padding: '3px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Còn {b.stockQuantity}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
                Không có sản phẩm nào sắp hết hàng.
              </div>
            )}
            <Link href="/admin/inventory">
              <Button
                block
                style={{
                  marginTop: 16,
                  borderColor: 'var(--color-divider)',
                  color: 'var(--color-ink)',
                }}
              >
                Xem tất cả báo cáo <ArrowRightOutlined />
              </Button>
            </Link>
          </div>

          {/* Top selling */}
          <div style={{ ...cardStyle(), padding: 20 }}>
            <div
              className="eyebrow"
              style={{ color: 'var(--color-primary)', marginBottom: 12 }}
            >
              Top sách bán chạy
            </div>
            {topSellingQ.isLoading ? (
              <Skeleton
                active
                title={{ width: '60%' }}
                paragraph={{ rows: 3, width: ['100%', '100%', '80%'] }}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {(topSellingQ.data?.items ?? []).map((b, i) => (
                  <div
                    key={b.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        ...SERIF,
                        fontSize: 20,
                        color: 'var(--color-muted)',
                        minWidth: 28,
                      }}
                    >
                      0{i + 1}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--color-ink)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {b.title}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--color-muted)',
                        }}
                      >
                        {b.authors.map((a) => a.name).join(', ')}
                      </div>
                    </div>
                    <span
                      style={{
                        fontWeight: 600,
                        color: 'var(--color-primary)',
                        fontSize: 13,
                      }}
                    >
                      {b.reviewCount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom top-10 table */}
      <div style={{ ...cardStyle(), padding: 24 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <div>
            <div
              className="eyebrow"
              style={{ color: 'var(--color-primary)', marginBottom: 6 }}
            >
              Top bán chạy
            </div>
            <h2 style={{ ...SERIF, fontSize: 24, margin: 0 }}>
              Top 10 Sách bán chạy nhất tuần
            </h2>
          </div>
          <Tooltip title="Sắp ra mắt">
            <Button disabled icon={<DownloadOutlined />}>
              Xuất báo cáo
            </Button>
          </Tooltip>
        </div>
        <Table<BookListItem>
          rowKey="id"
          loading={topTableQ.isLoading}
          dataSource={topTableQ.data?.items ?? []}
          pagination={false}
          columns={[
            {
              title: 'Sách',
              key: 'book',
              render: (_: unknown, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <BookCover
                    src={row.primaryImage}
                    alt={row.title}
                    size="sm"
                  />
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: 'var(--color-ink)',
                      }}
                    >
                      {row.title}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--color-muted)',
                      }}
                    >
                      {row.authors.map((a) => a.name).join(', ') || '—'}
                    </div>
                  </div>
                </div>
              ),
            },
            {
              title: 'Đã bán',
              // TODO phase 2: wire real sold count (currently reviewCount proxy)
              dataIndex: 'reviewCount',
              width: 110,
              align: 'right',
              render: (v: number) => (
                <span style={{ fontWeight: 600 }}>{v}</span>
              ),
            },
            {
              title: 'Giá',
              dataIndex: 'price',
              width: 140,
              align: 'right',
              render: (v: string) => formatVnd(v),
            },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              width: 140,
              render: (s: string) =>
                s === 'ACTIVE' ? (
                  <Tag
                    style={{
                      background: 'rgba(47,133,90,0.1)',
                      color: 'var(--color-success)',
                      border: 'none',
                    }}
                  >
                    Đang bán
                  </Tag>
                ) : (
                  <Tag
                    style={{
                      background: 'rgba(200,16,46,0.1)',
                      color: 'var(--color-primary)',
                      border: 'none',
                    }}
                  >
                    Tạm ẩn
                  </Tag>
                ),
            },
            {
              title: '',
              key: 'actions',
              width: 60,
              render: () => (
                <Button
                  type="text"
                  icon={<MoreOutlined />}
                  aria-label="actions"
                />
              ),
            },
          ]}
        />
      </div>

    </div>
  );
}
