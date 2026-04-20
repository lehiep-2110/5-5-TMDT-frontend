'use client';

import { Space, Typography } from 'antd';
import type { CSSProperties } from 'react';
import { formatVnd } from '@/lib/format';

const { Text } = Typography;

interface PriceTagProps {
  price: string | number | null | undefined;
  discountPrice?: string | number | null;
  size?: 'sm' | 'md' | 'lg';
  style?: CSSProperties;
}

/**
 * Renders a price with optional discount crossover.
 * When `discountPrice` is provided (and > 0), the original `price` is shown
 * struck through next to the discounted price highlighted in red.
 */
export function PriceTag({ price, discountPrice, size = 'md', style }: PriceTagProps) {
  const priceNum = price === null || price === undefined ? 0 : Number(price);
  const discountNum =
    discountPrice === null || discountPrice === undefined
      ? null
      : Number(discountPrice);
  const hasDiscount =
    discountNum !== null &&
    Number.isFinite(discountNum) &&
    discountNum > 0 &&
    discountNum < priceNum;

  const effectiveSize =
    size === 'lg' ? 24 : size === 'sm' ? 13 : 16;
  const oldSize = size === 'lg' ? 16 : size === 'sm' ? 12 : 13;

  if (hasDiscount) {
    return (
      <Space size={8} wrap style={style}>
        <Text strong style={{ color: '#ff4d4f', fontSize: effectiveSize }}>
          {formatVnd(discountNum!)}
        </Text>
        <Text type="secondary" delete style={{ fontSize: oldSize }}>
          {formatVnd(priceNum)}
        </Text>
      </Space>
    );
  }

  return (
    <Text strong style={{ color: '#ff4d4f', fontSize: effectiveSize, ...style }}>
      {formatVnd(priceNum)}
    </Text>
  );
}
