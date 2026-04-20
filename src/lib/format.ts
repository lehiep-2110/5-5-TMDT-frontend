const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export function formatVnd(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '0 ₫';
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return '0 ₫';
  return vndFormatter.format(num);
}
