'use client';

import { useQuery } from '@tanstack/react-query';
import {
  App as AntdApp,
  Button,
  Dropdown,
  Progress,
  Skeleton,
  Table,
  Tag,
} from 'antd';
import {
  AlertOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
  DollarCircleOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import { useMemo } from 'react';
import { api, extractErrorMessage, unwrap } from '@/lib/api';
import { downloadCsv, downloadXlsx } from '@/lib/download-csv';
import { formatVnd } from '@/lib/format';
import { BookCover } from '@/components/book-cover';
import { StatCard } from '@/components/editorial';
import type { Granularity } from '@/components/editorial';
import { HBarList } from '../_charts';

interface InventorySummary {
  totalTitles: number;
  totalQuantity: number;
  lowStockCount: number;
  totalValue: number;
}

interface InventoryCategoryRow {
  categoryId: string;
  categoryName: string;
  titleCount: number;
  totalQuantity: number;
  totalValue: number;
}

interface LowStockItem {
  id: string;
  title: string;
  slug: string;
  primaryImage: string | null;
  stockQuantity: number;
  authorName: string | null;
}

interface OrderStatusRow {
  status: string;
  count: number;
  pct: number;
}

interface CancelRate {
  cancelled: number;
  totalCreated: number;
  ratePct: number;
}

interface VoucherRow {
  voucherId: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED' | string;
  value: number;
  usedCount: number;
  totalDiscount: number;
  totalQuantity: number;
  remainingPct: number;
}

interface TabProps {
  from: Dayjs;
  to: Dayjs;
  granularity: Granularity;
}

const STATUS_ORDER = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
];

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PROCESSING: 'Đang xử lý',
  PACKED: 'Đã đóng gói',
  SHIPPED: 'Đang giao',
  DELIVERED: 'Hoàn tất',
  CANCELLED: 'Đã huỷ',
  RETURNED: 'Hoàn trả',
};

function toIso(d: Dayjs): string {
  return d.toISOString();
}

export function OperationsTab({ from, to }: TabProps) {
  const { message } = AntdApp.useApp();
  const fromIso = toIso(from.startOf('day'));
  const toIsoStr = toIso(to.endOf('day'));

  const summaryQ = useQuery<InventorySummary>({
    queryKey: ['reports', 'inventory-summary'],
    queryFn: async () => {
      const res = await api.get('/admin/reports/inventory-summary');
      return unwrap<InventorySummary>(res);
    },
  });

  const invCatQ = useQuery<{ items: InventoryCategoryRow[] }>({
    queryKey: ['reports', 'inventory-by-category'],
    queryFn: async () => {
      const res = await api.get('/admin/reports/inventory-by-category');
      return unwrap<{ items: InventoryCategoryRow[] }>(res);
    },
  });

  const lowStockQ = useQuery<{ items: LowStockItem[] }>({
    queryKey: ['reports', 'low-stock', 10, 5],
    queryFn: async () => {
      const res = await api.get('/admin/reports/low-stock', {
        params: { threshold: 10, limit: 5 },
      });
      return unwrap<{ items: LowStockItem[] }>(res);
    },
  });

  const statusQ = useQuery<{ items: OrderStatusRow[] }>({
    queryKey: ['reports', 'orders-status', fromIso, toIsoStr],
    queryFn: async () => {
      const res = await api.get('/admin/reports/orders/status-breakdown', {
        params: { from: fromIso, to: toIsoStr },
      });
      return unwrap<{ items: OrderStatusRow[] }>(res);
    },
  });

  const cancelQ = useQuery<CancelRate>({
    queryKey: ['reports', 'cancel-rate', fromIso, toIsoStr],
    queryFn: async () => {
      const res = await api.get('/admin/reports/orders/cancel-rate', {
        params: { from: fromIso, to: toIsoStr },
      });
      return unwrap<CancelRate>(res);
    },
  });

  const voucherQ = useQuery<{ items: VoucherRow[] }>({
    queryKey: ['reports', 'vouchers-usage', fromIso, toIsoStr],
    queryFn: async () => {
      const res = await api.get('/admin/reports/vouchers/usage', {
        params: { from: fromIso, to: toIsoStr },
      });
      return unwrap<{ items: VoucherRow[] }>(res);
    },
  });

  const invBars = useMemo(() => {
    const rows = (invCatQ.data?.items ?? []).slice(0, 10);
    const max = rows.reduce((m, r) => (r.totalValue > m ? r.totalValue : m), 0);
    return rows.map((r) => ({
      label: r.categoryName,
      value: r.totalValue,
      valueDisplay: `${formatVnd(r.totalValue)} · ${r.totalQuantity}`,
      max,
    }));
  }, [invCatQ.data]);

  const orderedStatuses = useMemo(() => {
    const map = new Map((statusQ.data?.items ?? []).map((r) => [r.status, r]));
    const total = (statusQ.data?.items ?? []).reduce((s, r) => s + r.count, 0);
    return STATUS_ORDER.filter((s) => map.has(s)).map((s) => ({
      status: s,
      row: map.get(s)!,
      total,
    }));
  }, [statusQ.data]);

  const handleExport = async (type: string, format: 'csv' | 'xlsx') => {
    const filename = `${type}-${from.format('YYYYMMDD')}-${to.format('YYYYMMDD')}.${format}`;
    try {
      const params = {
        type,
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

  const sortedVouchers = useMemo(
    () => [...(voucherQ.data?.items ?? [])].sort((a, b) => b.totalDiscount - a.totalDiscount),
    [voucherQ.data],
  );

  return (
    <div className="report-grid-split">
      {/* LEFT — Inventory */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="report-grid-2">
          <StatCard
            icon={<DatabaseOutlined />}
            label="Tổng tựa sách"
            value={summaryQ.data?.totalTitles ?? 0}
            tone="ink"
          />
          <StatCard
            icon={<AppstoreOutlined />}
            label="Tổng số lượng tồn"
            value={summaryQ.data?.totalQuantity ?? 0}
            tone="soft"
          />
          <StatCard
            icon={<AlertOutlined />}
            label="Sắp hết hàng"
            value={summaryQ.data?.lowStockCount ?? 0}
            tone="primary"
          />
          <StatCard
            icon={<DollarCircleOutlined />}
            label="Giá trị kho"
            value={formatVnd(summaryQ.data?.totalValue ?? 0)}
            tone="primary"
          />
        </div>

        <div style={cardStyle}>
          <div className="eyebrow" style={{ color: 'var(--color-primary)' }}>
            Kho
          </div>
          <h3 style={titleStyle}>Giá trị tồn theo danh mục</h3>
          {invCatQ.isLoading ? (
            <Skeleton active paragraph={{ rows: 5 }} />
          ) : (
            <HBarList rows={invBars} />
          )}
        </div>

        <div style={cardStyle}>
          <div className="eyebrow" style={{ color: 'var(--color-primary)' }}>
            Cảnh báo tồn kho
          </div>
          <h3 style={titleStyle}>Sách sắp hết (top 5)</h3>
          {lowStockQ.isLoading ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : (lowStockQ.data?.items ?? []).length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
              Không có sản phẩm nào sắp hết.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(lowStockQ.data?.items ?? []).map((b) => (
                <div
                  key={b.id}
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                  }}
                >
                  <BookCover
                    src={b.primaryImage}
                    alt={b.title}
                    width={36}
                    height={48}
                    iconSize={14}
                    borderRadius={4}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: 'var(--color-ink)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {b.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
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
                    }}
                  >
                    Còn {b.stockQuantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT — Orders + Vouchers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={cardStyle}>
          <div style={cardHeader}>
            <div>
              <div className="eyebrow" style={{ color: 'var(--color-primary)' }}>
                Đơn hàng
              </div>
              <h3 style={titleStyle}>Phân bố trạng thái</h3>
            </div>
            <Dropdown
              menu={{
                items: [
                  { key: 'csv', label: 'CSV (orders-status)', onClick: () => handleExport('orders-status', 'csv') },
                  { key: 'xlsx', label: 'Excel (orders-status)', onClick: () => handleExport('orders-status', 'xlsx') },
                ],
              }}
            >
              <Button icon={<DownloadOutlined />} size="small">
                Xuất
              </Button>
            </Dropdown>
          </div>
          {statusQ.isLoading ? (
            <Skeleton active paragraph={{ rows: 5 }} />
          ) : orderedStatuses.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
              Không có dữ liệu.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {orderedStatuses.map(({ status, row }) => (
                <div
                  key={status}
                  style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: 'var(--color-ink)' }}>
                      {STATUS_LABEL[status] ?? status}
                    </span>
                    <span style={{ color: 'var(--color-muted)' }}>
                      {row.count} · {row.pct.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: 8,
                      background: 'var(--color-soft)',
                      borderRadius: 999,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.max(2, row.pct)}%`,
                        height: '100%',
                        background:
                          status === 'CANCELLED' || status === 'RETURNED'
                            ? 'var(--color-primary)'
                            : 'linear-gradient(90deg, #1A1A1A 0%, #4A4A4A 100%)',
                        borderRadius: 999,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          {cancelQ.data ? (
            <div
              style={{
                display: 'inline-flex',
                alignSelf: 'flex-start',
                gap: 8,
                background: 'rgba(200,16,46,0.08)',
                color: 'var(--color-primary)',
                padding: '6px 12px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <span>Cancel rate</span>
              <span>{cancelQ.data.ratePct.toFixed(2)}%</span>
              <span style={{ color: 'var(--color-muted)' }}>
                ({cancelQ.data.cancelled}/{cancelQ.data.totalCreated})
              </span>
            </div>
          ) : null}
        </div>

        <div style={cardStyle}>
          <div style={cardHeader}>
            <div>
              <div className="eyebrow" style={{ color: 'var(--color-primary)' }}>
                Voucher
              </div>
              <h3 style={titleStyle}>Hiệu suất mã giảm giá</h3>
            </div>
            <Dropdown
              menu={{
                items: [
                  { key: 'csv', label: 'CSV (voucher-usage)', onClick: () => handleExport('voucher-usage', 'csv') },
                  { key: 'xlsx', label: 'Excel (voucher-usage)', onClick: () => handleExport('voucher-usage', 'xlsx') },
                  { type: 'divider' },
                  { key: 'inv-csv', label: 'CSV (inventory-detail)', onClick: () => handleExport('inventory-detail', 'csv') },
                  { key: 'inv-xlsx', label: 'Excel (inventory-detail)', onClick: () => handleExport('inventory-detail', 'xlsx') },
                ],
              }}
            >
              <Button icon={<DownloadOutlined />} size="small">
                Xuất
              </Button>
            </Dropdown>
          </div>
          <Table<VoucherRow>
            rowKey="voucherId"
            loading={voucherQ.isLoading}
            dataSource={sortedVouchers}
            pagination={false}
            size="small"
            scroll={{ x: 'max-content' }}
            columns={[
              {
                title: 'Code',
                dataIndex: 'code',
                render: (v: string) => (
                  <Tag
                    style={{
                      background: 'rgba(200,16,46,0.1)',
                      color: 'var(--color-primary)',
                      border: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {v}
                  </Tag>
                ),
              },
              {
                title: 'Loại',
                dataIndex: 'type',
                width: 120,
                render: (v: string) => (
                  <span style={{ fontSize: 12 }}>{v}</span>
                ),
              },
              {
                title: 'Giá trị',
                dataIndex: 'value',
                width: 100,
                align: 'right',
                render: (v: number, row) =>
                  row.type === 'PERCENTAGE' ? `${v}%` : formatVnd(v),
              },
              {
                title: 'Đã dùng',
                key: 'used',
                width: 140,
                render: (_: unknown, row) => {
                  const used = row.usedCount;
                  const total = row.totalQuantity;
                  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 12 }}>
                        {used}/{total}
                      </span>
                      <Progress
                        percent={pct}
                        showInfo={false}
                        size="small"
                        strokeColor="#C8102E"
                      />
                    </div>
                  );
                },
              },
              {
                title: 'Tổng đã giảm',
                dataIndex: 'totalDiscount',
                width: 140,
                align: 'right',
                render: (v: number) => (
                  <span style={{ fontWeight: 600 }}>{formatVnd(v)}</span>
                ),
              },
              {
                title: 'Còn lại',
                dataIndex: 'remainingPct',
                width: 90,
                align: 'right',
                render: (v: number) => `${v.toFixed(0)}%`,
              },
            ]}
          />
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
  fontSize: 20,
  fontWeight: 700,
  color: 'var(--color-ink)',
  margin: '4px 0 0',
};

export default OperationsTab;
