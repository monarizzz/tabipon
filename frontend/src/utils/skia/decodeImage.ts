import { Skia, type SkImage } from "@shopify/react-native-skia";

/**
 * uri から `SkImage` を読み込む。
 *
 * uri は `file://` / `http(s)://` / バンドルされたアセットの解決済み uri。
 */
export async function decodeImageFromUri(uri: string): Promise<SkImage> {
  const data = await Skia.Data.fromURI(uri);
  const image = Skia.Image.MakeImageFromEncoded(data);
  if (!image) {
    throw new Error(`画像をデコードできなかった: ${uri}`);
  }
  return image;
}
