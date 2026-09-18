# スタンプ生成パイプライン

写真からスタンプ画像を作る処理（`frontend/src/utils/stamp/`）の構成と方針。

## 工程順

**線画化 → 着色 → フレーム → 掠れ → 傾き**

掠れをフレームより後に掛けるので、枠線にも掠れが乗る。

### 線画は保存して使い回す

線画は元写真だけで決まり、色・フレーム・掠れ・傾きのどれを変えても変わらない。
押印時に PNG で保存しておき（`src/infra/db/stamps.ts` の `line_art_path`）、デザイン変更は
線画化を飛ばして `renderStampFromLineArt()` から始める。

元写真も別に残す（`original_photo_path`）。2 値の線画からは戻せないので、線画の作り方を
変えたときに引き直せなくなる。

## ファイル構成

```txt
src/utils/stamp/
  types.ts          # StampColor / StampFrame
  constants/        # サイズ・インク色・フレーム寸法
  runtimeEffect.ts  # SkSL のコンパイルとキャッシュ
  lineArt.ts        # 工程1: 線画化
  ink.ts            # 工程2: インク着色
  applyCircularFrame.ts  # 工程3: 円マスクで切り抜き、フレームを重ねる
  framePaint.ts     # 工程3: 枠線の Paint（意匠に依らない共通部分）
  frames/           # 工程3: 枠の意匠ごとに 1 ファイル
  scratch.ts        # 工程4: 掠れ
  rotate.ts         # 工程5: 傾き
  seed.ts           # 掠れのシード（Skia に触れない純粋な関数）
  pipeline.ts       # 工程の順序を決める層
  io.ts             # uri のデコードと PNG への符号化
```

## ルール

- **工程ファイルは順序を知らない。**どの工程の次に自分が来るかも、自分が何番目かも書かない（工程番号を振るのはこのドキュメントだけ）。コード上で順序を持つのは `pipeline.ts` だけで、工程順を見直すときに触るのはそこ 1 箇所になる
- **`pipeline.ts` 以下はファイルシステムに触らない。**PNG のバイト列を返すところまでが `io.ts` の責務で、`expo-file-system` で書き出すのは呼び出し側（`src/infra/db/stamps.ts`）の仕事
- **SkSL 文字列は工程ファイルに同居させる。**`uniform` の宣言と、それを埋める JS 側の平坦な配列は並び順で対応しており、離すと片方だけ直したときに気付けない。共通化したのはコンパイルとキャッシュ（`runtimeEffect.ts`）だけ
- **中間結果は GPU テクスチャのまま渡す。**CPU コピー（`src/utils/skia/surface.ts` の `toRasterImage()`）を通すのは、`src/utils/stamp/` の外へ `SkImage` を返す直前だけ。理由はその関数のコメントを参照。着色 → フレーム → 掠れ → 傾きの受け渡しはテクスチャのまま通る
  - 例外は `generateLineArtFromImage()`。工程の途中でありながら外へも返す（押印時に PNG へ符号化して保存する／`StampPreview` が線画を保持して色・フレームだけ差し替える）ため、ここだけラスタに落としてから返す。フルパイプラインではその分の CPU コピーが 1 回余分に入る

### モジュールのトップレベルで `Skia.*` を呼ばない

Skia のネイティブモジュールが無い環境（Jest のモック）では、**import しただけで落ちる**。
`Skia.Color()` や `Skia.XYWHRect()` を定数にせず、呼ばれた時点で作ること。`constants/` に素の数値しか置いていないのもこの理由による。

### 掠れの強さは「白抜き率」で決める

`scratchLevel` は**白く抜く画素の割合そのもの**として扱い、閾値はそこから逆算する（`scratch.ts` の `scratchThreshold()`）。上限は `SCRATCH_MAX_WHITEOUT`。

閾値を `1.0 - scratchLevel * 0.4` のように線形に動かす書き方は採らない。これは閾値を σ 単位で動かすということで、ぼかし後のノイズがほぼ正規分布である以上、白く抜ける画素の割合は指数的にしか増えない。実際、旧実装の白抜き率は level 0.6 で 0.11%、0.8 で 1.8%、1.0 でようやく 12.6% という曲線で、**0.8 を超えるまで目視できる変化が無かった**。

同じ理由で、ぼかしたノイズを**実測の min / max で正規化しない**。min / max は 26 万画素の外れ値そのものなので、同じ `scratchLevel` でもシードが変わるたびに白抜き率が動く（numpy で同じカーネルを組んだ実測では level 1.0 が 1.45% 〜 39.77% まで振れた）。分布の定数だけで閾値を決めればこの振れが無く、`readPixels` での min / max 走査も要らない。

`SCRATCH_MAX_WHITEOUT` の値は**実機で押して決める**（未確定。Issue #155 の「決めること」）。

### 掠れの強さは押し方で決まる

`scratchLevel` を決めるのは押印画面で、押し方によって経路が分かれる。

| 押し方                 | `scratchLevel`                                                    |
| ---------------------- | ----------------------------------------------------------------- |
| 端末を振り下ろす       | 押し付けのピーク(z の最小値)から写す（`stampPress/pressGesture.ts`） |
| 長押し（画面押し込み） | 0（`camera/components/StampPressMain/`）                            |

**掠れを掛けたくない押し方は長押しが担う。**そのため振り下ろし側の写像（`SCRATCH_LEVEL_RANGE`）は、掠れ 0 に届くことよりも、**実際に振り下ろして出る範囲を掠れの強弱へ広げること**を優先して決める。

### 掠れのシードはスタンプ id から導く

シードは列として保存せず、`seed.ts` の `seedFromStampId()` が id から導出する。id は不変なので、色やフレームを変えて再生成しても掠れ模様が変わらない。
そのため **id は PNG を描く前に払い出す**（`src/infra/db/stamps.ts` の `newStampId()`）。

## 出力の確認

`src/features/camera/components/StampPreview/` は生成結果を実機で目視するための Storybook 専用コンポーネント。プロダクトの画面には組み込まないので、文言は i18n のキーを足さず直書きする。
