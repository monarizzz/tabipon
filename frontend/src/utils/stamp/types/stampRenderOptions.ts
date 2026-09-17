import type { StampFrame } from "@/src/utils/stamp/types/stampFrame";

/** スタンプ 1 枚を描くためのパラメータ */
export type StampRenderOptions = {
  color: string;
  frame: StampFrame;
  /** 0..1。押し付けの弱さから決まる（`app/stamp-press.tsx` の DeviceMotion） */
  scratchLevel?: number;
  /** 度。時計回りが正 */
  tiltAngle?: number;
  /**
   * 掠れ模様のシード。同じ値なら必ず同じ模様になる。
   * 省略時は 0（＝常に同じ模様）で、呼び出し側が決めるのが前提。
   * スタンプの id から作るなら `seed.ts` の `seedFromStampId()` を使う。
   */
  seed?: number;
};
