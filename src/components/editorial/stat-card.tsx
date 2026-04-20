'use client';

import type { CSSProperties, ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  delta?: number;
  tone?: 'primary' | 'ink' | 'soft';
}

const TONE_BG: Record<NonNullable<StatCardProps['tone']>, string> = {
  primary: 'rgba(200, 16, 46, 0.08)',
  ink: 'rgba(26, 26, 26, 0.06)',
  soft: '#F7F5F2',
};
const TONE_FG: Record<NonNullable<StatCardProps['tone']>, string> = {
  primary: '#C8102E',
  ink: '#1A1A1A',
  soft: '#1A1A1A',
};

export function StatCard({
  icon,
  label,
  value,
  delta,
  tone = 'primary',
}: StatCardProps) {
  const cardStyle: CSSProperties = {
    background: '#fff',
    border: '1px solid var(--color-divider)',
    borderRadius: 12,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  };
  const iconStyle: CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 10,
    background: TONE_BG[tone],
    color: TONE_FG[tone],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
  };
  const labelStyle: CSSProperties = {
    color: 'var(--color-muted)',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 500,
  };
  const valueStyle: CSSProperties = {
    fontFamily: 'var(--font-serif), Georgia, serif',
    fontSize: 30,
    fontWeight: 700,
    color: 'var(--color-ink)',
    lineHeight: 1.1,
  };
  const deltaColor =
    delta === undefined
      ? 'transparent'
      : delta >= 0
      ? 'var(--color-success)'
      : 'var(--color-primary)';
  const deltaBg =
    delta === undefined
      ? 'transparent'
      : delta >= 0
      ? 'rgba(47, 133, 90, 0.1)'
      : 'rgba(200, 16, 46, 0.1)';
  const deltaStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 10px',
    borderRadius: 999,
    background: deltaBg,
    color: deltaColor,
    fontSize: 12,
    fontWeight: 600,
  };
  return (
    <div style={cardStyle}>
      <div style={iconStyle}>{icon}</div>
      <div style={labelStyle}>{label}</div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <span style={valueStyle}>{value}</span>
        {delta !== undefined ? (
          <span style={deltaStyle}>
            {delta >= 0 ? '+' : ''}
            {delta}%
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default StatCard;
