/**
 * 白黒2値の線画からスタンプ画像を Skia で組み立てる。
 * インク色・円フレーム（#122）と、掠れ・傾き・PNG 書き出し（#123）。
 *
 * Refs: #122 / #123 / #98
 *
 * 現行 `backend/app/services/stamp_processor.py` の `process_stamp_image()` のうち、
 * **線画化より後ろの全工程**を移植したもの。線画化は #121 の
 * `src/utils/skiaLineArt.ts` が担う。写真 uri から PNG まで一息に作るなら
 * `generateStampPngFromUri()` を呼ぶ。
 *
 * 工程の順序は backend と同じで、着色 → フレーム → 掠れ → 傾き。
 * 掠れをフレームより後に掛けるので、枠線にも掠れが乗る。
 *
 * 移植元（OpenCV）:
 *
 * ```python
 * dark = (img[:,:,0] < 180) & (img[:,:,1] < 180) & (img[:,:,2] < 180)
 * img[dark] = ink_color
 *
 * radius = 512 // 2 - 8          # 248
 * center = (256, 256)
 * mask = circle(center, radius, 255, -1)
 * out = full(255); out[mask == 255] = img[mask == 255]
 * # frame ごとに circle / ellipse / polylines を重ねる
 * ```
 *
 * ## OpenCV → Skia で意識的に変えた点
 *
 * ### 1. 色順が BGR → RGBA
 *
 * `STAMP_COLORS` の numpy 配列は **BGR 順**（OpenCV の既定）。
 * 例えば red の `[30, 50, 220]` は B=30 / G=50 / R=220 で、赤が 220。
 * Skia は RGBA なので、`STAMP_INK_COLORS` では反転させた値を書いている。
 * ここを素直に読み替えると赤と青が入れ替わるので、最初に間違えやすい箇所。
 *
 * ### 2. アンチエイリアスを掛けている（OpenCV は掛けていない）
 *
 * `cv2.circle` / `cv2.ellipse` / `cv2.polylines` の既定は `lineType=LINE_8`、
 * つまりアンチエイリアス無しで、円周も波線もジャギーが出る。Skia 側でこれを
 * 再現するには `paint.setAntiAlias(false)` にすればよいが、**あえて有効のままにした**。
 *
 * - スタンプは画面上で縮小表示されるため、ジャギーは「劣化」としてそのまま見える
 * - 現行出力を忠実に再現する目的は #121 の線画（=絵の内容）であって、
 *   枠線のラスタライズ品質まで一致させる必要は無い
 *
 * 差は円周と枠線の輪郭 ±1 画素に留まり、線の太さ・半径・位置は一致する。
 *
 * ### 3. 閾値判定は 0..1 スケール
 *
 * 暗いピクセルの判定 `< 180` は 0..255 スケール。SkSL 側は 0..1 なので
 * `180 / 255` に正規化して渡す。`<` の向きは変えていない（180 ちょうどは暗くない）。
 *
 * ## 入力は 2 値線画でなくてもよい
 *
 * `applyInkColor()` は「3 チャンネルとも 180 未満なら置換」という元の条件を
 * そのまま実装しているので、入力がグレースケールでも写真でも動く。
 * 実際に渡すのは `generateLineArtFromImage()` の出力（0 か 255 の 2 値）なので、
 * 実質は「黒をインク色に、白は白のまま」になる。
 */
import {
  ClipOp,
  FilterMode,
  ImageFormat,
  MipmapMode,
  PaintStyle,
  Skia,
  StrokeCap,
  StrokeJoin,
  TileMode,
  type SkCanvas,
  type SkImage,
  type SkPaint,
  type SkRuntimeEffect,
} from "@shopify/react-native-skia";

import type { StampColor, StampFrame } from "@/src/api/stamps";
import {
  LINE_ART_SIZE,
  generateLineArtFromImage,
} from "@/src/utils/skiaLineArt";
import { renderToSquareImage } from "@/src/utils/skiaSurface";

/** 出力サイズ。backend の `STAMP_IMAGE_SIZE` と揃える */
export const STAMP_SIZE = LINE_ART_SIZE;

/** RGB の 3 要素（各 0..255）。`Skia.Color` に渡す前の素の値 */
type InkRgb = readonly [number, number, number];

/**
 * インク色 4 色。`stamp_processor.py` の `STAMP_COLORS` と同じ色を **RGB 順**で持つ。
 *
 * | 色 | backend (BGR) | ここ (RGB) |
 * | --- | --- | --- |
 * | red | `[30, 50, 220]` | `[220, 50, 30]` |
 * | blue | `[180, 60, 30]` | `[30, 60, 180]` |
 * | black | `[30, 30, 30]` | `[30, 30, 30]` |
 * | green | `[100, 130, 40]` | `[40, 130, 100]` |
 *
 * black は BGR/RGB で同値なので、この表だけ見ると変換したように見えない。
 */
export const STAMP_INK_COLORS: Record<StampColor, InkRgb> = {
  red: [220, 50, 30],
  blue: [30, 60, 180],
  black: [30, 30, 30],
  green: [40, 130, 100],
};

/** `dark_pixels` の閾値 180 を 0..1 スケールに直したもの */
const DARK_PIXEL_THRESHOLD = 180 / 255;

/** 円マスク・フレームの半径。`STAMP_IMAGE_SIZE // 2 - 8` と同じ */
const FRAME_RADIUS = Math.floor(STAMP_SIZE / 2) - 8;

/** 円の中心。`(STAMP_IMAGE_SIZE // 2, STAMP_IMAGE_SIZE // 2)` と同じ */
const FRAME_CENTER = Math.floor(STAMP_SIZE / 2);

/** `simple`: 一重円の線幅 */
const SIMPLE_THICKNESS = 3;

/** `classic`: 外周の線幅と、内側の円の線幅・半径差 */
const CLASSIC_OUTER_THICKNESS = 10;
const CLASSIC_INNER_THICKNESS = 3;
const CLASSIC_INNER_RADIUS_OFFSET = 30;

/** `dash`: 円周の分割数と線幅。奇数番だけ描くので実際の破線は 12 本 */
const DASH_COUNT = 24;
const DASH_THICKNESS = 4;

/** `wave`: 波の数・振幅・線幅と、パスに打つ点の数 */
const WAVE_COUNT = 12;
const WAVE_AMPLITUDE = 6;
const WAVE_THICKNESS = 4;
const WAVE_POINT_COUNT = 720;

/**
 * インク置換シェーダ。
 *
 * `src` は線画の画像シェーダ。判定は BGR/RGB の順に依らない（3 チャンネルとも
 * 閾値未満か）ので、元の numpy の条件をそのまま書いている。
 */
const INK_SKSL = `
uniform shader src;
uniform half4  ink;        // 0..1 に正規化したインク色（RGBA。a は常に 1）
uniform half   threshold;  // 0..1 に正規化した 180

half4 main(float2 p) {
  half4 c = src.eval(p);
  // dark_pixels = (b < 180) & (g < 180) & (r < 180)
  bool dark = c.r < threshold && c.g < threshold && c.b < threshold;
  return dark ? ink : half4(c.rgb, 1.0);
}
`;

let cachedInkEffect: SkRuntimeEffect | null | undefined;

/**
 * SkSL をコンパイルして使い回す。
 *
 * `skiaLineArt.ts` と同じ理由で遅延させている。モジュールのトップレベルで
 * コンパイルすると、Skia のネイティブモジュールが無い環境（Jest のモック）で
 * import しただけで落ちる。
 */
function getInkEffect(): SkRuntimeEffect | null {
  if (cachedInkEffect === undefined) {
    cachedInkEffect = Skia.RuntimeEffect.Make(INK_SKSL) ?? null;
  }
  return cachedInkEffect;
}

/** インク色の `SkColor` を作る（不透明） */
function inkColorOf(color: StampColor) {
  const [r, g, b] = STAMP_INK_COLORS[color];
  return Skia.Color(`rgb(${r}, ${g}, ${b})`);
}

/**
 * 枠線用の Paint。
 *
 * `StrokeJoin.Round` / `StrokeCap.Round` にしているのは `wave` のため。
 * 720 点の折れ線を太さ 4 で描くと、既定の Miter 継ぎでは折れ角の外側に
 * 尖りが出る。`cv2.polylines` は内部で各線分を独立した太線として描いて
 * 重ねるので尖りが出ない。丸めるのが一番近い。
 *
 * `dash` の各弧の端は `cv2.ellipse` では平らに切られる（LINE_8 の
 * 太線描画は端をキャップしない）ため、`Butt` の方が近い。呼び出し側で上書きする。
 */
function framePaint(color: StampColor, thickness: number): SkPaint {
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(thickness);
  paint.setStrokeJoin(StrokeJoin.Round);
  paint.setStrokeCap(StrokeCap.Round);
  paint.setColor(inkColorOf(color));
  return paint;
}

/**
 * 線画の暗い画素をインク色に置き換える。
 *
 * `create_stamp_image()` の
 * `stamp_image[dark_pixels] = ink_color` に相当する。
 */
export function applyInkColor(lineArt: SkImage, color: StampColor): SkImage {
  const effect = getInkEffect();
  if (!effect) {
    throw new Error("インク置換シェーダ (SkSL) のコンパイルに失敗した");
  }

  const [r, g, b] = STAMP_INK_COLORS[color];
  // 出力と入力が同じ 512x512 で 1:1 に対応するので、補間は掛けず元のテクセルを読む
  const source = lineArt.makeShaderOptions(
    TileMode.Clamp,
    TileMode.Clamp,
    FilterMode.Nearest,
    MipmapMode.None,
  );
  // ink を half3 ではなく half4 にしてあるのは、uniform バッファ上で
  // 3 要素ベクトルの後ろに詰め物が入る余地を作らないため（JS 側は平坦な
  // float 配列を順に流し込むだけなので、並びがずれると色が壊れる）
  const shader = effect.makeShaderWithChildren(
    [r / 255, g / 255, b / 255, 1, DARK_PIXEL_THRESHOLD],
    [source],
  );

  const paint = Skia.Paint();
  paint.setShader(shader);
  return renderToSquareImage(STAMP_SIZE, (canvas) => {
    canvas.drawRect(Skia.XYWHRect(0, 0, STAMP_SIZE, STAMP_SIZE), paint);
  });
}

/**
 * `dash` の破線円を描く。
 *
 * `_draw_dashed_circle()` と同じく円周を 24 分割し、**奇数番の区間だけ**を描く
 * （`if i % 2 == 0: continue`）。結果として 15 度の弧が 12 本、15 度おきに並ぶ。
 *
 * 角度の起点と回転方向は OpenCV と Skia で一致している。どちらも 0 度が +x 方向で、
 * 画像座標系（y が下向き）なので画面上は時計回りに進む。
 */
function drawDashedCircle(canvas: SkCanvas, color: StampColor): void {
  const paint = framePaint(color, DASH_THICKNESS);
  // cv2.ellipse は弧の端をキャップしないので、丸めずに平らに切る
  paint.setStrokeCap(StrokeCap.Butt);

  const oval = Skia.XYWHRect(
    FRAME_CENTER - FRAME_RADIUS,
    FRAME_CENTER - FRAME_RADIUS,
    FRAME_RADIUS * 2,
    FRAME_RADIUS * 2,
  );
  const sweep = 360 / DASH_COUNT;

  for (let i = 0; i < DASH_COUNT; i += 1) {
    if (i % 2 === 0) {
      continue;
    }
    const path = Skia.Path.Make();
    path.addArc(oval, i * sweep, sweep);
    canvas.drawPath(path, paint);
  }
}

/**
 * `wave` の波形円を描く。
 *
 * `_draw_wave_circle()` の「720 点を打って閉じた折れ線にする」実装をそのまま移した。
 * 半径は `r = radius + amplitude * sin(wave_count * angle)`。
 *
 * backend は各点を `int()` で切り捨てて整数座標にしているが、ここは float のまま
 * 渡している。アンチエイリアス有りで描く以上、座標を整数に丸める意味が無いため。
 */
function drawWaveCircle(canvas: SkCanvas, color: StampColor): void {
  const path = Skia.Path.Make();
  for (let i = 0; i < WAVE_POINT_COUNT; i += 1) {
    const angle = (2 * Math.PI * i) / WAVE_POINT_COUNT;
    const radius = FRAME_RADIUS + WAVE_AMPLITUDE * Math.sin(WAVE_COUNT * angle);
    const x = FRAME_CENTER + radius * Math.cos(angle);
    const y = FRAME_CENTER + radius * Math.sin(angle);
    if (i === 0) {
      path.moveTo(x, y);
    } else {
      path.lineTo(x, y);
    }
  }
  // cv2.polylines(..., isClosed=True) と同じく最後の点と最初の点を繋ぐ
  path.close();

  canvas.drawPath(path, framePaint(color, WAVE_THICKNESS));
}

/** フレーム 4 種の描き分け。`apply_circular_stamp_frame()` の分岐と対応する */
function drawFrame(
  canvas: SkCanvas,
  color: StampColor,
  frame: StampFrame,
): void {
  switch (frame) {
    case "simple":
      canvas.drawCircle(
        FRAME_CENTER,
        FRAME_CENTER,
        FRAME_RADIUS,
        framePaint(color, SIMPLE_THICKNESS),
      );
      break;
    case "classic":
      canvas.drawCircle(
        FRAME_CENTER,
        FRAME_CENTER,
        FRAME_RADIUS,
        framePaint(color, CLASSIC_OUTER_THICKNESS),
      );
      canvas.drawCircle(
        FRAME_CENTER,
        FRAME_CENTER,
        FRAME_RADIUS - CLASSIC_INNER_RADIUS_OFFSET,
        framePaint(color, CLASSIC_INNER_THICKNESS),
      );
      break;
    case "dash":
      drawDashedCircle(canvas, color);
      break;
    case "wave":
      drawWaveCircle(canvas, color);
      break;
  }
}

/**
 * インク色を載せた画像を円マスクで切り抜き、フレームを重ねる。
 *
 * `apply_circular_stamp_frame()` に相当する。backend は
 * 「白で埋めた配列にマスク内だけ画素をコピーする」という書き方だが、
 * ここでは「白で塗る → 円でクリップ → 画像を描く → クリップを戻してフレームを描く」
 * に置き換えている。結果は同じで、円の内外の境界だけがアンチエイリアスされる。
 *
 * フレームはクリップの外で描く。`wave` は振幅 6 の分だけ円マスクより外へはみ出すので、
 * クリップしたままだと波の山が削れてしまう（backend もマスク適用後に描いている）。
 */
export function applyCircularFrame(
  inked: SkImage,
  color: StampColor,
  frame: StampFrame,
): SkImage {
  const circle = Skia.Path.Make();
  circle.addCircle(FRAME_CENTER, FRAME_CENTER, FRAME_RADIUS);

  return renderToSquareImage(STAMP_SIZE, (canvas) => {
    canvas.drawColor(Skia.Color("white"));

    canvas.save();
    canvas.clipPath(circle, ClipOp.Intersect, true);
    canvas.drawImage(inked, 0, 0);
    canvas.restore();

    drawFrame(canvas, color, frame);
  });
}

/**
 * 白黒の線画からスタンプ画像（インク色 + フレーム）を作る。
 *
 * 返り値を `makeNonTextureImage()` に通しているのは `skiaLineArt.ts` と同じ理由。
 * `Skia.Surface.MakeOffscreen` は GPU バックエンドなので、そのスナップショットは
 * 生成したスレッドの Skia コンテキストに属するテクスチャになり、UI スレッドで
 * 描画する `<Canvas>` からは見えない。CPU 側へコピーしてから返す。
 */
export function composeStampFromLineArt(
  lineArt: SkImage,
  color: StampColor,
  frame: StampFrame,
): SkImage {
  const inked = applyInkColor(lineArt, color);
  return applyCircularFrame(inked, color, frame).makeNonTextureImage();
}

/**
 * `cv2.GaussianBlur(noise, (15, 15), 0)` 相当の σ。
 *
 * 公称は `0.3 * ((15 - 1) * 0.5 - 1) + 0.8 = 2.6`。#121 と同じく打ち切り後の
 * 実効値（カーネルの 2 次モーメントから算出）を使う。15 タップは ±7 = 2.7σ しか
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
 * `apply_scratch` の min-max 正規化を、固定値に置き換えるための定数。
 *
 * ## backend をそのまま移植しなかった理由
 *
 * backend は「ぼかしたノイズを実測の min / max で 0..1 に伸ばし、
 * `1.0 - level * 0.4` で切る」。min / max は 26 万画素の**外れ値そのもの**なので、
 * 同じ `scratch_level` でも走らせるたびに白抜き率が変わる。
 * numpy で backend と同じカーネルを組んで 512x512 を 6 回試したときの実測:
 *
 * | scratch_level | 白抜き率の平均 | 最小 | 最大 |
 * | --- | --- | --- | --- |
 * | 0.2 | 0.004% | 0.001% | 0.014% |
 * | 0.4 | 0.033% | 0.004% | 0.138% |
 * | 0.6 | 0.364% | 0.016% | 1.483% |
 * | 1.0 | 16.06% | 1.45% | 39.77% |
 *
 * **level = 1.0 で 1.5% 〜 39.8% まで振れる。**掠れの「濃さ」が毎回変わるということで、
 * #123 が挙げている「再生成で掠れが変わる」問題の本体はシードよりこちらに近い。
 * 端末側は再レンダリングの頻度が上がるので、そのまま移植すると悪化する。
 *
 * そこで **min / max を実測せず、上の試行で得た期待値で固定する**。
 * ぼかし後のノイズの min / max はそれぞれ -6.025σ / +5.929σ（σ はぼかし後の標準偏差）。
 * これで backend の平均的な挙動は保ったまま、同じ入力なら必ず同じ結果になる。
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
 * 後段の積が 32bit float の精度を超えて `fract()` が潰れる（`seedFromStampId()` 参照）。
 *
 * 出力は 0..1 の一様乱数。backend は正規乱数だが、**このあとガウスぼかしを掛けるので
 * 中心極限定理でどちらも正規分布に近づく**。一様乱数を使うのは 8bit の
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

/**
 * ぼかしたノイズが閾値を超えた画素を白で抜くシェーダ。
 * `result[scratch_mask] = [255, 255, 255]` に相当する。
 */
const SCRATCH_APPLY_SKSL = `
uniform shader src;
uniform shader noise;
uniform half   threshold;

half4 main(float2 p) {
  half n = noise.eval(p).r;
  return n > threshold ? half4(1.0, 1.0, 1.0, 1.0) : half4(src.eval(p).rgb, 1.0);
}
`;

let cachedNoiseEffect: SkRuntimeEffect | null | undefined;
let cachedScratchEffect: SkRuntimeEffect | null | undefined;

function getScratchEffects(): {
  noise: SkRuntimeEffect;
  apply: SkRuntimeEffect;
} {
  if (cachedNoiseEffect === undefined) {
    cachedNoiseEffect = Skia.RuntimeEffect.Make(SCRATCH_NOISE_SKSL) ?? null;
  }
  if (cachedScratchEffect === undefined) {
    cachedScratchEffect = Skia.RuntimeEffect.Make(SCRATCH_APPLY_SKSL) ?? null;
  }
  if (!cachedNoiseEffect || !cachedScratchEffect) {
    throw new Error("掠れシェーダ (SkSL) のコンパイルに失敗した");
  }
  return { noise: cachedNoiseEffect, apply: cachedScratchEffect };
}

/**
 * 掠れの閾値を求める。0..1 のピクセル値と直接比較できる形で返す。
 *
 * backend の `threshold = 1.0 - scratch_level * 0.4` は**正規化後**の値なので、
 * 固定した min / max（`SCRATCH_NORMALIZE_*`）を使って σ 単位に戻し、
 * さらにノイズ画像のスケール（平均 0.5 / σ = `SCRATCH_NOISE_SD`）へ移す。
 */
function scratchThreshold(scratchLevel: number): number {
  const normalized = 1.0 - scratchLevel * 0.4;
  const sigma = normalized * SCRATCH_NORMALIZE_RANGE - SCRATCH_NORMALIZE_LOW;
  return 0.5 + sigma * SCRATCH_NOISE_SD;
}

/**
 * スタンプに掠れを掛ける。`apply_scratch()` に相当する。
 *
 * 3 パス構成:
 *
 * 1. `seed` から 0..1 の一様乱数ノイズを作る
 * 2. σ = 2.5543 でぼかす（`GaussianBlur(15, 15)` 相当）
 * 3. 閾値を超えた画素を白で抜く
 *
 * `scratchLevel <= 0` のときは何もしない（backend の `if scratch_level > 0` と同じ）。
 * 同じ `seed` と `scratchLevel` なら必ず同じ模様になる。
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

  // ぼかしのタイルモードは Clamp。既定の Decal だと画像の外側（透明）を
  // 巻き込んで縁のノイズが偏り、四辺だけ掠れ方が変わる
  const blurPaint = Skia.Paint();
  blurPaint.setImageFilter(
    Skia.ImageFilter.MakeBlur(
      SCRATCH_BLUR_SIGMA,
      SCRATCH_BLUR_SIGMA,
      TileMode.Clamp,
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

/** `rotate_stamp()` が回転を掛ける下限。1 度以下は無視する */
const MIN_TILT_ANGLE = 1.0;

/**
 * スタンプを傾ける。`rotate_stamp()` に相当する。
 *
 * backend は `getRotationMatrix2D(center, -angle_deg, 1.0)` に `warpAffine` で、
 * 余白は白（`BORDER_CONSTANT` + `(255, 255, 255)`）。
 * OpenCV の回転角は反時計回りが正なので、`-angle_deg` は「`angle_deg` だけ時計回り」。
 * Skia の `canvas.rotate()` も y 下向き座標系で時計回りが正なので、
 * **符号を反転させずにそのまま渡す**のが同じ向きになる。
 *
 * キャンバスは 512x512 のままなので、回転して外へ出た角は切り落とされる。
 * これも backend と同じ（`warpAffine` の出力サイズが `(w, h)` のため）。
 */
export function rotateStamp(stamp: SkImage, tiltAngle: number): SkImage {
  if (Math.abs(tiltAngle) <= MIN_TILT_ANGLE) {
    return stamp;
  }
  return renderToSquareImage(STAMP_SIZE, (canvas) => {
    canvas.drawColor(Skia.Color("white"));
    canvas.rotate(tiltAngle, FRAME_CENTER, FRAME_CENTER);
    const paint = Skia.Paint();
    // 画像の外周（回転して空いた角との境目）を滑らかにする
    paint.setAntiAlias(true);
    // サンプリングは Linear。`setAntiAlias()` は輪郭にしか効かず、テクセルの補間は
    // 別物で、既定の Nearest のままだと斜めになった線や円周が階段状になる。
    // 移植元の `cv2.warpAffine` も既定は `INTER_LINEAR`
    canvas.drawImageOptions(
      stamp,
      0,
      0,
      FilterMode.Linear,
      MipmapMode.None,
      paint,
    );
  });
}

/** スタンプ 1 枚を描くためのパラメータ。backend の `process_stamp_image()` の引数と対応する */
export type StampRenderOptions = {
  color: StampColor;
  frame: StampFrame;
  /** 0..1。押し付けの弱さから決まる（`app/stamp-press.tsx` の DeviceMotion） */
  scratchLevel?: number;
  /** 度。時計回りが正 */
  tiltAngle?: number;
  /**
   * 掠れ模様のシード。同じ値なら必ず同じ模様になる。
   * 省略時は 0（＝常に同じ模様）で、呼び出し側が決めるのが前提。
   * スタンプの id から作るなら `seedFromStampId()` を使う。
   */
  seed?: number;
};

/**
 * スタンプ id（uuid 文字列）から掠れのシードを作る。
 *
 * **シードを別に保存しない**ための関数。id は不変なので、色やフレームを変えて
 * 再生成しても掠れ模様は変わらない。保存スキーマ（#100）に列を足す必要も無い。
 *
 * ハッシュは FNV-1a（32bit）。暗号用途ではなく、id が 1 文字違えば別の模様になれば良い。
 *
 * **返す値は 0 以上 1 未満**。SkSL 側のハッシュは `fract()` で下位ビットを取り出すので、
 * 大きな値を渡すと途中の積が 32bit float の精度を食い潰して模様が退化する。
 * 例えば 1000 程度のシードでは `(p3.x + p3.y) * p3.z` が 10^6 の桁に乗り、
 * その付近の float32 の刻みは 0.25 なので、`fract()` の出力が数段階しか取れなくなる。
 * ノイズが数段階に潰れると平均も 0.5 から外れ、固定閾値との比較が破綻して
 * **uuid によって掠れ量が変わってしまう**（0..1 に収めればこの影響は無い）。
 */
export function seedFromStampId(id: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    // FNV の素数 16777619 を掛ける。32bit に収めるため Math.imul を使う
    hash = Math.imul(hash, 0x01000193);
  }
  // FNV-1a のままだと下位ビットが使えない。素数 16777619 ≒ 2^24 なので、
  // 最後の 1 文字の違いは「約 2^24 を足す」形でしか効かず、**下位 24bit には
  // ほとんど残らない**。実際、末尾 1 文字違いの id 5 つが同じ値に潰れていた。
  // 最後に撹拌（xorshift + 乗算）を掛けて、全ビットに差が回るようにする
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x21f0aaad);
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 0xd35a2d97);
  hash ^= hash >>> 15;
  // 上位 24bit を 0..1 へ。float32 の仮数 24bit に収まるので、
  // 別の id なら別の値になることと、精度を保つことを両立できる
  return (hash >>> 8) / 0x1000000;
}

/**
 * 線画からスタンプ 1 枚を仕上げる。着色 → フレーム → 掠れ → 傾きの順。
 *
 * 順序は backend の `process_stamp_image()` と同じ。掠れをフレームより後に掛けるので、
 * 枠線にも掠れが乗る（backend もそうなっている）。
 */
export function renderStampFromLineArt(
  lineArt: SkImage,
  options: StampRenderOptions,
): SkImage {
  const { color, frame, scratchLevel = 0, tiltAngle = 0, seed = 0 } = options;
  const inked = applyInkColor(lineArt, color);
  const framed = applyCircularFrame(inked, color, frame);
  const scratched = applyScratch(framed, scratchLevel, seed);
  const rotated = rotateStamp(scratched, tiltAngle);
  // GPU テクスチャのままでは呼び出し側の <Canvas> で描けない
  return rotated.makeNonTextureImage();
}

/**
 * 写真からスタンプ画像を生成する。#121 の線画化と #122 / #123 の仕上げを繋いだもの。
 * `process_stamp_image()` の全工程に相当する。
 */
export function generateStampFromImage(
  image: SkImage,
  options: StampRenderOptions,
): SkImage {
  return renderStampFromLineArt(generateLineArtFromImage(image), options);
}

/**
 * 写真の uri からスタンプ画像を生成する。
 *
 * uri は `file://` / `http(s)://` / バンドルされたアセットの解決済み uri。
 */
export async function generateStampFromUri(
  uri: string,
  options: StampRenderOptions,
): Promise<SkImage> {
  const data = await Skia.Data.fromURI(uri);
  const image = Skia.Image.MakeImageFromEncoded(data);
  if (!image) {
    throw new Error(`画像をデコードできなかった: ${uri}`);
  }
  return generateStampFromImage(image, options);
}

/**
 * 写真の uri からスタンプの PNG バイト列を生成する。
 *
 * `process_stamp_image()` の戻り値（`encode_png()` した bytes）に相当し、
 * #101 系の画面差し替えと #100 の保存が呼ぶのはこの関数になる。
 * ファイルへ書くのは呼び出し側（`expo-file-system`）の仕事なので、ここでは bytes まで。
 */
export async function generateStampPngFromUri(
  uri: string,
  options: StampRenderOptions,
): Promise<Uint8Array> {
  const stamp = await generateStampFromUri(uri, options);
  const png = stamp.encodeToBytes(ImageFormat.PNG);
  if (!png) {
    throw new Error("PNG への符号化に失敗した");
  }
  return png;
}
