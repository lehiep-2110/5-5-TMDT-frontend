'use client';

import { Skeleton } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useCurrentUser } from '@/lib/auth-hooks';
import type { UserRole } from '@/lib/types';

interface AuthGuardProps {
  children: ReactNode;
  role?: UserRole;
}

function homeForRole(role: UserRole | undefined): string {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'WAREHOUSE_STAFF':
      return '/staff/orders';
    default:
      return '/';
  }
}

export function AuthGuard({ children, role }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  // Runs `/auth/me` in the background to refresh the cached user, but we
  // don't block rendering on it. If the token is invalid, the axios 401
  // interceptor will call `logout()` → `accessToken` becomes null → we
  // redirect below. That avoids the stuck-skeleton state when /auth/me is
  // slow or fails transiently.
  const query = useCurrentUser();

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken) {
      const redirect = encodeURIComponent(pathname ?? '/');
      router.replace(`/login?redirect=${redirect}`);
      return;
    }
    if (user && role && user.role !== role) {
      router.replace(homeForRole(user.role));
    }
  }, [hydrated, accessToken, user, role, router, pathname]);

  // Before hydration finishes, or while we've redirected a logged-out user.
  if (!hydrated || !accessToken) {
    return (
      <div style={{ padding: 32 }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }

  // First login in this browser, no cached user yet — wait for /auth/me.
  if (!user) {
    if (query.isError) {
      // Token refused by server; the interceptor will clear auth → a rerender
      // triggers the redirect above. Keep showing skeleton meanwhile.
      return (
        <div style={{ padding: 32 }}>
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      );
    }
    return (
      <div style={{ padding: 32 }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }

  if (role && user.role !== role) {
    return (
      <div style={{ padding: 32 }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }

  return <>{children}</>;
}
