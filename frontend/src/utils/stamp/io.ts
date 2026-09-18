/**
 * 画像の入出力（uri のデコードと PNG への符号化）。
 *
 * **ファイルシステムには触らない。**PNG のバイト列を返すところまでがここの責務
 * （`docs/stamp-pipeline.md`「ルール」）。
 */
import { ImageFormat, type SkImage } from "@shopify/react-native-skia";

import { decodeImageFromUri } from "@/src/utils/skia/decodeImage";
import { generateLineArtFromImage } from "@/src/utils/stamp/lineArt";
import { renderStampFromLineArt } from "@/src/utils/stamp/pipeline";
import type { StampRenderOptions } from "@/src/utils/stamp/types/stampRenderOptions";

function toPng(image: SkImage, label: string): Uint8Array {
  const png = image.encodeToBytes(ImageFormat.PNG);
  if (!png) {
    throw new Error(`${label}の PNG への符号化に失敗した`);
  }
  return png;
}

/** 写真の uri から線画を生成する */
export async function generateLineArtFromUri(uri: string): Promise<SkImage> {
  return generateLineArtFromImage(await decodeImageFromUri(uri));
}

/**
 * 写真の uri から、スタンプと線画の PNG バイト列を生成する。押印時に呼ぶ
 * （`src/features/camera/utils/createStamp.ts`）。
 *
 * **線画も一緒に返す。**線画はデザイン変更で描き直すたびに要るが、生成が最も重い工程で、
 * かつ元写真だけで決まって変わらない。ここで保存しておけば二度と作らずに済む。
 */
export async function generateStampWithLineArtFromUri(
  uri: string,
  options: StampRenderOptions,
): Promise<{ stampPng: Uint8Array; lineArtPng: Uint8Array }> {
  const lineArt = await generateLineArtFromUri(uri);
  return {
    stampPng: toPng(renderStampFromLineArt(lineArt, options), "スタンプ"),
    lineArtPng: toPng(lineArt, "線画"),
  };
}

/**
 * 直前に読んだ線画を 1 枚だけ持つ。
 *
 * デザイン変更は色・フレームを選ぶたびに同じ uri を読み直す。線画は版番号を持たず
 * 書き換わらないので（`src/libs/stampFile/index.ts` の `lineArtPathOf()`）、
 * uri が同じなら中身も同じと見なしてよい。
 *
 * **1 枚だけにする。**保持するのは 512x512 のラスタ画像で、増やすとそのぶん常駐する。
 * デザイン変更は 1 つのスタンプを開いている間しか走らないので、1 枚で足りる。
 */
let lastLineArt: { uri: string; image: SkImage } | null = null;

async function loadLineArt(uri: string): Promise<SkImage> {
  if (lastLineArt?.uri === uri) {
    return lastLineArt.image;
  }
  const image = await decodeImageFromUri(uri);
  lastLineArt = { uri, image };
  return image;
}

/**
 * 保存済み線画の uri からスタンプ画像を生成する。デザイン変更のプレビューに使う
 * （`src/features/album/hooks/useStampDesignChange.ts`）。
 *
 * 線画は PNG で可逆に保存してあるので、読み直しても押印時と同じ画素が得られる。
 */
export async function renderStampFromLineArtUri(
  uri: string,
  options: StampRenderOptions,
): Promise<SkImage> {
  return renderStampFromLineArt(await loadLineArt(uri), options);
}

/** 保存済み線画の uri からスタンプの PNG バイト列を生成する。デザイン変更の確定時に呼ぶ */
export async function renderStampPngFromLineArtUri(
  uri: string,
  options: StampRenderOptions,
): Promise<Uint8Array> {
  return toPng(await renderStampFromLineArtUri(uri, options), "スタンプ");
}
