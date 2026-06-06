'use client';

import { notification as antdNotification, App as AntdApp } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { api, extractErrorMessage, unwrap } from './api';
import { useAuthStore } from './auth-store';
import type { NotificationItem, PageEnvelope } from './types';

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? 'http://localhost:8001';

/**
 * Number of unread notifications for the current user. Refetched every 30s
 * (paused when tab is hidden — React Query default) and also invalidated by
 * the SSE hook on incoming events.
 */
export function useUnreadCount() {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const enabled =
    hydrated && !!token && (!user || user.role === 'CUSTOMER');
  const query = useQuery({
    queryKey: ['notifications-unread'],
    enabled,
    refetchInterval: 30_000,
    queryFn: async () => {
      const res = await api.get('/notifications/unread-count');
      return unwrap<{ count: number }>(res);
    },
  });
  return query.data?.count ?? 0;
}

export function useNotificationsList(opts: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}) {
  const token = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);
  const { page = 1, limit = 20, unreadOnly = false } = opts;
  return useQuery({
    queryKey: ['notifications', page, limit, unreadOnly],
    enabled: hydrated && !!token,
    queryFn: async () => {
      const res = await api.get('/notifications', {
        params: { page, limit, unreadOnly: unreadOnly ? 'true' : undefined },
      });
      return unwrap<PageEnvelope<NotificationItem>>(res);
    },
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  const { message } = AntdApp.useApp();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/notifications/${id}/read`);
      return unwrap<{ id: string; isRead: boolean }>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
    onError: (err) => {
      message.error(extractErrorMessage(err, 'Không thể cập nhật thông báo'));
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  const { message } = AntdApp.useApp();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post('/notifications/read-all');
      return unwrap<unknown>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
      message.success('Đã đánh dấu tất cả là đã đọc');
    },
    onError: (err) => {
      message.error(extractErrorMessage(err, 'Không thể đánh dấu đã đọc'));
    },
  });
}

/**
 * SSE listener for realtime notifications. Uses native `EventSource` to stream
 * `/api/notifications/stream?token=<access>`. Reconnects on error with a
 * backoff (1s → 2s → 4s, capped at 15s). Cleans up on unmount + logout.
 *
 * Behaviour on new event:
 *   - Invalidates `['notifications']` + `['notifications-unread']`.
 *   - Shows an AntD `notification.info` toast (top-right).
 */
export function useNotificationsSSE() {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    // Only connect for authenticated customers.
    if (!token) return;
    if (user && user.role !== 'CUSTOMER') return;

    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      const url = `${BACKEND_ORIGIN}/api/notifications/stream?token=${encodeURIComponent(token)}`;
      const es = new EventSource(url);
      esRef.current = es;

      es.onopen = () => {
        retryRef.current = 0;
      };

      es.onmessage = (ev) => {
        try {
          const parsed = JSON.parse(ev.data) as {
            type?: string;
            data?: { title?: string; content?: string };
          };
          if (parsed?.type === 'notification' && parsed.data) {
            antdNotification.info({
              message: parsed.data.title ?? 'Thông báo mới',
              description: parsed.data.content ?? '',
              placement: 'topRight',
              duration: 5,
            });
          }
        } catch {
          /* ignore parse errors — heartbeat comments are not JSON */
        }
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;
        if (cancelled) return;
        retryRef.current += 1;
        const backoff = Math.min(15_000, 1000 * 2 ** (retryRef.current - 1));
        timerRef.current = setTimeout(connect, backoff);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [hydrated, token, user?.role, queryClient, user]);
}
