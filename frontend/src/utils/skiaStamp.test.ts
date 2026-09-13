/**
 * `seedFromStampId()` の性質を固定する回帰テスト。
 *
 * この関数は「掠れ模様のシードを保存せず、スタンプの uuid から導出する」ための
 * ものなので、次の 2 つが壊れると掠れの見た目が直接おかしくなる。
 *
 * - **返り値が 0 以上 1 未満**であること。SkSL 側のハッシュは `fract()` で
 *   下位ビットを取り出すため、大きな値を渡すと 32bit float の精度を食い潰して
 *   ノイズが数段階に潰れ、固定閾値との比較が破綻する（`skiaStamp.ts` のコメント参照）
 * - **id が少し違えばシードが十分に散る**こと。FNV-1a をそのまま返していた実装では
 *   素数 16777619 ≒ 2^24 のせいで末尾 1 文字の違いが下位 24bit に残らず、
 *   **末尾違いの uuid が同じシードに潰れていた**
 *
 * 後者は Storybook のスモークテストでは検出できない（絵が出てしまう）ので、
 * 実際に潰れた形の id 群をここに残しておく。
 *
 * Skia には触らない純粋な関数なので、`@shopify/react-native-skia` は読み込ませない。
 */
import { seedFromStampId } from "./skiaStamp";

/** 実際に同じシードへ潰れていた、末尾 1 文字だけ違う uuid 群 */
const TAIL_DIFFERENT_IDS = [
  "3f2504e0-4f89-11d3-9a0c-0305e82c3300",
  "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
  "3f2504e0-4f89-11d3-9a0c-0305e82c3302",
  "3f2504e0-4f89-11d3-9a0c-0305e82c3303",
  "3f2504e0-4f89-11d3-9a0c-0305e82c3304",
  "3f2504e0-4f89-11d3-9a0c-0305e82c3305",
];

describe("seedFromStampId", () => {
  test.each(TAIL_DIFFERENT_IDS)("%s のシードが 0 以上 1 未満になる", (id) => {
    const seed = seedFromStampId(id);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThan(1);
  });

  test("同じ id なら必ず同じシードになる", () => {
    for (const id of TAIL_DIFFERENT_IDS) {
      expect(seedFromStampId(id)).toBe(seedFromStampId(id));
    }
  });

  test("末尾 1 文字違いの id でシードが十分に散る", () => {
    const seeds = TAIL_DIFFERENT_IDS.map(seedFromStampId);
    // まず値として重複しない
    expect(new Set(seeds).size).toBe(seeds.length);
    // 重複しないだけでは足りない（差が極小なら模様は変わらない）ので間隔も見る。
    // 6 個が 0..1 に一様に散れば隣接間隔の期待値は約 1/7 なので、
    // その 1 桁下の 0.01 を下限にする。撹拌を外すとこの 6 個は
    // 0.369〜0.389 に等間隔で並び（最小間隔 0.0039）、この行で落ちる
    const sorted = [...seeds].sort((a, b) => a - b);
    const gaps = sorted.slice(1).map((seed, i) => seed - sorted[i]);
    expect(Math.min(...gaps)).toBeGreaterThan(0.01);
  });

  test("空文字列でも 0 以上 1 未満を返す", () => {
    const seed = seedFromStampId("");
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThan(1);
  });
});
