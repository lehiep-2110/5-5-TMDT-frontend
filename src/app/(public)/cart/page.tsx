'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';

/**
 * Cart is merged into /checkout per the editorial redesign.
 * This page simply redirects so any legacy link still works.
 */
export default function CartPage() {
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
