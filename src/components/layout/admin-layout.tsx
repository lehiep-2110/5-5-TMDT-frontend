'use client';

import { Avatar, Badge, Drawer, Input, Layout, Menu, Modal } from 'antd';
import {
  AppstoreOutlined,
  BankOutlined,
  BarChartOutlined,
  BellOutlined,
  BookOutlined,
  CloseOutlined,
  DashboardOutlined,
  FolderOpenOutlined,
  InboxOutlined,
  LogoutOutlined,
  MenuOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  TagsOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { AuthGuard } from './auth-guard';
import { useAuthStore } from '@/lib/auth-store';
import { useLogout } from '@/lib/auth-hooks';
import { EditorialLogo } from '@/components/editorial';
import { useResponsive } from '@/lib/use-responsive';

const { Header, Sider, Content } = Layout;

interface AdminLayoutProps {
  children: ReactNode;
}

// Flat list of routes with matching keys; used for selection highlighting.
const ROUTE_KEYS = [
  '/admin/dashboard',
  '/admin/inventory',
  '/admin/orders',
  '/admin/books',
  '/admin/users',
  '/admin/authors',
  '/admin/publishers',
  '/admin/categories',
  '/admin/vouchers',
  '/admin/notifications',
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const { screens, isSmDown } = useResponsive();
  const isCompact = !screens.lg;
  const isMdDown = !screens.lg; // hide pill search at md and down

  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Close drawer on route change.
  useEffect(() => {
    setNavOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const selectedKey = useMemo(() => {
    const matches = ROUTE_KEYS.filter((k) => pathname.startsWith(k));
    return matches.sort((a, b) => b.length - a.length)[0] ?? '/admin/dashboard';
  }, [pathname]);

  const handleLogout = async () => {
    await logout.mutateAsync();
    router.replace('/login');
  };

  const menuItems = [
    {
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: <Link href="/admin/dashboard">Tổng quan</Link>,
    },
    {
      key: '/admin/inventory',
      icon: <InboxOutlined />,
      label: <Link href="/admin/inventory">Kho hàng</Link>,
    },
    {
      key: '/admin/orders',
      icon: <ShoppingCartOutlined />,
      label: <Link href="/admin/orders">Đơn hàng</Link>,
    },
    {
      key: '/admin/books',
      icon: <BookOutlined />,
      label: <Link href="/admin/books">Sách & Ấn phẩm</Link>,
    },
    {
      key: '/admin/users',
      icon: <TeamOutlined />,
      label: <Link href="/admin/users">Khách hàng</Link>,
    },
    {
      key: '/admin/notifications',
      icon: <BellOutlined />,
      label: <Link href="/admin/notifications">Gửi thông báo</Link>,
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: <Link href="/admin/reports">Báo cáo chi tiết</Link>,
    },
    {
      key: 'catalog-group',
      icon: <AppstoreOutlined />,
      label: 'Danh mục quản lý',
      children: [
        {
          key: '/admin/authors',
          icon: <UserOutlined />,
          label: <Link href="/admin/authors">Tác giả</Link>,
        },
        {
          key: '/admin/publishers',
          icon: <BankOutlined />,
          label: <Link href="/admin/publishers">Nhà xuất bản</Link>,
        },
        {
          key: '/admin/categories',
          icon: <FolderOpenOutlined />,
          label: <Link href="/admin/categories">Danh mục</Link>,
        },
      ],
    },
    {
      key: '/admin/vouchers',
      icon: <TagsOutlined />,
      label: <Link href="/admin/vouchers">Voucher & Khuyến mãi</Link>,
    },
  ];

  const isCatalogRoute =
    selectedKey === '/admin/authors' ||
    selectedKey === '/admin/publishers' ||
    selectedKey === '/admin/categories';

  // The sider body content is reused inside the Drawer when on mobile.
  const sidebarBody = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Brand header */}
      <div
        style={{
          padding: '24px 24px 20px',
          borderBottom: '1px solid var(--color-divider)',
        }}
      >
        <EditorialLogo size="md" subtitle="Hệ thống quản trị" />
      </div>

      {/* Menu */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={isCatalogRoute ? ['catalog-group'] : []}
          items={menuItems}
          onClick={() => setNavOpen(false)}
          style={{
            border: 'none',
            background: 'transparent',
            fontSize: 14,
          }}
          className="admin-sider-menu"
        />
      </div>

      {/* User footer */}
      <div
        style={{
          borderTop: '1px solid var(--color-divider)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Avatar
            size={40}
            icon={<UserOutlined />}
            style={{
              background: 'rgba(200,16,46,0.1)',
              color: 'var(--color-primary)',
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: 14,
                color: 'var(--color-ink)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.fullName ?? 'Quản Trị Viên'}
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--color-muted)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Administrator
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 10px',
            border: '1px solid var(--color-divider)',
            background: '#fff',
            borderRadius: 8,
            cursor: 'pointer',
            color: 'var(--color-text)',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <LogoutOutlined />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );

  return (
    <AuthGuard role="ADMIN">
      <Layout style={{ minHeight: '100vh', background: 'var(--color-soft)' }}>
        {/* Desktop sider — visible >= lg */}
        {!isCompact && (
          <Sider
            width={260}
            collapsedWidth={0}
            trigger={null}
            style={{
              background: '#fff',
              borderRight: '1px solid var(--color-divider)',
              position: 'sticky',
              top: 0,
              height: '100vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ height: '100vh' }}>{sidebarBody}</div>
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
          <Header
            style={{
              background: '#fff',
              borderBottom: '1px solid var(--color-divider)',
              padding: isSmDown ? '0 12px' : isCompact ? '0 16px' : '0 24px',
              height: isCompact ? 60 : 72,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: isCompact ? 8 : 16,
            }}
          >
            {/* Hamburger trigger (compact only) */}
            {isCompact && (
              <button
                type="button"
                aria-label="menu"
                onClick={() => setNavOpen(true)}
                style={iconButtonStyle}
              >
                <MenuOutlined />
              </button>
            )}

            {/* Search pill (desktop) OR icon (mobile/tablet) */}
            {isMdDown ? (
              <div style={{ flex: 1 }} />
            ) : (
              <div style={{ flex: 1, maxWidth: 560 }}>
                <Input
                  size="large"
                  prefix={
                    <SearchOutlined style={{ color: 'var(--color-muted)' }} />
                  }
                  placeholder="Tìm kiếm tác giả, tựa sách hoặc mã đơn hàng..."
                  style={{
                    borderRadius: 999,
                    background: 'var(--color-soft)',
                    border: '1px solid var(--color-divider)',
                  }}
                  allowClear
                />
              </div>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isSmDown ? 6 : 12,
              }}
            >
              {/* Search icon (md and down) */}
              {isMdDown && (
                <button
                  type="button"
                  aria-label="Tìm kiếm"
                  onClick={() => setSearchOpen(true)}
                  style={iconButtonStyle}
                >
                  <SearchOutlined />
                </button>
              )}

              <Badge dot color="#C8102E" offset={[-4, 4]}>
                <button
                  type="button"
                  aria-label="Thông báo"
                  style={iconButtonStyle}
                >
                  <BellOutlined />
                </button>
              </Badge>

              {/* Hide gear + help on very small screens */}
              {!isSmDown && (
                <>
                  <button
                    type="button"
                    aria-label="Cài đặt"
                    style={iconButtonStyle}
                  >
                    <SettingOutlined />
                  </button>
                  <button
                    type="button"
                    aria-label="Trợ giúp"
                    style={iconButtonStyle}
                  >
                    <QuestionCircleOutlined />
                  </button>
                </>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  paddingLeft: isSmDown ? 8 : 12,
                  borderLeft: '1px solid var(--color-divider)',
                  marginLeft: 4,
                }}
              >
                <Avatar
                  size={isSmDown ? 32 : 36}
                  icon={<UserOutlined />}
                  style={{
                    background: 'rgba(200,16,46,0.1)',
                    color: 'var(--color-primary)',
                  }}
                />
                {!isSmDown && (
                  <div style={{ lineHeight: 1.2 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: 'var(--color-ink)',
                        maxWidth: 140,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {user?.fullName ?? 'Quản trị'}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--color-muted)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Admin
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Header>
          <Content
            style={{
              padding: isSmDown ? 12 : isCompact ? 16 : 24,
              background: 'var(--color-soft)',
              overflow: 'auto',
            }}
          >
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
            placeholder="Tìm kiếm tác giả, tựa sách hoặc mã đơn hàng..."
            allowClear
          />
        </Modal>

        <style jsx global>{`
          .admin-sider-menu .ant-menu-item,
          .admin-sider-menu .ant-menu-submenu-title {
            border-radius: 8px !important;
            height: 42px !important;
            line-height: 42px !important;
            margin: 2px 0 !important;
            padding-left: 14px !important;
            color: var(--color-text) !important;
          }
          .admin-sider-menu .ant-menu-item:hover,
          .admin-sider-menu .ant-menu-submenu-title:hover {
            background: rgba(200, 16, 46, 0.04) !important;
          }
          .admin-sider-menu .ant-menu-item-selected {
            background: #fdecee !important;
            color: var(--color-primary) !important;
            position: relative;
            font-weight: 600;
          }
          .admin-sider-menu .ant-menu-item-selected::before {
            content: '';
            position: absolute;
            left: 0;
            top: 10px;
            bottom: 10px;
            width: 3px;
            background: var(--color-primary);
            border-radius: 0 3px 3px 0;
          }
          .admin-sider-menu .ant-menu-item-selected a {
            color: var(--color-primary) !important;
          }
        `}</style>
      </Layout>
    </AuthGuard>
  );
}

const iconButtonStyle: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 999,
  border: '1px solid var(--color-divider)',
  background: '#fff',
  color: 'var(--color-text)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 16,
  flex: '0 0 auto',
};
