'use client';

import { useQuery } from '@tanstack/react-query';
import {
  App as AntdApp,
  Button,
  Dropdown,
  Skeleton,
} from 'antd';
import {
  BookOutlined,
  DollarCircleOutlined,
  DownloadOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import { useMemo } from 'react';
import { api, extractErrorMessage, unwrap } from '@/lib/api';
import { downloadCsv, downloadXlsx } from '@/lib/download-csv';
import { formatVnd } from '@/lib/format';
import { StatCard } from '@/components/editorial';
import type { Granularity } from '@/components/editorial';
import { Donut, HBarList, LineChart } from '../_charts';

interface RevenuePoint {
  date: string;
  revenue: number;
  orderCount: number;
  codRevenue: number;
  vnpayRevenue: number;
  momoRevenue: number;
}

interface RevenueDetail {
  granularity: Granularity;
  points: RevenuePoint[];
}

interface PaymentSlice {
  count: number;
  revenue: number;
  pct: number;
}

interface PaymentBreakdown {
  cod: PaymentSlice;
  vnpay: PaymentSlice;
  momo?: PaymentSlice;
  totalOrders: number;
  totalRevenue: number;
}

interface CategoryRevenueRow {
  categoryId: string;
  categoryName: string;
  revenue: number;
  units: number;
  orderCount: number;
}

interface TabProps {
  from: Dayjs;
  to: Dayjs;
  granularity: Granularity;
}

function toIso(d: Dayjs): string {
  return d.toISOString();
}

export function RevenueTab({ from, to, granularity }: TabProps) {
  const { message } = AntdApp.useApp();
  const fromIso = toIso(from.startOf('day'));
  const toIsoStr = toIso(to.endOf('day'));

  const detailQ = useQuery<RevenueDetail>({
    queryKey: ['reports', 'revenue-detail', fromIso, toIsoStr, granularity],
    queryFn: async () => {
      const res = await api.get('/admin/reports/revenue-detail', {
        params: { from: fromIso, to: toIsoStr, granularity },
      });
      return unwrap<RevenueDetail>(res);
    },
  });

  const paymentQ = useQuery<PaymentBreakdown>({
    queryKey: ['reports', 'payment-breakdown', fromIso, toIsoStr],
    queryFn: async () => {
      const res = await api.get('/admin/reports/payment-breakdown', {
        params: { from: fromIso, to: toIsoStr },
      });
      return unwrap<PaymentBreakdown>(res);
    },
  });

  const categoryQ = useQuery<{ items: CategoryRevenueRow[] }>({
    queryKey: ['reports', 'revenue-by-category', fromIso, toIsoStr],
    queryFn: async () => {
      const res = await api.get('/admin/reports/revenue-by-category', {
        params: { from: fromIso, to: toIsoStr },
      });
      return unwrap<{ items: CategoryRevenueRow[] }>(res);
    },
  });

  const points = detailQ.data?.points ?? [];
  const totalRevenue = useMemo(
    () => points.reduce((sum, p) => sum + p.revenue, 0),
    [points],
  );
  const totalOrders = useMemo(
    () => points.reduce((sum, p) => sum + p.orderCount, 0),
    [points],
  );
  const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const handleExport = async (format: 'csv' | 'xlsx') => {
    const filename = `revenue-${from.format('YYYYMMDD')}-${to.format('YYYYMMDD')}.${format}`;
    try {
      const params = {
        type: 'revenue',
        format,
        from: fromIso,
        to: toIsoStr,
      };
      if (format === 'csv') {
        await downloadCsv('/admin/reports/export', filename, params);
      } else {
        await downloadXlsx('/admin/reports/export', filename, params);
      }
      message.success(`Đã tải báo cáo (${format.toUpperCase()}).`);
    } catch (err) {
      message.error(extractErrorMessage(err, 'Không thể tải báo cáo'));
    }
  };

  const linePoints = points.map((p) => ({ date: p.date, value: p.revenue }));

  const paymentSlices = useMemo(() => {
    const p = paymentQ.data;
    if (!p) return [];
    const arr = [
      { label: 'COD', value: p.cod.revenue, color: '#C8102E' },
      { label: 'VNPAY', value: p.vnpay.revenue, color: '#9A0E24' },
    ];
    if (p.momo) {
      arr.push({ label: 'MoMo', value: p.momo.revenue, color: '#D97706' });
    }
    return arr;
  }, [paymentQ.data]);

  const categoryRows = useMemo(() => {
    const list = (categoryQ.data?.items ?? []).slice(0, 10);
    const max = list.reduce((m, r) => (r.revenue > m ? r.revenue : m), 0);
    return list.map((r) => ({
      label: r.categoryName,
      value: r.revenue,
      valueDisplay: `${formatVnd(r.revenue)} · ${r.units} cuốn`,
      max,
    }));
  }, [categoryQ.data]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="report-grid-3">
        <StatCard
          icon={<DollarCircleOutlined />}
          label="Tổng doanh thu"
          value={formatVnd(totalRevenue)}
          tone="primary"
        />
        <StatCard
          icon={<ShoppingCartOutlined />}
          label="Tổng đơn"
          value={totalOrders}
          tone="ink"
        />
        <StatCard
          icon={<BookOutlined />}
          label="Giá trị TB đơn"
          value={formatVnd(aov)}
          tone="soft"
        />
      </div>

      <div style={cardStyle}>
        <div style={cardHeader}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--color-primary)' }}>
              Doanh thu
            </div>
            <h3 style={titleStyle}>Biểu đồ doanh thu theo thời gian</h3>
          </div>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'csv',
                  label: 'CSV (revenue)',
                  onClick: () => handleExport('csv'),
                },
                {
                  key: 'xlsx',
                  label: 'Excel (revenue)',
                  onClick: () => handleExport('xlsx'),
                },
              ],
            }}
          >
            <Button icon={<DownloadOutlined />}>Xuất báo cáo</Button>
          </Dropdown>
        </div>
        {detailQ.isLoading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : (
          <LineChart points={linePoints} formatValue={formatVnd} />
        )}
      </div>

      <div className="report-grid-split">
        <div style={cardStyle}>
          <div className="eyebrow" style={{ color: 'var(--color-primary)' }}>
            Cơ cấu thanh toán
          </div>
          <h3 style={titleStyle}>Phương thức thanh toán</h3>
          {paymentQ.isLoading ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : (
            <Donut slices={paymentSlices} />
          )}
        </div>

        <div style={cardStyle}>
          <div className="eyebrow" style={{ color: 'var(--color-primary)' }}>
            Danh mục
          </div>
          <h3 style={titleStyle}>Top danh mục theo doanh thu</h3>
          {categoryQ.isLoading ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : (
            <HBarList rows={categoryRows} />
          )}
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid var(--color-divider)',
  borderRadius: 12,
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const cardHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const titleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-serif), Georgia, serif',
  fontSize: 22,
  fontWeight: 700,
  color: 'var(--color-ink)',
  margin: '4px 0 0',
};

export default RevenueTab;
