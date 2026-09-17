import { useEffect, useState } from "react";

import type { StampLocation } from "@/src/infra/db/stamps";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { reverseGeocode } from "@/src/libs/location/reverseGeocode";

export type ReverseGeocodeState = {
  /** 引けた住所。まだ引けていない場合と引けなかった場合は空文字 */
  address: string;
  /** 引けなかった。住所が無いだけの座標（海上など）では立てない */
  failed: boolean;
};

const IDLE: ReverseGeocodeState = { address: "", failed: false };

/**
 * 座標から住所を引く。
 *
 * ロケールが変わったら引き直す。設定画面で言語を切り替えたあと、
 * 住所だけ前の言語のまま残るのを避けるため。
 *
 * **中断は `AbortController` で行う。**画面を離れたあとに `setState` が走ると
 * 警告が出るうえ、捨てるはずの結果で表示が入れ替わる。
 */
export function useReverseGeocode(
  location: StampLocation | null,
): ReverseGeocodeState {
  const { locale } = useTranslation();
  const [state, setState] = useState<ReverseGeocodeState>(IDLE);

  // オブジェクトのままだと、同じ座標でも参照が変わるたびに引き直してしまう
  const latitude = location?.latitude ?? null;
  const longitude = location?.longitude ?? null;

  useEffect(() => {
    if (latitude === null || longitude === null) {
      return;
    }
    const controller = new AbortController();
    reverseGeocode({ latitude, longitude }, locale, {
      signal: controller.signal,
    })
      .then((result) => {
        if (controller.signal.aborted) {
          return;
        }
        if (result.status === "ok") {
          setState({ address: result.address, failed: false });
          return;
        }
        if (result.status === "empty") {
          setState(IDLE);
          return;
        }
        console.warn("[location] reverse geocoding failed", result.reason);
        setState({ address: "", failed: true });
      })
      .catch((error: unknown) => {
        // 中断は想定どおりの経路なので、失敗として扱わない
        if (controller.signal.aborted) {
          return;
        }
        console.warn("[location] reverse geocoding failed", error);
        setState({ address: "", failed: true });
      });
    return () => controller.abort();
  }, [latitude, longitude, locale]);

  return state;
}
