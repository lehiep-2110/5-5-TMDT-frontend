'use client';

import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { EditorialLogo } from '@/components/editorial';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const wrapper: CSSProperties = {
    minHeight: '100vh',
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    background: '#fff',
  };
  const leftPanel: CSSProperties = {
    position: 'relative',
    background: 'var(--color-soft)',
    padding: '48px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    overflow: 'hidden',
  };
  const rightPanel: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 32px',
  };
  const formCard: CSSProperties = {
    width: '100%',
    maxWidth: 440,
  };
  const imageWrap: CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
  };
  const overlay: CSSProperties = {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, rgba(247,245,242,0.3) 0%, rgba(247,245,242,0.9) 100%)',
    zIndex: 1,
  };
  const quoteWrap: CSSProperties = {
    position: 'relative',
    zIndex: 2,
    maxWidth: 520,
    marginTop: 'auto',
  };
  const quoteText: CSSProperties = {
    fontFamily: 'var(--font-serif), Georgia, serif',
    fontSize: 36,
    lineHeight: 1.25,
    color: 'var(--color-ink)',
    fontWeight: 700,
    letterSpacing: '-0.01em',
    margin: 0,
  };
  const quoteCite: CSSProperties = {
    marginTop: 16,
    color: 'var(--color-muted)',
    fontSize: 14,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 500,
  };

  return (
    <div style={wrapper}>
      <div style={leftPanel}>
        <div style={imageWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=60"
            alt="Stacked books"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'grayscale(0.1) contrast(0.95)',
            }}
          />
        </div>
        <div style={overlay} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Link href="/">
            <EditorialLogo size="lg" subtitle="Bookstore — est. 2024" />
          </Link>
        </div>
        <div style={quoteWrap}>
          <div
            className="eyebrow"
            style={{ marginBottom: 16, color: 'var(--color-primary)' }}
          >
            Trích từ biên tập viên
          </div>
          <p style={quoteText}>
            “Một cuốn sách hay không chỉ kể chuyện — nó dành cho người đọc
            một khoảng lặng để tự tìm thấy chính mình.”
          </p>
          <div style={quoteCite}>— The Editorial</div>
        </div>
      </div>
      <div style={rightPanel}>
        <div style={formCard}>{children}</div>
      </div>
    </div>
  );
}
