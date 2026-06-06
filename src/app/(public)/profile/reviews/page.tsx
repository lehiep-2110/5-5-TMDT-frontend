'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, Empty, Pagination, Rate, Skeleton } from 'antd';
import Link from 'next/link';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { useState } from 'react';
import { api, unwrap } from '@/lib/api';
import { AuthGuard } from '@/components/layout/auth-guard';
import { PageHeading } from '@/components/editorial';
import type { MyReviewItem, PageEnvelope } from '@/lib/types';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const LIMIT = 20;

function MyReviewsInner() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['my-reviews', page],
    queryFn: async () => {
      const res = await api.get('/reviews/me', {
        params: { page, limit: LIMIT },
      });
      return unwrap<PageEnvelope<MyReviewItem>>(res);
    },
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div>
      <PageHeading
        eyebrow="Tài khoản"
        title="Đánh giá của tôi"
        subtitle="Tất cả nhận xét bạn đã gửi cho các cuốn sách đã mua."
      />
      <Card style={{ borderRadius: 16 }}>
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : items.length === 0 ? (
          <Empty description="Bạn chưa viết đánh giá nào." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {items.map((r) => (
              <div
                key={r.id}
                style={{
                  padding: 16,
                  border: '1px solid var(--color-divider)',
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  {r.book ? (
                    <Link
                      href={`/books/${r.book.slug}`}
                      style={{
                        fontFamily: 'var(--font-serif), Georgia, serif',
                        fontSize: 16,
                        fontWeight: 700,
                        color: 'var(--color-ink)',
                      }}
                    >
                      {r.book.title}
                    </Link>
                  ) : (
                    <span style={{ fontWeight: 700 }}>Sách không còn</span>
                  )}
                  <span style={{ color: 'var(--color-muted)', fontSize: 12 }}>
                    {dayjs(r.createdAt).fromNow()}
                  </span>
                </div>
                <Rate
                  disabled
                  value={r.stars}
                  style={{ fontSize: 14, marginTop: 4 }}
                />
                {r.title ? (
                  <div style={{ fontWeight: 600, marginTop: 6 }}>
                    {r.title}
                  </div>
                ) : null}
                {r.content ? (
                  <div
                    style={{
                      fontSize: 14,
                      color: 'var(--color-text)',
                      marginTop: 4,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {r.content}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {total > LIMIT ? (
          <div
            style={{
              marginTop: 20,
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <Pagination
              current={page}
              pageSize={LIMIT}
              total={total}
              showSizeChanger={false}
              onChange={setPage}
            />
          </div>
        ) : null}
      </Card>
    </div>
  );
}

export default function MyReviewsPage() {
  return (
    <AuthGuard role="CUSTOMER">
      <MyReviewsInner />
    </AuthGuard>
  );
}
