'use client';

import { useQuery } from '@tanstack/react-query';
import {
  App as AntdApp,
  Button,
  Dropdown,
  Segmented,
  Select,
  Skeleton,
  Table,
  Tag,
} from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { api, extractErrorMessage, unwrap } from '@/lib/api';
import { downloadCsv, downloadXlsx } from '@/lib/download-csv';
import { formatVnd } from '@/lib/format';
import { BookCover } from '@/components/book-cover';
import type { Granularity } from '@/components/editorial';

interface TabProps {
  from: Dayjs;
  to: Dayjs;
  granularity: Granularity;
}

type SortKey = 'revenue' | 'units' | 'asc';

interface ProductRow {
  bookId: string;
  title: string;
  slug: string;
  primaryImage: string | null;
  authorName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  unitsSold: number;
  revenue: number;
  avgPrice: number;
  stockQuantity: number;
}

interface PaginatedResponse {
  items: ProductRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface SlowMover {
  id: string;
  title: string;
  slug: string;
  primaryImage: string | null;
  authorName: string | null;
  unitsSold: number;
  stockQuantity: number;
}

interface CategoryNode {
  id: string;
  name: string;
  slug?: string;
  children?: CategoryNode[];
}

function flattenCategories(nodes: CategoryNode[], depth = 0): {
  value: string;
  label: string;
}[] {
  const out: { value: string; label: string }[] = [];
  for (const n of nodes) {
    out.push({ value: n.id, label: `${'— '.repeat(depth)}${n.name}` });
    if (n.children?.length) {
      out.push(...flattenCategories(n.children, depth + 1));
    }
  }
  return out;
}

function toIso(d: Dayjs): string {
  return d.toISOString();
}

export function ProductsTab({ from, to }: TabProps) {
  const { message } = AntdApp.useApp();
  const [sort, setSort] = useState<SortKey>('revenue');
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const pageSize = 10;
  const fromIso = toIso(from.startOf('day'));
  const toIsoStr = toIso(to.endOf('day'));

  const categoriesQ = useQuery<CategoryNode[]>({
    queryKey: ['reports', 'categories-tree'],
    queryFn: async () => {
      const res = await api.get('/admin/categories/tree');
      return unwrap<CategoryNode[]>(res);
    },
  });

  const listQ = useQuery<PaginatedResponse>({
    queryKey: ['reports', 'products-paginated', fromIso, toIsoStr, sort, page, categoryId],
    queryFn: async () => {
      const res = await api.get('/admin/reports/products-paginated', {
        params: {
          from: fromIso,
          to: toIsoStr,
          sort,
          page,
          limit: pageSize,
          categoryId,
        },
      });
      return unwrap<PaginatedResponse>(res);
    },
  });

  const slowQ = useQuery<{ items: SlowMover[] }>({
    queryKey: ['reports', 'slow-movers', fromIso, toIsoStr],
    queryFn: async () => {
      const res = await api.get('/admin/reports/slow-movers', {
        params: { from: fromIso, to: toIsoStr, limit: 10 },
      });
      return unwrap<{ items: SlowMover[] }>(res);
    },
  });

  const categoryOptions = useMemo(
    () => (categoriesQ.data ? flattenCategories(categoriesQ.data) : []),
    [categoriesQ.data],
  );

  const handleExport = async (format: 'csv' | 'xlsx') => {
    const filename = `top-products-${from.format('YYYYMMDD')}-${to.format('YYYYMMDD')}.${format}`;
    try {
      const params = {
        type: 'top-products',
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

  const items = listQ.data?.items ?? [];
  const rankBase = (page - 1) * pageSize;

  return (
    <div className="report-grid-main">
      <div style={cardStyle}>
        <div style={cardHeader}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--color-primary)' }}>
              Sản phẩm
            </div>
            <h3 style={titleStyle}>Hiệu suất sản phẩm</h3>
          </div>
          <Dropdown
            menu={{
              items: [
                { key: 'csv', label: 'CSV (top-products)', onClick: () => handleExport('csv') },
                { key: 'xlsx', label: 'Excel (top-products)', onClick: () => handleExport('xlsx') },
              ],
            }}
          >
            <Button icon={<DownloadOutlined />}>Xuất báo cáo</Button>
          </Dropdown>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Select
            allowClear
            placeholder="Danh mục"
            style={{ minWidth: 220 }}
            value={categoryId}
            onChange={(v) => {
              setCategoryId(v);
              setPage(1);
            }}
            options={categoryOptions}
            loading={categoriesQ.isLoading}
          />
          <Segmented
            value={sort}
            onChange={(v) => {
              setSort(v as SortKey);
              setPage(1);
            }}
            options={[
              { label: 'Doanh thu', value: 'revenue' },
              { label: 'Số lượng', value: 'units' },
              { label: 'Bán chậm', value: 'asc' },
            ]}
          />
        </div>

        <Table<ProductRow>
          rowKey="bookId"
          loading={listQ.isLoading}
          dataSource={items}
          scroll={{ x: 880 }}
          pagination={{
            current: page,
            pageSize,
            total: listQ.data?.total ?? 0,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
          }}
          columns={[
            {
              title: '#',
              key: 'rank',
              width: 56,
              render: (_: unknown, _row: ProductRow, i: number) => (
                <span style={{ color: 'var(--color-muted)' }}>{rankBase + i + 1}</span>
              ),
            },
            {
              title: 'Sách',
              key: 'book',
              render: (_: unknown, row) => (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <BookCover
                    src={row.primaryImage}
                    alt={row.title}
                    size="sm"
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-ink)' }}>
                      {row.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                      {row.authorName ?? '—'}
                    </div>
                  </div>
                </div>
              ),
            },
            {
              title: 'Danh mục',
              dataIndex: 'categoryName',
              width: 160,
              render: (v: string | null) =>
                v ? (
                  <Tag
                    style={{
                      background: 'var(--color-soft)',
                      border: '1px solid var(--color-divider)',
                      color: 'var(--color-ink)',
                    }}
                  >
                    {v}
                  </Tag>
                ) : (
                  '—'
                ),
            },
            {
              title: 'Đã bán',
              dataIndex: 'unitsSold',
              width: 100,
              align: 'right',
              render: (v: number) => <span style={{ fontWeight: 600 }}>{v}</span>,
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
              title: 'AOV',
              dataIndex: 'avgPrice',
              width: 130,
              align: 'right',
              render: (v: number) => formatVnd(v),
            },
            {
              title: 'Tồn',
              dataIndex: 'stockQuantity',
              width: 80,
              align: 'right',
              render: (v: number) => (
                <span style={{ color: v <= 10 ? 'var(--color-primary)' : 'var(--color-ink)' }}>
                  {v}
                </span>
              ),
            },
          ]}
        />
      </div>

      <div style={cardStyle}>
        <div className="eyebrow" style={{ color: 'var(--color-primary)' }}>
          Bán chậm
        </div>
        <h3 style={titleStyle}>Sách bán chậm</h3>
        {slowQ.isLoading ? (
          <Skeleton active paragraph={{ rows: 5 }} />
        ) : (slowQ.data?.items ?? []).length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
            Không có dữ liệu.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(slowQ.data?.items ?? []).map((b) => (
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

export default ProductsTab;
