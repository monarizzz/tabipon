/**
 * 画像の入出力（uri のデコードと PNG への符号化）。
 *
 * **ファイルシステムには触らない。**PNG のバイト列を返すところまでがここの責務
 * （`docs/stamp-pipeline.md`「ルール」）。
 */
import { ImageFormat, Skia, type SkImage } from "@shopify/react-native-skia";

import { generateLineArtFromImage } from "@/src/utils/stamp/lineArt";
import { generateStampFromImage } from "@/src/utils/stamp/pipeline";
import type { StampRenderOptions } from "@/src/utils/stamp/types/stampRenderOptions";

/**
 * uri から `SkImage` を読み込む。
 *
 * uri は `file://` / `http(s)://` / バンドルされたアセットの解決済み uri。
 */
async function decodeImageFromUri(uri: string): Promise<SkImage> {
  const data = await Skia.Data.fromURI(uri);
  const image = Skia.Image.MakeImageFromEncoded(data);
  if (!image) {
    throw new Error(`画像をデコードできなかった: ${uri}`);
  }
  return image;
}

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
 * （`app/album-stamp-detail.tsx`）。戻り値のバイト列を `src/infra/db/stamps.ts` へ
 * 渡して保存させる。
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
