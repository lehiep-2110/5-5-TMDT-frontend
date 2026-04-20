'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Breadcrumb,
  Checkbox,
  Col,
  Pagination,
  Radio,
  Row,
  Segmented,
  Slider,
} from 'antd';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { api, unwrap } from '@/lib/api';
import { BookCard } from '@/components/book-card';
import { BookCardSkeleton } from '@/components/book-card-skeleton';
import { EmptyState, PageHeading } from '@/components/editorial';
import { formatVnd } from '@/lib/format';
import type {
  BookListItem,
  Category,
  PageEnvelope,
} from '@/lib/types';

const PAGE_LIMIT = 8;
const PRICE_MAX = 2_000_000;

type SortValue = 'newest' | 'bestselling' | 'price_asc' | 'price_desc';

interface AuthorItem {
  id: string;
  name: string;
  bookCount?: number;
}

/* --------------------------------------------------------------------------
 * Filter group header helper
 * ------------------------------------------------------------------------ */
function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div
        className="eyebrow"
        style={{
          color: 'var(--color-ink)',
          fontSize: 12,
          marginBottom: 14,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

/* --------------------------------------------------------------------------
 * Inner (URL-driven) page
 * ------------------------------------------------------------------------ */
function BooksListingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const keyword = searchParams.get('keyword') ?? '';
  const categoryId = searchParams.get('categoryId') ?? undefined;
  const minPriceRaw = searchParams.get('minPrice');
  const maxPriceRaw = searchParams.get('maxPrice');
  const sort = (searchParams.get('sort') as SortValue | null) ?? 'newest';
  const page = Number(searchParams.get('page')) || 1;

  const minPrice = minPriceRaw !== null ? Number(minPriceRaw) : 0;
  const maxPrice = maxPriceRaw !== null ? Number(maxPriceRaw) : PRICE_MAX;

  // Local range state so the Slider can move during drag; commits to URL onChangeComplete.
  const [rangeDraft, setRangeDraft] = useState<[number, number]>([
    minPrice,
    maxPrice,
  ]);
  useEffect(() => {
    setRangeDraft([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);

  // Multi-select authors — URL param `authors=id1,id2`. Filter client-side
  // because BE `/api/books` doesn't support OR-ing multiple authors yet.
  const authorIdsParam = searchParams.get('authors') ?? '';
  const selectedAuthorIds = useMemo(
    () => new Set(authorIdsParam.split(',').filter(Boolean)),
    [authorIdsParam],
  );
  const hasAuthorFilter = selectedAuthorIds.size > 0;

  const updateParams = (
    patch: Record<string, string | number | undefined | null>,
  ) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === null || value === '') {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    }
    if (!('page' in patch)) next.delete('page');
    router.push(`/books?${next.toString()}`);
  };

  const { data: categories } = useQuery({
    queryKey: ['categories-tree'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return unwrap<Category[]>(res);
    },
  });

  const { data: authors } = useQuery({
    queryKey: ['authors-top'],
    queryFn: async () => {
      const res = await api.get('/authors', { params: { limit: 8 } });
      return unwrap<PageEnvelope<AuthorItem>>(res);
    },
  });

  const queryParams = useMemo(
    () => ({
      keyword: keyword || undefined,
      categoryId,
      minPrice: minPrice > 0 ? minPrice : undefined,
      maxPrice: maxPrice < PRICE_MAX ? maxPrice : undefined,
      sort,
      // When filtering by authors client-side we fetch a larger set and paginate locally.
      page: hasAuthorFilter ? 1 : page,
      limit: hasAuthorFilter ? 200 : PAGE_LIMIT,
    }),
    [keyword, categoryId, minPrice, maxPrice, sort, page, hasAuthorFilter],
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['books-list', queryParams],
    queryFn: async () => {
      const res = await api.get('/books', { params: queryParams });
      return unwrap<PageEnvelope<BookListItem>>(res);
    },
  });

  const filteredItems = useMemo(() => {
    if (!data) return [];
    if (!hasAuthorFilter) return data.items;
    return data.items.filter((b) =>
      b.authors?.some((a) => selectedAuthorIds.has(a.id)),
    );
  }, [data, hasAuthorFilter, selectedAuthorIds]);

  const displayTotal = hasAuthorFilter ? filteredItems.length : data?.total ?? 0;
  const displayItems = hasAuthorFilter
    ? filteredItems.slice((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT)
    : data?.items ?? [];
  const total = displayTotal;
  const flatCategories = useMemo(() => {
    const flat: Category[] = [];
    const walk = (nodes: Category[]) => {
      for (const n of nodes) {
        flat.push(n);
        if (n.children?.length) walk(n.children);
      }
    };
    if (categories) walk(categories);
    return flat;
  }, [categories]);

  const currentCategoryName = useMemo(() => {
    if (!categoryId) return 'Bộ sưu tập';
    return (
      flatCategories.find((c) => c.id === categoryId)?.name ?? 'Bộ sưu tập'
    );
  }, [categoryId, flatCategories]);

  return (
    <div style={{ paddingBottom: 40 }}>
      <Breadcrumb
        style={{ marginBottom: 20, fontSize: 13 }}
        items={[
          { title: <Link href="/">Trang chủ</Link> },
          { title: currentCategoryName },
        ]}
      />

      <Row gutter={[40, 32]}>
        {/* -------------------------- SIDEBAR ----------------------------- */}
        <Col xs={24} md={7} lg={6} xl={5}>
          <aside
            style={{
              background: '#fff',
              border: '1px solid var(--color-divider)',
              borderRadius: 16,
              padding: 24,
              position: 'sticky',
              top: 96,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-serif), Georgia, serif',
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--color-ink)',
                marginBottom: 20,
              }}
            >
              Bộ lọc
            </div>

            <FilterGroup title="Danh mục">
              <ul
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <li>
                  <button
                    onClick={() =>
                      updateParams({ categoryId: undefined })
                    }
                    style={categoryButtonStyle(!categoryId)}
                  >
                    <span
                      style={{
                        width: 3,
                        height: 18,
                        background: !categoryId
                          ? 'var(--color-primary)'
                          : 'transparent',
                        marginRight: 10,
                        borderRadius: 2,
                      }}
                    />
                    Tất cả
                  </button>
                </li>
                {flatCategories.slice(0, 10).map((c) => {
                  const active = c.id === categoryId;
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() =>
                          updateParams({ categoryId: c.id })
                        }
                        style={categoryButtonStyle(active)}
                      >
                        <span
                          style={{
                            width: 3,
                            height: 18,
                            background: active
                              ? 'var(--color-primary)'
                              : 'transparent',
                            marginRight: 10,
                            borderRadius: 2,
                          }}
                        />
                        <span style={{ flex: 1, textAlign: 'left' }}>
                          {c.name}
                        </span>
                        <span
                          style={{
                            color: 'var(--color-muted)',
                            fontSize: 12,
                          }}
                        >
                          (24)
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </FilterGroup>

            <FilterGroup title="Khoảng giá">
              <Slider
                range
                min={0}
                max={PRICE_MAX}
                step={50000}
                value={rangeDraft}
                tooltip={{
                  formatter: (v) => formatVnd(v ?? 0),
                }}
                onChange={(val) =>
                  setRangeDraft(val as [number, number])
                }
                onChangeComplete={(val) => {
                  const [lo, hi] = val as [number, number];
                  updateParams({
                    minPrice: lo > 0 ? lo : undefined,
                    maxPrice: hi < PRICE_MAX ? hi : undefined,
                  });
                }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 4,
                  fontSize: 12,
                  color: 'var(--color-muted)',
                }}
              >
                <span>{formatVnd(rangeDraft[0])}</span>
                <span>{formatVnd(rangeDraft[1])}</span>
              </div>
            </FilterGroup>

            <FilterGroup title="Tác giả">
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {(authors?.items ?? []).slice(0, 8).map((a) => {
                  const checked = selectedAuthorIds.has(a.id);
                  return (
                    <Checkbox
                      key={a.id}
                      checked={checked}
                      onChange={(e) => {
                        const next = new Set(selectedAuthorIds);
                        if (e.target.checked) next.add(a.id);
                        else next.delete(a.id);
                        updateParams({
                          authors:
                            next.size > 0
                              ? Array.from(next).join(',')
                              : undefined,
                        });
                      }}
                    >
                      <span style={{ fontSize: 13 }}>{a.name}</span>
                    </Checkbox>
                  );
                })}
                {(!authors || authors.items.length === 0) && (
                  <span
                    style={{ color: 'var(--color-muted)', fontSize: 12 }}
                  >
                    Đang tải...
                  </span>
                )}
              </div>
            </FilterGroup>

            <FilterGroup title="Đánh giá">
              {/* TODO phase 2: wire rating filter */}
              <Radio.Group
                disabled
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <Radio value="5">
                  <span
                    style={{ color: 'var(--color-muted)', fontSize: 13 }}
                  >
                    Từ 5 sao
                  </span>
                </Radio>
                <Radio value="4">
                  <span
                    style={{ color: 'var(--color-muted)', fontSize: 13 }}
                  >
                    4 sao trở lên
                  </span>
                </Radio>
                <Radio value="3">
                  <span
                    style={{ color: 'var(--color-muted)', fontSize: 13 }}
                  >
                    3 sao trở lên
                  </span>
                </Radio>
              </Radio.Group>
            </FilterGroup>
          </aside>
        </Col>

        {/* -------------------------- CONTENT ----------------------------- */}
        <Col xs={24} md={17} lg={18} xl={19}>
          <PageHeading
            eyebrow={categoryId ? 'Danh mục' : 'Tuyển chọn'}
            title={currentCategoryName}
            subtitle={`Tìm thấy ${total} đầu sách đang có sẵn — được ban biên tập The Editorial tuyển chọn.`}
            trailing={
              <Segmented
                value={sort}
                onChange={(v) =>
                  updateParams({ sort: String(v) as SortValue })
                }
                options={[
                  { value: 'newest', label: 'Mới nhất' },
                  { value: 'bestselling', label: 'Bán chạy' },
                  { value: 'price_asc', label: 'Giá tăng' },
                  { value: 'price_desc', label: 'Giá giảm' },
                ]}
              />
            }
          />

          {isLoading ? (
            <Row gutter={[24, 32]}>
              {Array.from({ length: PAGE_LIMIT }).map((_, i) => (
                <Col xs={12} sm={8} lg={6} key={i}>
                  <BookCardSkeleton />
                </Col>
              ))}
            </Row>
          ) : !data || displayItems.length === 0 ? (
            <EmptyState
              title="Không tìm thấy sách phù hợp"
              description="Thử điều chỉnh bộ lọc hoặc khám phá danh mục khác."
            />
          ) : (
            <>
              <Row gutter={[24, 32]}>
                {displayItems.map((b) => (
                  <Col xs={12} sm={8} lg={6} key={b.id}>
                    <BookCard book={b} />
                  </Col>
                ))}
              </Row>
              <div
                style={{
                  marginTop: 40,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <Pagination
                  current={page}
                  pageSize={PAGE_LIMIT}
                  total={total}
                  showSizeChanger={false}
                  disabled={isFetching}
                  onChange={(p) => updateParams({ page: p })}
                />
              </div>
            </>
          )}
        </Col>
      </Row>
    </div>
  );
}

function categoryButtonStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '6px 0',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: active ? 'var(--color-ink)' : 'var(--color-text)',
    fontWeight: active ? 700 : 500,
    fontSize: 14,
    textAlign: 'left',
  };
}

function BooksListingFallback() {
  return (
    <div style={{ paddingBottom: 40 }}>
      <Row gutter={[40, 32]}>
        <Col xs={24} md={7} lg={6} xl={5}>
          <div
            style={{
              background: '#fff',
              border: '1px solid var(--color-divider)',
              borderRadius: 16,
              padding: 24,
              minHeight: 320,
            }}
          />
        </Col>
        <Col xs={24} md={17} lg={18} xl={19}>
          <Row gutter={[24, 32]}>
            {Array.from({ length: PAGE_LIMIT }).map((_, i) => (
              <Col xs={12} sm={8} lg={6} key={i}>
                <BookCardSkeleton />
              </Col>
            ))}
          </Row>
        </Col>
      </Row>
    </div>
  );
}

export default function BooksListingPage() {
  return (
    <Suspense fallback={<BooksListingFallback />}>
      <BooksListingInner />
    </Suspense>
  );
}
