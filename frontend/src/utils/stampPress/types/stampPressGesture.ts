import type { SharedValue } from "react-native-reanimated";

import type { PressGestureFinish } from "@/src/utils/stampPress/pressGesture";

export type StampPressGesture = {
  /**
   * プレビューに当てる傾き(度)。`useAnimatedStyle` から読む。
   *
   * **state ではなく SharedValue で返す。**センサーは 50ms ごとに来るので、
   * state にすると秒 20 回の再レンダリングが走る
   */
  rotationDeg: SharedValue<number>;
  /**
   * 長押しで押した場合の入口。以降の振り下ろしを受け付けなくする。
   * 既に確定済みなら false を返すので、呼び出し側はそこで打ち切る。
   *
   * 振り下ろしと長押しで確定済みフラグを分けると、両方が走ったときに
   * 二重で確定しうる。判定をこのフックに集める
   */
  markPressedByLongPress: () => boolean;
};

/** `useStampPressGesture()` の引数 */
export type StampPressGestureOptions = {
  /**
   * 振り下ろしで押印が確定したときに一度だけ呼ばれる。
   * 音・振動・アニメーションといった演出は呼び出し側の担当。
   */
  onPressed: (finish: PressGestureFinish) => void;
};
