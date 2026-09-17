import * as Location from "expo-location";

import type { StampLocation } from "@/src/infra/db/stamps";

/**
 * 住所から座標を引く。引けなければ null を返す。
 *
 * 利用者が「場所」を手で直したときに、地図が前の場所を指したままにならないよう
 * 座標を追従させるために使う（#87）。
 *
 * **端末の順ジオコーダ（expo-location）を使う。**逆引きと同じく API キーが要らず、
 * OS のキャッシュが効く範囲ではオフラインでも引ける。
 *
 * **引けなかったときは null を返し、呼び出し側は座標を据え置く。**「おばあちゃんち」
 * のような住所として引けない文字列を入れることはあり、そこで座標を消すと
 * 地図が出なくなる。前の場所を指し続ける方がまだ情報がある。
 *
 * 失敗しても投げない。住所の保存自体は座標が引けたかどうかと無関係に通す。
 */
export async function geocodeAddress(
  address: string,
): Promise<StampLocation | null> {
  const query = address.trim();
  if (!query) {
    return null;
  }
  try {
    const [found] = await Location.geocodeAsync(query);
    if (!found) {
      // 住所として引けない文字列。失敗ではない
      return null;
    }
    return { latitude: found.latitude, longitude: found.longitude };
  } catch (error) {
    console.warn("[location] geocoding failed", error);
    return null;
  }
}
