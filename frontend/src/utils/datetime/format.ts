const pad = (value: number) => `${value}`.padStart(2, "0");

/**
 * DB の ISO 8601 UTC 文字列を `Date` にする。
 * 解釈できない値は `null` を返すので、フォールバックは呼び出し側で決める
 */
export function parseIso(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** 端末のタイムゾーンで `YYYY/MM/DD` にする */
export function formatDate(date: Date): string {
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
}

/** 端末のタイムゾーンで `YYYY/MM/DD HH:mm` にする */
export function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** ISO 文字列を `YYYY/MM/DD` にする。解釈できない値は空文字 */
export function formatIsoDate(iso: string): string {
  const date = parseIso(iso);
  return date ? formatDate(date) : "";
}

/** ISO 文字列を `YYYY/MM/DD HH:mm` にする。解釈できない値は空文字 */
export function formatIsoDateTime(iso: string): string {
  const date = parseIso(iso);
  return date ? formatDateTime(date) : "";
}
