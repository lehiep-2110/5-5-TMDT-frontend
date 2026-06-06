'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from './api';
import { useAuthStore } from './auth-store';
import {
  getGuestCartSnapshot,
  useGuestCartStore,
} from './guest-cart-store';
import type {
  CartView,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  User,
} from './types';

export function useCurrentUser() {
  const token = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);
  const setUser = useAuthStore((s) => s.setUser);
  return useQuery({
    queryKey: ['me'],
    enabled: hydrated && !!token,
    queryFn: async () => {
      const res = await api.get('/auth/me');
      const user = unwrap<User>(res);
      setUser(user);
      return user;
    },
  });
}

async function mergeGuestCartIntoServer(): Promise<void> {
  const snapshot = getGuestCartSnapshot();
  const items = snapshot.items;
  if (items.length === 0) return;
  // Sequential so the server can reconcile stock per item; ignore individual
  // failures (e.g. out-of-stock or inactive book) — we don't want to block
  // login on a stale guest cart.
  for (const it of items) {
    try {
      await api.post('/cart/items', {
        bookId: it.bookId,
        quantity: it.quantity,
      });
    } catch {
      // swallow — surface a soft message to the user via a snackbar in the
      // future if needed.
    }
  }
  snapshot.clear();
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const res = await api.post('/auth/login', payload);
      const data = unwrap<LoginResponse>(res);
      // Persist token first so the merge call below picks it up via the axios
      // interceptor, then drain the guest cart.
      setAuth(data.accessToken, data.user);
      if (data.user.role === 'CUSTOMER') {
        await mergeGuestCartIntoServer();
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const res = await api.post('/auth/register', payload);
      return unwrap<unknown>(res);
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await api.post('/auth/resend-verification', { email });
      return unwrap<unknown>(res);
    },
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        await api.post('/auth/logout');
      } catch {
        // ignore network errors on logout
      }
    },
    onSettled: () => {
      clear();
      queryClient.clear();
    },
  });
}

export function useVerifyEmail(token: string | null) {
  return useQuery({
    queryKey: ['verify-email', token],
    enabled: !!token,
    retry: false,
    queryFn: async () => {
      const res = await api.get('/auth/verify-email', { params: { token } });
      return unwrap<unknown>(res);
    },
  });
}

export function useCartBadge(): number {
  const token = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);
  const guestItems = useGuestCartStore((s) => s.items);
  const query = useQuery({
    queryKey: ['cart'],
    enabled: hydrated && !!token,
    queryFn: async () => {
      const res = await api.get('/cart');
      return unwrap<CartView>(res);
    },
  });
  if (token) return query.data?.itemCount ?? 0;
  return guestItems.reduce((acc, it) => acc + it.quantity, 0);
}
