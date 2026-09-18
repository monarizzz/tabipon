/**
 * 共有カードの入出力（スタンプ画像の読み込みと PNG への符号化）。
 *
 * **ファイルシステムには触らない。**PNG のバイト列を返すところまでがここの責務で、
 * 書き出すのは `src/libs/shareCardFile/`。
 */
import { ImageFormat } from "@shopify/react-native-skia";

import { renderShareCard } from "@/src/utils/shareCard/renderShareCard";
import type { ShareCardContent } from "@/src/utils/shareCard/types/shareCardContent";
import { decodeImageFromUri } from "@/src/utils/skia/decodeImage";

/** スタンプ画像以外の載せるもの。スタンプは uri で渡す */
export type ShareCardSource = Omit<ShareCardContent, "stamp"> & {
  /** 保存済みスタンプ PNG の uri */
  stampUri: string;
};

/** 共有カードの PNG バイト列を作る */
export async function generateShareCardPng({
  stampUri,
  ...rest
}: ShareCardSource): Promise<Uint8Array> {
  const stamp = await decodeImageFromUri(stampUri);
  const png = renderShareCard({ ...rest, stamp }).encodeToBytes(
    ImageFormat.PNG,
  );
  if (!png) {
    throw new Error("PNG への符号化に失敗した");
  }
  return png;
}
