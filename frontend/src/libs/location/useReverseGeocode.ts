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

/** 取得結果と、それがどの入力に対するものか */
type Resolved = { key: string; state: ReverseGeocodeState };

/**
 * 座標から住所を引く。
 *
 * ロケールが変わったら引き直す。設定画面で言語を切り替えたあと、
 * 住所だけ前の言語のまま残るのを避けるため。
 *
 * **結果は入力（座標 + ロケール）をキーにして持つ。**別のスタンプに切り替わったり
 * 座標が外れたりしたときに、前の座標の住所がそのまま出続けるのを防ぐ。
 * effect の中で state を消す形にすると、消してから入れ直すまでの 1 レンダーぶん
 * 余計に描き直すことになり、`react-hooks/set-state-in-effect` にも触れる。
 *
 * 中断は `AbortController` で行う。画面を離れたあとに `setState` が走ると
 * 警告が出るうえ、捨てるはずの結果で表示が入れ替わる。
 */
export function useReverseGeocode(
  location: StampLocation | null,
): ReverseGeocodeState {
  const { locale } = useTranslation();
  const [resolved, setResolved] = useState<Resolved | null>(null);

  // オブジェクトのままだと、同じ座標でも参照が変わるたびに引き直してしまう
  const latitude = location?.latitude ?? null;
  const longitude = location?.longitude ?? null;
  const key =
    latitude === null || longitude === null
      ? null
      : `${latitude},${longitude},${locale}`;

  useEffect(() => {
    if (key === null || latitude === null || longitude === null) {
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
          setResolved({
            key,
            state: { address: result.address, failed: false },
          });
          return;
        }
        if (result.status === "empty") {
          setResolved({ key, state: IDLE });
          return;
        }
        console.warn("[location] reverse geocoding failed", result.reason);
        setResolved({ key, state: { address: "", failed: true } });
      })
      .catch((error: unknown) => {
        // 中断は想定どおりの経路なので、失敗として扱わない
        if (controller.signal.aborted) {
          return;
        }
        console.warn("[location] reverse geocoding failed", error);
        setResolved({ key, state: { address: "", failed: true } });
      });
    return () => controller.abort();
  }, [key, latitude, longitude, locale]);

  // 今の入力に対する結果でなければ、まだ何も引けていないものとして扱う
  return resolved?.key === key ? resolved.state : IDLE;
}
