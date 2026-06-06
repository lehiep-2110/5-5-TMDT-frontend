'use client';

import { useQuery } from '@tanstack/react-query';
import { Avatar, Empty, Pagination, Rate, Skeleton } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { useMemo, useState } from 'react';
import { api, unwrap } from '@/lib/api';
import type { BookReviewsResponse } from '@/lib/types';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const LIMIT = 10;

/**
 * Distribution bar for a given star level.
 */
function DistributionRow({
  stars,
  count,
  total,
}: {
  stars: number;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '36px 1fr 40px',
        gap: 10,
        alignItems: 'center',
        fontSize: 12,
      }}
    >
      <span style={{ color: 'var(--color-muted)' }}>{stars} sao</span>
      <div
        style={{
          height: 8,
          borderRadius: 999,
          background: 'var(--color-soft)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: 'var(--color-primary)',
            transition: 'width 220ms ease',
          }}
        />
      </div>
      <span style={{ color: 'var(--color-muted)', textAlign: 'right' }}>
        {count}
      </span>
    </div>
  );
}

interface ReviewsTabProps {
  slug: string;
}

export function ReviewsTab({ slug }: ReviewsTabProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['book-reviews', slug, page],
    enabled: !!slug,
    queryFn: async () => {
      const res = await api.get(`/books/${slug}/reviews`, {
        params: { page, limit: LIMIT },
      });
      return unwrap<BookReviewsResponse>(res);
    },
  });

  // Distribution is computed from the items on the current page — which is
  // approximate but good enough as a visual cue. (The full backend does not
  // expose a per-star breakdown.)
  const distribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0]; // index 0 = 1-star ... index 4 = 5-star
    if (data?.items) {
      for (const it of data.items) {
        const idx = Math.max(0, Math.min(4, (it.stars ?? 0) - 1));
        dist[idx] += 1;
      }
    }
    return dist;
  }, [data?.items]);

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  if (!data) {
    return <Empty description="Không tải được đánh giá" />;
  }

  const avg = Number(data.avgRating) || 0;
  const totalReviews = data.reviewCount;

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: 32,
          alignItems: 'center',
          padding: '16px 0 24px',
          borderBottom: '1px solid var(--color-divider)',
          marginBottom: 20,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: 'var(--font-serif), Georgia, serif',
              fontSize: 48,
              fontWeight: 700,
              color: 'var(--color-primary)',
              lineHeight: 1,
            }}
          >
            {avg.toFixed(1)}
          </div>
          <Rate disabled allowHalf value={avg} style={{ fontSize: 16 }} />
          <div
            style={{
              fontSize: 12,
              color: 'var(--color-muted)',
              marginTop: 6,
            }}
          >
            {totalReviews} đánh giá
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[5, 4, 3, 2, 1].map((s) => (
            <DistributionRow
              key={s}
              stars={s}
              count={distribution[s - 1]}
              total={data.items.length || 1}
            />
          ))}
        </div>
      </div>

      {data.items.length === 0 ? (
        <Empty description="Chưa có đánh giá nào." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {data.items.map((r) => (
            <div
              key={r.id}
              style={{
                display: 'flex',
                gap: 14,
                paddingBottom: 20,
                borderBottom: '1px solid var(--color-divider)',
              }}
            >
              <Avatar
                size={40}
                icon={<UserOutlined />}
                src={r.user.avatarUrl ?? undefined}
                style={{ background: 'var(--color-soft)', flex: '0 0 40px' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <strong style={{ color: 'var(--color-ink)' }}>
                    {r.user.fullName}
                  </strong>
                  <span style={{ color: 'var(--color-muted)', fontSize: 12 }}>
                    {dayjs(r.createdAt).fromNow()}
                  </span>
                </div>
                <Rate
                  disabled
                  value={r.stars}
                  style={{ fontSize: 13, marginTop: 4 }}
                />
                {r.title ? (
                  <div
                    style={{
                      fontWeight: 700,
                      color: 'var(--color-ink)',
                      marginTop: 6,
                    }}
                  >
                    {r.title}
                  </div>
                ) : null}
                {r.content ? (
                  <div
                    style={{
                      fontSize: 14,
                      lineHeight: 1.65,
                      color: 'var(--color-text)',
                      marginTop: 4,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {r.content}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalReviews > LIMIT ? (
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            current={page}
            pageSize={LIMIT}
            total={totalReviews}
            showSizeChanger={false}
            onChange={setPage}
          />
        </div>
      ) : null}
    </div>
  );
}
