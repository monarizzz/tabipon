import * as Location from "expo-location";

/**
 * 住所を組み立てる順。大きい方から並べる。
 *
 * `city` は iOS の一部の地域で空になり、代わりに `subregion`（郡）に入る。
 * どちらか一方しか埋まらないので、`city ?? subregion` の 1 要素として扱う。
 */
function addressParts(place: Location.LocationGeocodedAddress): string[] {
  return [
    place.country,
    place.region,
    place.city ?? place.subregion,
    place.district,
    place.name,
  ].flatMap((part) => {
    const trimmed = part?.trim();
    return trimmed ? [trimmed] : [];
  });
}

/**
 * 隣り合う重複を落とす。
 *
 * `name` には番地だけでなく `district` と同じ町名がそのまま入ることがあり、
 * そのまま連結すると「宇治市 宇治 宇治」のように同じ語が続く
 */
function dropAdjacentDuplicates(parts: string[]): string[] {
  return parts.filter((part, index) => part !== parts[index - 1]);
}

/**
 * 座標から住所を引き、「場所」として出す 1 行にする。
 * 引けなければ null を返す。
 *
 * **端末の逆ジオコーダ（expo-location）を使う。**Google Geocoding API は
 * Web Service のため `EXPO_PUBLIC_*` に置いた鍵がバンドルに埋まり、
 * リファラ制限もかけられない（#218）。端末側なら鍵が要らず、圏外でも
 * OS のキャッシュが効く範囲で引ける。
 *
 * **引ける言語は端末の設定で決まる。**`reverseGeocodeAsync()` に言語を渡す口が
 * 無いため、アプリ内の言語切り替えには追従しない。取得時に一度だけ引いて
 * 保存する形（呼び出し側の責務）なので、表示のたびに引き直すことも無い。
 *
 * 失敗しても投げない。スタンプの作成を住所の有無で止めないため、
 * 呼び出し側は null を「住所が無い」として扱えばよい。
 */
export async function reverseGeocode(location: {
  latitude: number;
  longitude: number;
}): Promise<string | null> {
  try {
    const [place] = await Location.reverseGeocodeAsync(location);
    if (!place) {
      // 海上など、住所が割り当たっていない座標。失敗ではない
      return null;
    }
    const parts = dropAdjacentDuplicates(addressParts(place));
    return parts.length > 0 ? parts.join(" ") : null;
  } catch (error) {
    console.warn("[location] reverse geocoding failed", error);
    return null;
  }
}
