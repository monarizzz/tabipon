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
