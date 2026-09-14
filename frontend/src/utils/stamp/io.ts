/**
 * 画像の入出力（uri のデコードと PNG への符号化）。
 *
 * Refs: #134 / #123 / #98
 *
 * **ファイルシステムには触らない。**PNG のバイト列を返すところまでがここの責務で、
 * `expo-file-system` で書き出すのは呼び出し側（#148 の永続化）の仕事。
 * 描画側（`pipeline.ts` 以下）を Skia だけに閉じておくために分けてある。
 */
import { ImageFormat, Skia, type SkImage } from "@shopify/react-native-skia";

import { generateLineArtFromImage } from "@/src/utils/stamp/lineArt";
import {
  generateStampFromImage,
  type StampRenderOptions,
} from "@/src/utils/stamp/pipeline";

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
 * `process_stamp_image()` の戻り値（`encode_png()` した bytes）に相当し、
 * 撮影フローの差し替え（#125）と永続化（#148）が呼ぶのはこの関数になる。
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
