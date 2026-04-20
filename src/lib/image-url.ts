const backendOrigin =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? 'http://localhost:8001';

const PLACEHOLDER =
  'https://via.placeholder.com/300x400/f0f0f0/999999?text=No+Image';

/**
 * Resolve a possibly-relative image URL from the backend to an absolute URL.
 * Falls back to a placeholder image when the input is empty/null.
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url) return PLACEHOLDER;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return `${backendOrigin}${url}`;
  return `${backendOrigin}/${url}`;
}

export const PLACEHOLDER_IMAGE = PLACEHOLDER;
