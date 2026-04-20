'use client';

import { Tag } from 'antd';
import type { OrderStatus, PaymentStatus } from '@/lib/types';

const ORDER_STATUS_MAP: Record<
  OrderStatus,
  { label: string; color: string }
> = {
  PENDING: { label: 'Chờ xử lý', color: 'gold' },
  PAID: { label: 'Đã thanh toán', color: 'cyan' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'gold' },
  PROCESSING: { label: 'Đang đóng gói', color: 'processing' },
  SHIPPING: { label: 'Đang giao', color: 'blue' },
  DELIVERED: { label: 'Đã giao', color: 'green' },
  COMPLETED: { label: 'Hoàn tất', color: 'green' },
  CANCELLED: { label: 'Đã huỷ', color: 'red' },
};

const PAYMENT_STATUS_MAP: Record<
  PaymentStatus,
  { label: string; color: string }
> = {
  UNPAID: { label: 'Chưa thanh toán', color: 'default' },
  PAID: { label: 'Đã thanh toán', color: 'green' },
  REFUND_PENDING: { label: 'Chờ hoàn tiền', color: 'orange' },
  REFUNDED: { label: 'Đã hoàn tiền', color: 'purple' },
};

export function OrderStatusTag({ status }: { status: OrderStatus }) {
  const info = ORDER_STATUS_MAP[status] ?? { label: status, color: 'default' };
  return <Tag color={info.color}>{info.label}</Tag>;
}

export function PaymentStatusTag({ status }: { status: PaymentStatus }) {
  const info = PAYMENT_STATUS_MAP[status] ?? { label: status, color: 'default' };
  return <Tag color={info.color}>{info.label}</Tag>;
}

export function orderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_MAP[status]?.label ?? status;
}
