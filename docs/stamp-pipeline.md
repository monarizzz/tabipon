# スタンプ生成パイプライン

写真からスタンプ画像を作る処理（`frontend/src/utils/stamp/`）の構成と方針。

## 工程順

**線画化 → 着色 → フレーム → 掠れ → 傾き**

掠れをフレームより後に掛けるので、枠線にも掠れが乗る。

## ファイル構成

```txt
src/utils/stamp/
  types.ts          # StampColor / StampFrame
  constants/        # サイズ・インク色・フレーム寸法
  surface.ts        # オフスクリーン描画と CPU コピー
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
- **中間結果は GPU テクスチャのまま渡す。**CPU コピー（`surface.ts` の `toRasterImage()`）を通すのは、`src/utils/stamp/` の外へ `SkImage` を返す直前だけ。理由はその関数のコメントを参照。着色 → フレーム → 掠れ → 傾きの受け渡しはテクスチャのまま通る
  - 例外は `generateLineArtFromImage()`。工程の途中でありながら外へも返す（`StampPreview` が線画を保持して色・フレームだけ差し替える）ため、ここだけラスタに落としてから返す。フルパイプラインではその分の CPU コピーが 1 回余分に入る

### モジュールのトップレベルで `Skia.*` を呼ばない

Skia のネイティブモジュールが無い環境（Jest のモック）では、**import しただけで落ちる**。
`Skia.Color()` や `Skia.XYWHRect()` を定数にせず、呼ばれた時点で作ること。`constants/` に素の数値しか置いていないのもこの理由による。

### 掠れのシードはスタンプ id から導く

シードは列として保存せず、`seed.ts` の `seedFromStampId()` が id から導出する。id は不変なので、色やフレームを変えて再生成しても掠れ模様が変わらない。
そのため **id は PNG を描く前に払い出す**（`src/infra/db/stamps.ts` の `newStampId()`）。

## 出力の確認

`src/features/camera/components/StampPreview/` は生成結果を実機で目視するための Storybook 専用コンポーネント。プロダクトの画面には組み込まないので、文言は i18n のキーを足さず直書きする。
