import { Directory, File, Paths } from "expo-file-system";

/**
 * スタンプの画像を端末のファイルシステムに置く層。
 *
 * ここは DB を知らない。扱うのは documentDirectory からの相対パスだけで、
 * どのパスがどの行に対応するかは呼び出し側（`src/infra/db/stamps.ts`）が決める。
 * 行とファイルは失敗の仕方が違う（行が入らない／ファイルが書けない）ため、
 * 置き場を分けて、順序を組み立てる側だけが両方を見る形にしている。
 */

/** スタンプ画像（PNG）の置き場。documentDirectory からの相対パス */
const STAMP_IMAGES_DIR = "stamps";

/** 元写真の置き場 */
const ORIGINAL_PHOTOS_DIR = "stamp-originals";

/** 線画（白黒 2 値の中間画像）の置き場 */
const LINE_ARTS_DIR = "stamp-line-arts";

/** 画像を書き出す置き場すべて。`deleteUnreferencedFiles()` が掃く範囲でもある */
const IMAGE_DIRS = [STAMP_IMAGES_DIR, ORIGINAL_PHOTOS_DIR, LINE_ARTS_DIR];

function fileOf(relativePath: string): File {
  return new File(Paths.document, relativePath);
}

/**
 * スタンプ id と版番号から、仕上げ済み PNG の置き場所（相対パス）を決める。
 *
 * **版番号をファイル名に入れる。**`<Image source={{ uri }}>` は uri をキーに
 * 画像をキャッシュするため、同じパスへ上書きすると中身を差し替えても古い絵が出る。
 * 内容が変わったらパスも変える形にして、キャッシュを意識せずに済ませる
 */
export function stampImagePathOf(id: string, revision: number): string {
  return `${STAMP_IMAGES_DIR}/${id}-${revision}.png`;
}

/**
 * 今の画像パスから版番号を読む。版番号の付かないパス（`<id>.png`）は 0 版とする。
 *
 * id を渡して先頭を切り落としてから読む。uuid の末尾は数字だけのこともあり、
 * 末尾の `-数字` を探すだけだと `<id>.png` の id 側を版番号と読み違える
 */
function stampImageRevisionOf(id: string, relativePath: string): number {
  const prefix = `${STAMP_IMAGES_DIR}/${id}`;
  if (!relativePath.startsWith(prefix)) {
    return 0;
  }
  const revision = /^-(\d+)\.png$/.exec(relativePath.slice(prefix.length));
  return revision ? Number(revision[1]) : 0;
}

/** 今の画像パスから、次の版の置き場所（相対パス）を決める */
export function nextStampImagePathOf(id: string, currentPath: string): string {
  return stampImagePathOf(id, stampImageRevisionOf(id, currentPath) + 1);
}

/** スタンプ id から、元写真の置き場所（相対パス）を決める */
export function originalPhotoPathOf(id: string): string {
  return `${ORIGINAL_PHOTOS_DIR}/${id}.jpg`;
}

/**
 * スタンプ id から、線画の置き場所（相対パス）を決める。
 *
 * 版番号は付けない。線画は元写真だけで決まり、デザイン変更では書き換わらないので、
 * `<Image>` のキャッシュと食い違う余地が無い（`stampImagePathOf()` の版番号と対比）。
 */
export function lineArtPathOf(id: string): string {
  return `${LINE_ARTS_DIR}/${id}.png`;
}

/** 相対パスを `<Image>` などに渡せる uri にする */
export function fileUriOf(relativePath: string): string {
  return fileOf(relativePath).uri;
}

/** 実体がある場合だけ uri を返す。失われていれば null */
export function existingFileUriOf(relativePath: string): string | null {
  const file = fileOf(relativePath);
  return file.exists ? file.uri : null;
}

/** 画像の置き場を作る。書き出す前に呼ぶ。既にあっても失敗しない */
export function ensureImageDirs(): void {
  for (const dirName of IMAGE_DIRS) {
    new Directory(Paths.document, dirName).create({ idempotent: true });
  }
}

/** PNG を書き出す。既にあれば上書きする */
export function writePng(relativePath: string, png: Uint8Array): void {
  fileOf(relativePath).write(png);
}

/** 撮影した写真を元写真の置き場へ複製する */
export function copyOriginalPhoto(
  photoUri: string,
  relativePath: string,
): void {
  new File(photoUri).copy(fileOf(relativePath));
}

/** 実体があるものだけ消す。無いものは何もしない */
export function deleteFiles(relativePaths: string[]): void {
  for (const relativePath of relativePaths) {
    const file = fileOf(relativePath);
    if (file.exists) {
      file.delete();
    }
  }
}

/**
 * 置き場の中で `referenced` に無いファイルを消し、消した数を返す。
 *
 * どのパスが参照されているかは DB しか知らないので、呼び出し側から受け取る。
 */
export function deleteUnreferencedFiles(referenced: Set<string>): number {
  let deleted = 0;
  for (const dirName of IMAGE_DIRS) {
    const dir = new Directory(Paths.document, dirName);
    if (!dir.exists) {
      continue;
    }
    for (const entry of dir.list()) {
      if (
        entry instanceof File &&
        !referenced.has(`${dirName}/${entry.name}`)
      ) {
        entry.delete();
        deleted += 1;
      }
    }
  }
  return deleted;
}
