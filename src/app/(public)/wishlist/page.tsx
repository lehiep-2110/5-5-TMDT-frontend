'use client';

import { Button, Col, Pagination, Row } from 'antd';
import { HeartOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useState } from 'react';
import { AuthGuard } from '@/components/layout/auth-guard';
import { BookCard } from '@/components/book-card';
import { BookCardSkeleton } from '@/components/book-card-skeleton';
import { EmptyState, PageHeading } from '@/components/editorial';
import { useWishlistList } from '@/lib/wishlist-hooks';
import type { BookListItem, WishlistItem } from '@/lib/types';

const PAGE_LIMIT = 24;

function toBookListItem(w: WishlistItem): BookListItem {
  return {
    id: w.book.id,
    slug: w.book.slug,
    title: w.book.title,
    isbn: '',
    price: w.book.price,
    discountPrice: w.book.discountPrice,
    discountEndDate: null,
    avgRating: '0',
    reviewCount: 0,
    stockQuantity: w.book.stockQuantity,
    status: w.book.stockQuantity > 0 ? 'ACTIVE' : 'INACTIVE',
    primaryImage: w.book.primaryImage,
    authors: w.book.authors,
    publisher: null,
    category: null,
  };
}

function WishlistInner() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useWishlistList({ page, limit: PAGE_LIMIT });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div style={{ paddingBottom: 40 }}>
      <PageHeading
        eyebrow="Tủ sách của tôi"
        title="Danh sách yêu thích"
        subtitle={
          total > 0
            ? `Bạn đang lưu ${total} đầu sách để đọc sau.`
            : 'Bấm hình trái tim trên mỗi cuốn để lưu vào tủ sách của bạn.'
        }
      />

      {isLoading ? (
        <Row gutter={[24, 32]}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Col xs={12} sm={8} md={6} lg={{ span: 24 / 5 }} key={i}>
              <BookCardSkeleton />
            </Col>
          ))}
        </Row>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<HeartOutlined />}
          title="Chưa có sách yêu thích nào"
          description="Hãy khám phá kho sách và bấm vào trái tim để lưu lại những tựa sách bạn muốn đọc."
          cta={
            <Link href="/books">
              <Button type="primary" size="large">
                Khám phá sách
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <Row gutter={[24, 32]}>
            {items.map((w) => (
              <Col
                xs={12}
                sm={8}
                md={6}
                lg={{ span: 24 / 5 }}
                key={w.id ?? w.book.id}
              >
                <BookCard book={toBookListItem(w)} />
              </Col>
            ))}
          </Row>
          {total > PAGE_LIMIT ? (
            <div
              style={{
                marginTop: 32,
                display: 'flex',
                justifyContent: 'center',
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
    </div>
  );
}

export default function WishlistPage() {
  return (
    <AuthGuard role="CUSTOMER">
      <WishlistInner />
    </AuthGuard>
  );
}
