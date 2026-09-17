/**
 * 工程4: スタンプに掠れを掛ける。
 *
 * 1. `seed` から 0..1 の一様乱数ノイズを作る
 * 2. σ = 2.5543 でぼかす（`GaussianBlur(15, 15)` 相当）
 * 3. 閾値を超えた画素を白で抜く
 *
 * 同じ `seed` と `scratchLevel` なら必ず同じ模様になる。
 * シードの作り方は `seed.ts` を参照。
 */
import {
  FilterMode,
  MipmapMode,
  Skia,
  TileMode,
  type SkImage,
} from "@shopify/react-native-skia";

import { STAMP_SIZE } from "@/src/utils/stamp/constants/constants";
import { createCachedEffect } from "@/src/utils/stamp/runtimeEffect";
import { renderToSquareImage } from "@/src/utils/stamp/surface";

/**
 * `cv2.GaussianBlur(noise, (15, 15), 0)` 相当の σ。
 *
 * 公称は `0.3 * ((15 - 1) * 0.5 - 1) + 0.8 = 2.6` だが、打ち切り後の実効値
 * （カーネルの 2 次モーメントから算出）を使う。15 タップは ±7 = 2.7σ しか
 * 取れていないので、公称より少し小さい 2.5543 になる。
 */
const SCRATCH_BLUR_SIGMA = 2.5543;

/**
 * 一様乱数を `SCRATCH_BLUR_SIGMA` でぼかしたあとの標準偏差。
 *
 * 白色ノイズに正規化済みカーネル k を畳み込むと、出力の σ は
 * `入力の σ × sqrt(Σk²)` になる。ksize = 15 の 2 次元カーネルでは
 * `sqrt(Σk²) = 0.10930`、入力は 0..1 の一様乱数なので σ = 1/sqrt(12) = 0.28868。
 * 掛けて 0.031556。
 */
const SCRATCH_NOISE_SD = 0.031556;

/**
 * ぼかしたノイズの min-max 正規化を、実測ではなく固定値で行うための定数。
 *
 * ## 実測の min / max を使わない理由
 *
 * 素直に書くと「ぼかしたノイズを実測の min / max で 0..1 に伸ばし、
 * `1.0 - level * 0.4` で切る」になる。min / max は 26 万画素の**外れ値そのもの**なので、
 * 同じ `scratchLevel` でも走らせるたびに白抜き率が変わる。
 * numpy で同じカーネルを組んで 512x512 を 6 回試したときの実測:
 *
 * | scratch_level | 白抜き率の平均 | 最小 | 最大 |
 * | --- | --- | --- | --- |
 * | 0.2 | 0.004% | 0.001% | 0.014% |
 * | 0.4 | 0.033% | 0.004% | 0.138% |
 * | 0.6 | 0.364% | 0.016% | 1.483% |
 * | 1.0 | 16.06% | 1.45% | 39.77% |
 *
 * **level = 1.0 で 1.5% 〜 39.8% まで振れる。**再生成のたびに掠れの「濃さ」が変わり、
 * シードを固定しても同じ絵にならない。
 *
 * そこで **min / max を実測せず、上の試行で得た期待値で固定する**。
 * ぼかし後のノイズの min / max はそれぞれ -6.025σ / +5.929σ（σ はぼかし後の標準偏差）。
 * これで平均的な見た目は保ったまま、同じ入力なら必ず同じ結果になる。
 *
 * 副産物として `readPixels` での min / max 走査が要らなくなる（GPU から CPU への
 * 読み戻しは重いので、プレビュー速度の面でも都合が良い）。
 */
const SCRATCH_NORMALIZE_LOW = 6.025;
const SCRATCH_NORMALIZE_RANGE = 11.954;

/**
 * 掠れのノイズを作るシェーダ。
 *
 * ハッシュは Dave Hoskins の "Hash without Sine"。`sin()` ベースのハッシュは
 * GPU ごとに精度が違って結果が変わるため使わない。`seed` はハッシュの中に混ぜる
 * （座標を平行移動するだけだと、シードを変えても同じ模様がずれて出てしまう）。
 *
 * **`seed` は 0 以上 1 未満であること。**`dot()` の中に足すので、大きな値を渡すと
 * 後段の積が 32bit float の精度を超えて `fract()` が潰れる（`seed.ts` を参照）。
 *
 * 出力は 0..1 の一様乱数。正規乱数でなくてよいのは、**このあとガウスぼかしを掛けるので
 * 中心極限定理でどちらも正規分布に近づく**ため。一様乱数を使うのは 8bit の
 * オフスクリーンに格納する都合で、σ = 0.289 と階調を目一杯使えるため
 * （正規乱数を 0..1 に押し込めると、そのままでは裾が飽和する）。
 */
const SCRATCH_NOISE_SKSL = `
uniform float seed;

float hash21(float2 p) {
  float3 p3 = fract(float3(p.x, p.y, p.x) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33 + seed);
  return fract((p3.x + p3.y) * p3.z);
}

half4 main(float2 p) {
  half v = half(hash21(p));
  return half4(v, v, v, 1.0);
}
`;

/** ぼかしたノイズが閾値を超えた画素を白で抜くシェーダ */
const SCRATCH_APPLY_SKSL = `
uniform shader src;
uniform shader noise;
uniform half   threshold;

half4 main(float2 p) {
  half n = noise.eval(p).r;
  return n > threshold ? half4(1.0, 1.0, 1.0, 1.0) : half4(src.eval(p).rgb, 1.0);
}
`;

const getNoiseEffect = createCachedEffect(SCRATCH_NOISE_SKSL, "掠れ");
const getApplyEffect = createCachedEffect(SCRATCH_APPLY_SKSL, "掠れ");

/**
 * 2 つのシェーダをまとめて取り出す。
 *
 * **片方だけ先にコンパイルしない**ために噛ませてある。個別に遅延させると、
 * 適用シェーダのコンパイルが失敗したときに、ノイズ生成とぼかしの 2 パスを
 * 走らせたあとで例外が飛ぶ。
 */
function getScratchEffects() {
  return { noise: getNoiseEffect(), apply: getApplyEffect() };
}

/**
 * 掠れの閾値を求める。0..1 のピクセル値と直接比較できる形で返す。
 *
 * `1.0 - scratchLevel * 0.4` は**正規化後**の値なので、
 * 固定した min / max（`SCRATCH_NORMALIZE_*`）を使って σ 単位に戻し、
 * さらにノイズ画像のスケール（平均 0.5 / σ = `SCRATCH_NOISE_SD`）へ移す。
 */
function scratchThreshold(scratchLevel: number): number {
  const normalized = 1.0 - scratchLevel * 0.4;
  const sigma = normalized * SCRATCH_NORMALIZE_RANGE - SCRATCH_NORMALIZE_LOW;
  return 0.5 + sigma * SCRATCH_NOISE_SD;
}

/**
 * スタンプに掠れを掛ける。
 *
 * `scratchLevel <= 0` のときは何もしない。
 */
export function applyScratch(
  stamp: SkImage,
  scratchLevel: number,
  seed: number,
): SkImage {
  if (scratchLevel <= 0) {
    return stamp;
  }

  const effects = getScratchEffects();

  const noisePaint = Skia.Paint();
  noisePaint.setShader(effects.noise.makeShader([seed]));
  const rawNoise = renderToSquareImage(STAMP_SIZE, (canvas) => {
    canvas.drawRect(Skia.XYWHRect(0, 0, STAMP_SIZE, STAMP_SIZE), noisePaint);
  });

  // ぼかしのタイルモードは Mirror（反射）。既定の Decal だと画像の外側（透明）を
  // 巻き込んで縁のノイズが偏り、四辺だけ掠れ方が変わる。
  // Clamp も駄目で、端の 1 画素を 7 回繰り返すぶん平均化が効かず、
  // **縁だけノイズの分散が大きくなって四辺が強く白抜きされる**。
  // Skia の Mirror は端の 1 画素を含む反射だが、白色ノイズに対しては分散が保たれる
  const blurPaint = Skia.Paint();
  blurPaint.setImageFilter(
    Skia.ImageFilter.MakeBlur(
      SCRATCH_BLUR_SIGMA,
      SCRATCH_BLUR_SIGMA,
      TileMode.Mirror,
    ),
  );
  const blurredNoise = renderToSquareImage(STAMP_SIZE, (canvas) => {
    canvas.drawImage(rawNoise, 0, 0, blurPaint);
  });

  const toShader = (image: SkImage) =>
    image.makeShaderOptions(
      TileMode.Clamp,
      TileMode.Clamp,
      FilterMode.Nearest,
      MipmapMode.None,
    );
  const shader = effects.apply.makeShaderWithChildren(
    [scratchThreshold(scratchLevel)],
    [toShader(stamp), toShader(blurredNoise)],
  );

  const paint = Skia.Paint();
  paint.setShader(shader);
  return renderToSquareImage(STAMP_SIZE, (canvas) => {
    canvas.drawRect(Skia.XYWHRect(0, 0, STAMP_SIZE, STAMP_SIZE), paint);
  });
}
