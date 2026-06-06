'use client';

import { useQuery } from '@tanstack/react-query';
import {
  App as AntdApp,
  Avatar,
  Button,
  Dropdown,
  Skeleton,
  Table,
} from 'antd';
import {
  DownloadOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { Dayjs } from 'dayjs';
import { useMemo } from 'react';
import { api, extractErrorMessage, unwrap } from '@/lib/api';
import { downloadCsv, downloadXlsx } from '@/lib/download-csv';
import { formatVnd } from '@/lib/format';
import { StatCard } from '@/components/editorial';
import type { Granularity } from '@/components/editorial';
import { LineChart } from '../_charts';

dayjs.extend(relativeTime);
dayjs.locale('vi');

interface NewVsReturning {
  newCount: number;
  returningCount: number;
  totalCustomersInPeriod: number;
}

interface RegSeries {
  granularity: Granularity;
  points: { date: string; count: number }[];
}

interface TopCustomer {
  userId: string;
  email: string;
  fullName: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

interface TabProps {
  from: Dayjs;
  to: Dayjs;
  granularity: Granularity;
}

function toIso(d: Dayjs): string {
  return d.toISOString();
}

export function CustomersTab({ from, to, granularity }: TabProps) {
  const { message } = AntdApp.useApp();
  const fromIso = toIso(from.startOf('day'));
  const toIsoStr = toIso(to.endOf('day'));

  const nvrQ = useQuery<NewVsReturning>({
    queryKey: ['reports', 'new-vs-returning', fromIso, toIsoStr],
    queryFn: async () => {
      const res = await api.get('/admin/reports/customers/new-vs-returning', {
        params: { from: fromIso, to: toIsoStr },
      });
      return unwrap<NewVsReturning>(res);
    },
  });

  const seriesQ = useQuery<RegSeries>({
    queryKey: ['reports', 'registration-series', fromIso, toIsoStr, granularity],
    queryFn: async () => {
      const res = await api.get('/admin/reports/customers/registration-series', {
        params: { from: fromIso, to: toIsoStr, granularity },
      });
      return unwrap<RegSeries>(res);
    },
  });

  const topQ = useQuery<TopCustomer[]>({
    queryKey: ['reports', 'customers-top', fromIso, toIsoStr],
    queryFn: async () => {
      const res = await api.get('/admin/reports/customers/top', {
        params: { from: fromIso, to: toIsoStr, limit: 20 },
      });
      return unwrap<TopCustomer[]>(res);
    },
  });

  const handleExport = async (format: 'csv' | 'xlsx') => {
    const filename = `customers-top-${from.format('YYYYMMDD')}-${to.format('YYYYMMDD')}.${format}`;
    try {
      const params = {
        type: 'customers-top',
        format,
        from: fromIso,
        to: toIsoStr,
      };
      if (format === 'csv') await downloadCsv('/admin/reports/export', filename, params);
      else await downloadXlsx('/admin/reports/export', filename, params);
      message.success(`Đã tải báo cáo (${format.toUpperCase()}).`);
    } catch (err) {
      message.error(extractErrorMessage(err, 'Không thể tải báo cáo'));
    }
  };

  const linePoints = useMemo(
    () => (seriesQ.data?.points ?? []).map((p) => ({ date: p.date, value: p.count })),
    [seriesQ.data],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="report-grid-3">
        <StatCard
          icon={<UserAddOutlined />}
          label="Khách mới"
          value={nvrQ.data?.newCount ?? 0}
          tone="primary"
        />
        <StatCard
          icon={<UserOutlined />}
          label="Khách quay lại"
          value={nvrQ.data?.returningCount ?? 0}
          tone="ink"
        />
        <StatCard
          icon={<TeamOutlined />}
          label="Tổng KH trong kỳ"
          value={nvrQ.data?.totalCustomersInPeriod ?? 0}
          tone="soft"
        />
      </div>

      <div style={cardStyle}>
        <div className="eyebrow" style={{ color: 'var(--color-primary)' }}>
          Khách hàng
        </div>
        <h3 style={titleStyle}>Đăng ký theo thời gian</h3>
        {seriesQ.isLoading ? (
          <Skeleton active paragraph={{ rows: 5 }} />
        ) : (
          <LineChart
            points={linePoints}
            formatValue={(v) => `${v} khách`}
            color="#9A0E24"
          />
        )}
      </div>

      <div style={cardStyle}>
        <div style={cardHeader}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--color-primary)' }}>
              Top khách hàng
            </div>
            <h3 style={titleStyle}>Top 20 khách chi tiêu cao</h3>
          </div>
          <Dropdown
            menu={{
              items: [
                { key: 'csv', label: 'CSV (customers-top)', onClick: () => handleExport('csv') },
                { key: 'xlsx', label: 'Excel (customers-top)', onClick: () => handleExport('xlsx') },
              ],
            }}
          >
            <Button icon={<DownloadOutlined />}>Xuất báo cáo</Button>
          </Dropdown>
        </div>

        <Table<TopCustomer>
          rowKey="userId"
          loading={topQ.isLoading}
          dataSource={topQ.data ?? []}
          pagination={false}
          scroll={{ x: 760 }}
          onRow={(row) => ({
            onClick: () => message.info(row.email),
            style: { cursor: 'pointer' },
          })}
          columns={[
            {
              title: '#',
              key: 'rank',
              width: 56,
              render: (_: unknown, _row: TopCustomer, i: number) => (
                <span style={{ color: 'var(--color-muted)' }}>{i + 1}</span>
              ),
            },
            {
              title: 'Khách hàng',
              key: 'user',
              render: (_: unknown, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar
                    icon={<UserOutlined />}
                    style={{
                      background: 'rgba(200,16,46,0.1)',
                      color: 'var(--color-primary)',
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--color-ink)' }}>
                      {row.fullName ?? '—'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                      {row.email}
                    </div>
                  </div>
                </div>
              ),
            },
            {
              title: 'Số đơn',
              dataIndex: 'orderCount',
              width: 100,
              align: 'right',
              render: (v: number) => <span style={{ fontWeight: 600 }}>{v}</span>,
            },
            {
              title: 'Tổng chi tiêu',
              dataIndex: 'totalSpent',
              width: 180,
              align: 'right',
              render: (v: number) => (
                <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                  {formatVnd(v)}
                </span>
              ),
            },
            {
              title: 'Lần mua gần nhất',
              dataIndex: 'lastOrderAt',
              width: 180,
              render: (v: string | null) =>
                v ? (
                  <span style={{ color: 'var(--color-muted)', fontSize: 13 }}>
                    {dayjs(v).fromNow()}
                  </span>
                ) : (
                  '—'
                ),
            },
          ]}
        />
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

export default CustomersTab;
