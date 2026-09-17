import type { StampGridItem } from "@/src/features/album/components/StampGrid/StampGrid";
import { stampImageUri, type Stamp } from "@/src/infra/db/stamps";
import { formatIsoDate } from "@/src/utils/datetime/format";

/**
 * DB の 1 行を一覧のカード 1 枚に変換する。
 *
 * スポット名は未設定と空白だけの入力を同じ扱いにする。`nameUnset` を別に返すのは、
 * 代替名を出しているのか本人が入れた名前なのかをカード側で見分けるため。
 *
 * @param defaultName スポット名が未設定のときに出す代替名（翻訳済みの文字列）
 */
export function toGridItem(stamp: Stamp, defaultName: string): StampGridItem {
  const spotName = stamp.title?.trim() || "";
  return {
    id: stamp.id,
    name: spotName || defaultName,
    nameUnset: !spotName,
    // 一覧のカードは日付だけ。時刻は詳細画面で出す
    date: formatIsoDate(stamp.capturedAt),
    imageUri: stampImageUri(stamp),
    obtained: true,
  };
}
