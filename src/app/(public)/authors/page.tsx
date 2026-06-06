'use client';

import { useQuery } from '@tanstack/react-query';
import { Avatar, Col, Input, Pagination, Row, Skeleton } from 'antd';
import {
  ArrowRightOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useState, type CSSProperties } from 'react';
import { api, unwrap } from '@/lib/api';
import { EmptyState, PageHeading } from '@/components/editorial';
import { resolveImageUrl } from '@/lib/image-url';
import type { PageEnvelope } from '@/lib/types';

const PAGE_LIMIT = 24;

interface AuthorView {
  id: string;
  name: string;
  biography: string | null;
  nationality: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export default function AuthorsPage() {
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['public-authors', keyword, page],
    queryFn: async () => {
      const res = await api.get('/authors', {
        params: {
          keyword: keyword || undefined,
          page,
          limit: PAGE_LIMIT,
        },
      });
      return unwrap<PageEnvelope<AuthorView>>(res);
    },
  });

  const commitSearch = (v: string) => {
    setKeyword(v.trim());
    setPage(1);
  };

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div style={{ paddingBottom: 40 }}>
      <PageHeading
        eyebrow="Khám phá"
        title="Tác giả"
        subtitle={`Khám phá ${
          total > 0 ? total + ' ' : ''
        }tác giả và những đầu sách của họ tại The Editorial.`}
      />

      <div style={{ maxWidth: 480, marginBottom: 28 }}>
        <Input
          allowClear
          size="large"
          prefix={<SearchOutlined style={{ color: 'var(--color-muted)' }} />}
          placeholder="Tìm tác giả theo tên..."
          value={keywordInput}
          onChange={(e) => {
            setKeywordInput(e.target.value);
            // Reset immediately when the field is cleared.
            if (e.target.value === '') commitSearch('');
          }}
          onPressEnter={() => commitSearch(keywordInput)}
          style={{
            borderRadius: 999,
            background: 'var(--color-soft)',
            borderColor: 'transparent',
            padding: '8px 18px',
          }}
        />
      </div>

      {isLoading ? (
        <Row gutter={[24, 24]}>
          {Array.from({ length: 9 }).map((_, i) => (
            <Col xs={24} sm={12} lg={8} key={i}>
              <div style={cardStyle}>
                <Skeleton avatar={{ size: 64 }} active paragraph={{ rows: 2 }} />
              </div>
            </Col>
          ))}
        </Row>
      ) : items.length === 0 ? (
        <EmptyState
          title="Không tìm thấy tác giả"
          description="Thử từ khoá khác, hoặc khám phá toàn bộ kho sách."
        />
      ) : (
        <>
          <Row gutter={[24, 24]}>
            {items.map((a) => (
              <Col xs={24} sm={12} lg={8} key={a.id}>
                <Link
                  href={`/books?authors=${a.id}`}
                  style={{ display: 'block', height: '100%' }}
                  aria-label={`Xem sách của ${a.name}`}
                >
                  <div style={cardStyle}>
                    <Avatar
                      size={64}
                      src={
                        a.avatarUrl ? resolveImageUrl(a.avatarUrl) : undefined
                      }
                      icon={<UserOutlined />}
                      style={{
                        background: 'var(--color-soft)',
                        color: 'var(--color-muted)',
                        flex: '0 0 auto',
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={nameStyle}>{a.name}</div>
                      {a.nationality ? (
                        <div style={natStyle}>{a.nationality}</div>
                      ) : null}
                      {a.biography ? (
                        <div style={bioStyle}>{a.biography}</div>
                      ) : null}
                      <div style={ctaStyle}>
                        Xem sách <ArrowRightOutlined style={{ fontSize: 12 }} />
                      </div>
                    </div>
                  </div>
                </Link>
              </Col>
            ))}
          </Row>

          <div
            style={{
              marginTop: 40,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Pagination
              current={page}
              pageSize={PAGE_LIMIT}
              total={total}
              showSizeChanger={false}
              disabled={isFetching}
              onChange={(p) => setPage(p)}
            />
          </div>
        </>
      )}
    </div>
  );
}

const cardStyle: CSSProperties = {
  display: 'flex',
  gap: 16,
  alignItems: 'flex-start',
  background: '#fff',
  border: '1px solid var(--color-divider)',
  borderRadius: 16,
  padding: 20,
  height: '100%',
};

const nameStyle: CSSProperties = {
  fontFamily: 'var(--font-serif), Georgia, serif',
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--color-ink)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const natStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--color-muted)',
  marginTop: 2,
};

const bioStyle: CSSProperties = {
  fontSize: 13,
  color: 'var(--color-text)',
  marginTop: 8,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const ctaStyle: CSSProperties = {
  marginTop: 12,
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-primary)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};
