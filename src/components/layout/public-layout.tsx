'use client';

import { Layout } from 'antd';
import type { CSSProperties, ReactNode } from 'react';
import { PublicHeader } from './public-header';
import { PublicFooter } from './public-footer';
import { useResponsive } from '@/lib/use-responsive';

const { Content } = Layout;

export function PublicLayout({ children }: { children: ReactNode }) {
  const { isMobile, isSmDown } = useResponsive();
  const containerStyle: CSSProperties = {
    maxWidth: 1200,
    margin: '0 auto',
    padding: isSmDown
      ? '16px 12px'
      : isMobile
        ? '20px 16px'
        : '24px 16px',
    width: '100%',
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <PublicHeader />
      <Content style={{ background: '#f5f5f5' }}>
        <div style={containerStyle}>{children}</div>
      </Content>
      <PublicFooter />
    </Layout>
  );
}
