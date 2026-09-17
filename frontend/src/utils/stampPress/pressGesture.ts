/**
 * スタンプを「振り下ろす」ジェスチャの検出。
 *
 * 端末の加速度(z)の流れを **持ち上げ → 押し付け → ニュートラル復帰** の 3 段階で読み、
 * 最後の復帰をもって押印を確定する。センサーにも React にも触れない純粋な関数として
 * 書いてあるので、`pressGesture.test.ts` から任意のサンプル列を流して確かめられる。
 *
 * 購読と演出は `useStampPressGesture.ts` の担当。
 */

import {
  PRESS_GESTURE_THRESHOLDS,
  SCRATCH_LEVEL_RANGE,
} from "@/src/utils/stampPress/constants/pressGesture";
import type {
  PressGestureResult,
  PressGestureSample,
  PressGestureState,
} from "@/src/utils/stampPress/types/pressGesture";

export function createPressGestureState(): PressGestureState {
  return {
    pressed: false,
    liftedAt: null,
    downPeak: 0,
    referenceAlpha: null,
    relativeAlpha: 0,
  };
}

/** ラジアンを、画面上の回転方向に合わせた -180〜180 度へ直す */
function toNormalizedDeg(radian: number): number {
  let deg = -(radian * (180 / Math.PI));
  if (deg > 180) deg -= 360;
  if (deg < -180) deg += 360;
  return deg;
}

/**
 * 押し付けのピーク(z の最小値)を掠れ量 0〜1 に写す。
 * 弱く押すと掠れ、強く押すとくっきり出る。
 */
export function scratchLevelFromPeak(peak: number): number {
  const { weakPeak, strongPeak } = SCRATCH_LEVEL_RANGE;
  return Math.max(
    0,
    Math.min(1, (peak - strongPeak) / (weakPeak - strongPeak)),
  );
}

/**
 * 押印を確定済みにする。長押しで押した場合の入口。
 *
 * 振り下ろしと長押しはどちらも同じ「確定済み」フラグを見て二重確定を防ぐ。
 * 判定を 1 箇所に集めるため、長押し側もここを通す。
 */
export function markPressed(state: PressGestureState): PressGestureState {
  return { ...state, pressed: true, liftedAt: null, downPeak: 0 };
}

/**
 * センサー 1 サンプルを読んで状態を進める。
 *
 * 傾きの追従は確定前後を問わず続ける（プレビューの回転に使う）が、
 * 段階の判定は `pressed` になった時点で止まる。
 */
export function reducePressGesture(
  state: PressGestureState,
  sample: PressGestureSample,
): PressGestureResult {
  let next = state;
  let rotationDeg: number | null = null;

  if (sample.rotationAlpha !== null) {
    const referenceAlpha = state.referenceAlpha ?? sample.rotationAlpha;
    const relativeAlpha = sample.rotationAlpha - referenceAlpha;
    next = { ...next, referenceAlpha, relativeAlpha };
    rotationDeg = toNormalizedDeg(relativeAlpha);
  }

  if (next.pressed) {
    return { state: next, rotationDeg, finish: null };
  }

  const { lift, press, neutral, liftTimeoutMs } = PRESS_GESTURE_THRESHOLDS;
  const { z, now } = sample;

  // 持ち上げてから liftTimeoutMs 以内に押し付けが来なければ取り消す。
  // setTimeout ではなくサンプルの時刻で見るので、判定が外から見える
  if (next.liftedAt !== null && now - next.liftedAt > liftTimeoutMs) {
    next = { ...next, liftedAt: null, downPeak: 0 };
  }

  // ①持ち上げ検知
  if (z > lift) {
    next = { ...next, liftedAt: now, downPeak: 0 };
  }

  // ②持ち上げ後に押し付けへ入ったら、最も深く押し込んだ z を残す
  if (next.liftedAt !== null && z < press && z < next.downPeak) {
    next = { ...next, downPeak: z };
  }

  // ③押し付けピークの後にニュートラルまで戻ったら確定（縦持ち方式）
  if (next.liftedAt !== null && next.downPeak < press && z > neutral) {
    const peak = next.downPeak;
    next = { ...next, pressed: true, liftedAt: null, downPeak: 0 };
    return {
      state: next,
      rotationDeg,
      finish: {
        scratchLevel: scratchLevelFromPeak(peak),
        tiltAngle: toNormalizedDeg(next.relativeAlpha),
      },
    };
  }

  return { state: next, rotationDeg, finish: null };
}
