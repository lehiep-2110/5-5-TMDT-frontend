'use client';

import type { CSSProperties, ReactNode } from 'react';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  trailing?: ReactNode;
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  trailing,
}: SectionHeadingProps) {
  const wrapperStyle: CSSProperties = {
    display: 'flex',
    alignItems: align === 'center' ? 'center' : 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
    marginBottom: 24,
    flexDirection: align === 'center' ? 'column' : 'row',
    textAlign: align,
  };
  const titleStyle: CSSProperties = {
    fontFamily: 'var(--font-serif), Georgia, serif',
    fontWeight: 700,
    fontSize: 'clamp(22px, 5vw, 32px)',
    lineHeight: 1.15,
    color: 'var(--color-ink)',
    margin: 0,
    letterSpacing: '-0.01em',
  };
  const subStyle: CSSProperties = {
    marginTop: 8,
    color: 'var(--color-muted)',
    fontSize: 15,
    maxWidth: 640,
  };
  return (
    <div style={wrapperStyle}>
      <div>
        {eyebrow ? (
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            {eyebrow}
          </div>
        ) : null}
        <h2 style={titleStyle}>{title}</h2>
        {subtitle ? <div style={subStyle}>{subtitle}</div> : null}
      </div>
      {trailing ? <div>{trailing}</div> : null}
    </div>
  );
}

export default SectionHeading;
