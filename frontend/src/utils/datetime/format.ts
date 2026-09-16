const pad = (value: number) => `${value}`.padStart(2, "0");

/** 端末のタイムゾーンで `YYYY/MM/DD HH:mm` にする */
export function formatDateTime(date: Date): string {
  return (
    `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}` +
    ` ${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}
