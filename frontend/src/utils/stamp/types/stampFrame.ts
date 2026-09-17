/** 円フレームの種類。フレームを増やすときはここに値を足す */
export const STAMP_FRAMES = ["simple", "classic", "dash", "wave"] as const;

export type StampFrame = (typeof STAMP_FRAMES)[number];

/** 値が決まっていないときのフレーム */
export const DEFAULT_STAMP_FRAME: StampFrame = "classic";

/**
 * DB には廃止済みの識別子も残り続ける
 * （`src/infra/db/migrations.ts` の `frame_id` は値を縛らない）。
 * 外から来た文字列を `StampFrame` として扱う前に必ずここを通す。
 */
export function isStampFrame(value: string): value is StampFrame {
  return (STAMP_FRAMES as readonly string[]).includes(value);
}
