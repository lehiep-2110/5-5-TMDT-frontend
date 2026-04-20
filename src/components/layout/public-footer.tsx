'use client';

import Link from 'next/link';
import { Layout } from 'antd';
import type { CSSProperties } from 'react';
import { EditorialLogo } from '@/components/editorial';

const { Footer } = Layout;

type FooterLink = { label: string; href: string };

const EXPLORE: FooterLink[] = [
  { label: 'Về chúng tôi', href: '#' },
  { label: 'Hệ thống cửa hàng', href: '#' },
  { label: 'Tạp chí & Ấn bản', href: '#' },
  { label: 'Blog Sách', href: '#' },
];

const SUPPORT: FooterLink[] = [
  { label: 'Chính sách bảo mật', href: '#' },
  { label: 'Điều khoản dịch vụ', href: '#' },
  { label: 'Đổi trả & Kiến nghị', href: '#' },
  { label: 'Vận chuyển', href: '#' },
];

const PAYMENTS = ['VISA', 'MOMO', 'VNPAY'];

export function PublicFooter() {
  const footerStyle: CSSProperties = {
    background: '#fff',
    color: 'var(--color-text)',
    padding: '56px 0 32px',
    borderTop: '1px solid var(--color-divider)',
  };
  const innerStyle: CSSProperties = {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '0 24px',
  };
  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 40,
    marginBottom: 40,
  };
  const titleStyle: CSSProperties = {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    fontWeight: 600,
    color: 'var(--color-ink)',
    marginBottom: 16,
  };
  const linkStyle: CSSProperties = {
    display: 'block',
    fontSize: 14,
    color: 'var(--color-text)',
    marginBottom: 10,
  };
  const chipStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 14px',
    borderRadius: 999,
    border: '1px solid var(--color-divider)',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--color-ink)',
    marginRight: 8,
    marginBottom: 8,
    background: 'var(--color-soft)',
    letterSpacing: '0.1em',
  };
  const dividerStyle: CSSProperties = {
    height: 1,
    background: 'var(--color-divider)',
    width: '100%',
    margin: '24px 0 20px',
  };
  const bottomStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    fontSize: 13,
    color: 'var(--color-muted)',
  };

  return (
    <Footer style={footerStyle}>
      <div style={innerStyle}>
        <div style={gridStyle}>
          <div>
            <div style={{ marginBottom: 16 }}>
              <EditorialLogo size="lg" />
            </div>
            <p
              style={{
                fontSize: 14,
                color: 'var(--color-muted)',
                lineHeight: 1.6,
                maxWidth: 280,
              }}
            >
              Nơi hội tụ những giá trị tri thức vượt thời gian, được chắt lọc
              cho những độc giả trân quý từng trang sách.
            </p>
          </div>
          <div>
            <div style={titleStyle}>Khám phá</div>
            {EXPLORE.map((item) => (
              <Link key={item.label} href={item.href} style={linkStyle}>
                {item.label}
              </Link>
            ))}
          </div>
          <div>
            <div style={titleStyle}>Hỗ trợ</div>
            {SUPPORT.map((item) => (
              <Link key={item.label} href={item.href} style={linkStyle}>
                {item.label}
              </Link>
            ))}
          </div>
          <div>
            <div style={titleStyle}>Thanh toán</div>
            <div>
              {PAYMENTS.map((p) => (
                <span key={p} style={chipStyle}>
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div style={dividerStyle} />
        <div style={bottomStyle}>
          <span>&copy; {new Date().getFullYear()} The Editorial Bookstore.</span>
          <span
            style={{
              fontFamily: 'var(--font-serif), Georgia, serif',
              fontStyle: 'italic',
              color: 'var(--color-ink)',
            }}
          >
            Designed with Soul.
          </span>
        </div>
      </div>
    </Footer>
  );
}
