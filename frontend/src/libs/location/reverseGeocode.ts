import * as Location from "expo-location";

/**
 * 住所を組み立てる順。大きい方から並べる。
 *
 * iOS では `CLPlacemark` がそのまま渡ってくる（`expo-location` の
 * `ios/Geocoder.swift` は加工しない）。そのため項目どうしが入れ子になっており、
 * 素直に全部つなぐと同じ語が二重に出る。日本の住所では次の 2 つが起きる。
 *
 * - `street`(thoroughfare) が `district`(subLocality) を接頭辞として含む
 *   （`district: 永田町` に対し `street: 永田町1丁目`）
 * - `name` は多くの場合 `street + streetNumber` の連結
 *   （`名駅1丁目` + `1番4号` → `name: 名駅1丁目1番4号`）
 *
 * **`district` と `name` は使わない。**`street` が町名を含むので `district` は
 * 要らず、`name` は `street` を丸ごと含むうえ、地物がある地点では住所ではなく
 * 施設名（`大阪駅`）が入って番地が落ちる。
 *
 * `city` は郡部で空になり、代わりに `subregion`（郡）に入る。どちらか一方しか
 * 埋まらないので `city ?? subregion` の 1 要素として扱う。両方つなぐと
 * `city` 側が郡を含むため（`高岡郡日高村`）、やはり二重になる。
 */
function addressParts(place: Location.LocationGeocodedAddress): string[] {
  return [
    place.country,
    place.region,
    place.city ?? place.subregion,
    // 住所が割り当たっていない地点では street が空になる。その場合だけ name に
    // 頼る（湖や山では `name` に `高島市` のような広い地名が入る）
    place.street ?? place.name,
    place.street ? place.streetNumber : null,
  ].flatMap((part) => {
    const trimmed = part?.trim();
    return trimmed ? [trimmed] : [];
  });
}

/**
 * 隣り合う重複を落とす。
 *
 * 項目の選び方で入れ子はあらかた避けているが、地域によっては同じ語が
 * 別の項目に入ることがある（`city` と `name` など）。最後の網として残す
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
 *
 * 向きは座標 → 住所の一方向だけ。利用者が「場所」を手で直しても座標は動かさない
 * （`geocodeAsync()` で引き直すと、実際に押した地点が番地の代表点に丸められて
 * 失われる）。座標を住所に追従させるかは #87 で決める。
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
