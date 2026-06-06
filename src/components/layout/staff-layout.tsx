'use client';

import { Avatar, Drawer, Input, Layout, Menu, Modal, Typography } from 'antd';
import type { MenuProps } from 'antd';
import {
  BellOutlined,
  BookOutlined,
  CloseOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  LogoutOutlined,
  MenuOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  TruckOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { AuthGuard } from './auth-guard';
import { useAuthStore } from '@/lib/auth-store';
import { useLogout } from '@/lib/auth-hooks';
import { EditorialLogo } from '@/components/editorial';
import { useResponsive } from '@/lib/use-responsive';

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
  const { screens, isSmDown } = useResponsive();
  const isCompact = !screens.lg;
  const isMdDown = !screens.lg;

  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
    setSearchOpen(false);
  }, [pathname]);

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

  // Shared sidebar body used by both Sider and Drawer.
  const sidebarBody = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
        onClick={() => setNavOpen(false)}
        style={{
          borderRight: 0,
          padding: '16px 12px',
          fontFamily: 'var(--font-sans), sans-serif',
          flex: 1,
        }}
      />
      <div
        style={{
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
    </div>
  );

  return (
    <AuthGuard role="WAREHOUSE_STAFF">
      <Layout style={{ minHeight: '100vh', background: 'var(--color-soft)' }}>
        {/* Desktop sider — visible >= lg */}
        {!isCompact && (
          <Sider
            theme="light"
            width={260}
            style={{
              background: '#fff',
              borderRight: '1px solid var(--color-divider)',
              position: 'sticky',
              top: 0,
              height: '100vh',
              overflow: 'hidden',
            }}
          >
            {sidebarBody}
          </Sider>
        )}

        {/* Mobile / tablet drawer */}
        {isCompact && (
          <Drawer
            open={navOpen}
            placement="left"
            onClose={() => setNavOpen(false)}
            width={280}
            closeIcon={<CloseOutlined />}
            styles={{
              body: { padding: 0 },
              header: { display: 'none' },
            }}
          >
            {sidebarBody}
          </Drawer>
        )}

        <Layout style={{ background: 'var(--color-soft)' }}>
          <div
            style={{
              background: '#fff',
              borderBottom: '1px solid var(--color-divider)',
              padding: isSmDown ? '10px 12px' : isCompact ? '12px 16px' : '14px 32px',
              display: 'flex',
              alignItems: 'center',
              gap: isCompact ? 8 : 18,
            }}
          >
            {isCompact && (
              <button
                type="button"
                aria-label="menu"
                onClick={() => setNavOpen(true)}
                style={iconButtonSquareStyle}
              >
                <MenuOutlined />
              </button>
            )}

            {isMdDown ? (
              <div style={{ flex: 1 }} />
            ) : (
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
            )}

            {!isMdDown && <div style={{ flex: 1 }} />}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isSmDown ? 6 : 10,
              }}
            >
              {isMdDown && (
                <button
                  type="button"
                  aria-label="Tìm kiếm"
                  onClick={() => setSearchOpen(true)}
                  style={iconButtonSquareStyle}
                >
                  <SearchOutlined />
                </button>
              )}

              <IconButton icon={<BellOutlined />} />
              {!isSmDown && (
                <>
                  <IconButton icon={<SettingOutlined />} />
                  <IconButton icon={<QuestionCircleOutlined />} />
                </>
              )}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  paddingLeft: isSmDown ? 8 : 14,
                  borderLeft: '1px solid var(--color-divider)',
                  marginLeft: isSmDown ? 2 : 6,
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
                {!isSmDown && (
                  <div style={{ lineHeight: 1.2 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--color-ink)',
                        display: 'block',
                        maxWidth: 140,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
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
                )}
              </div>
            </div>
          </div>
          <Content
            style={{
              padding: isSmDown
                ? '16px 12px 32px'
                : isCompact
                  ? '20px 16px 40px'
                  : '28px 32px 48px',
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

        {/* Mobile / tablet search modal */}
        <Modal
          title="Tìm kiếm"
          open={searchOpen}
          onCancel={() => setSearchOpen(false)}
          footer={null}
          destroyOnHidden
        >
          <Input
            autoFocus
            size="large"
            prefix={<SearchOutlined style={{ color: 'var(--color-muted)' }} />}
            placeholder="Tìm mã đơn hàng hoặc khách hàng..."
            allowClear
          />
        </Modal>
      </Layout>
    </AuthGuard>
  );
}

function IconButton({ icon }: { icon: ReactNode }) {
  return (
    <button
      type="button"
      style={iconButtonSquareStyle}
    >
      {icon}
    </button>
  );
}

const iconButtonSquareStyle: CSSProperties = {
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
  flex: '0 0 auto',
};
