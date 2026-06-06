'use client';

import { Button, Card, Empty, Pagination, Segmented, Skeleton, Space } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import Link from 'next/link';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthGuard } from '@/components/layout/auth-guard';
import { EmptyState, PageHeading } from '@/components/editorial';
import {
  useMarkAllRead,
  useMarkRead,
  useNotificationsList,
} from '@/lib/notifications-hooks';
import type { NotificationItem } from '@/lib/types';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const PAGE_LIMIT = 20;

function NotificationsInner() {
  const router = useRouter();
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useNotificationsList({
    page,
    limit: PAGE_LIMIT,
    unreadOnly: filter === 'UNREAD',
  });
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const handleClick = (n: NotificationItem) => {
    if (!n.isRead) markRead.mutate(n.id);
    if (n.link) router.push(n.link);
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      <PageHeading
        eyebrow="Hộp thư"
        title="Thông báo"
        subtitle="Cập nhật đơn hàng, khuyến mãi và tin tức từ The Editorial."
        trailing={
          <Button
            onClick={() => markAll.mutate()}
            loading={markAll.isPending}
            disabled={total === 0}
          >
            Đánh dấu đã đọc tất cả
          </Button>
        }
      />

      <Card style={{ borderRadius: 16 }}>
        <Space
          style={{
            width: '100%',
            justifyContent: 'space-between',
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          <Segmented
            value={filter}
            onChange={(v) => {
              setFilter(v as 'ALL' | 'UNREAD');
              setPage(1);
            }}
            options={[
              { label: 'Tất cả', value: 'ALL' },
              { label: 'Chưa đọc', value: 'UNREAD' },
            ]}
          />
          <span style={{ color: 'var(--color-muted)', fontSize: 13 }}>
            {total} thông báo
          </span>
        </Space>

        {isLoading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<BellOutlined />}
            title={
              filter === 'UNREAD'
                ? 'Bạn đã đọc hết thông báo'
                : 'Chưa có thông báo nào'
            }
            description="Các cập nhật về đơn hàng, khuyến mãi sẽ xuất hiện tại đây."
            cta={
              <Link href="/books">
                <Button type="primary">Tiếp tục mua sắm</Button>
              </Link>
            }
          />
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n)}
                  style={{
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start',
                    padding: '14px 16px',
                    background: n.isRead
                      ? '#fff'
                      : 'rgba(200,16,46,0.04)',
                    border: `1px solid ${n.isRead ? 'var(--color-divider)' : 'rgba(200,16,46,0.18)'}`,
                    borderRadius: 12,
                    cursor: n.link ? 'pointer' : 'default',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: n.isRead
                        ? 'var(--color-divider)'
                        : 'var(--color-primary)',
                      marginTop: 8,
                      flex: '0 0 10px',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily:
                          'var(--font-serif), Georgia, serif',
                        fontSize: 16,
                        fontWeight: 700,
                        color: 'var(--color-ink)',
                      }}
                    >
                      {n.title}
                    </div>
                    {n.content ? (
                      <div
                        style={{
                          fontSize: 14,
                          color: 'var(--color-text)',
                          marginTop: 4,
                          lineHeight: 1.55,
                        }}
                      >
                        {n.content}
                      </div>
                    ) : null}
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--color-muted)',
                        marginTop: 6,
                      }}
                    >
                      {dayjs(n.createdAt).fromNow()}
                      {n.link ? (
                        <>
                          {' · '}
                          <span style={{ color: 'var(--color-primary)' }}>
                            Xem chi tiết →
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {total > PAGE_LIMIT ? (
              <div
                style={{
                  marginTop: 20,
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <Pagination
                  current={page}
                  pageSize={PAGE_LIMIT}
                  total={total}
                  showSizeChanger={false}
                  onChange={setPage}
                />
              </div>
            ) : null}
          </>
        )}
      </Card>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <AuthGuard role="CUSTOMER">
      <NotificationsInner />
    </AuthGuard>
  );
}
