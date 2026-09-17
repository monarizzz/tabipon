import React from "react";
import { DeviceMotion } from "expo-sensors";
import { useSharedValue } from "react-native-reanimated";

import {
  createPressGestureState,
  markPressed,
  reducePressGesture,
} from "@/src/utils/stampPress/pressGesture";
import type {
  StampPressGesture,
  StampPressGestureOptions,
} from "@/src/utils/stampPress/types/stampPressGesture";

/** DeviceMotion の更新間隔(ミリ秒)。判定の時間分解能でもある */
const UPDATE_INTERVAL_MS = 50;

/**
 * 端末を振り下ろすジェスチャを購読し、押印の確定を通知する。
 *
 * 段階の判定そのものは `pressGesture.ts` の純粋な関数が持つ。ここは
 * 購読・状態の持ち回り・SharedValue への書き込みだけを行う。
 */
export function useStampPressGesture({
  onPressed,
}: StampPressGestureOptions): StampPressGesture {
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
