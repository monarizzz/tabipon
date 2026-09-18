import { parseIso } from "@/src/utils/datetime/format";

/**
 * ルートパラメータで運ばれてきた撮影時刻を、保存に使う ISO 文字列にする。
 *
 * 解釈できない値と未指定は、その場の現在時刻で埋める。撮影画面を通らずに
 * 押印画面へ入る経路（ディープリンク、開発中のリロード）では撮影時刻が存在せず、
 * ここで止めると押印そのものが保存できなくなる。
 */
export function resolveCapturedAt(value: string | undefined): string {
  const date = value ? parseIso(value) : null;
  return (date ?? new Date()).toISOString();
}
