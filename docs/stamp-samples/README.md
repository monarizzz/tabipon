# スタンプ出力サンプル（現行 backend / 比較用）

Epic [#98](https://github.com/monarizzz/tabipon/issues/98) でスタンプ画像生成を react-native-skia に
移植するにあたり、「移植後の見た目が現行 `backend/` の出力と比べて許容範囲か」を判断するための基準として、
現行 `backend/app/services/stamp_processor.py` の `process_stamp_image()` の出力をここに固定している。

`backend/` は [#103](https://github.com/monarizzz/tabipon/issues/103) で削除予定のため、動くうちに
出力を書き出したのがこのディレクトリ（Refs [#120](https://github.com/monarizzz/tabipon/issues/120)）。

## 生成方法

```bash
# リポジトリルートから
backend/.venv/bin/python backend/scripts/generate_stamp_samples.py
```

スクリプト本体は `backend/scripts/generate_stamp_samples.py`。`backend/` の削除と運命を共にするので、
このディレクトリの中身（PNG・manifest.json・本 README）だけは `backend/` 削除後も残す。

### 実写真での再生成（推奨）

**このディレクトリに入っている入力画像・出力は、実写真ではなく合成テスト画像を使って生成したもの。**
理由と限界は下の節を参照。実写真が用意できたら、次のように `--input` で差し替えて再生成できる。

```bash
backend/.venv/bin/python backend/scripts/generate_stamp_samples.py --input /path/to/photo.jpg
```

出力先を変えたい場合は `--output-dir` で指定できる（デフォルトは `docs/stamp-samples/`）。
実行するたびに `output/` と `manifest.json` は上書きされる。`--input` を省略すると、内蔵の合成テスト画像
生成ロジックで再度作り直される（乱数シード固定のため結果は毎回同じ）。

## ディレクトリ構成

```
docs/stamp-samples/
├── README.md              # このファイル
├── manifest.json           # 生成日時・入力・各PNGのパラメータ一覧
├── input/
│   └── synthetic_test_image.png   # 生成に使った入力画像（合成）
└── output/
    ├── base/               # 4色 × 4フレーム = 16通り（掠れ・回転なし）
    │   └── {color}_{frame}.png
    └── variants/           # 掠れ・回転の有無を見るための参考パターン
        ├── scratch_light.png       # scratch_level=0.2
        ├── scratch_heavy.png       # scratch_level=0.6
        ├── tilt_15deg.png          # tilt_angle=15度
        └── scratch_and_tilt.png    # scratch_level=0.4, tilt_angle=20度
```

各ファイルのパラメータは `manifest.json` に構造化して記録している（色・フレーム・掠れ・回転角・入力画像の説明）。

## 置き場所をここにした理由

- `backend/` は #103 で削除される。生成物を `backend/` 配下に置くと、削除と同時に比較材料も消えてしまう
- `docs/` は「backend 削除後も参照する資料」の置き場として既に機能している
  （`docs/README.md` 参照）。このサンプルも同じ性質を持つ
- 生成スクリプト自体は `backend/app/services/stamp_processor.py` と `backend/.venv` に依存するため、
  スクリプト本体は `backend/scripts/` に置く。削除される `backend/` と運命を共にしてよい
  （#103 で `backend/` を消す前に、このディレクトリの生成物が揃っていることを確認すればよい）

## 合成テスト画像を使っていることの限界（重要）

**このサンプルの入力はリポジトリに実写真が無いため、スクリプトが自動生成した合成テスト画像
（チェッカーボード・グラデーション・塗りの図形・ドット群・ガウスノイズを組み合わせたもの）。**

- adaptiveThreshold / Canny は実写真の自然な階調・ノイズ分布・被写体の輪郭に対して調整されたものではないため、
  合成画像での見え方が実写真での見え方を正確に代表するとは限らない
- 特に「風景写真のような滑らかな階調やボケ」「人物・建物の輪郭」に対する線画化の挙動は、このサンプルからは
  判断できない
- **実写真が用意できた時点で、上記の `--input` オプションを使って必ず再生成することが望ましい。**
  #121（線画化の SkSL 再現・判定ゲート）や #122（色・フレームの Skia 実装）で実機比較する際は、
  可能な限り実写真での再生成版を基準にすること

## 掠れ (`scratch_level`) について

掠れはガウスノイズを乱数生成してから閾値処理する実装のため、同じ `scratch_level` でも実行のたびに
結果が変わる（**完全一致の比較はできない**）。`output/variants/` の掠れサンプルは「見た目の雰囲気が
合っているか」を確認するための参考であり、ピクセル単位の比較対象ではない。

線画化とフレームの比較が本サンプルの主目的であり、`output/base/` の16通り（掠れ・回転なし）を基準にすること。

## ファイルサイズ

`output/base/` 16枚 + `output/variants/` 4枚 + 入力画像1枚 + manifest.json の合計で約 1.8MB。
入力画像を 512x512（`process_stamp_image` が最終的にリサイズするサイズに合わせた）にし、
PNG 圧縮レベルを最大にして抑えている。
