'use client';

import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

interface CategoryChipProps {
  icon: ReactNode;
  label: string;
  href?: string;
  active?: boolean;
}

export function CategoryChip({
  icon,
  label,
  href,
  active = false,
}: CategoryChipProps) {
  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 18px',
    borderRadius: 999,
    border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-divider)'}`,
    background: active ? 'rgba(200, 16, 46, 0.06)' : '#fff',
    color: active ? 'var(--color-primary)' : 'var(--color-ink)',
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };
  const iconStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: active ? 'var(--color-primary)' : 'var(--color-muted)',
    fontSize: 16,
  };
  const content = (
    <span style={style}>
      <span style={iconStyle}>{icon}</span>
      <span>{label}</span>
    </span>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default CategoryChip;
