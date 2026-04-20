'use client';

import { Button, Result, Spin, Typography } from 'antd';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, type CSSProperties } from 'react';
import { useVerifyEmail } from '@/lib/auth-hooks';
import { extractErrorMessage } from '@/lib/api';

const { Paragraph, Text } = Typography;

const headingStyle: CSSProperties = {
  fontFamily: 'var(--font-serif), Georgia, serif',
  fontSize: 36,
  lineHeight: 1.15,
  letterSpacing: '-0.01em',
  color: 'var(--color-ink)',
  margin: 0,
  fontWeight: 700,
};

const subtitleStyle: CSSProperties = {
  color: 'var(--color-muted)',
  fontSize: 15,
  marginTop: 12,
  marginBottom: 32,
};

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { isLoading, isError, isSuccess, error } = useVerifyEmail(token);

  if (!token) {
    return (
      <div>
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          Xác thực email
        </div>
        <h1 style={headingStyle}>Thiếu token xác thực</h1>
        <p style={subtitleStyle}>
          Vui lòng mở liên kết xác thực từ email. Liên kết hiện được log ở
          console của backend, copy đầy đủ vào trình duyệt.
        </p>
        <Link href="/login">
          <Button
            type="primary"
            size="large"
            block
            style={{
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Về trang đăng nhập
          </Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16, color: 'var(--color-muted)' }}>
          Đang xác thực email...
        </Paragraph>
      </div>
    );
  }

  if (isError) {
    return (
      <Result
        status="error"
        title="Xác thực thất bại"
        subTitle={
          <Text>
            {extractErrorMessage(error, 'Token không hợp lệ hoặc đã hết hạn')}
          </Text>
        }
        extra={
          <Link href="/login">
            <Button type="primary">Về trang đăng nhập</Button>
          </Link>
        }
      />
    );
  }

  if (isSuccess) {
    return (
      <div>
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          Thành công
        </div>
        <h1 style={headingStyle}>Xác thực email thành công</h1>
        <p style={subtitleStyle}>Bạn đã có thể đăng nhập vào hệ thống.</p>
        <Link href="/login">
          <Button
            type="primary"
            size="large"
            block
            style={{
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Đăng nhập ngay
          </Button>
        </Link>
      </div>
    );
  }

  return null;
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Spin size="large" />
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
