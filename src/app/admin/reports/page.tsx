'use client';

import { Tabs } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { AuthGuard } from '@/components/layout/auth-guard';
import {
  DateRangeToolbar,
  PageHeading,
  defaultGranularity,
} from '@/components/editorial';
import type { Granularity } from '@/components/editorial';
import { RevenueTab } from './_tabs/revenue-tab';
import { ProductsTab } from './_tabs/products-tab';
import { CustomersTab } from './_tabs/customers-tab';
import { OperationsTab } from './_tabs/operations-tab';

type TabKey = 'revenue' | 'products' | 'customers' | 'operations';

const VALID_TABS: TabKey[] = ['revenue', 'products', 'customers', 'operations'];

function ReportsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab = useMemo<TabKey>(() => {
    const t = searchParams?.get('tab') as TabKey | null;
    return t && VALID_TABS.includes(t) ? t : 'revenue';
  }, [searchParams]);

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [range, setRange] = useState<[Dayjs, Dayjs]>(() => [
    dayjs().subtract(29, 'day').startOf('day'),
    dayjs().endOf('day'),
  ]);
  const [granularity, setGranularity] = useState<Granularity>(() =>
    defaultGranularity(
      dayjs().subtract(29, 'day').startOf('day'),
      dayjs().endOf('day'),
    ),
  );
  // Track whether the user manually changed granularity; if not, auto-derive
  // from the new range on every update.
  const [granOverridden, setGranOverridden] = useState(false);

  const handleRangeChange = useCallback(
    (v: [Dayjs, Dayjs]) => {
      setRange(v);
      if (!granOverridden) {
        setGranularity(defaultGranularity(v[0], v[1]));
      }
    },
    [granOverridden],
  );

  const handleGranChange = useCallback((g: Granularity) => {
    setGranOverridden(true);
    setGranularity(g);
  }, []);

  const handleTabChange = useCallback(
    (key: string) => {
      const next = (VALID_TABS.includes(key as TabKey) ? key : 'revenue') as TabKey;
      setActiveTab(next);
      const sp = new URLSearchParams(searchParams?.toString() ?? '');
      sp.set('tab', next);
      router.replace(`/admin/reports?${sp.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  // Sync internal state when the URL tab param changes (e.g. back/forward).
  useEffect(() => {
    if (initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab]);

  const tabProps = { from: range[0], to: range[1], granularity };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <PageHeading
        title="Báo cáo chi tiết"
        subtitle="Phân tích toàn diện theo nhiều chiều — doanh thu, sản phẩm, khách hàng, vận hành."
      />

      <DateRangeToolbar
        value={range}
        onChange={handleRangeChange}
        granularity={granularity}
        onGranularityChange={handleGranChange}
      />

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        destroyOnHidden
        items={[
          {
            key: 'revenue',
            label: 'Doanh thu',
            children: <RevenueTab {...tabProps} />,
          },
          {
            key: 'products',
            label: 'Sản phẩm',
            children: <ProductsTab {...tabProps} />,
          },
          {
            key: 'customers',
            label: 'Khách hàng',
            children: <CustomersTab {...tabProps} />,
          },
          {
            key: 'operations',
            label: 'Vận hành',
            children: <OperationsTab {...tabProps} />,
          },
        ]}
      />
    </div>
  );
}

export default function AdminReportsPage() {
  return (
    <AuthGuard role="ADMIN">
      <Suspense
        fallback={
          <div style={{ padding: 32, color: 'var(--color-muted)' }}>
            Đang tải báo cáo...
          </div>
        }
      >
        <ReportsInner />
      </Suspense>
    </AuthGuard>
  );
}
