import { Directory, File, Paths } from "expo-file-system";

/**
 * 共有カードの画像を端末に置く層。
 *
 * **置き場は cacheDirectory。**共有シートへ渡すためだけの一時ファイルで、
 * DB の行からは参照されない。documentDirectory へ置くと
 * `deleteUnreferencedFiles()`（`src/libs/stampFile/`）が掃く対象と混ざる
 */

/** 共有カードの置き場。cacheDirectory からの相対パス */
const SHARE_CARDS_DIR = "share-cards";

/**
 * 共有カードの PNG を書き出して uri を返す。
 *
 * ファイル名にはスタンプ id を使い、同じスタンプを続けて共有しても増えないようにする。
 * 共有シートに出るファイル名にもなるので、日本語やスポット名は入れない
 */
export function writeShareCard(stampId: string, png: Uint8Array): string {
  const dir = new Directory(Paths.cache, SHARE_CARDS_DIR);
  dir.create({ idempotent: true });

  const file = new File(dir, `${stampId}.png`);
  file.write(png);
  return file.uri;
}
