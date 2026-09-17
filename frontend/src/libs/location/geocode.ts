import * as Location from "expo-location";

import type { StampLocation } from "@/src/infra/db/stamps";

/**
 * 住所から座標を引いた結果。
 *
 * **引けなかった理由を 2 つに分ける。**利用者にとって「住所として引けない文字列
 * だった」と「通信できなかった」は意味が違い、取るべき行動も違う（表記を直す /
 * 電波のある所でやり直す）。同じ値で返すと呼び出し側が文言を出し分けられない
 */
export type GeocodeResult =
  | { status: "found"; location: StampLocation }
  /** 住所として引けない文字列だった。「おばあちゃんち」など */
  | { status: "notFound" }
  /** ジオコーダ自体が失敗した。オフラインなど */
  | { status: "unavailable" };

/**
 * 住所から座標を引く。
 *
 * 利用者が「場所」を手で直したときに、地図が前の場所を指したままにならないよう
 * 座標を追従させるために使う（#87）。
 *
 * **端末の順ジオコーダ（expo-location）を使う。**逆引きと同じく API キーが要らず、
 * OS のキャッシュが効く範囲ではオフラインでも引ける。
 *
 * **引けなかったときも投げない。**座標が引けたかどうかと、住所を保存するかどうかは
 * 別の話なので、判断は呼び出し側に委ねる
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const query = address.trim();
  if (!query) {
    return { status: "notFound" };
  }
  try {
    const [found] = await Location.geocodeAsync(query);
    if (!found) {
      // 住所として引けない文字列。失敗ではない
      return { status: "notFound" };
    }
    return {
      status: "found",
      location: { latitude: found.latitude, longitude: found.longitude },
    };
  } catch (error) {
    console.warn("[location] geocoding failed", error);
    return { status: "unavailable" };
  }
}
