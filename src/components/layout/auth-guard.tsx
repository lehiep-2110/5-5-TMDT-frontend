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
  const { isLoading } = useCurrentUser();

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

  if (!hydrated || !accessToken || isLoading || !user) {
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
