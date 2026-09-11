# スタンプ出力サンプル（現行 backend / 比較用）

Epic [#98](https://github.com/monarizzz/tabipon/issues/98) でスタンプ画像生成を react-native-skia に
移植するにあたり、「移植後の見た目が現行 `backend/` の出力と比べて許容範囲か」を判断するための基準として、
現行 `backend/app/services/stamp_processor.py` の `process_stamp_image()` の出力をここに固定している。

`backend/` は [#103](https://github.com/monarizzz/tabipon/issues/103) で削除予定のため、動くうちに
出力を書き出したのがこのディレクトリ（Refs [#120](https://github.com/monarizzz/tabipon/issues/120)）。

## 入力画像と出典

いずれも Wikimedia Commons の **CC0 1.0（パブリックドメイン相当）** の写真。CC0 は帰属表示を要求しないが、
再配布の根拠を追えるよう出典を記録として残す。

| ファイル | 被写体 | 著作者 | 出典 | ライセンス |
| --- | --- | --- | --- | --- |
| `input/byodoin-uji-kyoto.jpg` | 平等院（京都府宇治市） | GiveMeMollusks | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:By%C5%8Ddo-in_Temple_in_Uji,_Kyoto,_Japan.jpg) | CC0 1.0 |
| `input/hida-mountains.jpg` | 飛騨山脈の雪山（ハイキー・低コントラスト） | Wall Boat | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Hida_Mountains,_Japan.jpg) | CC0 1.0 |

各画像のメタデータ（著作者・出典URL・ライセンス）は `manifest.json` の `sources.<key>.input` にも
構造化して記録している。

### なぜ2枚あるか

`adaptiveThreshold` はローカルの明暗差で閾値が決まるため、被写体によって挙動が大きく変わる。

- **平等院（主サンプル）**: 建築のエッジ・中間調・水面の反射を含み、エッジが多い被写体での線画化・
  色・フレームの比較基準として使う
- **飛騨山脈の雪山（副サンプル）**: ほぼ白でコントラストが低く、局所2値化が破綻しやすい入力の代表例。
  #121 で SkSL 再現度を判定する際、こうした「破綻しやすい入力」で現行実装と差が出るかどうかが重要になる

## 生成方法

```bash
# リポジトリルートから。主サンプル（平等院、4色×4フレーム + 掠れ・回転の参考パターン）
backend/.venv/bin/python backend/scripts/generate_stamp_samples.py \
    --input docs/stamp-samples/input/byodoin-uji-kyoto.jpg \
    --source-key byodoin \
    --author "GiveMeMollusks" \
    --source-url "https://commons.wikimedia.org/wiki/File:By%C5%8Ddo-in_Temple_in_Uji,_Kyoto,_Japan.jpg" \
    --license "CC0 1.0" \
    --with-variants

# 副サンプル（雪山、4フレーム×黒のみ・variants無し）
backend/.venv/bin/python backend/scripts/generate_stamp_samples.py \
    --input docs/stamp-samples/input/hida-mountains.jpg \
    --source-key hida-mountains \
    --author "Wall Boat" \
    --source-url "https://commons.wikimedia.org/wiki/File:Hida_Mountains,_Japan.jpg" \
    --license "CC0 1.0" \
    --colors black \
    --output-subdir hida-mountains
```

スクリプト本体は `backend/scripts/generate_stamp_samples.py`。`backend/` の削除と運命を共にするので、
このディレクトリの中身（PNG・manifest.json・本 README）だけは `backend/` 削除後も残す。

各呼び出しの結果は `manifest.json` の `sources` にソースキーごとにマージされる（既存の他ソースの
エントリは上書きされない）。`--colors` / `--frames` で生成する色・フレームの組み合わせを絞り込める。

### 他の写真で再生成したい場合

```bash
backend/.venv/bin/python backend/scripts/generate_stamp_samples.py \
    --input /path/to/photo.jpg \
    --source-key <任意のキー> \
    --author "<著作者>" --source-url "<出典URL>" --license "<ライセンス>"
```

`--input` を省略すると、合成テスト画像（チェッカーボード・グラデーション・図形・ノイズ）を生成して使う
フォールバックが動く。実写真が全く用意できない状況向けの保険として実装を残しているだけで、現在コミット
されている主要サンプルはすべて実写真から生成したもの。

## ディレクトリ構成

```
docs/stamp-samples/
├── README.md              # このファイル
├── manifest.json           # 生成日時・各ソースの入力メタデータ・各PNGのパラメータ
├── input/
│   ├── byodoin-uji-kyoto.jpg      # 主サンプルの入力（実写真・CC0）
│   └── hida-mountains.jpg         # 副サンプルの入力（実写真・CC0）
└── output/
    ├── base/               # 平等院: 4色 × 4フレーム = 16通り（掠れ・回転なし。比較の基準）
    │   └── {color}_{frame}.png
    ├── variants/            # 平等院: 掠れ・回転の有無を見るための参考パターン4通り
    │   ├── scratch_light.png       # scratch_level=0.2
    │   ├── scratch_heavy.png       # scratch_level=0.6
    │   ├── tilt_15deg.png          # tilt_angle=15度
    │   └── scratch_and_tilt.png    # scratch_level=0.4, tilt_angle=20度
    └── hida-mountains/      # 雪山（副サンプル）: 黒 × 4フレームのみ（全16通りは不要のため省略）
        └── black_{frame}.png
```

## 雪山サンプルで分かったこと

**懸念していた「真っ白または真っ黒に潰れる」という破綻は起きなかった。** ただし、平等院のような
エッジの多い被写体ときれいに比較できる状態でもない。

- 空・雪面などコントラストがほぼ無い領域は、まとまった線にならず、**黒い斑点状のノイズ**として
  adaptiveThreshold が拾ってしまっている（`output/hida-mountains/black_simple.png` などを参照）
- 山の稜線・登山者のシルエットなど実際にエッジがある部分は、平等院と同様にそれなりの精度で線として
  抽出できている
- つまり「全体が破綻する」のではなく、**低コントラスト領域が斑点ノイズに変換される**という形で
  現行実装の弱点が現れている。この斑点ノイズを SkSL 実装でどこまで再現する（あるいはしない）べきかは
  #121 の判断材料になる

## 掠れ (`scratch_level`) について

掠れはガウスノイズを乱数生成してから閾値処理する実装のため、同じ `scratch_level` でも実行のたびに
結果が変わる（**完全一致の比較はできない**）。`output/variants/` の掠れサンプルは「見た目の雰囲気が
合っているか」を確認するための参考であり、ピクセル単位の比較対象ではない。

線画化とフレームの比較が本サンプルの主目的であり、`output/base/`（平等院・掠れ回転なし16通り）を
基準にすること。

## ファイルサイズ

`output/base/` 16枚 + `output/variants/` 4枚 + `output/hida-mountains/` 4枚 + 入力写真2枚 +
manifest.json の合計で約2.0MB。入力画像はオリジナルの解像度のまま使っているが、
`process_stamp_image` が内部で512x512にリサイズするため出力PNG自体は小さく、PNG圧縮レベルも
最大にして抑えている。副サンプルは全16通りではなく黒×4フレームのみに絞ることでサイズを抑えた。
