'use client';

import { useQuery } from '@tanstack/react-query';
import {
  App as AntdApp,
  Button,
  List,
  Skeleton,
  Table,
  Tag,
} from 'antd';
import { useResponsive } from '@/lib/use-responsive';
import {
  ArrowRightOutlined,
  BookOutlined,
  DollarCircleOutlined,
  DownloadOutlined,
  MoreOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { api, extractErrorMessage, unwrap } from '@/lib/api';
import { downloadCsv } from '@/lib/download-csv';
import { formatVnd } from '@/lib/format';
import { BookCover } from '@/components/book-cover';
import {
  DateRangeToolbar,
  PageHeading,
  StatCard,
  defaultGranularity,
} from '@/components/editorial';
import type { Granularity } from '@/components/editorial';
import { HBarList } from '../reports/_charts';

interface MetricValue {
  value: number;
  deltaPct: number;
  direction: 'up' | 'down' | 'flat';
}

interface OverviewResponse {
  period: string;
  range: { from: string; to: string };
  metrics: {
    revenue: MetricValue;
    orderCount: MetricValue;
    newCustomers: MetricValue;
    averageOrderValue: MetricValue;
  };
}

interface RevenuePoint {
  date: string;
  revenue: number;
  orderCount: number;
}

interface RevenueSeriesResponse {
  granularity: 'day' | 'week' | 'month';
  points: RevenuePoint[];
}

interface LowStockItem {
  id: string;
  title: string;
  slug: string;
  primaryImage: string | null;
  stockQuantity: number;
  authorName: string | null;
}

interface TopProductItem {
  bookId: string;
  title: string;
  slug: string;
  primaryImage: string | null;
  unitsSold: number;
  revenue: number;
  avgPrice: number;
}

interface SlowMoverItem {
  id: string;
  title: string;
  slug: string;
  primaryImage: string | null;
  authorName: string | null;
  unitsSold: number;
  stockQuantity: number;
}

interface TopCustomerItem {
  userId: string;
  email: string | null;
  fullName: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

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

function toIso(d: dayjs.Dayjs): string {
  return d.toISOString();
}

export default function AdminDashboardPage() {
  const { message } = AntdApp.useApp();
  const { isMobile, screens } = useResponsive();
  const isLgDown = !screens.lg;

  // Date-range filter (shared toolbar). Default: last 30 days, daily chart.
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>(() => [
    dayjs().subtract(29, 'day').startOf('day'),
    dayjs().endOf('day'),
  ]);
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [granOverridden, setGranOverridden] = useState(false);

  const handleRangeChange = (v: [dayjs.Dayjs, dayjs.Dayjs]) => {
    setRange(v);
    if (!granOverridden) setGranularity(defaultGranularity(v[0], v[1]));
  };
  const handleGranChange = (g: Granularity) => {
    setGranOverridden(true);
    setGranularity(g);
  };

  const fromIso = toIso(range[0].startOf('day'));
  const toIsoStr = toIso(range[1].endOf('day'));

  const overviewQ = useQuery<OverviewResponse>({
    queryKey: ['admin-dashboard', 'overview', fromIso, toIsoStr],
    queryFn: async () => {
      const res = await api.get('/admin/reports/overview', {
        params: { from: fromIso, to: toIsoStr },
      });
      return unwrap<OverviewResponse>(res);
    },
  });

  const revenueSeriesQ = useQuery<RevenueSeriesResponse>({
    queryKey: ['admin-dashboard', 'revenue-series', fromIso, toIsoStr, granularity],
    queryFn: async () => {
      const res = await api.get('/admin/reports/revenue-series', {
        params: { from: fromIso, to: toIsoStr, granularity },
      });
      return unwrap<RevenueSeriesResponse>(res);
    },
  });

  const lowStockQ = useQuery<{ items: LowStockItem[] }>({
    queryKey: ['admin-dashboard', 'low-stock'],
    queryFn: async () => {
      const res = await api.get('/admin/reports/low-stock', {
        params: { threshold: 10, limit: 5 },
      });
      return unwrap<{ items: LowStockItem[] }>(res);
    },
  });

  const topSellingQ = useQuery<{ items: TopProductItem[] }>({
    queryKey: ['admin-dashboard', 'top-3', fromIso, toIsoStr],
    queryFn: async () => {
      const res = await api.get('/admin/reports/top-products', {
        params: { from: fromIso, to: toIsoStr, limit: 3 },
      });
      return unwrap<{ items: TopProductItem[] }>(res);
    },
  });

  const topTableQ = useQuery<{ items: TopProductItem[] }>({
    queryKey: ['admin-dashboard', 'top-10', fromIso, toIsoStr],
    queryFn: async () => {
      const res = await api.get('/admin/reports/top-products', {
        params: { from: fromIso, to: toIsoStr, limit: 10 },
      });
      return unwrap<{ items: TopProductItem[] }>(res);
    },
  });

  const slowMoversQ = useQuery<{ items: SlowMoverItem[] }>({
    queryKey: ['admin-dashboard', 'slow-movers', fromIso, toIsoStr],
    queryFn: async () => {
      const res = await api.get('/admin/reports/slow-movers', {
        params: { from: fromIso, to: toIsoStr, limit: 10 },
      });
      return unwrap<{ items: SlowMoverItem[] }>(res);
    },
  });

  // Top 5 khách hàng theo SỐ ĐƠN trong khoảng đã chọn (sort=orders).
  const topCustomersQ = useQuery<{ items: TopCustomerItem[] }>({
    queryKey: ['admin-dashboard', 'top-customers', fromIso, toIsoStr],
    queryFn: async () => {
      const res = await api.get('/admin/reports/customers/top', {
        params: { from: fromIso, to: toIsoStr, sort: 'orders', limit: 5 },
      });
      return unwrap<{ items: TopCustomerItem[] }>(res);
    },
  });

  const metrics = overviewQ.data?.metrics;

  const points = revenueSeriesQ.data?.points ?? [];
  const maxRevenue = useMemo(
    () =>
      Math.max(
        1,
        points.reduce((m, p) => (p.revenue > m ? p.revenue : m), 0),
      ),
    [points],
  );

  const topCustomers = topCustomersQ.data?.items ?? [];
  const maxCustomerOrders = useMemo(
    () =>
      Math.max(
        1,
        topCustomers.reduce((m, c) => (c.orderCount > m ? c.orderCount : m), 0),
      ),
    [topCustomers],
  );

  const handleExport = async () => {
    try {
      await downloadCsv(
        '/admin/reports/export',
        `revenue-${range[0].format('YYYYMMDD')}-${range[1].format('YYYYMMDD')}.csv`,
        {
          type: 'revenue',
          from: fromIso,
          to: toIsoStr,
        },
      );
      message.success('Đã tải báo cáo doanh thu.');
    } catch (err) {
      message.error(extractErrorMessage(err, 'Không thể tải báo cáo'));
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <PageHeading
        title="Chào buổi sáng, Quản trị viên"
        subtitle="Đây là những gì đang diễn ra với cửa hàng của bạn hôm nay."
      />

      <DateRangeToolbar
        value={range}
        onChange={handleRangeChange}
        granularity={granularity}
        onGranularityChange={handleGranChange}
      />

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile
            ? '1fr'
            : !screens.lg
            ? 'repeat(2, minmax(0, 1fr))'
            : 'repeat(4, minmax(0, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard
          icon={<DollarCircleOutlined />}
          label="Doanh thu"
          value={formatVnd(metrics?.revenue.value ?? 0)}
          delta={metrics?.revenue.deltaPct}
          tone="primary"
        />
        <StatCard
          icon={<ShoppingCartOutlined />}
          label="Đơn hàng"
          value={metrics?.orderCount.value ?? 0}
          delta={metrics?.orderCount.deltaPct}
          tone="ink"
        />
        <StatCard
          icon={<UserOutlined />}
          label="Khách mới"
          value={metrics?.newCustomers.value ?? 0}
          delta={metrics?.newCustomers.deltaPct}
          tone="soft"
        />
        <StatCard
          icon={<BookOutlined />}
          label="Giá trị TB đơn"
          value={formatVnd(metrics?.averageOrderValue.value ?? 0)}
          delta={metrics?.averageOrderValue.deltaPct}
          tone="primary"
        />
      </div>

      {/* Chart + right column */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isLgDown ? '1fr' : '7fr 3fr',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Revenue chart */}
        <div style={{ ...cardStyle(), padding: isMobile ? 16 : 24 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              marginBottom: 8,
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 12 : 0,
            }}
          >
            <div>
              <div
                className="eyebrow"
                style={{ color: 'var(--color-muted)', marginBottom: 6 }}
              >
                Doanh thu
              </div>
              <h2 style={{ ...SERIF, fontSize: isMobile ? 20 : 24, margin: 0 }}>
                Biểu đồ doanh thu
              </h2>
            </div>
          </div>
          {revenueSeriesQ.isLoading ? (
            <Skeleton active paragraph={{ rows: 5 }} />
          ) : (
            <RevenueBarsSvg
              points={points}
              maxRevenue={maxRevenue}
              highlightLast
              compact={isMobile}
            />
          )}
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
              {points[0]
                ? dayjs(points[0].date).format('DD/MM')
                : '—'}
            </span>
            <span>
              {points[points.length - 1]
                ? dayjs(points[points.length - 1].date).format('DD/MM')
                : '—'}
            </span>
          </div>
          <div
            style={{
              marginTop: 12,
              fontSize: 12,
              color: 'var(--color-muted)',
            }}
          >
            Tổng doanh thu trong khoảng:{' '}
            <strong style={{ color: 'var(--color-ink)' }}>
              {formatVnd(points.reduce((sum, p) => sum + p.revenue, 0))}
            </strong>
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
                        {b.authorName ?? '—'}
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
            ) : (topSellingQ.data?.items ?? []).length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
                Chưa có dữ liệu bán.
              </div>
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
                    key={b.bookId}
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
                        {b.unitsSold} cuốn
                      </div>
                    </div>
                    <span
                      style={{
                        fontWeight: 600,
                        color: 'var(--color-primary)',
                        fontSize: 13,
                      }}
                    >
                      {formatVnd(b.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top 5 khách hàng theo số đơn — driven by the selected date range */}
      <div
        style={{ ...cardStyle(), padding: isMobile ? 16 : 24, marginBottom: 24 }}
      >
        <div
          className="eyebrow"
          style={{ color: 'var(--color-primary)', marginBottom: 6 }}
        >
          Khách hàng thân thiết
        </div>
        <h2 style={{ ...SERIF, fontSize: isMobile ? 20 : 24, margin: '0 0 16px' }}>
          Top 5 khách hàng đặt nhiều đơn nhất
        </h2>
        {topCustomersQ.isLoading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : topCustomers.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
            Chưa có dữ liệu đơn hàng trong khoảng đã chọn.
          </div>
        ) : (
          <HBarList
            rows={topCustomers.map((c) => ({
              label: c.fullName || c.email || '—',
              value: c.orderCount,
              valueDisplay: `${c.orderCount} đơn · ${formatVnd(c.totalSpent)}`,
              max: maxCustomerOrders,
            }))}
          />
        )}
      </div>

      {/* Bottom top-10 table */}
      <div style={{ ...cardStyle(), padding: isMobile ? 16 : 24 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            marginBottom: 16,
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 12 : 0,
          }}
        >
          <div>
            <div
              className="eyebrow"
              style={{ color: 'var(--color-primary)', marginBottom: 6 }}
            >
              Top bán chạy
            </div>
            <h2 style={{ ...SERIF, fontSize: isMobile ? 20 : 24, margin: 0 }}>
              Top 10 Sách bán chạy nhất
            </h2>
          </div>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            Xuất báo cáo
          </Button>
        </div>
        {isMobile ? (
          <List<TopProductItem>
            loading={topTableQ.isLoading}
            dataSource={topTableQ.data?.items ?? []}
            rowKey="bookId"
            renderItem={(row) => (
              <List.Item
                key={row.bookId}
                style={{ padding: '12px 0', borderBottom: '1px solid var(--color-divider)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                  <BookCover src={row.primaryImage} alt={row.title} size="sm" />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-ink)', fontSize: 14 }}>
                      {row.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                      {row.unitsSold} cuốn · {formatVnd(row.avgPrice)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: 13 }}>
                      {formatVnd(row.revenue)}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      {row.unitsSold > 0 ? (
                        <Tag
                          style={{
                            background: 'rgba(47,133,90,0.1)',
                            color: 'var(--color-success)',
                            border: 'none',
                            margin: 0,
                          }}
                        >
                          Đang bán
                        </Tag>
                      ) : (
                        <Tag
                          style={{
                            background: 'rgba(26,26,26,0.06)',
                            color: 'var(--color-muted)',
                            border: 'none',
                            margin: 0,
                          }}
                        >
                          —
                        </Tag>
                      )}
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
        ) : (
        <Table<TopProductItem>
          rowKey="bookId"
          loading={topTableQ.isLoading}
          dataSource={topTableQ.data?.items ?? []}
          pagination={false}
          scroll={{ x: 720 }}
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
                      {row.slug}
                    </div>
                  </div>
                </div>
              ),
            },
            {
              title: 'Đã bán',
              dataIndex: 'unitsSold',
              width: 110,
              align: 'right',
              render: (v: number) => (
                <span style={{ fontWeight: 600 }}>{v}</span>
              ),
            },
            {
              title: 'Giá TB',
              dataIndex: 'avgPrice',
              width: 160,
              align: 'right',
              render: (v: number) => formatVnd(v),
            },
            {
              title: 'Doanh thu',
              dataIndex: 'revenue',
              width: 160,
              align: 'right',
              render: (v: number) => (
                <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                  {formatVnd(v)}
                </span>
              ),
            },
            {
              title: 'Trạng thái',
              key: 'status',
              width: 140,
              render: (_: unknown, row) =>
                row.unitsSold > 0 ? (
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
                      background: 'rgba(26,26,26,0.06)',
                      color: 'var(--color-muted)',
                      border: 'none',
                    }}
                  >
                    Chưa có lượt bán
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
        )}
      </div>

      {/* Sách bán chậm (slow movers) — driven by the selected date range */}
      <div style={{ ...cardStyle(), padding: isMobile ? 16 : 24, marginTop: 24 }}>
        <div
          className="eyebrow"
          style={{ color: 'var(--color-primary)', marginBottom: 6 }}
        >
          Bán chậm
        </div>
        <h2 style={{ ...SERIF, fontSize: isMobile ? 20 : 24, margin: '0 0 16px' }}>
          Sách bán chậm trong khoảng đã chọn
        </h2>
        {slowMoversQ.isLoading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : (slowMoversQ.data?.items ?? []).length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
            Không có dữ liệu trong khoảng này.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile
                ? '1fr'
                : 'repeat(2, minmax(0, 1fr))',
              gap: 12,
            }}
          >
            {(slowMoversQ.data?.items ?? []).map((b) => (
              <div
                key={b.id}
                style={{ display: 'flex', gap: 12, alignItems: 'center' }}
              >
                <BookCover
                  src={b.primaryImage}
                  alt={b.title}
                  width={40}
                  height={56}
                  iconSize={16}
                  borderRadius={4}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      color: 'var(--color-ink)',
                      fontSize: 13,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {b.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                    {(b.authorName ?? '—') + ' · Tồn ' + b.stockQuantity}
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
                  {b.unitsSold} cuốn
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RevenueBarsSvg({
  points,
  maxRevenue,
  highlightLast,
  compact,
}: {
  points: RevenuePoint[];
  maxRevenue: number;
  highlightLast?: boolean;
  compact?: boolean;
}) {
  const width = 720;
  const height = compact ? 180 : 240;
  const paddingX = 4;
  const paddingTop = 12;
  const paddingBottom = 8;
  const innerW = width - paddingX * 2;
  const innerH = height - paddingTop - paddingBottom;
  const count = Math.max(1, points.length);
  const gap = count <= 10 ? 10 : 4;
  const barW = Math.max(3, (innerW - gap * (count - 1)) / count);

  return (
    <div
      style={{
        marginTop: 20,
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        style={{
          display: 'block',
          borderBottom: '1px solid var(--color-divider)',
        }}
      >
        {points.map((p, i) => {
          const x = paddingX + i * (barW + gap);
          const h = Math.max(2, (p.revenue / maxRevenue) * innerH);
          const y = paddingTop + (innerH - h);
          const isLast = i === points.length - 1;
          const fill =
            highlightLast && isLast
              ? 'var(--color-primary)'
              : '#1A1A1A';
          return (
            <rect
              key={p.date + i}
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={3}
              ry={3}
              fill={fill}
            >
              <title>
                {dayjs(p.date).format('DD/MM/YYYY')} — {formatVnd(p.revenue)} (
                {p.orderCount} đơn)
              </title>
            </rect>
          );
        })}
      </svg>
    </div>
  );
}
