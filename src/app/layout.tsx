import type { Metadata, Viewport } from 'next';
import { Lora, Be_Vietnam_Pro } from 'next/font/google';
import { Providers } from '@/lib/providers';
import './globals.css';

const lora = Lora({
  subsets: ['latin', 'vietnamese'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const beVietnam = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'The Editorial',
  description: 'Nơi hội tụ những giá trị tri thức vượt thời gian.',
};

// Explicit mobile viewport — ensures correct scaling on phones/tablets while
// still allowing users to pinch-zoom (no maximumScale lock for accessibility).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

// App is fully auth-gated + data-driven; skip static prerender to avoid
// SSG failures while multiple agents iterate in parallel.
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${lora.variable} ${beVietnam.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
