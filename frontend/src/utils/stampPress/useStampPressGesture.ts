import React from "react";
import { DeviceMotion } from "expo-sensors";
import { useSharedValue, type SharedValue } from "react-native-reanimated";

import {
  createPressGestureState,
  markPressed,
  reducePressGesture,
  type PressGestureFinish,
} from "@/src/utils/stampPress/pressGesture";

/** DeviceMotion の更新間隔(ミリ秒)。判定の時間分解能でもある */
const UPDATE_INTERVAL_MS = 50;

type Options = {
  /**
   * 振り下ろしで押印が確定したときに一度だけ呼ばれる。
   * 音・振動・アニメーションといった演出は呼び出し側の担当。
   */
  onPressed: (finish: PressGestureFinish) => void;
};

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

/**
 * 端末を振り下ろすジェスチャを購読し、押印の確定を通知する。
 *
 * 段階の判定そのものは `pressGesture.ts` の純粋な関数が持つ。ここは
 * 購読・状態の持ち回り・SharedValue への書き込みだけを行う。
 */
export function useStampPressGesture({
  onPressed,
}: Options): StampPressGesture {
  const rotationDeg = useSharedValue(0);
  const stateRef = React.useRef(createPressGestureState());
  // 押印はセンサーの購読中に確定するので、購読を張り直さずに最新の関数を読めるようにする
  const onPressedRef = React.useRef(onPressed);
  React.useEffect(() => {
    onPressedRef.current = onPressed;
  });

  React.useEffect(() => {
    DeviceMotion.setUpdateInterval(UPDATE_INTERVAL_MS);
    const subscription = DeviceMotion.addListener(
      ({ acceleration, rotation }) => {
        const {
          state,
          rotationDeg: deg,
          finish,
        } = reducePressGesture(stateRef.current, {
          z: acceleration?.z ?? 0,
          rotationAlpha: rotation?.alpha ?? null,
          now: Date.now(),
        });
        stateRef.current = state;
        if (deg !== null) {
          rotationDeg.value = deg;
        }
        if (finish) {
          onPressedRef.current(finish);
        }
      },
    );
    return () => subscription.remove();
  }, [rotationDeg]);

  const markPressedByLongPress = React.useCallback(() => {
    if (stateRef.current.pressed) return false;
    stateRef.current = markPressed(stateRef.current);
    return true;
  }, []);

  return { rotationDeg, markPressedByLongPress };
}
