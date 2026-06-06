'use client';

import { App as AntdApp } from 'antd';
import {
  BookOutlined,
  HeartFilled,
  HeartOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';
import { useState } from 'react';
import { resolveImageUrl } from '@/lib/image-url';
import { formatVnd } from '@/lib/format';
import { useAuthStore } from '@/lib/auth-store';
import { useToggleWishlist, useWishlistIds } from '@/lib/wishlist-hooks';
import type { BookListItem } from '@/lib/types';

interface BookCardProps {
  book: BookListItem;
  /** Optional top-left badge. Overrides the auto discount badge. */
  badge?: ReactNode;
  /** Hide the hover lift effect (useful in very dense grids). */
  compact?: boolean;
  /** Hide the heart (e.g. already on the wishlist page where a trash button is shown). */
  hideWishlist?: boolean;
}

/**
 * Editorial-style portrait card.
 * Layout: 3:4 cover on cream chip → eyebrow (author) → serif title (2-line) → price.
 */
export function BookCard({
  book,
  badge,
  compact = false,
  hideWishlist = false,
}: BookCardProps) {
  const [hovered, setHovered] = useState(false);
  const [imgErrored, setImgErrored] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { message } = AntdApp.useApp();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const { ids: wishlistIds } = useWishlistIds();
  const toggle = useToggleWishlist();

  const priceNum = Number(book.price) || 0;
  const discountNum = book.discountPrice ? Number(book.discountPrice) : null;
  const hasDiscount =
    discountNum !== null &&
    Number.isFinite(discountNum) &&
    discountNum > 0 &&
    discountNum < priceNum;
  const pct = hasDiscount
    ? Math.round(((priceNum - discountNum!) / priceNum) * 100)
    : 0;

  const authorLine =
    book.authors.map((a) => a.name).join(', ') || 'Tác giả chưa cập nhật';

  // Only customers (or guests) see the heart. Staff/admin never need a
  // shopping affordance on book cards.
  const showHeart =
    !hideWishlist && (!user || user.role === 'CUSTOMER');
  const isWishlisted = wishlistIds.has(book.id);

  // Hover lift is handled via CSS so it only triggers on (hover: hover) devices.
  // We keep box-shadow toggling here because that depends on JS hover state for
  // the cover image specifically.
  const cardStyle: CSSProperties = {
    display: 'block',
    textDecoration: 'none',
    color: 'inherit',
    minWidth: 0,
  };

  const coverWrap: CSSProperties = {
    position: 'relative',
    width: '100%',
    aspectRatio: '3 / 4',
    borderRadius: 12,
    background: 'var(--color-soft)',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: hovered
      ? '0 18px 40px rgba(26, 26, 26, 0.12)'
      : '0 2px 6px rgba(26, 26, 26, 0.04)',
    transition: 'box-shadow 220ms ease',
  };

  const imgStyle: CSSProperties = {
    maxWidth: '82%',
    maxHeight: '88%',
    objectFit: 'contain',
    filter: 'drop-shadow(0 10px 18px rgba(26,26,26,0.18))',
  };

  const badgeStyle: CSSProperties = {
    position: 'absolute',
    top: 12,
    left: 12,
    padding: '4px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    background: 'var(--color-primary)',
    color: '#fff',
    lineHeight: 1.4,
  };

  const heartBtnStyle: CSSProperties = {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.9)',
    border: '1px solid rgba(0,0,0,0.06)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: isWishlisted ? 'var(--color-primary)' : 'var(--color-muted)',
    fontSize: 16,
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    transition: 'transform 150ms ease',
    zIndex: 2,
  };

  const eyebrow: CSSProperties = {
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    fontSize: 11,
    color: 'var(--color-muted)',
    fontWeight: 600,
    marginBottom: 6,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    minWidth: 0,
  };

  const titleStyle: CSSProperties = {
    fontFamily: 'var(--font-serif), Georgia, serif',
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.25,
    color: 'var(--color-ink)',
    margin: 0,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    minHeight: 40,
    minWidth: 0,
    wordBreak: 'break-word',
  };

  const priceRow: CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  };

  const handleHeart = (e: React.MouseEvent) => {
    // The heart sits inside the <Link>, so stop the click from navigating.
    e.preventDefault();
    e.stopPropagation();
    if (!accessToken) {
      message.info('Vui lòng đăng nhập');
      const redirect = encodeURIComponent(pathname ?? '/');
      router.push(`/login?redirect=${redirect}`);
      return;
    }
    toggle.mutate(book.id);
  };

  const cardClassName = compact
    ? 'book-card'
    : 'book-card book-card-interactive';

  return (
    <Link
      href={`/books/${book.slug}`}
      className={cardClassName}
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={coverWrap}>
        {book.primaryImage && !imgErrored ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveImageUrl(book.primaryImage)}
            alt={book.title}
            style={imgStyle}
            onError={() => setImgErrored(true)}
          />
        ) : (
          <BookOutlined
            style={{ fontSize: 32, color: '#C8C6C1' }}
            aria-label={book.title}
          />
        )}
        {badge ? (
          <span style={badgeStyle}>{badge}</span>
        ) : hasDiscount ? (
          <span style={badgeStyle}>-{pct}%</span>
        ) : null}
        {showHeart ? (
          <button
            type="button"
            aria-label={isWishlisted ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
            aria-pressed={isWishlisted}
            onClick={handleHeart}
            disabled={toggle.isPending}
            style={heartBtnStyle}
          >
            {isWishlisted ? <HeartFilled /> : <HeartOutlined />}
          </button>
        ) : null}
      </div>
      <div style={{ padding: '14px 4px 4px', minWidth: 0 }}>
        <div className="book-card-eyebrow" style={eyebrow}>
          {authorLine}
        </div>
        <h3 className="book-card-title" style={titleStyle}>
          {book.title}
        </h3>
        <div style={priceRow}>
          <span
            className="book-card-price"
            style={{
              color: 'var(--color-primary)',
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            {formatVnd(hasDiscount ? discountNum! : priceNum)}
          </span>
          {hasDiscount ? (
            <span
              className="book-card-price-original"
              style={{
                color: 'var(--color-muted)',
                fontSize: 13,
                textDecoration: 'line-through',
              }}
            >
              {formatVnd(priceNum)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
