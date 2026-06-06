'use client';

import dayjs from 'dayjs';
import type { CSSProperties } from 'react';
import { useMemo } from 'react';

/* -------------------------------------------------------------------------- */
/*                                  LineChart                                 */
/* -------------------------------------------------------------------------- */

export interface LinePoint {
  date: string;
  value: number;
}

interface LineChartProps {
  points: LinePoint[];
  height?: number;
  color?: string;
  /** Optional formatter for the tooltip value (e.g. formatVnd). */
  formatValue?: (v: number) => string;
}

export function LineChart({
  points,
  height = 240,
  color = '#C8102E',
  formatValue,
}: LineChartProps) {
  const width = 800;
  const padX = 36;
  const padTop = 16;
  const padBottom = 28;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;

  const max = useMemo(
    () => Math.max(1, points.reduce((m, p) => (p.value > m ? p.value : m), 0)),
    [points],
  );

  if (points.length === 0) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-muted)',
          fontSize: 13,
        }}
      >
        Không có dữ liệu.
      </div>
    );
  }

  const xs = points.map((_, i) =>
    points.length === 1
      ? padX + innerW / 2
      : padX + (i * innerW) / (points.length - 1),
  );
  const ys = points.map((p) => padTop + innerH - (p.value / max) * innerH);

  const lineD = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${ys[i]}`).join(' ');
  const areaD =
    xs.length === 0
      ? ''
      : `M ${xs[0]} ${padTop + innerH} ` +
        xs.map((x, i) => `L ${x} ${ys[i]}`).join(' ') +
        ` L ${xs[xs.length - 1]} ${padTop + innerH} Z`;

  // Pick ~5 x-axis labels.
  const labelStride = Math.max(1, Math.ceil(points.length / 5));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      style={{ display: 'block' }}
    >
      {/* Y grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={padX}
          x2={padX + innerW}
          y1={padTop + innerH * (1 - t)}
          y2={padTop + innerH * (1 - t)}
          stroke="var(--color-divider)"
          strokeWidth={1}
          strokeDasharray={t === 0 ? '0' : '3 3'}
        />
      ))}
      {/* Area */}
      <path d={areaD} fill="rgba(200,16,46,0.08)" />
      {/* Line */}
      <path
        d={lineD}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Dots */}
      {xs.map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={ys[i]} r={3.5} fill={color} />
          <circle
            cx={x}
            cy={ys[i]}
            r={10}
            fill="transparent"
            style={{ cursor: 'pointer' }}
          >
            <title>
              {dayjs(points[i].date).format('DD/MM/YYYY')} —{' '}
              {formatValue ? formatValue(points[i].value) : points[i].value}
            </title>
          </circle>
        </g>
      ))}
      {/* X labels */}
      {points.map((p, i) =>
        i % labelStride === 0 || i === points.length - 1 ? (
          <text
            key={i}
            x={xs[i]}
            y={height - 8}
            textAnchor="middle"
            fontSize={10}
            fill="var(--color-muted)"
          >
            {dayjs(p.date).format('DD/MM')}
          </text>
        ) : null,
      )}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Donut                                   */
/* -------------------------------------------------------------------------- */

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function Donut({ slices }: { slices: DonutSlice[] }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const radius = 70;
  const circ = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <svg viewBox="0 0 200 200" width={180} height={180}>
        <circle
          cx={100}
          cy={100}
          r={radius}
          fill="none"
          stroke="var(--color-divider)"
          strokeWidth={24}
        />
        {slices.map((s) => {
          const pct = s.value / total;
          const dash = pct * circ;
          const seg = (
            <circle
              key={s.label}
              cx={100}
              cy={100}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={24}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 100 100)"
            />
          );
          offset += dash;
          return seg;
        })}
        <text
          x={100}
          y={100}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={16}
          fontWeight={700}
          fill="var(--color-ink)"
          style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
        >
          {total > 0 ? `${slices.length} kênh` : '—'}
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 180 }}>
        {slices.map((s) => {
          const pct = total > 0 ? (s.value / total) * 100 : 0;
          return (
            <div key={s.label} style={legendRow}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: s.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1, fontSize: 13, color: 'var(--color-ink)' }}>
                {s.label}
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                {pct.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const legendRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

/* -------------------------------------------------------------------------- */
/*                                  HBarList                                  */
/* -------------------------------------------------------------------------- */

export interface HBarRow {
  label: string;
  value: number;
  valueDisplay?: string;
  max: number;
}

export function HBarList({ rows }: { rows: HBarRow[] }) {
  if (rows.length === 0) {
    return (
      <div style={{ color: 'var(--color-muted)', fontSize: 13, padding: 20 }}>
        Không có dữ liệu.
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map((row, i) => {
        const pct = row.max > 0 ? (row.value / row.max) * 100 : 0;
        return (
          <div key={`${row.label}-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 13,
              }}
            >
              <span style={{ color: 'var(--color-ink)', fontWeight: 500 }}>
                {row.label}
              </span>
              <span style={{ color: 'var(--color-muted)' }}>
                {row.valueDisplay ?? String(row.value)}
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: 8,
                background: 'var(--color-soft)',
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.max(2, pct)}%`,
                  height: '100%',
                  background:
                    'linear-gradient(90deg, #C8102E 0%, #9A0E24 100%)',
                  borderRadius: 999,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
