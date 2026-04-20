import type { ReactNode } from 'react';
import { StaffLayout } from '@/components/layout/staff-layout';

export default function StaffRouteLayout({ children }: { children: ReactNode }) {
  return <StaffLayout>{children}</StaffLayout>;
}
