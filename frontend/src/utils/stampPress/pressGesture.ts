/**
 * スタンプを「振り下ろす」ジェスチャの検出。
 *
 * 端末の加速度(z)の流れを **持ち上げ → 押し付け → ニュートラル復帰** の 3 段階で読み、
 * 最後の復帰をもって押印を確定する。センサーにも React にも触れない純粋な関数として
 * 書いてあるので、`pressGesture.test.ts` から任意のサンプル列を流して確かめられる。
 *
 * 購読と演出は `useStampPressGesture.ts` の担当。
 */

/** 段階の判定に使う閾値。実機で振って調整する対象がここに集まっている */
export const PRESS_GESTURE_THRESHOLDS = {
  /** ①この値より z が大きくなったら「持ち上げた」とみなす */
  lift: 2,
  /** ②持ち上げ後、この値より z が小さくなったら「押し付け中」とみなす */
  press: -2,
  /** ③押し付けピーク後、この値より z が大きく戻ったら確定 */
  neutral: -0.5,
  /** ①の後この時間内に②が来なければ持ち上げを取り消す（ミリ秒） */
  liftTimeoutMs: 800,
} as const;

/**
 * 押し付けの強さを掠れ量へ写す両端。
 * 弱い押し付け(`weakPeak`)ほど掠れ、強い押し付け(`strongPeak`)ほど掠れない。
 */
export const SCRATCH_LEVEL_RANGE = {
  weakPeak: PRESS_GESTURE_THRESHOLDS.press,
  strongPeak: -75,
} as const;

/** センサー 1 サンプル。`rotationAlpha` は端末の向き(ラジアン)で、取れなければ null */
export type PressGestureSample = {
  /** 加速度の z 成分 */
  z: number;
  /** DeviceMotion の `rotation.alpha`(ラジアン)。取得できなければ null */
  rotationAlpha: number | null;
  /** サンプルの時刻(ミリ秒)。持ち上げのタイムアウト判定に使う */
  now: number;
};

/** 押印が確定したときに決まる演出値 */
export type PressGestureFinish = {
  /** 0(掠れ無し)〜1(最も掠れる) */
  scratchLevel: number;
  /** -180〜180 度 */
  tiltAngle: number;
};

export type PressGestureState = {
  /** 押印が確定済みか。確定後は以降のサンプルを一切見ない */
  pressed: boolean;
  /** ①を検出した時刻。未検出なら null */
  liftedAt: number | null;
  /** ②で記録した z の最小値。未記録なら 0 */
  downPeak: number;
  /** 最初のサンプルの `rotationAlpha`。ここを 0 度として相対角を測る */
  referenceAlpha: number | null;
  /** 基準からの相対角(ラジアン)。確定時の傾きはこの値から出す */
  relativeAlpha: number;
};

export type PressGestureResult = {
  state: PressGestureState;
  /**
   * プレビューに反映する傾き(度)。-180〜180 に正規化済み。
   * `rotationAlpha` が取れなかったサンプルでは null。
   */
  rotationDeg: number | null;
  /** このサンプルで押印が確定したときだけ入る */
  finish: PressGestureFinish | null;
};

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
