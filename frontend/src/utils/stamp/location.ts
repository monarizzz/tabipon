import * as Location from "expo-location";
import type { StampLocation } from "@/src/api/stamps";

/**
 * スタンプ取得時の現在地(GPS)を取得する。
 * 権限が拒否された/取得に失敗した場合は null を返し、スタンプ作成自体は継続できるようにする。
 * (Vision によるランドマーク自動判定の代替として、端末の位置情報を場所の記録に使う)
 */
export async function getCurrentStampLocation(): Promise<StampLocation | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("[location] permission not granted");
      return null;
    }
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch (error) {
    console.warn("[location] failed to get current position", error);
    return null;
  }
}
