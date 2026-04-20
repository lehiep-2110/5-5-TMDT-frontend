import type { OrderStatus } from './types';

/**
 * Allowed state transitions for ADMIN actor.
 * Mirrors backend order-state.service.ts.
 *
 * PENDING    -> CONFIRMED | CANCELLED
 * CONFIRMED  -> PROCESSING | CANCELLED
 * PROCESSING -> SHIPPING | CANCELLED
 * SHIPPING   -> DELIVERED
 * DELIVERED  -> COMPLETED
 * COMPLETED / CANCELLED / PAID -> terminal
 */
export const ALLOWED_ADMIN_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['DELIVERED'],
  DELIVERED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  PAID: [],
};

export function getAllowedNextStatuses(from: OrderStatus): OrderStatus[] {
  return ALLOWED_ADMIN_TRANSITIONS[from] ?? [];
}
