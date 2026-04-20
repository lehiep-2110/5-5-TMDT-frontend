'use client';

import {
  Avatar,
  Badge,
  Button,
  Dropdown,
  Input,
  Layout,
  Space,
} from 'antd';
import {
  BellOutlined,
  FileTextOutlined,
  LogoutOutlined,
  ProfileOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type CSSProperties } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useCartBadge, useCurrentUser, useLogout } from '@/lib/auth-hooks';
import { EditorialLogo } from '@/components/editorial';

const { Header } = Layout;

const NAV_ITEMS: { label: string; href: string }[] = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Sách mới', href: '/books?sort=newest' },
  { label: 'Bán chạy', href: '/books?sort=bestselling' },
  { label: 'Sưu tầm', href: '/books' },
  { label: 'Tác giả', href: '/books' },
];

export function PublicHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  useCurrentUser();
  const logout = useLogout();
  const cartCount = useCartBadge();
  const [keyword, setKeyword] = useState('');

  const handleSearch = (value: string) => {
    const q = value.trim();
    if (!q) {
      router.push('/books');
      return;
    }
    router.push(`/books?keyword=${encodeURIComponent(q)}`);
  };

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <ProfileOutlined />,
        label: <Link href="/profile">Tài khoản</Link>,
      },
      {
        key: 'orders',
        icon: <FileTextOutlined />,
        label: <Link href="/orders">Đơn hàng của tôi</Link>,
      },
      { type: 'divider' as const },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Đăng xuất',
        onClick: async () => {
          await logout.mutateAsync();
          router.push('/');
        },
      },
    ],
  };

  const headerStyle: CSSProperties = {
    background: '#fff',
    padding: 0,
    borderBottom: '1px solid var(--color-divider)',
    height: 72,
    lineHeight: 'normal',
    position: 'sticky',
    top: 0,
    zIndex: 20,
  };

  const innerStyle: CSSProperties = {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '0 24px',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 32,
  };

  const navStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
  };

  const iconBtn: CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: 999,
    border: '1px solid var(--color-divider)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-ink)',
    background: '#fff',
    cursor: 'pointer',
  };

  return (
    <Header style={headerStyle}>
      <div style={innerStyle}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
          <EditorialLogo size="md" />
        </Link>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Input
            allowClear
            size="large"
            prefix={
              <SearchOutlined style={{ color: 'var(--color-muted)' }} />
            }
            placeholder="Tìm kiếm tác giả, tựa sách hoặc danh mục..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => handleSearch(keyword)}
            style={{
              width: '100%',
              maxWidth: 520,
              borderRadius: 999,
              background: 'var(--color-soft)',
              borderColor: 'transparent',
              padding: '8px 18px',
            }}
          />
        </div>

        <nav style={navStyle} aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname?.startsWith(item.href.split('?')[0] ?? item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: isActive
                    ? 'var(--color-primary)'
                    : 'var(--color-ink)',
                  letterSpacing: '0.01em',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Space size={12} align="center">
          <Link href="/cart" aria-label="Giỏ hàng" style={iconBtn}>
            <Badge count={cartCount} size="small" showZero={false} offset={[2, -2]}>
              <ShoppingCartOutlined style={{ fontSize: 18 }} />
            </Badge>
          </Link>

          <span style={iconBtn} aria-label="Thông báo">
            <BellOutlined style={{ fontSize: 18 }} />
          </span>

          {accessToken && user ? (
            <Dropdown menu={userMenu} placement="bottomRight">
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '4px 10px 4px 4px',
                  borderRadius: 999,
                  border: '1px solid var(--color-divider)',
                  cursor: 'pointer',
                }}
              >
                <Avatar
                  size={32}
                  icon={<UserOutlined />}
                  src={user.avatarUrl ?? undefined}
                  style={{ background: 'var(--color-soft)' }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--color-ink)',
                  }}
                >
                  {user.fullName}
                </span>
              </span>
            </Dropdown>
          ) : (
            <Space size={8}>
              <Button onClick={() => router.push('/register')}>Đăng ký</Button>
              <Button type="primary" onClick={() => router.push('/login')}>
                Đăng nhập
              </Button>
            </Space>
          )}
        </Space>
      </div>
    </Header>
  );
}
