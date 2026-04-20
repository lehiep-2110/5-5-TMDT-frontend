'use client';

import { Avatar, Input, Layout, Menu, Typography } from 'antd';
import type { MenuProps } from 'antd';
import {
  BellOutlined,
  BookOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  LogoutOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  TruckOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, type ReactNode } from 'react';
import { AuthGuard } from './auth-guard';
import { useAuthStore } from '@/lib/auth-store';
import { useLogout } from '@/lib/auth-hooks';
import { EditorialLogo } from '@/components/editorial';

const { Sider, Content } = Layout;
const { Text } = Typography;

interface StaffMenuItem {
  key: string;
  icon: ReactNode;
  label: ReactNode;
  disabled?: boolean;
}

const MENU_ITEMS: StaffMenuItem[] = [
  {
    key: '/staff/overview',
    icon: <DashboardOutlined />,
    label: <Link href="/staff/inventory">Tổng quan</Link>,
  },
  {
    key: '/staff/inventory',
    icon: <DatabaseOutlined />,
    label: <Link href="/staff/inventory">Kho hàng</Link>,
  },
  {
    key: '/staff/orders',
    icon: <ShoppingCartOutlined />,
    label: <Link href="/staff/orders">Đơn hàng</Link>,
  },
  {
    key: '/staff/shipping',
    icon: <TruckOutlined />,
    label: <Link href="/staff/shipping">Cập nhật Shipping</Link>,
  },
  {
    key: '/staff/books',
    icon: <BookOutlined />,
    label: (
      <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <span>Sách &amp; Ấn phẩm</span>
        <span style={{ fontSize: 10, color: 'var(--color-muted)', letterSpacing: '0.08em' }}>
          CHỈ XEM
        </span>
      </span>
    ),
    disabled: true,
  },
  {
    key: '/staff/customers',
    icon: <TeamOutlined />,
    label: 'Khách hàng',
    disabled: true,
  },
  {
    key: '/staff/reports',
    icon: <FileTextOutlined />,
    label: (
      <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <span>Báo cáo</span>
        <span style={{ fontSize: 10, color: 'var(--color-muted)', letterSpacing: '0.08em' }}>
          SẮP RA MẮT
        </span>
      </span>
    ),
    disabled: true,
  },
];

export function StaffLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  const selectedKey = useMemo(() => {
    const matches = MENU_ITEMS.filter(
      (item) => !item.disabled && pathname.startsWith(item.key),
    ).map((i) => i.key);
    return matches.sort((a, b) => b.length - a.length)[0] ?? '/staff/inventory';
  }, [pathname]);

  const handleLogout = async () => {
    await logout.mutateAsync();
    router.replace('/login');
  };

  const menuItems: MenuProps['items'] = MENU_ITEMS.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
    disabled: item.disabled,
  }));

  const displayName = user?.fullName ?? 'Quản Trị Viên';
  const initials = (user?.fullName ?? 'QT')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <AuthGuard role="WAREHOUSE_STAFF">
      <Layout style={{ minHeight: '100vh', background: 'var(--color-soft)' }}>
        <Sider
          theme="light"
          width={260}
          breakpoint="lg"
          style={{
            background: '#fff',
            borderRight: '1px solid var(--color-divider)',
            position: 'relative',
          }}
        >
          <div
            style={{
              padding: '28px 24px 20px',
              borderBottom: '1px solid var(--color-divider)',
            }}
          >
            <EditorialLogo size="md" subtitle="HỆ THỐNG KHO" />
          </div>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            style={{
              borderRight: 0,
              padding: '16px 12px',
              fontFamily: 'var(--font-sans), sans-serif',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '16px 20px 20px',
              borderTop: '1px solid var(--color-divider)',
              background: '#fff',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 12,
              }}
            >
              <Avatar
                size={38}
                style={{
                  background: 'var(--color-primary)',
                  color: '#fff',
                  fontWeight: 600,
                }}
              >
                {initials}
              </Avatar>
              <div style={{ lineHeight: 1.25, overflow: 'hidden' }}>
                <div
                  style={{
                    fontWeight: 600,
                    color: 'var(--color-ink)',
                    fontSize: 14,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {displayName}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--color-muted)',
                  }}
                >
                  HỆ THỐNG KHO
                </div>
              </div>
            </div>
            <div
              style={{
                height: 1,
                background: 'var(--color-divider)',
                margin: '4px 0 10px',
              }}
            />
            <button
              type="button"
              onClick={handleLogout}
              style={{
                border: 0,
                background: 'transparent',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--color-text)',
                fontSize: 13,
                padding: 0,
              }}
            >
              <LogoutOutlined style={{ color: 'var(--color-primary)' }} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </Sider>
        <Layout style={{ background: 'var(--color-soft)' }}>
          <div
            style={{
              background: '#fff',
              borderBottom: '1px solid var(--color-divider)',
              padding: '14px 32px',
              display: 'flex',
              alignItems: 'center',
              gap: 18,
            }}
          >
            <Input
              prefix={<SearchOutlined style={{ color: 'var(--color-muted)' }} />}
              placeholder="Tìm mã đơn hàng hoặc khách hàng..."
              style={{
                maxWidth: 520,
                flex: 1,
                height: 40,
                borderRadius: 999,
                background: 'var(--color-soft)',
                border: '1px solid var(--color-divider)',
              }}
            />
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <IconButton icon={<BellOutlined />} />
              <IconButton icon={<SettingOutlined />} />
              <IconButton icon={<QuestionCircleOutlined />} />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  paddingLeft: 14,
                  borderLeft: '1px solid var(--color-divider)',
                  marginLeft: 6,
                }}
              >
                <Avatar
                  size={30}
                  style={{
                    background: 'var(--color-primary)',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  {initials}
                </Avatar>
                <div style={{ lineHeight: 1.2 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--color-ink)',
                      display: 'block',
                    }}
                  >
                    {displayName}
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: 'var(--color-muted)',
                    }}
                  >
                    HỆ THỐNG KHO
                  </Text>
                </div>
              </div>
            </div>
          </div>
          <Content
            style={{
              padding: '28px 32px 48px',
              background: 'var(--color-soft)',
              overflow: 'auto',
            }}
          >
            <style>{`
              .ant-menu-light.ant-menu-root.ant-menu-inline .ant-menu-item {
                border-radius: 8px;
                margin-inline: 0;
                margin-block: 4px;
                height: 44px;
                line-height: 44px;
                color: var(--color-text);
              }
              .ant-menu-light.ant-menu-root.ant-menu-inline .ant-menu-item a {
                color: inherit;
              }
              .ant-menu-light.ant-menu-root.ant-menu-inline .ant-menu-item-selected {
                background: #FDECEE !important;
                color: var(--color-primary) !important;
                position: relative;
                font-weight: 600;
              }
              .ant-menu-light.ant-menu-root.ant-menu-inline .ant-menu-item-selected::before {
                content: '';
                position: absolute;
                left: 0;
                top: 8px;
                bottom: 8px;
                width: 3px;
                background: var(--color-primary);
                border-radius: 0 2px 2px 0;
              }
              .ant-menu-light.ant-menu-root.ant-menu-inline .ant-menu-item-selected a {
                color: var(--color-primary) !important;
              }
              .ant-menu-light.ant-menu-root.ant-menu-inline .ant-menu-item-disabled {
                color: var(--color-muted) !important;
              }
            `}</style>
            {children}
          </Content>
        </Layout>
      </Layout>
    </AuthGuard>
  );
}

function IconButton({ icon }: { icon: ReactNode }) {
  return (
    <button
      type="button"
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        border: '1px solid var(--color-divider)',
        background: '#fff',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text)',
        fontSize: 15,
      }}
    >
      {icon}
    </button>
  );
}

