/**
 * 掠れの効き方を固定する回帰テスト。
 *
 * `scratchLevel` は白抜き率そのものとして扱う（`docs/stamp-pipeline.md`
 * 「掠れの強さは『白抜き率』で決める」）。これが壊れると掠れの効き方が
 * 直接おかしくなるので、次の 2 つを見る。
 *
 * - **白抜き率が level に比例する**こと
 * - **level を上げれば閾値が必ず下がる**こと。逆転すると強くするほど掠れなくなる
 *
 * 比例の検査は `scratchThreshold()` の返り値ではなく、**`applyScratch()` が実際に
 * 白へ抜いた画素を数えて**行う。閾値を実装と同じ正規分布へ当て直すだけの検査では、
 * `MakeBlur` の実カーネル・8bit サーフェス・`half` 精度・SkSL のハッシュが
 * 想定と違っても常に通ってしまい、ユーザーが見る掠れが比例しなくなっても気付けない。
 *
 * 描画には触れるが、Storybook のスモークテストでは検出できない（絵は出てしまう）。
 */
import { Skia } from "@shopify/react-native-skia";

import { STAMP_SIZE } from "@/src/utils/stamp/constants/constants";
import { applyScratch, scratchThreshold } from "@/src/utils/stamp/scratch";
import { renderToSquareImage, toRasterImage } from "@/src/utils/skia/surface";

/** `scratch.ts` の `SCRATCH_MAX_WHITEOUT` と同じ値 */
const MAX_WHITEOUT = 0.35;

/**
 * 実測の白抜き率と狙い値とのずれの許容幅（ポイント）。
 *
 * ノイズは 8bit のオフスクリーンに入るので、σ = `SCRATCH_NOISE_SD` = 0.0316 は
 * 8 階調しかない。閾値は階調の間に落ちるため、狙った割合をそのまま取れず
 * シードによっても数ポイント振れる（実測で最大 3.3 ポイント）。
 * 見た目には効かないが、ここを 1 ポイント台まで絞ると偽陽性で落ちる。
 */
const WHITEOUT_TOLERANCE = 0.04;

/** 掠れを掛ける前の下地。全面黒なので、白い画素 = 抜かれた画素になる */
function blackSquare() {
  const paint = Skia.Paint();
  paint.setColor(Skia.Color("black"));
  return renderToSquareImage(STAMP_SIZE, (canvas) => {
    canvas.drawRect(Skia.XYWHRect(0, 0, STAMP_SIZE, STAMP_SIZE), paint);
  });
}

/** `applyScratch()` が実際に白へ抜いた画素の割合 */
function measureWhiteoutRatio(scratchLevel: number, seed: number): number {
  const scratched = applyScratch(blackSquare(), scratchLevel, seed);
  const pixels = toRasterImage(scratched, "掠れの結果").readPixels();
  if (!pixels) {
    throw new Error("readPixels に失敗した");
  }
  let white = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    // 下地は黒・抜いた先は白なので、中間の値は出ない
    if ((pixels[i] as number) > 127) {
      white += 1;
    }
  }
  return white / (pixels.length / 4);
}

/** 掠れ模様がシードに依らないことを見るための、無関係な 3 つのシード */
const SEEDS = [0.1, 0.42, 0.77];

const LEVELS = [0.2, 0.4, 0.6, 0.8, 1.0];

describe("applyScratch の白抜き率", () => {
  test("level 0 では 1 画素も白抜きされない", () => {
    expect(measureWhiteoutRatio(0, SEEDS[0] as number)).toBe(0);
  });

  test.each(LEVELS)("level %p の白抜き率が level に比例する", (level) => {
    const expected = level * MAX_WHITEOUT;
    for (const seed of SEEDS) {
      // toBeCloseTo の桁指定では `WHITEOUT_TOLERANCE` の幅を表せないので差を直接見る
      expect(
        Math.abs(measureWhiteoutRatio(level, seed) - expected),
      ).toBeLessThanOrEqual(WHITEOUT_TOLERANCE);
    }
  });

  test("level を上げると白抜き率が必ず増える", () => {
    for (const seed of SEEDS) {
      const ratios = LEVELS.map((level) => measureWhiteoutRatio(level, seed));
      for (let i = 1; i < ratios.length; i += 1) {
        expect(ratios[i] as number).toBeGreaterThan(ratios[i - 1] as number);
      }
    }
  });
});

describe("scratchThreshold", () => {
  test("level 0 の閾値はノイズの最大値 1.0 を超える", () => {
    expect(scratchThreshold(0)).toBeGreaterThan(1);
  });

  test("level を上げると閾値が必ず下がる", () => {
    const thresholds = [0.1, ...LEVELS].map(scratchThreshold);
    for (let i = 1; i < thresholds.length; i += 1) {
      expect(thresholds[i] as number).toBeLessThan(thresholds[i - 1] as number);
    }
  });

  test("範囲外の level は 0..1 に丸められる", () => {
    expect(scratchThreshold(1.5)).toBe(scratchThreshold(1));
    expect(scratchThreshold(-1)).toBe(scratchThreshold(0));
  });
});
