'use client';

import { BookOutlined } from '@ant-design/icons';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { useState } from 'react';
import { resolveImageUrl } from '@/lib/image-url';
import { formatVnd } from '@/lib/format';
import type { BookListItem } from '@/lib/types';

interface BookCardProps {
  book: BookListItem;
  /** Optional top-left badge. Overrides the auto discount badge. */
  badge?: ReactNode;
  /** Hide the hover lift effect (useful in very dense grids). */
  compact?: boolean;
}

/**
 * Editorial-style portrait card.
 * Layout: 3:4 cover on cream chip → eyebrow (author) → serif title (2-line) → price.
 */
export function BookCard({ book, badge, compact = false }: BookCardProps) {
  const [hovered, setHovered] = useState(false);
  const [imgErrored, setImgErrored] = useState(false);

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

  const cardStyle: CSSProperties = {
    display: 'block',
    textDecoration: 'none',
    color: 'inherit',
    transform: hovered && !compact ? 'translateY(-4px)' : 'translateY(0)',
    transition: 'transform 220ms ease, box-shadow 220ms ease',
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
  };

  const priceRow: CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  };

  return (
    <Link
      href={`/books/${book.slug}`}
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
      </div>
      <div style={{ padding: '14px 4px 4px' }}>
        <div style={eyebrow}>{authorLine}</div>
        <h3 style={titleStyle}>{book.title}</h3>
        <div style={priceRow}>
          <span
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
