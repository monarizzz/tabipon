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

/** 元写真の置き場。v1 では `line_art_path` にこのパスが入る */
const ORIGINAL_PHOTOS_DIR = "stamp-originals";

/** 画像を書き出す置き場すべて。`deleteUnreferencedFiles()` が掃く範囲でもある */
const IMAGE_DIRS = [STAMP_IMAGES_DIR, ORIGINAL_PHOTOS_DIR];

function fileOf(relativePath: string): File {
  return new File(Paths.document, relativePath);
}

/** スタンプ id から、仕上げ済み PNG の置き場所（相対パス）を決める */
export function stampImagePathOf(id: string): string {
  return `${STAMP_IMAGES_DIR}/${id}.png`;
}

/** スタンプ id から、元写真の置き場所（相対パス）を決める */
export function originalPhotoPathOf(id: string): string {
  return `${ORIGINAL_PHOTOS_DIR}/${id}.jpg`;
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

/** 仕上げ済み PNG を書き出す。既にあれば上書きする */
export function writeStampImage(
  relativePath: string,
  stampPng: Uint8Array,
): void {
  fileOf(relativePath).write(stampPng);
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
