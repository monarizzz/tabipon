/** 空文字は「未設定」として null で保存する。DB 側で "" と null が混ざらないようにする */
export function normalizeOptionalText(value: string): string | null {
  return value.trim() || null;
}
