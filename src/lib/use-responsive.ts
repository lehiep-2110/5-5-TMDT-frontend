'use client';

import { Grid } from 'antd';

const { useBreakpoint } = Grid;

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Tiny wrapper around AntD's `Grid.useBreakpoint()` to expose semantic flags
 * for our responsive design.
 *
 * Thresholds (AntD defaults):
 *   xs:  < 576px
 *   sm:  576-768px
 *   md:  768-992px
 *   lg:  992-1200px
 *   xl:  >= 1200px
 *
 * Drawer threshold (sider/header collapse): `< 992px` -> `!screens.lg`.
 */
export function useResponsive() {
  const screens = useBreakpoint();
  return {
    screens,
    isMobile: !screens.md,                  // < 768
    isTablet: !!screens.md && !screens.lg,  // 768 - 991
    isDesktop: !!screens.lg,                // >= 992
    isSmDown: !screens.sm,                  // < 576
  };
}
