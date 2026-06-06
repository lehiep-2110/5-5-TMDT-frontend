"use client";

import {
  Avatar,
  Badge,
  Button,
  Drawer,
  Dropdown,
  Empty,
  Input,
  Layout,
  Popover,
  Space,
  Spin,
} from "antd";
import {
  BellOutlined,
  CloseOutlined,
  FileTextOutlined,
  HeartOutlined,
  LogoutOutlined,
  MenuOutlined,
  ProfileOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import { Suspense, useEffect, useState, type CSSProperties } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { useCartBadge, useCurrentUser, useLogout } from "@/lib/auth-hooks";
import {
  useMarkAllRead,
  useMarkRead,
  useNotificationsList,
  useNotificationsSSE,
  useUnreadCount,
} from "@/lib/notifications-hooks";
import { EditorialLogo } from "@/components/editorial";
import { useResponsive } from "@/lib/use-responsive";
import type { NotificationItem } from "@/lib/types";

const { Header } = Layout;

// Configure once — safe to call on every render; dayjs is idempotent.
dayjs.extend(relativeTime);
dayjs.locale("vi");

const NAV_ITEMS: { label: string; href: string }[] = [
  { label: "Trang chủ", href: "/" },
  { label: "Sách mới", href: "/books?sort=newest" },
  { label: "Bán chạy", href: "/books?sort=bestselling" },
  { label: "Tác giả", href: "/authors" },
];

/**
 * Renders the nav links with correct active highlighting. Uses useSearchParams,
 * so it must be wrapped in a <Suspense> boundary by the caller.
 */
function NavLinks({
  variant,
  onNavigate,
}: {
  variant: "desktop" | "drawer";
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Active when the path matches AND every query param in the nav href (e.g.
  // ?sort=newest) matches the current URL — so items sharing /books don't all
  // light up at once.
  const isActive = (href: string): boolean => {
    const [path, query] = href.split("?");
    if (path === "/") return pathname === "/";
    if (!pathname?.startsWith(path)) return false;
    if (!query) return true;
    const target = new URLSearchParams(query);
    let active = true;
    target.forEach((value, key) => {
      if (searchParams.get(key) !== value) active = false;
    });
    return active;
  };

  return (
    <>
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavigate}
            style={
              variant === "desktop"
                ? navLinkStyle(active)
                : drawerLinkStyle(active)
            }
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

function navLinkStyle(active: boolean): CSSProperties {
  return {
    fontSize: 14,
    fontWeight: 500,
    color: active ? "var(--color-primary)" : "var(--color-ink)",
    letterSpacing: "0.01em",
  };
}

function drawerLinkStyle(active: boolean): CSSProperties {
  return {
    display: "block",
    padding: "16px 24px",
    fontSize: 16,
    fontWeight: 500,
    color: active ? "var(--color-primary)" : "var(--color-ink)",
    borderBottom: "1px solid var(--color-divider)",
    letterSpacing: "0.01em",
  };
}

export function PublicHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  useCurrentUser();
  const logout = useLogout();
  const cartCount = useCartBadge();
  const [keyword, setKeyword] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { screens, isSmDown } = useResponsive();

  // Desktop = lg and up. Anything narrower uses drawers/icons.
  const isCompact = !screens.lg;

  // Realtime SSE stream — auto-enables only for logged-in CUSTOMERs.
  useNotificationsSSE();

  // Close drawers on route change.
  useEffect(() => {
    setNavOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const handleSearch = (value: string) => {
    const q = value.trim();
    setSearchOpen(false);
    if (!q) {
      router.push("/books");
      return;
    }
    router.push(`/books?keyword=${encodeURIComponent(q)}`);
  };

  const userMenu = {
    items: [
      {
        key: "profile",
        icon: <ProfileOutlined />,
        label: <Link href="/profile">Tài khoản</Link>,
      },
      {
        key: "orders",
        icon: <FileTextOutlined />,
        label: <Link href="/orders">Đơn hàng của tôi</Link>,
      },
      {
        key: "wishlist",
        icon: <HeartOutlined />,
        label: <Link href="/wishlist">Đã yêu thích</Link>,
      },
      {
        key: "reviews",
        icon: <FileTextOutlined />,
        label: <Link href="/profile/reviews">Đánh giá của tôi</Link>,
      },
      { type: "divider" as const },
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Đăng xuất",
        onClick: async () => {
          await logout.mutateAsync();
          router.push("/");
        },
      },
    ],
  };

  const headerStyle: CSSProperties = {
    background: "#fff",
    padding: 0,
    borderBottom: "1px solid var(--color-divider)",
    height: isCompact ? 60 : 72,
    lineHeight: "normal",
    position: "sticky",
    top: 0,
    zIndex: 20,
  };

  const innerStyle: CSSProperties = {
    maxWidth: 1280,
    margin: "0 auto",
    padding: isSmDown ? "0 8px" : isCompact ? "0 16px" : "0 24px",
    height: "100%",
    display: "flex",
    alignItems: "center",
    gap: isSmDown ? 8 : isCompact ? 12 : 32,
  };

  const navStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 24,
  };

  const iconBtn: CSSProperties = {
    width: isSmDown ? 34 : 40,
    height: isSmDown ? 34 : 40,
    borderRadius: 999,
    border: "1px solid var(--color-divider)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--color-ink)",
    background: "#fff",
    cursor: "pointer",
    flex: "0 0 auto",
  };

  return (
    <Header style={headerStyle}>
      <div style={innerStyle}>
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", flex: "0 0 auto" }}
          aria-label="Trang chủ"
        >
          <EditorialLogo size={isSmDown ? "xs" : isCompact ? "sm" : "md"} />
        </Link>

        {/* Desktop search bar (lg+) */}
        {!isCompact && (
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <Input
              allowClear
              size="large"
              prefix={
                <SearchOutlined style={{ color: "var(--color-muted)" }} />
              }
              placeholder="Tìm kiếm tác giả, tựa sách hoặc danh mục..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={() => handleSearch(keyword)}
              style={{
                width: "100%",
                maxWidth: 520,
                borderRadius: 999,
                background: "var(--color-soft)",
                borderColor: "transparent",
                padding: "8px 18px",
              }}
            />
          </div>
        )}

        {/* Desktop nav (lg+) */}
        {!isCompact && (
          <nav style={navStyle} aria-label="Primary">
            <Suspense fallback={null}>
              <NavLinks variant="desktop" />
            </Suspense>
          </nav>
        )}

        {/* Spacer when compact pushes right cluster to the edge */}
        {isCompact && <div style={{ flex: 1 }} />}

        <Space size={isSmDown ? 4 : 12} align="center">
          {/* Compact: surface search as an icon button that opens a drawer */}
          {isCompact && (
            <button
              type="button"
              aria-label="Tìm kiếm"
              onClick={() => setSearchOpen(true)}
              style={{ ...iconBtn, border: "1px solid var(--color-divider)" }}
            >
              <SearchOutlined style={{ fontSize: 18 }} />
            </button>
          )}

          <Link href="/cart" aria-label="Giỏ hàng" style={iconBtn}>
            <Badge
              count={cartCount}
              size="small"
              showZero={false}
              offset={[2, -2]}
            >
              <ShoppingCartOutlined style={{ fontSize: 18 }} />
            </Badge>
          </Link>

          {/* Bell — interactive only when logged in as a customer. */}
          {accessToken && (!user || user.role === "CUSTOMER") ? (
            <NotificationsBell iconBtnStyle={iconBtn} />
          ) : !isSmDown ? (
            <span style={iconBtn} aria-label="Thông báo">
              <BellOutlined style={{ fontSize: 18 }} />
            </span>
          ) : null}

          {accessToken && user ? (
            <Dropdown menu={userMenu} placement="bottomRight">
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: isSmDown ? 2 : "4px 10px 4px 4px",
                  borderRadius: 999,
                  border: "1px solid var(--color-divider)",
                  cursor: "pointer",
                }}
              >
                <Avatar
                  size={32}
                  icon={<UserOutlined />}
                  src={user.avatarUrl ?? undefined}
                  style={{ background: "var(--color-soft)" }}
                />
                {!isSmDown && (
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--color-ink)",
                      maxWidth: 140,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {user.fullName}
                  </span>
                )}
              </span>
            </Dropdown>
          ) : isCompact ? (
            // Compact: only show a single primary action to save room.
            <Button
              type="primary"
              size="small"
              onClick={() => router.push("/login")}
            >
              Đăng nhập
            </Button>
          ) : (
            <Space size={8}>
              <Button onClick={() => router.push("/register")}>Đăng ký</Button>
              <Button type="primary" onClick={() => router.push("/login")}>
                Đăng nhập
              </Button>
            </Space>
          )}

          {/* Hamburger — compact only, opens nav drawer */}
          {isCompact && (
            <button
              type="button"
              aria-label="menu"
              onClick={() => setNavOpen(true)}
              style={iconBtn}
            >
              <MenuOutlined style={{ fontSize: 18 }} />
            </button>
          )}
        </Space>
      </div>

      {/* Mobile / tablet nav drawer */}
      <Drawer
        open={navOpen}
        onClose={() => setNavOpen(false)}
        placement="right"
        width={300}
        title={<EditorialLogo size="sm" />}
        closeIcon={<CloseOutlined />}
        styles={{ body: { padding: 0 } }}
      >
        <nav
          aria-label="Mobile primary"
          style={{ display: "flex", flexDirection: "column" }}
        >
          <Suspense fallback={null}>
            <NavLinks variant="drawer" onNavigate={() => setNavOpen(false)} />
          </Suspense>
        </nav>
      </Drawer>

      {/* Mobile / tablet search drawer (top sheet) */}
      <Drawer
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        placement="top"
        height={120}
        closeIcon={<CloseOutlined />}
        styles={{ body: { padding: 16 } }}
      >
        <Input
          allowClear
          autoFocus
          size="large"
          prefix={<SearchOutlined style={{ color: "var(--color-muted)" }} />}
          placeholder="Tìm tác giả, tựa sách..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={() => handleSearch(keyword)}
          style={{
            width: "100%",
            borderRadius: 999,
            background: "var(--color-soft)",
            borderColor: "transparent",
            padding: "8px 18px",
          }}
        />
      </Drawer>
    </Header>
  );
}

/* --------------------------------------------------------------------------
 * Notifications bell (dropdown + badge)
 * ------------------------------------------------------------------------ */
function NotificationsBell({ iconBtnStyle }: { iconBtnStyle: CSSProperties }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const unreadCount = useUnreadCount();
  // Only fetch the list while the popover is open to avoid an extra request
  // for every page the user visits.
  const { data, isLoading } = useNotificationsList({
    page: 1,
    limit: 8,
  });
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();

  // Close when route changes.
  useEffect(() => {
    if (open) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const items = data?.items ?? [];

  const handleItemClick = (n: NotificationItem) => {
    if (!n.isRead) markRead.mutate(n.id);
    setOpen(false);
    if (n.link) {
      router.push(n.link);
    }
  };

  const content = (
    <div style={{ width: 340, maxWidth: "90vw" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "4px 4px 10px",
          borderBottom: "1px solid var(--color-divider)",
          marginBottom: 4,
        }}
      >
        <strong
          style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontSize: 16,
          }}
        >
          Thông báo
        </strong>
        <button
          type="button"
          onClick={() => markAll.mutate()}
          disabled={markAll.isPending || unreadCount === 0}
          style={{
            background: "transparent",
            border: "none",
            color:
              unreadCount > 0 ? "var(--color-primary)" : "var(--color-muted)",
            cursor: unreadCount > 0 ? "pointer" : "default",
            fontSize: 12,
            fontWeight: 600,
            padding: 0,
          }}
        >
          Đánh dấu đã đọc tất cả
        </button>
      </div>

      <div style={{ maxHeight: 360, overflowY: "auto" }}>
        {isLoading ? (
          <div style={{ padding: 24, textAlign: "center" }}>
            <Spin size="small" />
          </div>
        ) : items.length === 0 ? (
          <Empty
            description="Chưa có thông báo"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ margin: "24px 0" }}
          />
        ) : (
          items.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => handleItemClick(n)}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                padding: "10px 8px",
                width: "100%",
                textAlign: "left",
                background: n.isRead ? "transparent" : "rgba(200,16,46,0.04)",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                transition: "background 120ms ease",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: n.isRead ? "transparent" : "var(--color-primary)",
                  marginTop: 6,
                  flex: "0 0 8px",
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: n.isRead ? 500 : 700,
                    fontSize: 13,
                    color: "var(--color-ink)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {n.title}
                </div>
                {n.content ? (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--color-muted)",
                      marginTop: 2,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {n.content}
                  </div>
                ) : null}
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--color-muted)",
                    marginTop: 4,
                  }}
                >
                  {dayjs(n.createdAt).fromNow()}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      <div
        style={{
          borderTop: "1px solid var(--color-divider)",
          marginTop: 6,
          paddingTop: 6,
          textAlign: "center",
        }}
      >
        <Link
          href="/notifications"
          onClick={() => setOpen(false)}
          style={{
            color: "var(--color-primary)",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Xem tất cả
        </Link>
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
      overlayStyle={{ paddingTop: 4 }}
    >
      <span
        style={{ ...iconBtnStyle, cursor: "pointer" }}
        aria-label="Thông báo"
      >
        <Badge
          count={unreadCount}
          size="small"
          showZero={false}
          offset={[2, -2]}
        >
          <BellOutlined style={{ fontSize: 18 }} />
        </Badge>
      </span>
    </Popover>
  );
}
