/**
 * 白黒2値の線画にインク色と円フレームを載せて、スタンプ画像を Skia で組み立てる。
 *
 * Refs: #122 / #98
 *
 * 現行 `backend/app/services/stamp_processor.py` のうち、
 * **インク色の置換と `apply_circular_stamp_frame()` だけ**を移植したもの。
 * 線画化までは #121 の `src/utils/skiaLineArt.ts` が担う。掠れ（`apply_scratch`）と
 * 傾き（`rotate_stamp`）は #123 の範囲なのでここではやらない。
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
 * 写真からスタンプ画像を生成する。線画化（#121）と着色・フレーム（#122）を繋いだもの。
 *
 * 掠れと傾きは #123 で足す。現時点の出力は
 * `scratch_level = 0` / `tilt_angle = 0` の `process_stamp_image()` に相当する。
 */
export function generateStampFromImage(
  image: SkImage,
  color: StampColor,
  frame: StampFrame,
): SkImage {
  return composeStampFromLineArt(generateLineArtFromImage(image), color, frame);
}
