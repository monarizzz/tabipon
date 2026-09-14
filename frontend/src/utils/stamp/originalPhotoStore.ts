import { Directory, File, Paths } from "expo-file-system";

// スタンプ作成時の元写真を端末の永続領域に保存しておくためのユーティリティ。
// デザイン変更(色/フレーム)は元写真からの再レンダリングが必要だが、
// バックエンド/DB には完成済み PNG しか残らないため、元写真を端末側で保持する。
// documentDirectory 配下に置くのでキャッシュ削除では消えない。
const ORIGINALS_DIR = "stamp-originals";

function originalsDir(): Directory {
  return new Directory(Paths.document, ORIGINALS_DIR);
}

function originalFile(stampId: string): File {
  return new File(originalsDir(), `${stampId}.jpg`);
}

/**
 * スタンプ作成成功時に元写真をコピー保存する。
 * 失敗してもスタンプ作成本体は止めないため、例外は握りつぶしてログのみ残す。
 */
export async function persistOriginalPhoto(
  stampId: string,
  photoUri: string,
): Promise<void> {
  try {
    originalsDir().create({ idempotent: true });
    const dest = originalFile(stampId);
    if (dest.exists) dest.delete();
    new File(photoUri).copy(dest);
    console.log(`[originalPhoto] saved stampId=${stampId}`);
  } catch (error) {
    console.warn(`[originalPhoto] failed to persist stampId=${stampId}`, error);
  }
}

/**
 * 保存済みの元写真 uri を返す。無ければ null(＝この端末では変更不可)。
 */
export async function getOriginalPhotoUri(
  stampId: string,
): Promise<string | null> {
  try {
    const file = originalFile(stampId);
    return file.exists ? file.uri : null;
  } catch (error) {
    console.warn(`[originalPhoto] failed to read stampId=${stampId}`, error);
    return null;
  }
}
