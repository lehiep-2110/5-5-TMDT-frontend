'use client';

import { create } from 'zustand';
import type { BookStatus, CartView } from './types';

const STORAGE_KEY = 'guestCart';
const MAX_PER_ITEM = 10;

// We snapshot the book fields needed to render the cart so the guest view
// works without any extra API call.
export interface GuestCartSnapshot {
  bookId: string;
  slug: string;
  title: string;
  price: string;
  discountPrice: string | null;
  primaryImage: string | null;
  stockQuantity: number;
  status: BookStatus;
}

export interface GuestCartItem extends GuestCartSnapshot {
  quantity: number;
}

interface GuestCartState {
  items: GuestCartItem[];
  hydrated: boolean;
  add: (snap: GuestCartSnapshot, qty: number) => void;
  setQuantity: (bookId: string, qty: number) => void;
  remove: (bookId: string) => void;
  clear: () => void;
  hydrate: () => void;
}

function readStorage(): GuestCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (it: unknown): it is GuestCartItem =>
        !!it &&
        typeof (it as GuestCartItem).bookId === 'string' &&
        typeof (it as GuestCartItem).quantity === 'number',
    );
  } catch {
    return [];
  }
}

function writeStorage(items: GuestCartItem[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function cap(stock: number, q: number) {
  const ceiling = Math.min(MAX_PER_ITEM, Math.max(0, stock || 0));
  if (ceiling === 0) return 0;
  return Math.max(1, Math.min(ceiling, q));
}

export const useGuestCartStore = create<GuestCartState>((set, get) => ({
  items: [],
  hydrated: false,
  add: (snap, qty) => {
    const items = [...get().items];
    const idx = items.findIndex((it) => it.bookId === snap.bookId);
    if (idx >= 0) {
      const merged = cap(snap.stockQuantity, items[idx].quantity + qty);
      items[idx] = { ...items[idx], ...snap, quantity: merged };
    } else {
      const q = cap(snap.stockQuantity, qty);
      if (q > 0) items.push({ ...snap, quantity: q });
    }
    writeStorage(items);
    set({ items });
  },
  setQuantity: (bookId, qty) => {
    const items = get().items.map((it) =>
      it.bookId === bookId
        ? { ...it, quantity: cap(it.stockQuantity, qty) }
        : it,
    );
    writeStorage(items);
    set({ items });
  },
  remove: (bookId) => {
    const items = get().items.filter((it) => it.bookId !== bookId);
    writeStorage(items);
    set({ items });
  },
  clear: () => {
    writeStorage([]);
    set({ items: [] });
  },
  hydrate: () => {
    set({ items: readStorage(), hydrated: true });
  },
}));

export function getGuestCartSnapshot() {
  return useGuestCartStore.getState();
}

// Shape guest items as a CartView so the checkout components can treat both
// flows uniformly.
export function buildGuestCartView(items: GuestCartItem[]): CartView {
  let subtotal = 0;
  const cartItems = items.map((it) => {
    const discount = it.discountPrice ? Number(it.discountPrice) : 0;
    const unit = discount > 0 ? discount : Number(it.price) || 0;
    subtotal += unit * it.quantity;
    return {
      id: `guest-${it.bookId}`,
      bookId: it.bookId,
      quantity: it.quantity,
      outOfStock: it.quantity > it.stockQuantity || it.status !== 'ACTIVE',
      book: {
        id: it.bookId,
        slug: it.slug,
        title: it.title,
        price: it.price,
        discountPrice: it.discountPrice,
        stockQuantity: it.stockQuantity,
        primaryImage: it.primaryImage,
        status: it.status,
      },
    };
  });
  const itemCount = items.reduce((acc, it) => acc + it.quantity, 0);
  return { items: cartItems, subtotal, itemCount };
}
