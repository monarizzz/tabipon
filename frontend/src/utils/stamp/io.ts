/**
 * 画像の入出力（uri のデコードと PNG への符号化）。
 *
 * **ファイルシステムには触らない。**PNG のバイト列を返すところまでがここの責務
 * （`docs/stamp-pipeline.md`「ルール」）。
 */
import { ImageFormat, type SkImage } from "@shopify/react-native-skia";

import { decodeImageFromUri } from "@/src/utils/skia/decodeImage";
import { generateLineArtFromImage } from "@/src/utils/stamp/lineArt";
import { generateStampFromImage } from "@/src/utils/stamp/pipeline";
import type { StampRenderOptions } from "@/src/utils/stamp/types/stampRenderOptions";

/** 写真の uri から線画を生成する */
export async function generateLineArtFromUri(uri: string): Promise<SkImage> {
  return generateLineArtFromImage(await decodeImageFromUri(uri));
}

/** 写真の uri からスタンプ画像を生成する */
export async function generateStampFromUri(
  uri: string,
  options: StampRenderOptions,
): Promise<SkImage> {
  return generateStampFromImage(await decodeImageFromUri(uri), options);
}

/**
 * 写真の uri からスタンプの PNG バイト列を生成する。
 *
 * 呼ぶのは押印時（`src/features/camera/utils/createStamp.ts`）とデザイン変更時
 * （`src/features/album/hooks/useStampDesignChange.ts`）。戻り値のバイト列を
 * `src/infra/db/stamps.ts` へ渡して保存させる。
 */
export async function generateStampPngFromUri(
  uri: string,
  options: StampRenderOptions,
): Promise<Uint8Array> {
  const stamp = await generateStampFromUri(uri, options);
  const png = stamp.encodeToBytes(ImageFormat.PNG);
  if (!png) {
    throw new Error("PNG への符号化に失敗した");
  }
  return png;
}
