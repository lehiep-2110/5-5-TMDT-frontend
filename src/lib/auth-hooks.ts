'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from './api';
import { useAuthStore } from './auth-store';
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

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const res = await api.post('/auth/login', payload);
      return unwrap<LoginResponse>(res);
    },
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user);
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
  const query = useQuery({
    queryKey: ['cart'],
    enabled: hydrated && !!token,
    queryFn: async () => {
      const res = await api.get('/cart');
      return unwrap<CartView>(res);
    },
  });
  return query.data?.itemCount ?? 0;
}
