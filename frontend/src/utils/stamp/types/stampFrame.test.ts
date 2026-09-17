/**
 * フレーム識別子の型ガードを固定するテスト。
 *
 * `migrations.ts` の `frame_id` は値の一覧で縛っていないので、DB には廃止済みの
 * 識別子も残りうる。`stamps.ts` はその文字列を `isStampFrame()` に通し、
 * 外れた値を `DEFAULT_STAMP_FRAME` へ寄せてから `StampFrame` として扱う。
 *
 * ここが緩むと未知の値が `drawFrame()` まで素通りし、`default` の `throw` に当たって
 * スタンプの生成ごと失敗する。逆に `DEFAULT_STAMP_FRAME` が `STAMP_FRAMES` から
 * 外れると、寄せた先がそのまま未知の値になる。
 *
 * Skia には触らない純粋な関数なので、`@shopify/react-native-skia` は読み込ませない。
 */
import { DEFAULT_STAMP_FRAME, STAMP_FRAMES, isStampFrame } from "./stampFrame";

/** 型どおりでない値。廃止・改名・大文字小文字違い・空文字を並べている */
const UNKNOWN_VALUES = ["", "Simple", "SIMPLE", "double", "dotted", "円"];

describe("isStampFrame", () => {
  test.each(STAMP_FRAMES)("%s を StampFrame と判定する", (frame) => {
    expect(isStampFrame(frame)).toBe(true);
  });

  test.each(UNKNOWN_VALUES)("%p を StampFrame と判定しない", (value) => {
    expect(isStampFrame(value)).toBe(false);
  });

  test("Array.prototype の名前を拾わない", () => {
    expect(isStampFrame("length")).toBe(false);
    expect(isStampFrame("includes")).toBe(false);
  });
});

describe("DEFAULT_STAMP_FRAME", () => {
  test("STAMP_FRAMES に含まれる値である", () => {
    expect(isStampFrame(DEFAULT_STAMP_FRAME)).toBe(true);
  });
});
