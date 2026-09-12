/**
 * 写真から白黒2値の線画を Skia (SkSL) で生成する。
 *
 * Refs: #121 / #98
 *
 * 現行 `backend/app/services/stamp_processor.py` の `create_stamp_image()` のうち、
 * **線画化までの工程1〜4だけ**を移植したもの。色の置換・円フレーム・円マスク・掠れ・回転は
 * #122 / #123 の範囲なのでここではやらない。
 *
 * 移植元（OpenCV）:
 *
 * ```python
 * sq   = crop_center_square(img)
 * rz   = cv2.resize(sq, (512, 512), interpolation=cv2.INTER_AREA)
 * gray = cv2.cvtColor(rz, cv2.COLOR_BGR2GRAY)
 * blur = cv2.GaussianBlur(gray, (5, 5), 0)
 * th   = cv2.adaptiveThreshold(blur, 255, ADAPTIVE_THRESH_GAUSSIAN_C, THRESH_BINARY, 31, 7)
 * edges = cv2.Canny(blur, 60, 160)
 * line_art = cv2.bitwise_and(th, cv2.bitwise_not(edges))
 * ```
 *
 * ## OpenCV → Skia の数値換算（ここを外すと再現できない）
 *
 * OpenCV はカーネルサイズ (ksize) 指定、Skia のブラーは σ 指定なので変換が要る。
 * `sigma <= 0` を渡したときに OpenCV が使う式は `getGaussianKernel()` の
 *
 *     sigma = 0.3 * ((ksize - 1) * 0.5 - 1) + 0.8
 *
 * - `GaussianBlur(5, 5)`   → sigma = 0.3 * (2 - 1) + 0.8  = 1.1
 * - `adaptiveThreshold(blockSize = 31)` は内部で ksize = 31 の GaussianBlur を掛けるので
 *   → sigma = 0.3 * (15 - 1) + 0.8 = 5.0
 *
 * ただし**この公称 σ をそのまま Skia に渡すとぼけ過ぎる**。OpenCV のカーネルは ksize で
 * 打ち切られており、ksize = 5 は ±2 画素 = 1.8σ しか無いので裾が大きく削れる。
 * 実際に `cv2.getGaussianKernel()` の 2 次モーメントから実効 σ を測ると
 *
 * | OpenCV の指定 | 公称 σ | 打ち切り後の実効 σ |
 * | --- | --- | --- |
 * | `GaussianBlur(5, 5)` | 1.1 | **1.00** |
 * | `blockSize = 31` | 5.0 | **4.95** |
 *
 * Skia の `MakeBlur` は裾をほぼ落とさないため、**実効 σ の方を渡す**のが「同じ量だけ
 * ぼかす」ことになる。ksize = 31 は ±15 = 3σ まで取れているので公称とほぼ変わらないが、
 * ksize = 5 は 1.1 → 1.0 と 1 割違う。ここが最初にずれた箇所だった。
 *
 * ## 2種類のブラーが要る理由
 *
 * `adaptiveThreshold` のローカル平均は「blockSize = 31 のガウス窓での平均」であって、
 * 前処理の 5x5 ブラーとは別物。しかも OpenCV は**既に 5x5 でぼかした画像**に対して
 * adaptiveThreshold を掛けているので、σ = 4.95 のブラーは σ = 1.0 のブラー結果に
 * 重ねて掛ける（元画像から見ると sqrt(1.0^2 + 4.95^2) ≒ 5.05 相当）。
 * したがってパスは「グレースケール → σ1.0 → σ4.95」の直列で、これは OpenCV と同じ順序。
 *
 * ## Canny の近似（完全移植はしていない）
 *
 * Canny のヒステリシス（弱いエッジを強いエッジから連結的に追跡する）は、
 * 隣接画素の確定結果を参照する反復処理なので単一パスのシェーダでは書けない。
 * ここでは次まで実装し、追跡は 1 段で打ち切っている。
 *
 * 1. 3x3 Sobel の勾配（OpenCV の Canny は既定 `L2gradient=False` なので L1 ノルム）
 * 2. 勾配方向を 4 方位に量子化した非最大抑制（NMS）
 * 3. `mag >= high` は採用、`low <= mag < high` は 8 近傍に強エッジがあれば採用
 *
 * 3 の「8 近傍に強エッジ」は OpenCV の推移的な追跡の 1 段目だけに相当する。
 * 強エッジから 2 画素以上離れた弱エッジの鎖は落ちるため、Canny より線がやや短く切れる。
 *
 * 追跡段数は numpy で 0 / 1 / 2 / 4 / 無制限を試した上で 1 段にしている。
 * 段数を増やしてもエッジ単体の一致は上がるが、最終出力の黒画素 IoU は
 * 平等院で 81.6%（1段）→ 81.9%（無制限）とほぼ動かず、コストに見合わなかった。
 *
 * ## リサイズ（ここが Canny より効いた）
 *
 * OpenCV は `INTER_AREA`（面積平均）だが Skia に相当物が無い。素の linear で
 * 済ませると高周波成分がずれて **黒画素 IoU が 88% → 82% まで落ちる**。
 * `makeGrayscaleSquare()` で面積平均を近似している（詳細はその関数のコメント）。
 *
 * ## 戻り値は GPU テクスチャではなくラスタ画像にしてある
 *
 * 中間パスは GPU バックエンド（`Skia.Surface.MakeOffscreen`）で描くが、
 * **最終結果だけは `makeNonTextureImage()` で CPU メモリへコピーして返す**。
 * 理由は `generateLineArtFromImage()` のコメントを参照。
 */
import {
  AlphaType,
  ColorType,
  FilterMode,
  MipmapMode,
  Skia,
  TileMode,
  type SkCanvas,
  type SkImage,
  type SkRuntimeEffect,
} from "@shopify/react-native-skia";

import { renderToSquareImage } from "@/src/utils/skiaSurface";

/** 出力サイズ。backend の `STAMP_IMAGE_SIZE` と揃える */
export const LINE_ART_SIZE = 512;

/**
 * `cv2.GaussianBlur(gray, (5, 5), 0)` 相当の σ。
 * 公称は 1.1 だが、5 タップで打ち切られたカーネルの実効 σ は 1.0（冒頭の表を参照）。
 */
const PRE_BLUR_SIGMA = 1.0;

/**
 * `cv2.adaptiveThreshold(..., blockSize = 31)` のローカル平均に相当する σ。
 * 公称 5.0 / 実効 4.95。31 タップは ±3σ まで取れているのでほぼ差が無い。
 */
const LOCAL_MEAN_SIGMA = 4.95;

/** `adaptiveThreshold` の C。0..255 スケールの 7 を 0..1 に正規化する */
const ADAPTIVE_THRESHOLD_C = 7 / 255;

/** `cv2.Canny(blur, 60, 160)` の 2 閾値。Sobel の生の応答値（0..255 入力）と同じスケール */
const CANNY_LOW = 60;
const CANNY_HIGH = 160;

/**
 * BGR→GRAY の係数（ITU-R BT.601）。`cv2.COLOR_BGR2GRAY` と同じ重み。
 * Skia は RGBA 順なので R = 0.299 / G = 0.587 / B = 0.114 を各行に置き、
 * R = G = B = 輝度 になる 4x5 カラーマトリクスにする。
 */
// prettier-ignore
const BT601_LUMA_MATRIX = [
  0.299, 0.587, 0.114, 0, 0,
  0.299, 0.587, 0.114, 0, 0,
  0.299, 0.587, 0.114, 0, 0,
  0,     0,     0,     1, 0,
];

/**
 * 線画化シェーダ。
 *
 * `blurred` は「グレースケール + σ1.0 ブラー」、`localMean` は「それをさらに σ4.95 で
 * ぼかしたもの」。どちらも 512x512 の画像シェーダなので、`main` に来る座標はピクセル単位。
 * そのため隣接画素は `± 1.0` のオフセットで取れる（`texel` は正規化 UV ではない）。
 */
const LINE_ART_SKSL = `
uniform shader blurred;    // gray -> GaussianBlur(5,5) 相当
uniform shader localMean;  // それを blockSize=31 相当のガウス窓で平均したもの
uniform float2 texel;      // 隣接画素までのオフセット（画像シェーダなので (1, 1)）
uniform float  delta;      // adaptiveThreshold の C（0..1 正規化済み）
uniform float  cannyLow;
uniform float  cannyHigh;

// Sobel の閾値は 0..255 スケールなので、輝度もそこに合わせて取り出す
float lumaAt(float2 p) {
  return blurred.eval(p).r * 255.0;
}

// 3x3 Sobel。OpenCV の Canny が内部で使うものと同じカーネル
float2 gradientAt(float2 p) {
  float tl = lumaAt(p + float2(-texel.x, -texel.y));
  float tm = lumaAt(p + float2(       0, -texel.y));
  float tr = lumaAt(p + float2( texel.x, -texel.y));
  float ml = lumaAt(p + float2(-texel.x,        0));
  float mr = lumaAt(p + float2( texel.x,        0));
  float bl = lumaAt(p + float2(-texel.x,  texel.y));
  float bm = lumaAt(p + float2(       0,  texel.y));
  float br = lumaAt(p + float2( texel.x,  texel.y));
  float gx = -tl + tr - 2.0 * ml + 2.0 * mr - bl + br;
  float gy = -tl - 2.0 * tm - tr + bl + 2.0 * bm + br;
  return float2(gx, gy);
}

// L1 ノルム。cv2.Canny は L2gradient=False が既定なので |gx| + |gy|
float magnitudeAt(float2 p) {
  float2 g = gradientAt(p);
  return abs(g.x) + abs(g.y);
}

// 非最大抑制。勾配方向を 4 方位（0 / 45 / 90 / 135 度）に量子化し、
// その方向の両隣より大きい画素だけを残す。tan(22.5) / tan(67.5) が境界。
float suppressedMagnitudeAt(float2 p) {
  float2 g = gradientAt(p);
  float m = abs(g.x) + abs(g.y);
  if (m < cannyLow) {
    return 0.0;
  }
  float ax = abs(g.x);
  float ay = abs(g.y);
  float2 dir;
  if (ay <= 0.41421356 * ax) {
    dir = float2(1.0, 0.0);
  } else if (ay >= 2.41421356 * ax) {
    dir = float2(0.0, 1.0);
  } else if (g.x * g.y > 0.0) {
    dir = float2(1.0, 1.0);
  } else {
    dir = float2(1.0, -1.0);
  }
  float2 offset = dir * texel;
  if (m < magnitudeAt(p + offset) || m < magnitudeAt(p - offset)) {
    return 0.0;
  }
  return m;
}

// ヒステリシスの近似。強エッジはそのまま、弱エッジは 8 近傍に強エッジがある場合だけ残す。
// OpenCV の追跡は推移的だが、シェーダでは 1 段しか辿れない（冒頭のコメント参照）。
float edgeAt(float2 p) {
  float m = suppressedMagnitudeAt(p);
  if (m >= cannyHigh) {
    return 1.0;
  }
  if (m < cannyLow) {
    return 0.0;
  }
  float strongest = 0.0;
  for (int j = -1; j <= 1; ++j) {
    for (int i = -1; i <= 1; ++i) {
      float2 q = p + float2(float(i), float(j)) * texel;
      strongest = max(strongest, suppressedMagnitudeAt(q));
    }
  }
  return strongest >= cannyHigh ? 1.0 : 0.0;
}

half4 main(float2 p) {
  float src  = blurred.eval(p).r;
  float mean = localMean.eval(p).r;
  // cv2.THRESH_BINARY: src > mean - C なら白、そうでなければ黒
  float threshold = src > mean - delta ? 1.0 : 0.0;
  // bitwise_and(th, bitwise_not(edges)) は「エッジ上を黒で塗り潰す」のと同じ
  float value = threshold * (1.0 - edgeAt(p));
  // SkSL は float -> half の暗黙の縮小変換を許さないので明示的に変換する
  half v = half(value);
  return half4(v, v, v, 1.0);
}
`;

let cachedEffect: SkRuntimeEffect | null | undefined;

/**
 * SkSL をコンパイルして使い回す。
 *
 * モジュールのトップレベルでコンパイルすると、Skia のネイティブモジュールが
 * 使えない環境（Jest のモック）で import しただけで落ちるため、遅延させている。
 */
function getLineArtEffect(): SkRuntimeEffect | null {
  if (cachedEffect === undefined) {
    cachedEffect = Skia.RuntimeEffect.Make(LINE_ART_SKSL) ?? null;
  }
  return cachedEffect;
}

/** 中央正方形の切り出し範囲。`crop_center_square()` と同じ計算 */
function centerSquareRect(width: number, height: number) {
  const side = Math.min(width, height);
  return Skia.XYWHRect(
    Math.floor((width - side) / 2),
    Math.floor((height - side) / 2),
    side,
    side,
  );
}

/** 512x512 のオフスクリーンサーフェスに描いてスナップショットを返す */
function renderToImage(draw: (canvas: SkCanvas) => void): SkImage {
  return renderToSquareImage(LINE_ART_SIZE, draw);
}

/**
 * 出力サイズの矩形。
 *
 * モジュールのトップレベルで `Skia.*` を呼ぶと、Skia のネイティブモジュールが
 * 無い環境（Jest のモック）では import しただけでテストが落ちる。
 * 定数にせず、呼ばれたときに作る。
 */
function fullRect() {
  return Skia.XYWHRect(0, 0, LINE_ART_SIZE, LINE_ART_SIZE);
}

/**
 * `INTER_AREA` の面積平均を近似するためのガウス σ（出力画素単位）。
 *
 * `INTER_AREA` は「出力1画素に対応する入力領域の平均」＝幅1（出力画素換算）の
 * 箱型フィルタ。幅1の箱型フィルタの分散は 1/12 なので、同じ広がりを持つガウスの
 * σ は 1/sqrt(12) ≒ 0.289 になる。Skia に面積平均のサンプリングは無いので、
 * **縮小の直前**にこの σ でぼかしてから linear で縮小する。
 *
 * 縮小したあとにぼかしても意味が無い（折り返しは既に起きている）ため、
 * 掛ける場所は必ず縮小前でなければならない。
 */
const AREA_APPROX_SIGMA = 1 / Math.sqrt(12);

/**
 * 中央正方形を切り出して 512x512 にリサイズし、グレースケール化した画像を作る。
 *
 * OpenCV 側は `INTER_AREA`（縮小時は面積平均）だが、Skia の `drawImageRectOptions` は
 * nearest / linear / mipmap しか持たない。素の linear で済ませると、
 * **Canny が拾う高周波成分がずれて線画の一致度がはっきり落ちる**（検証では
 * 平等院で黒画素 IoU が 88% → 82% まで悪化した）。そこで 2 段構えで近似する。
 *
 * 1. 残りの縮小率が 2 倍を切るまで 1/2 ずつ縮小する。ちょうど 1/2 の linear 縮小は
 *    2x2 の平均と一致するので、この範囲は `INTER_AREA` と実質同じ
 * 2. 端数（縮小率 1〜2 倍）は mipmap が効かないので、`AREA_APPROX_SIGMA` を
 *    入力側スケールに換算したガウスぼかしを縮小前に掛けて面積平均を近似する
 */
function makeGrayscaleSquare(image: SkImage): SkImage {
  let side = Math.min(image.width(), image.height());
  let source = image;
  let sourceRect = centerSquareRect(image.width(), image.height());

  // 1/2 縮小の繰り返し。抜けた時点で side < 1024 が保証されるので、
  // 以降の中間サーフェスのサイズも 1024 未満に収まる
  while (Math.floor(side / 2) >= LINE_ART_SIZE) {
    const next = Math.floor(side / 2);
    const from = sourceRect;
    const current = source;
    source = renderToSquareImage(next, (canvas) => {
      canvas.drawImageRectOptions(
        current,
        from,
        Skia.XYWHRect(0, 0, next, next),
        FilterMode.Linear,
        MipmapMode.None,
      );
    });
    sourceRect = Skia.XYWHRect(0, 0, next, next);
    side = next;
  }

  // 端数分の面積平均近似。拡大になる場合（元画像が 512 未満）は掛けない
  const scale = side / LINE_ART_SIZE;
  if (scale > 1) {
    const from = sourceRect;
    const current = source;
    const sigma = AREA_APPROX_SIGMA * scale;
    const blurPaint = Skia.Paint();
    blurPaint.setImageFilter(
      Skia.ImageFilter.MakeBlur(sigma, sigma, TileMode.Clamp),
    );
    source = renderToSquareImage(side, (canvas) => {
      canvas.drawImageRect(
        current,
        from,
        Skia.XYWHRect(0, 0, side, side),
        blurPaint,
      );
    });
    sourceRect = Skia.XYWHRect(0, 0, side, side);
  }

  const paint = Skia.Paint();
  paint.setColorFilter(Skia.ColorFilter.MakeMatrix(BT601_LUMA_MATRIX));
  const from = sourceRect;
  const current = source;
  return renderToImage((canvas) => {
    canvas.drawColor(Skia.Color("white"));
    canvas.drawImageRectOptions(
      current,
      from,
      fullRect(),
      FilterMode.Linear,
      MipmapMode.None,
      paint,
    );
  });
}

/**
 * ガウスぼかしを 1 枚の画像として焼き込む。
 *
 * SkSL で畳み込みを自前で書くより Skia の `ImageFilter.MakeBlur` の方が速い。
 * タイルモードは `Clamp`（端の色を複製）。OpenCV の `adaptiveThreshold` は
 * `BORDER_REPLICATE` なので、既定の `Decal`（外側を透明扱い）だと画像の縁が
 * 不当に暗くなり、額縁状の黒枠が出てしまう。
 */
function blurToImage(image: SkImage, sigma: number): SkImage {
  const paint = Skia.Paint();
  paint.setImageFilter(Skia.ImageFilter.MakeBlur(sigma, sigma, TileMode.Clamp));
  return renderToImage((canvas) => {
    canvas.drawColor(Skia.Color("white"));
    canvas.drawImage(image, 0, 0, paint);
  });
}

/**
 * すでに読み込み済みの `SkImage` から線画を生成する。
 *
 * 4 パス構成（いずれも 512x512 のオフスクリーン）:
 * 1. 中央正方形の切り出し + リサイズ + グレースケール
 * 2. σ = 1.0 のブラー（`GaussianBlur(5, 5)` 相当）
 * 3. σ = 4.95 のブラー（`blockSize = 31` のローカル平均相当）
 * 4. 2 と 3 を child shader に渡した SkSL で 2 値化 + エッジ合成
 *
 * 2 と 3 を画像として焼く必要があるのは、シェーダ側で Sobel のために
 * 隣接画素を読む（= テクスチャとして参照する）必要があるため。
 *
 * ## 返す前に `makeNonTextureImage()` を通す理由
 *
 * `Skia.Surface.MakeOffscreen` は型定義のコメントどおり **GPU バックエンドの
 * サーフェス**を作る（CPU バックエンドが要るときは `Skia.Surface.Make`）。
 * そのため `makeImageSnapshot()` が返す `SkImage` は、そのサーフェスを作った
 * スレッドの Skia コンテキストに属する GPU テクスチャになる。
 *
 * この関数は JS スレッドから呼ばれるが、`<Canvas>` の描画は UI スレッドの
 * Skia コンテキストで行われる。公式ドキュメント（Canvas overview）は
 * `makeImageSnapshotAsync` を「UI スレッドで実行されるので、テクスチャを含め
 * オンスクリーンの Canvas と同じ Skia コンテキストにアクセスできる」と説明し、
 * 同期版の `makeImageSnapshot` は「描画にテクスチャを含まない場合に使ってよい」
 * としている。つまり **コンテキストが違えばテクスチャは共有されない**。
 * 別コンテキストのテクスチャを描こうとしても例外は飛ばず、単に何も出ない。
 *
 * `makeNonTextureImage()` は「GPU テクスチャに backed された SkImage を
 * 必要なら CPU メモリへコピーする」API なので、これを通した結果はどの
 * コンテキスト・どのスレッドからでも描ける素のラスタ画像になる。
 * 読み戻し自体は生成したコンテキスト内で行われるので安全（`readPixels` が
 * 同じ経路で動いていることが実機で確認できている）。
 *
 * 中間パス（gray / blurred / localMean）は同一スレッド・同一コンテキスト内で
 * しか使わないため、変換せずテクスチャのまま渡してよい。
 */
export function generateLineArtFromImage(image: SkImage): SkImage {
  const effect = getLineArtEffect();
  if (!effect) {
    throw new Error("線画化シェーダ (SkSL) のコンパイルに失敗した");
  }

  const gray = makeGrayscaleSquare(image);
  const blurred = blurToImage(gray, PRE_BLUR_SIGMA);
  const localMean = blurToImage(blurred, LOCAL_MEAN_SIGMA);

  // Nearest / None にするのは、Sobel で ±1 画素を読むときに
  // 補間された値ではなく元のテクセルをそのまま取りたいため
  const toShader = (img: SkImage) =>
    img.makeShaderOptions(
      TileMode.Clamp,
      TileMode.Clamp,
      FilterMode.Nearest,
      MipmapMode.None,
    );

  const shader = effect.makeShaderWithChildren(
    [1, 1, ADAPTIVE_THRESHOLD_C, CANNY_LOW, CANNY_HIGH],
    [toShader(blurred), toShader(localMean)],
  );

  const paint = Skia.Paint();
  paint.setShader(shader);
  const rendered = renderToImage((canvas) => {
    canvas.drawRect(fullRect(), paint);
  });
  // GPU テクスチャのままでは呼び出し側の <Canvas> で描けない（上のコメント参照）
  return rendered.makeNonTextureImage();
}

/**
 * 写真の uri（`file://` / `http(s)://` / バンドルされたアセットの解決済み uri）から
 * 線画を生成する。
 */
export async function generateLineArtFromUri(uri: string): Promise<SkImage> {
  const data = await Skia.Data.fromURI(uri);
  const image = Skia.Image.MakeImageFromEncoded(data);
  if (!image) {
    throw new Error(`画像をデコードできなかった: ${uri}`);
  }
  return generateLineArtFromImage(image);
}

/**
 * 生成結果の黒画素率を返す（0..1）。
 *
 * 目視だけだと「なんとなく似ている」以上の判定ができないので、現行 backend 側と
 * 突き合わせられる数値を出す。backend 側の値は `docs/stamp-samples/manifest.json` の
 * `sources.<key>.line_art.black_pixel_ratio`（平等院 31.0% / 雪山 10.3%）。
 */
export function measureBlackPixelRatio(image: SkImage): number | null {
  const pixels = image.readPixels(0, 0, {
    width: image.width(),
    height: image.height(),
    colorType: ColorType.RGBA_8888,
    alphaType: AlphaType.Unpremul,
  });
  if (!pixels) {
    return null;
  }
  let black = 0;
  const total = image.width() * image.height();
  for (let i = 0; i < total; i += 1) {
    if (pixels[i * 4] < 128) {
      black += 1;
    }
  }
  return black / total;
}
