'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';
import { AuthGuard } from '@/components/layout/auth-guard';

/**
 * Cart is merged into /checkout per the editorial redesign.
 * This page simply redirects so any legacy link still works.
 */
function CartRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/checkout');
  }, [router]);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 320,
      }}
    >
      <Spin size="large" />
    </div>
  );
}

export default function CartPage() {
  return (
    <AuthGuard role="CUSTOMER">
      <CartRedirect />
    </AuthGuard>
  );
}
