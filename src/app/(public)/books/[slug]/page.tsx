'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App as AntdApp,
  Breadcrumb,
  Col,
  Descriptions,
  Empty,
  Row,
  Tabs,
  Typography,
} from 'antd';
import {
  BookOutlined,
  MinusOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  TruckOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { api, extractErrorMessage, unwrap } from '@/lib/api';
import { BookCard } from '@/components/book-card';
import {
  BookCardSkeleton,
  BookDetailSkeleton,
} from '@/components/book-card-skeleton';
import { SectionHeading } from '@/components/editorial';
import { resolveImageUrl } from '@/lib/image-url';
import { formatVnd } from '@/lib/format';
import { useAuthStore } from '@/lib/auth-store';
import type { BookDetail, BookListItem, PageEnvelope } from '@/lib/types';

const { Paragraph } = Typography;

export default function BookDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();

  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [heroErrored, setHeroErrored] = useState(false);
  const [thumbErrored, setThumbErrored] = useState<Record<string, boolean>>({});

  // Reset hero error when the active image changes so a new src re-tries loading.
  useEffect(() => {
    setHeroErrored(false);
  }, [activeImageIndex, slug]);

  const { data: book, isLoading } = useQuery({
    queryKey: ['book-detail', slug],
    enabled: !!slug,
    queryFn: async () => {
      const res = await api.get(`/books/${slug}`);
      return unwrap<BookDetail>(res);
    },
  });

  const relatedCategoryId = book?.category?.id;
  const { data: related } = useQuery({
    queryKey: ['book-related', relatedCategoryId, book?.id],
    enabled: !!relatedCategoryId,
    queryFn: async () => {
      const res = await api.get('/books', {
        params: { categoryId: relatedCategoryId, limit: 6 },
      });
      return unwrap<PageEnvelope<BookListItem>>(res);
    },
  });

  const addToCart = useMutation({
    mutationFn: async (vars: { bookId: string; quantity: number }) => {
      const res = await api.post('/cart/items', vars);
      return unwrap(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      message.success('Đã thêm vào giỏ hàng');
    },
    onError: (err) => {
      message.error(extractErrorMessage(err, 'Không thể thêm vào giỏ'));
    },
  });

  const images = useMemo(() => book?.images ?? [], [book?.images]);
  const currentImage = useMemo(() => {
    if (images.length === 0) return null;
    return images[Math.min(activeImageIndex, images.length - 1)].imageUrl;
  }, [images, activeImageIndex]);

  if (isLoading) {
    return (
      <div style={{ paddingBottom: 40 }}>
        <BookDetailSkeleton />
        <section style={{ marginTop: 64 }}>
          <Row gutter={[24, 32]}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Col xs={12} sm={8} md={6} lg={{ span: 24 / 5 }} key={i}>
                <BookCardSkeleton />
              </Col>
            ))}
          </Row>
        </section>
      </div>
    );
  }

  if (!book) {
    return <Empty description="Không tìm thấy sách" />;
  }

  const priceNum = Number(book.price) || 0;
  const discountNum = book.discountPrice ? Number(book.discountPrice) : null;
  const hasDiscount =
    discountNum !== null && discountNum > 0 && discountNum < priceNum;
  const pct = hasDiscount
    ? Math.round(((priceNum - discountNum!) / priceNum) * 100)
    : 0;

  const inStock = book.stockQuantity > 0 && book.status === 'ACTIVE';
  const relatedItems =
    related?.items.filter((b) => b.id !== book.id).slice(0, 5) ?? [];

  const eyebrowText = book.breadcrumb.length
    ? book.breadcrumb.map((b) => b.name).join(' / ').toUpperCase()
    : (book.category?.name ?? 'SÁCH').toUpperCase();

  const handleAddToCart = () => {
    if (!accessToken) {
      router.push(`/login?redirect=/books/${book.slug}`);
      return;
    }
    addToCart.mutate({ bookId: book.id, quantity });
  };

  const handleBuyNow = () => {
    if (!accessToken) {
      router.push(`/login?redirect=/books/${book.slug}`);
      return;
    }
    addToCart.mutate(
      { bookId: book.id, quantity },
      {
        onSuccess: () => router.push('/checkout'),
      },
    );
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      <Breadcrumb
        style={{ marginBottom: 24, fontSize: 13 }}
        items={[
          { title: <Link href="/">Trang chủ</Link> },
          ...book.breadcrumb.map((b) => ({
            title: (
              <Link href={`/books?categoryId=${b.id}`}>{b.name}</Link>
            ),
          })),
          { title: book.title },
        ]}
      />

      <Row gutter={[48, 32]}>
        {/* ------------------------ GALLERY ---------------------------- */}
        <Col xs={24} md={13}>
          <div
            style={{
              width: '100%',
              aspectRatio: '3 / 4',
              background: 'var(--color-soft)',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              marginBottom: 16,
            }}
          >
            {(currentImage || book.primaryImage) && !heroErrored ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveImageUrl(currentImage ?? book.primaryImage)}
                alt={book.title}
                onError={() => setHeroErrored(true)}
                style={{
                  maxWidth: '70%',
                  maxHeight: '82%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 26px 44px rgba(0,0,0,0.22))',
                }}
              />
            ) : (
              <BookOutlined style={{ fontSize: 64, color: '#C8C6C1' }} />
            )}
          </div>
          {images.length > 1 ? (
            <div
              style={{
                display: 'flex',
                gap: 12,
                overflowX: 'auto',
                paddingBottom: 4,
              }}
            >
              {images.slice(0, 4).map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  style={{
                    width: 84,
                    height: 110,
                    borderRadius: 10,
                    border:
                      idx === activeImageIndex
                        ? '2px solid var(--color-primary)'
                        : '1px solid var(--color-divider)',
                    background: 'var(--color-soft)',
                    cursor: 'pointer',
                    padding: 6,
                    flex: '0 0 auto',
                  }}
                >
                  {img.imageUrl && !thumbErrored[img.id] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveImageUrl(img.imageUrl)}
                      alt=""
                      onError={() =>
                        setThumbErrored((prev) => ({ ...prev, [img.id]: true }))
                      }
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  ) : (
                    <BookOutlined style={{ fontSize: 22, color: '#C8C6C1' }} />
                  )}
                </button>
              ))}
            </div>
          ) : null}
        </Col>

        {/* ------------------------ INFO ------------------------------- */}
        <Col xs={24} md={11}>
          <div
            className="eyebrow"
            style={{ marginBottom: 14, color: 'var(--color-muted)' }}
          >
            {eyebrowText}
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-serif), Georgia, serif',
              fontSize: 'clamp(28px, 4vw, 40px)',
              lineHeight: 1.15,
              fontWeight: 700,
              color: 'var(--color-ink)',
              margin: 0,
              letterSpacing: '-0.015em',
            }}
          >
            {book.title}
          </h1>

          <div style={{ marginTop: 16, fontSize: 14 }}>
            <span style={{ color: 'var(--color-muted)' }}>Tác giả: </span>
            {book.authors.length > 0
              ? book.authors.map((a, idx) => (
                  <span key={a.id}>
                    <Link
                      href={`/books?keyword=${encodeURIComponent(a.name)}`}
                      style={{
                        color: 'var(--color-ink)',
                        fontWeight: 600,
                        textDecoration: 'underline',
                        textUnderlineOffset: 3,
                      }}
                    >
                      {a.name}
                    </Link>
                    {idx < book.authors.length - 1 ? ', ' : null}
                  </span>
                ))
              : 'Đang cập nhật'}
          </div>
          {book.publisher ? (
            <div
              style={{
                marginTop: 6,
                fontSize: 14,
                color: 'var(--color-text)',
              }}
            >
              <span style={{ color: 'var(--color-muted)' }}>NXB: </span>
              {book.publisher.name}
            </div>
          ) : null}

          {/* Price */}
          <div
            style={{
              marginTop: 28,
              padding: '20px 0',
              borderTop: '1px solid var(--color-divider)',
              borderBottom: '1px solid var(--color-divider)',
              display: 'flex',
              alignItems: 'baseline',
              gap: 14,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                color: 'var(--color-primary)',
                fontFamily: 'var(--font-serif), Georgia, serif',
                fontSize: 38,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {formatVnd(hasDiscount ? discountNum! : priceNum)}
            </span>
            {hasDiscount ? (
              <>
                <span
                  style={{
                    color: 'var(--color-muted)',
                    textDecoration: 'line-through',
                    fontSize: 18,
                  }}
                >
                  {formatVnd(priceNum)}
                </span>
                <span
                  style={{
                    background: 'var(--color-primary)',
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  -{pct}%
                </span>
              </>
            ) : null}
          </div>

          {/* Quantity + CTA */}
          <div
            style={{
              marginTop: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <QuantityStepper
              value={quantity}
              max={Math.max(1, Math.min(10, book.stockQuantity))}
              onChange={setQuantity}
              disabled={!inStock}
            />
            <span
              style={{
                color: inStock ? 'var(--color-success)' : 'var(--color-primary)',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {inStock
                ? `Còn ${book.stockQuantity} cuốn`
                : 'Tạm hết hàng'}
            </span>
          </div>
          <div
            style={{
              marginTop: 20,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!inStock || addToCart.isPending}
              style={ctaButton('ghost', inStock)}
            >
              Thêm vào giỏ
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!inStock || addToCart.isPending}
              style={ctaButton('solid', inStock)}
            >
              Mua ngay
            </button>
          </div>

          {/* Trust inline */}
          <div
            style={{
              marginTop: 28,
              display: 'flex',
              gap: 24,
              color: 'var(--color-text)',
              fontSize: 13,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TruckOutlined
                style={{ color: 'var(--color-primary)', fontSize: 18 }}
              />
              Giao hàng toàn quốc
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SafetyCertificateOutlined
                style={{ color: 'var(--color-primary)', fontSize: 18 }}
              />
              Sách thật 100%
            </div>
          </div>
        </Col>
      </Row>

      {/* Tabs */}
      <section style={{ marginTop: 64 }}>
        <Tabs
          defaultActiveKey="desc"
          size="large"
          items={[
            {
              key: 'desc',
              label: 'Mô tả',
              children: (
                <Paragraph
                  style={{
                    whiteSpace: 'pre-line',
                    fontSize: 15,
                    lineHeight: 1.8,
                    color: 'var(--color-text)',
                    maxWidth: 820,
                  }}
                >
                  {book.description || 'Chưa có mô tả.'}
                </Paragraph>
              ),
            },
            {
              key: 'specs',
              label: 'Thông số',
              children: (
                <Descriptions
                  column={{ xs: 1, sm: 2 }}
                  bordered
                  size="small"
                >
                  <Descriptions.Item label="Số trang">
                    {book.pages ?? 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Kích thước">
                    {book.dimensions ?? 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Trọng lượng">
                    {book.weight ? `${book.weight} g` : 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngôn ngữ">
                    {book.language || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Năm xuất bản">
                    {book.yearPublished ?? 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="ISBN">
                    {book.isbn}
                  </Descriptions.Item>
                </Descriptions>
              ),
            },
            {
              key: 'reviews',
              label: `Đánh giá (${book.reviewCount})`,
              children: <Empty description="Chức năng ra mắt phase 2" />,
            },
          ]}
        />
      </section>

      {relatedItems.length > 0 ? (
        <section style={{ marginTop: 64 }}>
          <SectionHeading
            eyebrow="Bạn đọc cũng thích"
            title="Sách cùng thể loại"
          />
          <Row gutter={[24, 32]}>
            {relatedItems.slice(0, 5).map((b) => (
              <Col
                xs={12}
                sm={8}
                md={6}
                lg={{ span: 24 / 5 }}
                key={b.id}
              >
                <BookCard book={b} />
              </Col>
            ))}
          </Row>
        </section>
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------------------
 * Quantity stepper
 * ------------------------------------------------------------------------ */
function QuantityStepper({
  value,
  max,
  onChange,
  disabled,
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const btn: React.CSSProperties = {
    width: 36,
    height: 36,
    border: 'none',
    background: 'transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    color: 'var(--color-ink)',
    fontSize: 14,
  };
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        border: '1px solid var(--color-divider)',
        borderRadius: 8,
        background: '#fff',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <button
        type="button"
        style={btn}
        disabled={disabled || value <= 1}
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        <MinusOutlined />
      </button>
      <div
        style={{
          minWidth: 40,
          textAlign: 'center',
          fontWeight: 600,
          color: 'var(--color-ink)',
          borderLeft: '1px solid var(--color-divider)',
          borderRight: '1px solid var(--color-divider)',
          padding: '6px 0',
        }}
      >
        {value}
      </div>
      <button
        type="button"
        style={btn}
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <PlusOutlined />
      </button>
    </div>
  );
}

function ctaButton(variant: 'solid' | 'ghost', enabled: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '12px 28px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    cursor: enabled ? 'pointer' : 'not-allowed',
    transition: 'all 0.2s ease',
    minHeight: 46,
  };
  if (variant === 'solid') {
    return {
      ...base,
      background: enabled ? 'var(--color-primary)' : '#E8E8E8',
      color: '#fff',
      border: '1px solid transparent',
    };
  }
  return {
    ...base,
    background: '#fff',
    color: enabled ? 'var(--color-primary)' : 'var(--color-muted)',
    border: `1px solid ${enabled ? 'var(--color-primary)' : 'var(--color-divider)'}`,
  };
}
