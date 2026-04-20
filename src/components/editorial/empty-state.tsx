'use client';

import type { CSSProperties, ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  cta?: ReactNode;
}

export function EmptyState({ icon, title, description, cta }: EmptyStateProps) {
  const wrapperStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '48px 24px',
    background: 'var(--color-soft)',
    border: '1px solid var(--color-divider)',
    borderRadius: 12,
    gap: 12,
  };
  const iconWrap: CSSProperties = {
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: '#fff',
    border: '1px solid var(--color-divider)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    color: 'var(--color-muted)',
    marginBottom: 4,
  };
  const titleStyle: CSSProperties = {
    fontFamily: 'var(--font-serif), Georgia, serif',
    fontWeight: 700,
    fontSize: 22,
    color: 'var(--color-ink)',
    margin: 0,
  };
  const descStyle: CSSProperties = {
    color: 'var(--color-muted)',
    fontSize: 14,
    maxWidth: 420,
  };
  return (
    <div style={wrapperStyle}>
      {icon ? <div style={iconWrap}>{icon}</div> : null}
      <h3 style={titleStyle}>{title}</h3>
      {description ? <div style={descStyle}>{description}</div> : null}
      {cta ? <div style={{ marginTop: 8 }}>{cta}</div> : null}
    </div>
  );
}

export default EmptyState;
