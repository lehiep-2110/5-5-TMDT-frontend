import { PublicLayout } from '@/components/layout/public-layout';
import type { ReactNode } from 'react';

export default function PublicGroupLayout({ children }: { children: ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}
