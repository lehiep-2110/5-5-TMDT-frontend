'use client';

import { DatePicker, Segmented } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { CSSProperties, ReactNode } from 'react';
import { useMemo } from 'react';

export type Granularity = 'day' | 'week' | 'month';

export interface DateRangeToolbarProps {
  value: [Dayjs, Dayjs];
  onChange: (v: [Dayjs, Dayjs]) => void;
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
  extra?: ReactNode;
}

type PresetKey =
  | 'today'
  | 'week'
  | '7d'
  | '30d'
  | 'month'
  | 'quarter'
  | 'year'
  | 'custom';

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'week', label: 'Tuần này' },
  { key: '7d', label: '7 ngày' },
  { key: '30d', label: '30 ngày' },
  { key: 'month', label: 'Tháng này' },
  { key: 'quarter', label: 'Quý này' },
  { key: 'year', label: 'Năm này' },
  { key: 'custom', label: 'Tuỳ chỉnh' },
];

function rangeForPreset(key: PresetKey): [Dayjs, Dayjs] | null {
  const today = dayjs().endOf('day');
  switch (key) {
    case 'today':
      return [dayjs().startOf('day'), today];
    case 'week':
      return [dayjs().startOf('week'), today];
    case '7d':
      return [dayjs().subtract(6, 'day').startOf('day'), today];
    case '30d':
      return [dayjs().subtract(29, 'day').startOf('day'), today];
    case 'month':
      return [dayjs().startOf('month'), today];
    case 'quarter': {
      // Start of the current quarter (Jan/Apr/Jul/Oct). startOf('month') first
      // so .month() can't overflow when today's day-of-month is large.
      const qStartMonth = Math.floor(dayjs().month() / 3) * 3;
      return [dayjs().startOf('month').month(qStartMonth), today];
    }
    case 'year':
      return [dayjs().startOf('year'), today];
    case 'custom':
    default:
      return null;
  }
}

function detectPreset(value: [Dayjs, Dayjs]): PresetKey {
  const [from, to] = value;
  for (const p of PRESETS) {
    if (p.key === 'custom') continue;
    const candidate = rangeForPreset(p.key);
    if (!candidate) continue;
    if (
      candidate[0].isSame(from, 'day') &&
      candidate[1].isSame(to, 'day')
    ) {
      return p.key;
    }
  }
  return 'custom';
}

/**
 * Derive a sensible default granularity for a range.
 * <=14 days → day, <=90 days → week, else month.
 */
export function defaultGranularity(from: Dayjs, to: Dayjs): Granularity {
  const days = to.diff(from, 'day') + 1;
  if (days <= 14) return 'day';
  if (days <= 90) return 'week';
  return 'month';
}

export function DateRangeToolbar({
  value,
  onChange,
  granularity,
  onGranularityChange,
  extra,
}: DateRangeToolbarProps) {
  const selectedPreset = useMemo(() => detectPreset(value), [value]);

  const handlePreset = (key: PresetKey) => {
    if (key === 'custom') return; // Custom is informational; user picks via RangePicker.
    const r = rangeForPreset(key);
    if (r) onChange(r);
  };

  return (
    <div style={wrap}>
      <div style={rowStyle}>
        <div style={chipsRow}>
          {PRESETS.map((p) => {
            const active = selectedPreset === p.key;
            return (
              <button
                type="button"
                key={p.key}
                onClick={() => handlePreset(p.key)}
                style={chipStyle(active)}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <DatePicker.RangePicker
            value={value}
            onChange={(v) => {
              if (v && v[0] && v[1]) {
                onChange([v[0].startOf('day'), v[1].endOf('day')]);
              }
            }}
            allowClear={false}
            format="DD/MM/YYYY"
          />
          {extra}
        </div>
      </div>
      <div style={granRow}>
        <span style={granLabel}>Mức tổng hợp</span>
        <Segmented
          value={granularity}
          onChange={(v) => onGranularityChange(v as Granularity)}
          options={[
            { label: 'Ngày', value: 'day' },
            { label: 'Tuần', value: 'week' },
            { label: 'Tháng', value: 'month' },
          ]}
        />
      </div>
    </div>
  );
}

const wrap: CSSProperties = {
  background: '#fff',
  border: '1px solid var(--color-divider)',
  borderRadius: 12,
  padding: 16,
  marginBottom: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
};

const chipsRow: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
};

function chipStyle(active: boolean): CSSProperties {
  return {
    border: '1px solid',
    borderColor: active ? 'var(--color-primary)' : 'var(--color-divider)',
    background: active ? 'rgba(200,16,46,0.08)' : '#fff',
    color: active ? 'var(--color-primary)' : 'var(--color-text)',
    borderRadius: 999,
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
    transition: 'all 120ms ease',
  };
}

const granRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  borderTop: '1px dashed var(--color-divider)',
  paddingTop: 12,
};

const granLabel: CSSProperties = {
  fontSize: 12,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-muted)',
  fontWeight: 500,
};

export default DateRangeToolbar;
