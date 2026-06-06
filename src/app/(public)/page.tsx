'use client';

import { useQuery } from '@tanstack/react-query';
import { Button, Col, Row } from 'antd';
import {
  BookOutlined,
  BulbOutlined,
  ExperimentOutlined,
  HeartOutlined,
  ReadOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api, unwrap } from '@/lib/api';
import { BookCard } from '@/components/book-card';
import { BookCardSkeleton } from '@/components/book-card-skeleton';
import {
  CategoryChip,
  EmptyState,
  SectionHeading,
} from '@/components/editorial';
import { formatVnd } from '@/lib/format';
import { resolveImageUrl } from '@/lib/image-url';
import { useResponsive } from '@/lib/use-responsive';
import type { BookListItem, Category, PageEnvelope } from '@/lib/types';

/* --------------------------------------------------------------------------
 * HERO
 * ------------------------------------------------------------------------ */
function EditorialHero() {
  const { isSmDown } = useResponsive();
  return (
    <section
      style={{
        background: 'var(--color-soft)',
        borderRadius: 16,
        padding: 'clamp(24px, 5vw, 56px)',
        marginTop: 8,
        overflow: 'hidden',
      }}
    >
      <Row gutter={[48, 32]} align="middle">
        <Col xs={24} md={12}>
          <div
            className="eyebrow"
            style={{ marginBottom: 16 }}
          >
            Sự kiện đặc biệt
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-serif), Georgia, serif',
              fontSize: 'clamp(28px, 6vw, 56px)',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.015em',
              margin: 0,
              color: 'var(--color-ink)',
            }}
          >
            Ngày hội sách 2026
          </h1>
          <p
            style={{
              marginTop: 20,
              fontSize: 16,
              lineHeight: 1.7,
              color: 'var(--color-text)',
              maxWidth: 460,
            }}
          >
            Hàng nghìn đầu sách văn học, kỹ năng và giáo trình giảm đến 50%. Ghé
            The Editorial — nơi mỗi trang sách là một cuộc hẹn.
          </p>
          <div
            style={{
              marginTop: 28,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <Link href="/books">
              <Button type="primary" size="large">
                Khám phá ngay
              </Button>
            </Link>
            <Button size="large" ghost={false} type="default">
              Xem lịch trình
            </Button>
          </div>
        </Col>
        {/* Hide hero image on extra-small screens to save real estate. */}
        {isSmDown ? null : (
          <Col xs={24} md={12}>
            <div
              style={{
                position: 'relative',
                borderRadius: 16,
                overflow: 'hidden',
                aspectRatio: '4 / 3',
                background: '#fff',
                boxShadow: '0 18px 60px rgba(26,26,26,0.14)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=900&q=60"
                alt="Ngày hội sách 2026"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
          </Col>
        )}
      </Row>
    </section>
  );
}

/* --------------------------------------------------------------------------
 * FLASH SALE
 * TODO phase 2: replace static countdown with real timer based on promo.
 * ------------------------------------------------------------------------ */
function CountdownChip({ value, unit }: { value: string; unit: string }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 56,
        padding: '6px 10px',
        borderRadius: 10,
        background: 'var(--color-ink)',
        color: '#fff',
        fontFamily: 'var(--font-serif), Georgia, serif',
        lineHeight: 1,
      }}
    >
      <span style={{ fontSize: 20, fontWeight: 700 }}>{value}</span>
      <span
        style={{
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          marginTop: 4,
          color: 'rgba(255,255,255,0.68)',
          fontFamily: 'var(--font-sans), sans-serif',
        }}
      >
        {unit}
      </span>
    </div>
  );
}

function FlashSaleFeatured({ book }: { book: BookListItem }) {
  const priceNum = Number(book.price) || 0;
  const discountNum = book.discountPrice ? Number(book.discountPrice) : null;
  const hasDiscount = discountNum && discountNum > 0 && discountNum < priceNum;
  const pct = hasDiscount
    ? Math.round(((priceNum - discountNum!) / priceNum) * 100)
    : 0;

  return (
    <Link
      href={`/books/${book.slug}`}
      style={{
        display: 'block',
        color: 'inherit',
        textDecoration: 'none',
        background: '#fff',
        borderRadius: 16,
        border: '1px solid var(--color-divider)',
        overflow: 'hidden',
        height: '100%',
      }}
    >
      <Row gutter={0} style={{ height: '100%' }}>
        <Col xs={24} sm={12}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '4 / 5',
              background: 'var(--color-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {book.primaryImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveImageUrl(book.primaryImage)}
                alt={book.title}
                style={{
                  maxWidth: '78%',
                  maxHeight: '86%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 18px 30px rgba(0,0,0,0.22))',
                }}
              />
            ) : (
              <BookOutlined style={{ fontSize: 48, color: '#C8C6C1' }} />
            )}
            {hasDiscount ? (
              <span
                style={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  background: 'var(--color-primary)',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: '0.04em',
                }}
              >
                -{pct}%
              </span>
            ) : (
              <span
                style={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  background: 'var(--color-ink)',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Bán chạy
              </span>
            )}
          </div>
        </Col>
        <Col xs={24} sm={12}>
          <div
            style={{
              padding: 28,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <div className="eyebrow" style={{ marginBottom: 10 }}>
              Ưu đãi hôm nay
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-serif), Georgia, serif',
                fontSize: 26,
                fontWeight: 700,
                color: 'var(--color-ink)',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {book.title}
            </h3>
            <div
              style={{
                color: 'var(--color-muted)',
                fontSize: 13,
                marginTop: 6,
              }}
            >
              {book.authors.map((a) => a.name).join(', ') ||
                'Tác giả chưa cập nhật'}
            </div>
            <div
              style={{
                marginTop: 18,
                display: 'flex',
                alignItems: 'baseline',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  color: 'var(--color-primary)',
                  fontWeight: 700,
                  fontSize: 24,
                }}
              >
                {formatVnd(hasDiscount ? discountNum! : priceNum)}
              </span>
              {hasDiscount ? (
                <span
                  style={{
                    color: 'var(--color-muted)',
                    textDecoration: 'line-through',
                    fontSize: 15,
                  }}
                >
                  {formatVnd(priceNum)}
                </span>
              ) : null}
            </div>
            <div style={{ marginTop: 22 }}>
              <Button type="primary" size="large">
                Mua ngay
              </Button>
            </div>
          </div>
        </Col>
      </Row>
    </Link>
  );
}

function useCountdownToEndOfDay() {
  const [time, setTime] = useState({ h: '00', m: '00', s: '00' });

  useEffect(() => {
    const compute = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      let diff = Math.max(0, end.getTime() - now.getTime());
      const h = Math.floor(diff / 3_600_000);
      diff -= h * 3_600_000;
      const m = Math.floor(diff / 60_000);
      diff -= m * 60_000;
      const s = Math.floor(diff / 1000);
      setTime({
        h: String(h).padStart(2, '0'),
        m: String(m).padStart(2, '0'),
        s: String(s).padStart(2, '0'),
      });
    };
    compute();
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, []);

  return time;
}

function FlashSaleSection({ books }: { books: BookListItem[] }) {
  const countdown = useCountdownToEndOfDay();
  if (books.length === 0) return null;
  const featured = books[0];
  const rest = books.slice(1, 3);

  return (
    <section style={{ marginTop: 56 }}>
      <SectionHeading
        eyebrow="Ưu đãi giới hạn"
        title="Flash Sale"
        trailing={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CountdownChip value={countdown.h} unit="Giờ" />
              <span
                style={{
                  color: 'var(--color-muted)',
                  fontWeight: 700,
                  fontSize: 18,
                }}
              >
                :
              </span>
              <CountdownChip value={countdown.m} unit="Phút" />
              <span
                style={{
                  color: 'var(--color-muted)',
                  fontWeight: 700,
                  fontSize: 18,
                }}
              >
                :
              </span>
              <CountdownChip value={countdown.s} unit="Giây" />
            </div>
            <Link
              href="/books?sort=newest"
              style={{
                color: 'var(--color-primary)',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Xem tất cả →
            </Link>
          </div>
        }
      />
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <FlashSaleFeatured book={featured} />
        </Col>
        <Col xs={24} lg={12}>
          <Row gutter={[24, 24]} style={{ height: '100%' }}>
            {rest.map((b) => (
              <Col xs={24} sm={12} key={b.id}>
                <BookCard book={b} />
              </Col>
            ))}
          </Row>
        </Col>
      </Row>
    </section>
  );
}

/* --------------------------------------------------------------------------
 * CATEGORIES
 * ------------------------------------------------------------------------ */
const FALLBACK_CATEGORY_ICONS = [
  <BookOutlined key="b" />,
  <ReadOutlined key="r" />,
  <BulbOutlined key="bl" />,
  <ExperimentOutlined key="e" />,
  <HeartOutlined key="h" />,
  <ShoppingOutlined key="s" />,
];

function FeaturedCategories() {
  const { isMobile } = useResponsive();
  const { data } = useQuery({
    queryKey: ['home-categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return unwrap<Category[]>(res);
    },
  });
  const items = (data ?? []).slice(0, 5);
  if (items.length === 0) return null;

  // On mobile use a horizontally-scrollable strip so chips remain a single row.
  if (isMobile) {
    return (
      <section style={{ marginTop: 56 }}>
        <SectionHeading
          eyebrow="Duyệt theo sở thích"
          title="Danh mục nổi bật"
          subtitle="Những chủ đề được bạn đọc The Editorial quan tâm nhất trong tháng."
          align="center"
        />
        <div
          style={{
            display: 'flex',
            gap: 12,
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 6,
            // Negative margin pulls the scroll container to the page gutter so
            // the user can see content extending past the edge.
            marginLeft: -4,
            marginRight: -4,
            paddingLeft: 4,
            paddingRight: 4,
          }}
        >
          {items.map((c, i) => (
            <div key={c.id} style={{ flex: '0 0 auto' }}>
              <CategoryChip
                icon={
                  FALLBACK_CATEGORY_ICONS[i % FALLBACK_CATEGORY_ICONS.length]
                }
                label={c.name}
                href={`/books?categoryId=${c.id}`}
              />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section style={{ marginTop: 72 }}>
      <SectionHeading
        eyebrow="Duyệt theo sở thích"
        title="Danh mục nổi bật"
        subtitle="Những chủ đề được bạn đọc The Editorial quan tâm nhất trong tháng."
        align="center"
      />
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          justifyContent: 'center',
        }}
      >
        {items.map((c, i) => (
          <CategoryChip
            key={c.id}
            icon={
              FALLBACK_CATEGORY_ICONS[i % FALLBACK_CATEGORY_ICONS.length]
            }
            label={c.name}
            href={`/books?categoryId=${c.id}`}
          />
        ))}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
 * BOOK GRID (newest / bestselling)
 * ------------------------------------------------------------------------ */
function BookGrid({
  title,
  eyebrow,
  sort,
  trailing,
}: {
  title: string;
  eyebrow?: string;
  sort: 'newest' | 'bestselling';
  trailing?: React.ReactNode;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['home-books', sort],
    queryFn: async () => {
      const res = await api.get('/books', {
        params: { sort, limit: 10 },
      });
      return unwrap<PageEnvelope<BookListItem>>(res);
    },
  });

  const items = data?.items.slice(0, 5) ?? [];

  return (
    <section style={{ marginTop: 72 }}>
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        trailing={
          trailing ?? (
            <Link
              href={`/books?sort=${sort}`}
              style={{
                color: 'var(--color-primary)',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Xem tất cả →
            </Link>
          )
        }
      />
      {isLoading ? (
        <Row gutter={[24, 32]}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Col xs={12} sm={12} md={8} lg={{ span: 24 / 5 }} key={i}>
              <BookCardSkeleton />
            </Col>
          ))}
        </Row>
      ) : items.length === 0 ? (
        <EmptyState title="Chưa có sách" description="Hãy quay lại sau." />
      ) : (
        <Row gutter={[24, 32]}>
          {items.map((b) => (
            <Col xs={12} sm={12} md={8} lg={{ span: 24 / 5 }} key={b.id}>
              <BookCard book={b} />
            </Col>
          ))}
        </Row>
      )}
    </section>
  );
}

function BestsellerSection() {
  // Visual-only scope toggle. TODO phase 2: actually filter by week/month.
  const [scope, setScope] = useState<'week' | 'month'>('week');
  const toggleStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.04em',
    cursor: 'pointer',
    border: '1px solid var(--color-divider)',
    background: active ? 'var(--color-ink)' : '#fff',
    color: active ? '#fff' : 'var(--color-muted)',
    transition: 'all 0.2s ease',
  });
  return (
    <BookGrid
      eyebrow="Độc giả yêu thích"
      title="Sách bán chạy"
      sort="bestselling"
      trailing={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span
            role="button"
            style={toggleStyle(scope === 'week')}
            onClick={() => setScope('week')}
          >
            Tuần này
          </span>
          <span
            role="button"
            style={toggleStyle(scope === 'month')}
            onClick={() => setScope('month')}
          >
            Tháng này
          </span>
          <Link
            href="/books?sort=bestselling"
            style={{
              color: 'var(--color-primary)',
              fontWeight: 600,
              fontSize: 14,
              marginLeft: 6,
            }}
          >
            Xem tất cả →
          </Link>
        </div>
      }
    />
  );
}

/* --------------------------------------------------------------------------
 * HOME
 * ------------------------------------------------------------------------ */
function FlashSaleLoader() {
  const { data, isLoading } = useQuery({
    queryKey: ['home-flash'],
    queryFn: async () => {
      const res = await api.get('/books', { params: { limit: 12 } });
      return unwrap<PageEnvelope<BookListItem>>(res);
    },
  });

  const books = useMemo(() => {
    if (!data) return [];
    const withDiscount = data.items.filter((b) => {
      if (!b.discountPrice) return false;
      const d = Number(b.discountPrice);
      const p = Number(b.price);
      return d > 0 && d < p;
    });
    if (withDiscount.length >= 3) return withDiscount.slice(0, 3);
    return data.items.slice(0, 3);
  }, [data]);

  if (isLoading) {
    return (
      <section style={{ marginTop: 56 }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <div
              style={{
                background: '#fff',
                border: '1px solid var(--color-divider)',
                borderRadius: 16,
                padding: 20,
                display: 'flex',
                gap: 20,
              }}
            >
              <div style={{ flex: 1, maxWidth: '50%' }}>
                <BookCardSkeleton />
              </div>
              <div style={{ flex: 1 }}>
                <BookCardSkeleton />
              </div>
            </div>
          </Col>
          <Col xs={24} lg={12}>
            <Row gutter={[24, 24]}>
              {Array.from({ length: 2 }).map((_, i) => (
                <Col xs={24} sm={12} key={i}>
                  <BookCardSkeleton />
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </section>
    );
  }
  return <FlashSaleSection books={books} />;
}

export default function HomePage() {
  return (
    <div style={{ paddingBottom: 32 }}>
      <EditorialHero />
      <FlashSaleLoader />
      <FeaturedCategories />
      <BookGrid
        eyebrow="Vừa lên kệ"
        title="Sách mới nhất"
        sort="newest"
      />
      <BestsellerSection />
    </div>
  );
}
