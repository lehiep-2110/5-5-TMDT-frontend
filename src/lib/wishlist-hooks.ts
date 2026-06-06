'use client';

import { App as AntdApp } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, extractErrorMessage, unwrap } from './api';
import { useAuthStore } from './auth-store';
import type { PageEnvelope, WishlistItem } from './types';

/**
 * Returns a Set<bookId> of wishlisted book ids for the current customer.
 * Empty set when not logged in (or not CUSTOMER).
 */
export function useWishlistIds() {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const enabled =
    hydrated && !!token && (!user || user.role === 'CUSTOMER');

  const query = useQuery({
    queryKey: ['wishlist-ids'],
    enabled,
    queryFn: async () => {
      const res = await api.get('/wishlist/ids');
      const data = unwrap<{ bookIds: string[] } | string[]>(res);
      const ids = Array.isArray(data) ? data : data.bookIds;
      return new Set<string>(ids ?? []);
    },
  });

  return {
    ...query,
    ids: query.data ?? new Set<string>(),
  };
}

export function useWishlistList(opts: { page?: number; limit?: number } = {}) {
  const token = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);
  const { page = 1, limit = 24 } = opts;
  return useQuery({
    queryKey: ['wishlist', page, limit],
    enabled: hydrated && !!token,
    queryFn: async () => {
      const res = await api.get('/wishlist', { params: { page, limit } });
      return unwrap<PageEnvelope<WishlistItem>>(res);
    },
  });
}

/**
 * Toggle wishlist membership. Server returns { wishlisted: boolean }.
 * Invalidates both the ids query and the full list, and shows a message.
 */
export function useToggleWishlist() {
  const queryClient = useQueryClient();
  const { message } = AntdApp.useApp();
  return useMutation({
    mutationFn: async (bookId: string) => {
      const res = await api.post(`/wishlist/${bookId}`);
      return unwrap<{ wishlisted: boolean }>(res);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-ids'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      if (data?.wishlisted) {
        message.success('Đã thêm vào yêu thích');
      } else {
        message.success('Đã bỏ khỏi yêu thích');
      }
    },
    onError: (err) => {
      message.error(extractErrorMessage(err, 'Không thể cập nhật danh sách yêu thích'));
    },
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  const { message } = AntdApp.useApp();
  return useMutation({
    mutationFn: async (bookId: string) => {
      const res = await api.delete(`/wishlist/${bookId}`);
      return unwrap<unknown>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-ids'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      message.success('Đã bỏ khỏi yêu thích');
    },
    onError: (err) => {
      message.error(extractErrorMessage(err, 'Xoá khỏi yêu thích thất bại'));
    },
  });
}
