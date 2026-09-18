/**
 * スタンプに掠れを掛ける。
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
import { renderToSquareImage } from "@/src/utils/skia/surface";

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
 * `scratchLevel` が 1.0 のときに白く抜く画素の割合。**掠れの強さの上限。**
 *
 * 見た目を決める唯一のつまみなので、強さを変えたいときはここだけ動かす。
 * 実際に絵として消えるのはインクが乗っている画素だけなので、線画の黒画素率が
 * 28% なら、絵の上では「線の 1/3 ほどが飛ぶ」ことになる。
 */
const SCRATCH_MAX_WHITEOUT = 0.35;

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
 * 逆誤差関数 `erf⁻¹(x)` の近似（Winitzki）。`|x| < 1`。
 *
 * 白抜き率から閾値を逆算するのに要る。JS に標準の逆正規分布が無いため置いている。
 * 白抜き率 0..50% の範囲で、結果の誤差は 0.006 ポイント以下（検証済み）。
 * 裾（白抜き率が 0 に近い側）ほど誤差が大きくなるので、上限を上げるときは
 * 精度を確かめ直すこと。
 */
const WINITZKI_A = 0.147;

function erfInv(x: number): number {
  if (x === 0) {
    return 0;
  }
  const sign = x > 0 ? 1 : -1;
  const ln = Math.log(1 - x * x);
  const t = 2 / (Math.PI * WINITZKI_A) + ln / 2;
  return sign * Math.sqrt(Math.sqrt(t * t - ln / WINITZKI_A) - t);
}

/** 標準正規分布の分位点 `Φ⁻¹(p)`。`0 < p < 1` */
function normalQuantile(p: number): number {
  return Math.SQRT2 * erfInv(2 * p - 1);
}

/**
 * 掠れの閾値を求める。ぼかし後のノイズ（0..1）と直接比較できる形で返す。
 *
 * `scratchLevel` は白く抜く画素の割合として扱う（`SCRATCH_MAX_WHITEOUT` が上限）。
 * ノイズは平均 0.5・σ = `SCRATCH_NOISE_SD` のほぼ正規分布なので、
 * 上位 f を抜く閾値は `0.5 + Φ⁻¹(1 - f) * σ` で求まる。
 *
 * 閾値を level に対して線形に動かす形を採らない理由は
 * `docs/stamp-pipeline.md`「掠れの強さは『白抜き率』で決める」。
 */
export function scratchThreshold(scratchLevel: number): number {
  const fraction =
    Math.min(Math.max(scratchLevel, 0), 1) * SCRATCH_MAX_WHITEOUT;
  if (fraction <= 0) {
    // ノイズの最大値は 1.0 なので、それより大きければ 1 画素も抜けない
    return 2;
  }
  return 0.5 + normalQuantile(1 - fraction) * SCRATCH_NOISE_SD;
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
