'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Card,
  InputNumber,
  List,
  Pagination,
  Popover,
  Select,
  Table,
  Tag,
} from 'antd';
import { useResponsive } from '@/lib/use-responsive';
import {
  AppstoreOutlined,
  BookOutlined,
  DatabaseOutlined,
  EditOutlined,
  FilterOutlined,
  InboxOutlined,
  PlusOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { api, unwrap } from '@/lib/api';
import { formatVnd } from '@/lib/format';
import { BookCover } from '@/components/book-cover';
import { PageHeading, StatCard } from '@/components/editorial';
import type {
  BookListItem,
  BookStatus,
  PageEnvelope,
} from '@/lib/types';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface InventoryBookItem extends BookListItem {
  // Re-uses admin-books listing; tolerate missing fields.
}

const PAGE_SIZE = 12;

function cardStyle(): React.CSSProperties {
  return {
    background: '#fff',
    border: '1px solid var(--color-divider)',
    borderRadius: 12,
    boxShadow: '0 1px 2px rgba(26,26,26,0.03)',
  };
}

function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return '0';
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} tỉ`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} tr`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

function StockBar({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color =
    value === 0
      ? 'var(--color-primary)'
      : value < 10
      ? 'var(--color-warning)'
      : 'var(--color-success)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          flex: 1,
          height: 6,
          borderRadius: 999,
          background: 'var(--color-divider)',
          position: 'relative',
          overflow: 'hidden',
          minWidth: 80,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${pct}%`,
            background: color,
            borderRadius: 999,
          }}
        />
      </div>
      <span
        style={{
          fontWeight: 600,
          color: value === 0 ? 'var(--color-primary)' : 'var(--color-ink)',
          fontSize: 13,
          minWidth: 32,
          textAlign: 'right',
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function AdminInventoryPage() {
  const { isMobile, screens } = useResponsive();
  const isLgDown = !screens.lg;
  const isMdDown = !screens.md;
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(
    undefined,
  );
  const [minStock, setMinStock] = useState<number | null>(null);
  const [maxStock, setMaxStock] = useState<number | null>(null);
  const [jumpPage, setJumpPage] = useState<number | null>(null);

  const categoriesQ = useQuery({
    queryKey: ['categories-flat'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return unwrap<Category[]>(res);
    },
  });

  const booksQ = useQuery({
    queryKey: ['admin-books', 'inventory', { categoryFilter, page }],
    queryFn: async () => {
      const res = await api.get('/admin/books', {
        params: {
          categoryId: categoryFilter || undefined,
          page,
          limit: PAGE_SIZE,
        },
      });
      return unwrap<PageEnvelope<InventoryBookItem>>(res);
    },
  });

  const warehouseAggQ = useQuery({
    queryKey: ['admin-books', 'inventory-agg'],
    queryFn: async () => {
      const res = await api.get('/admin/books', { params: { limit: 200 } });
      return unwrap<PageEnvelope<InventoryBookItem>>(res);
    },
  });

  const totalTitlesQ = useQuery({
    queryKey: ['admin-books', 'total'],
    queryFn: async () => {
      const res = await api.get('/admin/books', { params: { limit: 1 } });
      return unwrap<PageEnvelope<InventoryBookItem>>(res);
    },
  });

  const lowStockCountQ = useQuery({
    queryKey: ['inventory', 'low-count'],
    queryFn: async () => {
      const res = await api.get('/inventory', {
        params: { lowStockOnly: 'true', limit: 1 },
      });
      return unwrap<{ total: number }>(res);
    },
  });

  const aggregates = useMemo(() => {
    const items = warehouseAggQ.data?.items ?? [];
    let totalQty = 0;
    let totalValue = 0;
    for (const b of items) {
      totalQty += b.stockQuantity ?? 0;
      totalValue += (b.stockQuantity ?? 0) * Number(b.price ?? 0);
    }
    return { totalQty, totalValue };
  }, [warehouseAggQ.data]);

  const filteredRows = useMemo(() => {
    const rows = booksQ.data?.items ?? [];
    return rows.filter((r) => {
      if (minStock !== null && r.stockQuantity < minStock) return false;
      if (maxStock !== null && r.stockQuantity > maxStock) return false;
      return true;
    });
  }, [booksQ.data, minStock, maxStock]);

  const filterContent = (
    <div style={{ minWidth: 240, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--color-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          Danh mục
        </div>
        <Select
          allowClear
          value={categoryFilter}
          onChange={(v) => {
            setPage(1);
            setCategoryFilter(v);
          }}
          placeholder="Tất cả danh mục"
          style={{ width: '100%' }}
          options={(categoriesQ.data ?? []).map((c) => ({
            value: c.id,
            label: c.name,
          }))}
        />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 11,
              color: 'var(--color-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Tồn tối thiểu
          </div>
          <InputNumber
            min={0}
            value={minStock ?? undefined}
            onChange={(v) => setMinStock(v ?? null)}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 11,
              color: 'var(--color-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Tồn tối đa
          </div>
          <InputNumber
            min={0}
            value={maxStock ?? undefined}
            onChange={(v) => setMaxStock(v ?? null)}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <PageHeading
        title="Quản Lý Kho Hàng"
        subtitle="Theo dõi và cập nhật số lượng tồn kho theo thời gian thực."
        trailing={
          <Link href="/admin/books">
            <Button type="primary" icon={<PlusOutlined />}>
              Thêm sách mới
            </Button>
          </Link>
        }
      />

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile
            ? '1fr'
            : isLgDown
            ? 'repeat(2, minmax(0, 1fr))'
            : 'repeat(4, minmax(0, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard
          icon={<BookOutlined />}
          label="Tổng tựa sách"
          value={totalTitlesQ.data?.total ?? 0}
          tone="ink"
        />
        <StatCard
          icon={<DatabaseOutlined />}
          label="Tổng số lượng tồn"
          value={formatCompact(aggregates.totalQty)}
          tone="primary"
        />
        <StatCard
          icon={<WarningOutlined />}
          label="Sắp hết hàng"
          value={lowStockCountQ.data?.total ?? 0}
          tone="primary"
        />
        <StatCard
          icon={<AppstoreOutlined />}
          label="Giá trị kho"
          value={
            aggregates.totalValue > 1_000_000_000
              ? `${(aggregates.totalValue / 1_000_000_000).toFixed(1)} tỉ VNĐ`
              : formatVnd(aggregates.totalValue)
          }
          tone="ink"
        />
      </div>

      {/* Toolbar */}
      <div
        style={{
          ...cardStyle(),
          padding: 16,
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <Popover
          content={filterContent}
          title="Bộ lọc nâng cao"
          trigger="click"
          placement="bottomLeft"
        >
          <Button icon={<FilterOutlined />}>Bộ lọc</Button>
        </Popover>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: 'var(--color-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Hiển thị
          </span>
          <Select
            allowClear
            value={categoryFilter}
            onChange={(v) => {
              setPage(1);
              setCategoryFilter(v);
            }}
            placeholder="Tất cả danh mục"
            style={{ minWidth: 220 }}
            options={(categoriesQ.data ?? []).map((c) => ({
              value: c.id,
              label: c.name,
            }))}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ ...cardStyle(), padding: isMobile ? 12 : 8, marginBottom: 24 }}>
        {isMdDown ? (
          <>
            <List<InventoryBookItem>
              loading={booksQ.isLoading}
              dataSource={filteredRows}
              rowKey="id"
              renderItem={(row) => (
                <List.Item
                  style={{
                    padding: 12,
                    marginBottom: 8,
                    border: '1px solid var(--color-divider)',
                    borderRadius: 10,
                    display: 'block',
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <BookCover src={row.primaryImage} alt={row.title} size="sm" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-ink)', fontFamily: 'var(--font-serif), Georgia, serif', fontSize: 14, marginBottom: 4 }}>
                        {row.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 8 }}>
                        {row.authors?.map((a) => a.name).join(', ') || '—'}
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <StockBar value={row.stockQuantity} max={100} />
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <strong style={{ color: 'var(--color-ink)' }}>{formatVnd(row.price)}</strong>
                        {row.status === 'ACTIVE' ? (
                          <Tag
                            style={{
                              background: 'rgba(47,133,90,0.1)',
                              color: 'var(--color-success)',
                              border: 'none',
                              margin: 0,
                            }}
                          >
                            Active
                          </Tag>
                        ) : (
                          <Tag
                            style={{
                              background: 'rgba(138,138,138,0.1)',
                              color: 'var(--color-muted)',
                              border: 'none',
                              margin: 0,
                            }}
                          >
                            Inactive
                          </Tag>
                        )}
                        <Link href="/admin/books">
                          <Button
                            type="text"
                            icon={<EditOutlined />}
                            aria-label="edit"
                          />
                        </Link>
                      </div>
                    </div>
                  </div>
                </List.Item>
              )}
            />
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                simple
                current={page}
                pageSize={PAGE_SIZE}
                total={booksQ.data?.total ?? 0}
                onChange={(p) => setPage(p)}
              />
            </div>
          </>
        ) : (
        <Table<InventoryBookItem>
          rowKey="id"
          loading={booksQ.isLoading}
          dataSource={filteredRows}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: booksQ.data?.total ?? 0,
            showSizeChanger: false,
            onChange: (p) => setPage(p),
          }}
          footer={() => (
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: 'var(--color-muted)',
              }}
            >
              <span>Chuyển đến trang:</span>
              <InputNumber
                size="small"
                min={1}
                max={booksQ.data?.totalPages ?? 1}
                value={jumpPage ?? undefined}
                onChange={(v) => setJumpPage(v ?? null)}
                onPressEnter={() => jumpPage && setPage(jumpPage)}
                style={{ width: 70 }}
              />
              <Button
                size="small"
                onClick={() => jumpPage && setPage(jumpPage)}
              >
                Đi
              </Button>
            </div>
          )}
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
                        fontFamily: 'var(--font-serif), Georgia, serif',
                        fontSize: 15,
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
                      {row.authors?.map((a) => a.name).join(', ') || '—'}
                    </div>
                  </div>
                </div>
              ),
            },
            {
              title: 'ISBN',
              dataIndex: 'isbn',
              width: 150,
              render: (v: string) => (
                <span
                  style={{
                    padding: '2px 8px',
                    background: 'var(--color-soft)',
                    borderRadius: 6,
                    fontSize: 12,
                    fontFamily: 'monospace',
                    color: 'var(--color-text)',
                  }}
                >
                  {v}
                </span>
              ),
            },
            {
              title: 'Danh mục',
              key: 'category',
              width: 150,
              render: (_: unknown, row) =>
                row.category ? (
                  <Tag
                    style={{
                      background: 'rgba(200,16,46,0.08)',
                      color: 'var(--color-primary)',
                      border: 'none',
                    }}
                  >
                    {row.category.name}
                  </Tag>
                ) : (
                  '—'
                ),
            },
            {
              title: 'Giá bán',
              dataIndex: 'price',
              width: 140,
              align: 'right',
              render: (v: string) => (
                <span style={{ fontWeight: 600 }}>{formatVnd(v)}</span>
              ),
            },
            {
              title: 'Tồn kho',
              dataIndex: 'stockQuantity',
              width: 200,
              render: (v: number) => <StockBar value={v} max={100} />,
            },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              width: 110,
              render: (s: BookStatus) =>
                s === 'ACTIVE' ? (
                  <Tag
                    style={{
                      background: 'rgba(47,133,90,0.1)',
                      color: 'var(--color-success)',
                      border: 'none',
                    }}
                  >
                    Active
                  </Tag>
                ) : (
                  <Tag
                    style={{
                      background: 'rgba(138,138,138,0.1)',
                      color: 'var(--color-muted)',
                      border: 'none',
                    }}
                  >
                    Inactive
                  </Tag>
                ),
            },
            {
              title: '',
              key: 'actions',
              width: 60,
              render: () => (
                <Link href="/admin/books">
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    aria-label="edit"
                  />
                </Link>
              ),
            },
          ]}
        />
        )}
      </div>

      {/* Promo / help cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isLgDown ? '1fr' : '1fr 1fr',
          gap: 16,
        }}
      >
        <div
          style={{
            ...cardStyle(),
            background: 'var(--color-primary)',
            borderColor: 'transparent',
            color: '#fff',
            padding: 28,
          }}
        >
          <div
            className="eyebrow"
            style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 10 }}
          >
            <InboxOutlined /> &nbsp; Tối ưu kho
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-serif), Georgia, serif',
              fontSize: 24,
              margin: '0 0 10px',
              color: '#fff',
              fontWeight: 700,
            }}
          >
            Tối ưu hoá kho hàng
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.88)', marginBottom: 20 }}>
            Phân tích tốc độ bán, đề xuất tái nhập hàng và cảnh báo sớm cho
            những tựa sách đang thiếu.
          </p>
          <Button
            style={{
              background: '#fff',
              color: 'var(--color-primary)',
              borderColor: '#fff',
              fontWeight: 600,
            }}
          >
            Xem chi tiết
          </Button>
        </div>
        <div style={{ ...cardStyle(), padding: 28 }}>
          <div
            className="eyebrow"
            style={{ color: 'var(--color-primary)', marginBottom: 10 }}
          >
            Hướng dẫn
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-serif), Georgia, serif',
              fontSize: 22,
              margin: '0 0 14px',
              color: 'var(--color-ink)',
              fontWeight: 700,
            }}
          >
            Hướng dẫn nhanh
          </h3>
          <ol
            style={{
              paddingLeft: 20,
              margin: 0,
              color: 'var(--color-text)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              fontSize: 14,
            }}
          >
            <li>Lọc danh sách theo danh mục hoặc khoảng tồn để thu hẹp phạm vi.</li>
            <li>Nhấn vào biểu tượng chỉnh sửa để cập nhật thông tin sách & tồn.</li>
            <li>
              Theo dõi thẻ <strong>Sắp hết hàng</strong> ở đầu trang để phản ứng
              kịp thời.
            </li>
            <li>Xuất báo cáo chi tiết sẽ ra mắt trong phase 2.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
