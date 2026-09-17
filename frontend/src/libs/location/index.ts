import * as Location from "expo-location";
import type { StampLocation } from "@/src/infra/db/stamps";
import { reverseGeocode } from "@/src/libs/location/reverseGeocode";

/** スタンプに記録する取得地。座標と、それを引いた住所 */
export type StampPlace = {
  location: StampLocation | null;
  /** 「場所」として出す 1 行。引けなければ null */
  address: string | null;
};

const NOWHERE: StampPlace = { location: null, address: null };

/**
 * スタンプ取得時の現在地を、座標と住所の両方で取る。
 *
 * 権限が拒否された/取得に失敗した場合は座標も住所も null を返し、
 * スタンプ作成自体は継続できるようにする。
 * (Vision によるランドマーク自動判定の代替として、端末の位置情報を場所の記録に使う)
 *
 * **住所はここで一度だけ引く。**表示のたびに引くと、圏外で住所が出ないうえ、
 * 同じスタンプを開き直すたびに引き直すことになる（#218）。
 *
 * **住所が引けなくても座標は返す。**地図は座標だけで出せるので、
 * 逆引きの失敗を座標の欠落まで広げない。
 */
export async function getCurrentStampPlace(): Promise<StampPlace> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("[location] permission not granted");
      return NOWHERE;
    }
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const location: StampLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    return { location, address: await reverseGeocode(location) };
  } catch (error) {
    console.warn("[location] failed to get current position", error);
    return NOWHERE;
  }
}
