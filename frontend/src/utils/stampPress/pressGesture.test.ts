import {
  createPressGestureState,
  markPressed,
  reducePressGesture,
  scratchLevelFromPeak,
} from "@/src/utils/stampPress/pressGesture";
import {
  PRESS_GESTURE_THRESHOLDS,
  SCRATCH_LEVEL_RANGE,
} from "@/src/utils/stampPress/constants/pressGesture";
import type {
  PressGestureResult,
  PressGestureSample,
  PressGestureState,
} from "@/src/utils/stampPress/types/pressGesture";

const { lift, press, neutral, liftTimeoutMs } = PRESS_GESTURE_THRESHOLDS;

/** 傾きを見ないケース用。`rotationAlpha` を省いて z と時刻だけ並べる */
function feed(
  state: PressGestureState,
  samples: { z: number; now?: number }[],
): PressGestureResult {
  let result: PressGestureResult = { state, rotationDeg: null, finish: null };
  samples.forEach(({ z, now }, index) => {
    const sample: PressGestureSample = {
      z,
      rotationAlpha: null,
      // 既定では 50ms 間隔（DeviceMotion.setUpdateInterval(50) と同じ）
      now: now ?? index * 50,
    };
    result = reducePressGesture(result.state, sample);
  });
  return result;
}

/** 持ち上げ → 押し付け → 復帰 の 1 往復 */
const strokeSamples = [{ z: lift + 1 }, { z: -10 }, { z: neutral + 1 }];

describe("reducePressGesture", () => {
  it("持ち上げ → 押し付け → ニュートラル復帰 で確定する", () => {
    const result = feed(createPressGestureState(), strokeSamples);

    expect(result.finish).not.toBeNull();
    expect(result.state.pressed).toBe(true);
  });

  it("持ち上げずに押し付けても確定しない", () => {
    const result = feed(createPressGestureState(), [
      { z: -10 },
      { z: neutral + 1 },
    ]);

    expect(result.finish).toBeNull();
    expect(result.state.pressed).toBe(false);
  });

  it("持ち上げの閾値ちょうどでは持ち上げとみなさない", () => {
    const result = feed(createPressGestureState(), [
      { z: lift },
      { z: -10 },
      { z: neutral + 1 },
    ]);

    expect(result.finish).toBeNull();
  });

  it("押し付けが閾値に届かなければ確定しない", () => {
    const result = feed(createPressGestureState(), [
      { z: lift + 1 },
      { z: press },
      { z: neutral + 1 },
    ]);

    expect(result.finish).toBeNull();
  });

  it("ニュートラルまで戻らなければ確定しない", () => {
    const result = feed(createPressGestureState(), [
      { z: lift + 1 },
      { z: -10 },
      { z: neutral },
    ]);

    expect(result.finish).toBeNull();
  });

  it("持ち上げから liftTimeoutMs を過ぎた押し付けは拾わない", () => {
    const result = feed(createPressGestureState(), [
      { z: lift + 1, now: 0 },
      { z: -10, now: liftTimeoutMs + 1 },
      { z: neutral + 1, now: liftTimeoutMs + 51 },
    ]);

    expect(result.finish).toBeNull();
    expect(result.state.liftedAt).toBeNull();
  });

  it("持ち上げから liftTimeoutMs 以内に振り切れば確定する", () => {
    const result = feed(createPressGestureState(), [
      { z: lift + 1, now: 0 },
      { z: -10, now: liftTimeoutMs - 50 },
      { z: neutral + 1, now: liftTimeoutMs },
    ]);

    expect(result.finish).not.toBeNull();
  });

  it("押し付けまで届いていても liftTimeoutMs を過ぎたら確定しない", () => {
    const result = feed(createPressGestureState(), [
      { z: lift + 1, now: 0 },
      { z: -10, now: 100 },
      { z: neutral + 1, now: liftTimeoutMs + 1 },
    ]);

    expect(result.finish).toBeNull();
  });

  it("押し付け中の最も深い z をピークとして使う", () => {
    const deepest = -40;
    const result = feed(createPressGestureState(), [
      { z: lift + 1 },
      { z: -10 },
      { z: deepest },
      { z: -10 },
      { z: neutral + 1 },
    ]);

    expect(result.finish?.scratchLevel).toBeCloseTo(
      scratchLevelFromPeak(deepest),
    );
  });

  it("確定後はサンプルを読んでも二度と確定しない", () => {
    const pressed = feed(createPressGestureState(), strokeSamples);
    const again = feed(pressed.state, strokeSamples);

    expect(again.finish).toBeNull();
  });

  it("確定後もプレビューの傾きは追従し続ける", () => {
    const pressed = feed(createPressGestureState(), strokeSamples);
    const after = reducePressGesture(pressed.state, {
      z: 0,
      rotationAlpha: Math.PI / 2,
      now: 1000,
    });

    // 最初に見た alpha を 0 度の基準にするので、確定後の初 alpha は 0 度になる
    expect(after.rotationDeg).toBeCloseTo(0);
  });

  it("markPressed() で確定済みにすると振り下ろしを受け付けない", () => {
    const result = feed(markPressed(createPressGestureState()), strokeSamples);

    expect(result.finish).toBeNull();
  });
});

describe("reducePressGesture の傾き", () => {
  it("最初のサンプルの alpha を 0 度の基準にする", () => {
    const result = reducePressGesture(createPressGestureState(), {
      z: 0,
      rotationAlpha: 1.23,
      now: 0,
    });

    expect(result.rotationDeg).toBeCloseTo(0);
    expect(result.state.referenceAlpha).toBeCloseTo(1.23);
  });

  it("基準から時計回りに回すと負の角度になる", () => {
    const first = reducePressGesture(createPressGestureState(), {
      z: 0,
      rotationAlpha: 0,
      now: 0,
    });
    const second = reducePressGesture(first.state, {
      z: 0,
      rotationAlpha: Math.PI / 2,
      now: 50,
    });

    expect(second.rotationDeg).toBeCloseTo(-90);
  });

  it("-180〜180 度に正規化する", () => {
    const first = reducePressGesture(createPressGestureState(), {
      z: 0,
      rotationAlpha: 0,
      now: 0,
    });
    const second = reducePressGesture(first.state, {
      z: 0,
      rotationAlpha: -Math.PI * 1.5,
      now: 50,
    });

    // 270 度は -90 度として扱う
    expect(second.rotationDeg).toBeCloseTo(-90);
  });

  it("alpha が取れないサンプルでは直前の傾きを保つ", () => {
    const first = reducePressGesture(createPressGestureState(), {
      z: 0,
      rotationAlpha: 0,
      now: 0,
    });
    const second = reducePressGesture(first.state, {
      z: 0,
      rotationAlpha: Math.PI / 4,
      now: 50,
    });
    const third = reducePressGesture(second.state, {
      z: 0,
      rotationAlpha: null,
      now: 100,
    });

    expect(third.rotationDeg).toBeNull();
    expect(third.state.relativeAlpha).toBeCloseTo(second.state.relativeAlpha);
  });

  it("確定時の傾きは直前のサンプルの向きから決まる", () => {
    let state = createPressGestureState();
    state = reducePressGesture(state, {
      z: 0,
      rotationAlpha: 0,
      now: 0,
    }).state;
    state = reducePressGesture(state, {
      z: lift + 1,
      rotationAlpha: 0,
      now: 50,
    }).state;
    state = reducePressGesture(state, {
      z: -10,
      rotationAlpha: 0,
      now: 100,
    }).state;
    const result = reducePressGesture(state, {
      z: neutral + 1,
      rotationAlpha: Math.PI / 6,
      now: 150,
    });

    expect(result.finish?.tiltAngle).toBeCloseTo(-30);
  });
});

describe("scratchLevelFromPeak", () => {
  it("弱い押し付けは最も掠れる", () => {
    expect(scratchLevelFromPeak(SCRATCH_LEVEL_RANGE.weakPeak)).toBe(1);
  });

  it("強い押し付けは掠れない", () => {
    expect(scratchLevelFromPeak(SCRATCH_LEVEL_RANGE.strongPeak)).toBe(0);
  });

  it("両端の外側は 0〜1 に丸める", () => {
    expect(scratchLevelFromPeak(0)).toBe(1);
    expect(scratchLevelFromPeak(-200)).toBe(0);
  });

  it("両端の中間はおよそ 0.5 になる", () => {
    const { weakPeak, strongPeak } = SCRATCH_LEVEL_RANGE;

    expect(scratchLevelFromPeak((weakPeak + strongPeak) / 2)).toBeCloseTo(0.5);
  });
});
