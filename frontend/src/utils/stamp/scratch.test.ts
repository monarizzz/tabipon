/**
 * `scratchThreshold()` の応答曲線を固定する回帰テスト。
 *
 * この関数は「`scratchLevel` をそのまま白抜き率として扱う」ための逆算で、
 * #155 で式を入れ替えた本体。壊れると掠れの効き方が直接おかしくなる。
 *
 * - **白抜き率が level に比例する**こと。旧実装（閾値を σ 単位で線形に動かす）は
 *   level 0.8 まで実質何も起きず、つまみとして機能していなかった
 * - **level が増えれば必ず閾値が下がる**こと。逆転すると強くするほど掠れなくなる
 *
 * 描画には触れないので、実機やストーリーでは検出できない。
 */
import { scratchThreshold } from "./scratch";

/** ぼかし後のノイズの標準偏差。`scratch.ts` の `SCRATCH_NOISE_SD` と同じ値 */
const NOISE_SD = 0.031556;

/** 標準正規分布の上側確率。`erfc` が無いので級数を使わず数値積分で出す */
function fractionAbove(threshold: number): number {
  const z = (threshold - 0.5) / NOISE_SD;
  // 台形則。区間は ±12σ あれば裾は十分に無視できる
  const steps = 200000;
  const from = z;
  const to = 12;
  if (from >= to) {
    return 0;
  }
  const h = (to - from) / steps;
  const pdf = (t: number) => Math.exp((-t * t) / 2) / Math.sqrt(2 * Math.PI);
  let sum = (pdf(from) + pdf(to)) / 2;
  for (let i = 1; i < steps; i += 1) {
    sum += pdf(from + i * h);
  }
  return sum * h;
}

describe("scratchThreshold", () => {
  test("level 0 では 1 画素も白抜きされない", () => {
    // ノイズの最大値は 1.0 なので、閾値がそれを超えていれば誰も通らない
    expect(scratchThreshold(0)).toBeGreaterThan(1);
  });

  // level 1.0 で SCRATCH_MAX_WHITEOUT の 35% に届く
  test.each([
    [0.2, 0.07],
    [0.4, 0.14],
    [0.6, 0.21],
    [0.8, 0.28],
    [1.0, 0.35],
  ])("level %p の白抜き率が %p になる", (level, expected) => {
    // 近似式（Winitzki）の誤差を見込んで 0.001 まで許容する
    expect(fractionAbove(scratchThreshold(level))).toBeCloseTo(expected, 3);
  });

  test("白抜き率が level に比例する", () => {
    const levels = [0.2, 0.4, 0.6, 0.8, 1.0];
    const ratios = levels.map(
      (level) => fractionAbove(scratchThreshold(level)) / level,
    );
    // 比例していれば level で割った値はすべて等しくなる。
    // 旧実装ではここが 0.00002 〜 0.126 と 4 桁違っていた
    for (const ratio of ratios) {
      expect(ratio).toBeCloseTo(ratios[0], 3);
    }
  });

  test("level を上げると閾値が必ず下がる", () => {
    const thresholds = [0.1, 0.2, 0.4, 0.6, 0.8, 1.0].map(scratchThreshold);
    for (let i = 1; i < thresholds.length; i += 1) {
      expect(thresholds[i]).toBeLessThan(thresholds[i - 1]);
    }
  });

  test("範囲外の level は 0..1 に丸められる", () => {
    expect(scratchThreshold(1.5)).toBe(scratchThreshold(1));
    expect(scratchThreshold(-1)).toBe(scratchThreshold(0));
  });
});
