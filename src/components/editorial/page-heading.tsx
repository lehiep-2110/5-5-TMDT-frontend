'use client';

import type { CSSProperties, ReactNode } from 'react';

interface PageHeadingProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  trailing?: ReactNode;
}

export function PageHeading({
  title,
  subtitle,
  eyebrow,
  trailing,
}: PageHeadingProps) {
  const wrapperStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 24,
    flexWrap: 'wrap',
    paddingBottom: 20,
    borderBottom: '1px solid var(--color-divider)',
    marginBottom: 32,
  };
  const titleStyle: CSSProperties = {
    fontFamily: 'var(--font-serif), Georgia, serif',
    fontWeight: 700,
    fontSize: 'clamp(26px, 6vw, 40px)',
    lineHeight: 1.15,
    color: 'var(--color-ink)',
    margin: 0,
    letterSpacing: '-0.01em',
  };
  const subStyle: CSSProperties = {
    marginTop: 10,
    color: 'var(--color-muted)',
    fontSize: 15,
    maxWidth: 680,
  };
  return (
    <div style={wrapperStyle}>
      <div>
        {eyebrow ? (
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            {eyebrow}
          </div>
        ) : null}
        <h1 style={titleStyle}>{title}</h1>
        {subtitle ? <div style={subStyle}>{subtitle}</div> : null}
      </div>
      {trailing ? <div>{trailing}</div> : null}
    </div>
  );
}

export default PageHeading;
