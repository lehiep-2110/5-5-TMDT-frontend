'use client';

import type { CSSProperties } from 'react';

/**
 * Matches BookCard dimensions so grids do not reflow when data arrives.
 * Layout mirror:
 *   - 3:4 cover chip on cream background (rounded-12)
 *   - author eyebrow (~45% width, 11px)
 *   - 2-line serif title (~70% width)
 *   - price line (~35% width, 18px)
 *
 * Uses a subtle shimmer via CSS @keyframes editorial-shimmer. The animation
 * is defined once as an injected <style> tag so the component stays fully
 * self-contained.
 */
export function BookCardSkeleton() {
  const coverStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    aspectRatio: '3 / 4',
    borderRadius: 12,
    background: 'var(--color-soft, #F0EDE8)',
    overflow: 'hidden',
  };

  const bar = (width: string | number, height: number, marginTop: number): CSSProperties => ({
    width,
    height,
    borderRadius: 4,
    marginTop,
    background: 'var(--color-soft, #F0EDE8)',
    position: 'relative',
    overflow: 'hidden',
  });

  return (
    <>
      <ShimmerStyles />
      <div className="book-skeleton" aria-hidden="true" style={{ display: 'block' }}>
        <div className="book-skeleton-shimmer" style={coverStyle} />
        <div style={{ padding: '14px 4px 4px' }}>
          <div className="book-skeleton-shimmer" style={bar('45%', 11, 0)} />
          <div className="book-skeleton-shimmer" style={bar('80%', 14, 12)} />
          <div className="book-skeleton-shimmer" style={bar('60%', 14, 6)} />
          <div className="book-skeleton-shimmer" style={bar('35%', 18, 14)} />
        </div>
      </div>
    </>
  );
}

/**
 * Large skeleton for the BookDetail page gallery+info split.
 */
export function BookDetailSkeleton() {
  const leftCover: CSSProperties = {
    width: '100%',
    maxWidth: 520,
    aspectRatio: '3 / 4',
    background: 'var(--color-soft, #F0EDE8)',
    borderRadius: 16,
  };
  const bar = (width: string | number, height: number, marginTop: number): CSSProperties => ({
    width,
    height,
    borderRadius: 6,
    marginTop,
    background: 'var(--color-soft, #F0EDE8)',
    position: 'relative',
    overflow: 'hidden',
  });
  const btn: CSSProperties = {
    width: 160,
    height: 46,
    borderRadius: 8,
    background: 'var(--color-soft, #F0EDE8)',
    position: 'relative',
    overflow: 'hidden',
  };

  return (
    <>
      <ShimmerStyles />
      <div
        aria-hidden="true"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 13fr) minmax(0, 11fr)',
          gap: 48,
          alignItems: 'start',
        }}
        className="book-detail-skeleton"
      >
        <div>
          <div className="book-skeleton-shimmer" style={leftCover} />
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginTop: 16,
            }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="book-skeleton-shimmer"
                style={{
                  width: 84,
                  height: 110,
                  borderRadius: 10,
                  background: 'var(--color-soft, #F0EDE8)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              />
            ))}
          </div>
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="book-skeleton-shimmer" style={bar('30%', 12, 0)} />
          <div className="book-skeleton-shimmer" style={bar('90%', 36, 16)} />
          <div className="book-skeleton-shimmer" style={bar('60%', 18, 18)} />
          <div className="book-skeleton-shimmer" style={bar('40%', 16, 10)} />
          <div className="book-skeleton-shimmer" style={bar('35%', 38, 28)} />
          <div style={{ display: 'flex', gap: 12, marginTop: 22, flexWrap: 'wrap' }}>
            <div className="book-skeleton-shimmer" style={btn} />
            <div className="book-skeleton-shimmer" style={btn} />
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .book-detail-skeleton {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </>
  );
}

/**
 * Thin row-style skeleton that matches the compact cart / order line layout:
 * 64x88 cover skeleton on the left, two text bars on the right.
 */
export function BookListRowSkeleton() {
  const cover: CSSProperties = {
    width: 72,
    height: 96,
    background: 'var(--color-soft, #F0EDE8)',
    borderRadius: 8,
    flex: '0 0 auto',
    position: 'relative',
    overflow: 'hidden',
  };
  const bar = (width: string | number, height: number, marginTop: number): CSSProperties => ({
    width,
    height,
    borderRadius: 4,
    marginTop,
    background: 'var(--color-soft, #F0EDE8)',
    position: 'relative',
    overflow: 'hidden',
  });
  return (
    <>
      <ShimmerStyles />
      <div
        aria-hidden="true"
        style={{
          display: 'flex',
          gap: 18,
          alignItems: 'center',
          padding: '16px 0',
          borderBottom: '1px solid var(--color-divider)',
        }}
      >
        <div className="book-skeleton-shimmer" style={cover} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="book-skeleton-shimmer" style={bar('65%', 16, 0)} />
          <div className="book-skeleton-shimmer" style={bar('35%', 12, 10)} />
        </div>
        <div className="book-skeleton-shimmer" style={bar(110, 18, 0)} />
      </div>
    </>
  );
}

/**
 * Shared shimmer keyframes + gradient overlay.
 * Injected once per page; React dedupes identical <style> content in the
 * document. Kept scoped via the `.book-skeleton-shimmer` class.
 */
function ShimmerStyles() {
  return (
    <style>{`
      @keyframes editorial-shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      .book-skeleton-shimmer::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.55) 50%,
          transparent 100%
        );
        animation: editorial-shimmer 1.6s ease-in-out infinite;
        pointer-events: none;
      }
    `}</style>
  );
}

export default BookCardSkeleton;
