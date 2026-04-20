'use client';

import { Layout } from 'antd';
import type { ReactNode } from 'react';
import { PublicHeader } from './public-header';
import { PublicFooter } from './public-footer';

const { Content } = Layout;

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <PublicHeader />
      <Content style={{ background: '#f5f5f5' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
          {children}
        </div>
      </Content>
      <PublicFooter />
    </Layout>
  );
}
