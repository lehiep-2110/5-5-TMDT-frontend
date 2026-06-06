'use client';

import { api } from './api';

type Params = Record<string, string | number | boolean | undefined | null>;

/**
 * Internal helper — performs an authenticated GET that streams the response
 * as a blob and triggers a client-side download via a dynamic <a> tag.
 * Throws on non-2xx so callers can show a toast via AntD `message.error`.
 */
async function downloadBlob(
  url: string,
  filename: string,
  mime: string,
  params?: Params,
): Promise<void> {
  const res = await api.get(url, {
    params,
    responseType: 'blob',
    // Avoid axios throwing automatically — we want to inspect the status.
    validateStatus: (status) => status >= 200 && status < 300,
  });
  const blob = new Blob([res.data as BlobPart], { type: mime });
  const objectUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(objectUrl);
}

/**
 * Fetch a CSV blob from an authenticated endpoint and trigger a download.
 */
export async function downloadCsv(
  url: string,
  filename: string,
  params?: Params,
): Promise<void> {
  return downloadBlob(url, filename, 'text/csv;charset=utf-8', params);
}

/**
 * Fetch an XLSX (OOXML spreadsheet) blob from an authenticated endpoint and
 * trigger a download.
 */
export async function downloadXlsx(
  url: string,
  filename: string,
  params?: Params,
): Promise<void> {
  return downloadBlob(
    url,
    filename,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    params,
  );
}
