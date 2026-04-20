'use client';

import { ConfigProvider, App as AntdApp } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { useEffect, type ReactNode } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { QueryProvider } from './query-client';
import { useAuthStore } from './auth-store';

dayjs.locale('vi');

function AuthHydrator({ children }: { children: ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider
        locale={viVN}
        theme={{
          token: {
            colorPrimary: '#C8102E',
            colorInfo: '#C8102E',
            colorLink: '#C8102E',
            colorLinkHover: '#9A0E24',
            colorTextHeading: '#1A1A1A',
            colorText: '#4A4A4A',
            colorBorder: '#E8E8E8',
            colorSuccess: '#2F855A',
            colorWarning: '#D97706',
            colorError: '#C8102E',
            borderRadius: 8,
            fontFamily:
              'var(--font-sans), "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
            fontSize: 15,
          },
          components: {
            Button: {
              controlHeight: 40,
              controlHeightLG: 48,
              fontWeight: 600,
              borderRadius: 6,
              borderRadiusLG: 6,
            },
            Input: {
              controlHeight: 40,
              controlHeightLG: 48,
            },
            Card: {
              borderRadiusLG: 12,
            },
            Menu: {
              itemSelectedBg: '#FDECEE',
              itemSelectedColor: '#C8102E',
              iconMarginInlineEnd: 12,
            },
            Tabs: {
              inkBarColor: '#C8102E',
              itemActiveColor: '#C8102E',
              itemSelectedColor: '#C8102E',
            },
            Tag: {
              borderRadiusSM: 999,
            },
          },
        }}
      >
        <AntdApp>
          <QueryProvider>
            <AuthHydrator>{children}</AuthHydrator>
          </QueryProvider>
        </AntdApp>
      </ConfigProvider>
    </AntdRegistry>
  );
}
