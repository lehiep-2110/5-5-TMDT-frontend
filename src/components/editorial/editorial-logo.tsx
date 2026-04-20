'use client';

import type { CSSProperties } from 'react';

interface EditorialLogoProps {
  size?: 'md' | 'lg';
  subtitle?: string;
  color?: string;
}

const SIZE_MAP: Record<'md' | 'lg', { fontSize: number; tracking: number }> = {
  md: { fontSize: 18, tracking: 3 },
  lg: { fontSize: 26, tracking: 4 },
};

export function EditorialLogo({
  size = 'md',
  subtitle,
  color,
}: EditorialLogoProps) {
  const { fontSize, tracking } = SIZE_MAP[size];
  const wrapperStyle: CSSProperties = {
    display: 'inline-flex',
    flexDirection: 'column',
    lineHeight: 1,
    gap: 4,
  };
  const brandStyle: CSSProperties = {
    fontFamily: 'var(--font-serif), Georgia, serif',
    fontWeight: 700,
    fontSize,
    letterSpacing: `${tracking}px`,
    textTransform: 'uppercase',
    color: color ?? 'var(--color-ink)',
  };
  const subtitleStyle: CSSProperties = {
    fontFamily: 'var(--font-sans), sans-serif',
    fontSize: 10,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'var(--color-muted)',
    fontWeight: 500,
  };
  return (
    <span style={wrapperStyle} aria-label="The Editorial">
      <span style={brandStyle}>The Editorial</span>
      {subtitle ? <span style={subtitleStyle}>{subtitle}</span> : null}
    </span>
  );
}

export default EditorialLogo;
