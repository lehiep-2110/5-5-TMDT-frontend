'use client';

import { BookOutlined } from '@ant-design/icons';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { resolveImageUrl } from '@/lib/image-url';

type Size = 'sm' | 'md' | 'lg' | 'hero';

interface BookCoverProps {
  src?: string | null;
  alt: string;
  size?: Size;
  /** Override width (in px). Falls back to size preset. */
  width?: number;
  /** Override height (in px). Falls back to size preset. */
  height?: number;
  /** If true, fill its container (the parent defines dimensions). */
  fill?: boolean;
  /** Additional style merged onto the outer frame. */
  style?: CSSProperties;
  /** Additional style merged onto the inner <img>. */
  imgStyle?: CSSProperties;
  /** Icon size override. */
  iconSize?: number;
  /** Border radius override. */
  borderRadius?: number;
}

const PRESETS: Record<Size, { w: number; h: number; icon: number; radius: number }> = {
  sm: { w: 40, h: 56, icon: 18, radius: 4 },
  md: { w: 72, h: 96, icon: 22, radius: 8 },
  lg: { w: 120, h: 160, icon: 32, radius: 10 },
  hero: { w: 420, h: 560, icon: 64, radius: 16 },
};

/**
 * Safe book cover with graceful image-load fallback.
 * Renders the cream placeholder (with BookOutlined icon) when:
 *   - no src is provided, OR
 *   - the image fails to load (onError).
 */
export function BookCover({
  src,
  alt,
  size = 'md',
  width,
  height,
  fill = false,
  style,
  imgStyle,
  iconSize,
  borderRadius,
}: BookCoverProps) {
  const [errored, setErrored] = useState(false);

  // Reset error state if src changes.
  useEffect(() => {
    setErrored(false);
  }, [src]);

  const preset = PRESETS[size];
  const frameW = fill ? undefined : (width ?? preset.w);
  const frameH = fill ? undefined : (height ?? preset.h);
  const radius = borderRadius ?? preset.radius;

  const frameStyle: CSSProperties = {
    width: fill ? '100%' : frameW,
    height: fill ? '100%' : frameH,
    borderRadius: radius,
    background: 'var(--color-soft)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
    ...style,
  };

  const hasImage = src && !errored;

  if (!hasImage) {
    return (
      <div style={frameStyle} aria-label={alt}>
        <BookOutlined
          style={{ fontSize: iconSize ?? preset.icon, color: '#C8C6C1' }}
        />
      </div>
    );
  }

  return (
    <div style={frameStyle}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolveImageUrl(src)}
        alt={alt}
        onError={() => setErrored(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          ...imgStyle,
        }}
      />
    </div>
  );
}
