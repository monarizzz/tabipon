import type { StampPlace } from "@/src/libs/location";

/**
 * 押印画面へ渡すルートパラメータを組み立てる。
 *
 * **撮影時刻・座標・住所は取れたものだけ入れる。**ルートパラメータは文字列しか
 * 運べないので、未取得を `null` で表せない。キーごと落として「無い」を表す。
 */
export function stampPressParams(
  photoUri: string | undefined,
  capturedAt: string | undefined,
  place: StampPlace,
): Record<string, string> {
  return {
    ...(photoUri && { uri: photoUri }),
    ...(capturedAt && { capturedAt }),
    ...(place.location && {
      latitude: String(place.location.latitude),
      longitude: String(place.location.longitude),
    }),
    ...(place.address && { address: place.address }),
  };
}
