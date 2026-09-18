# 共有カード

共有ボタンを押したときに作る 1 枚の画像（`frontend/src/utils/shareCard/`）の構成と方針。

## 手順

**カードの合成 → キャッシュへ書き出し → 画像と本文を共有シートへ**

順序を持つのは `src/commons/stamp/hooks/useStampShare.ts` だけで、スタンプ完成画面と
スタンプ詳細画面はどちらもこのフックを呼ぶ。

## ファイル構成

```txt
src/utils/shareCard/
  constants/        # 紙の寸法・罫線・文字サイズ
  types/            # カードに載せる中身
  text.ts           # 文字の描画（Paragraph）
  notebook.ts       # 台紙（紙と罫線）
  renderShareCard.ts  # スタンプを押し、罫線へ項目を書き込む
  io.ts             # スタンプ画像の読み込みと PNG への符号化
src/libs/shareCardFile/   # cacheDirectory への書き出し
```

## カードの体裁

スタンプ帳の 1 ページに見立てる。上にスタンプを押し、その下の罫線へ記入欄のように書き込む。

| 項目         | 値                                                       |
| ------------ | -------------------------------------------------------- |
| サイズ       | 1080 × 1920（9:16）                                      |
| 紙           | 白地に `#c3d6cf` の罫線 5 本                             |
| スタンプ     | 紙の上部に 820px。横中央                                 |
| 1 本目の罫線 | スポット名（ラベル無し・太字）                           |
| 以降の罫線   | 「日付」「場所」「メモ」。ラベルを行の左に小さく、値をその右に |
| 色・文字階層 | `design/DESIGN.md` のトークンを出力解像度に合わせて拡大   |

## ルール

- **アプリ名とハッシュタグはカードに描かない。**投稿に付ける文字列を持つのは共有シートの
  本文だけにする。同じ語がカードと本文の両方に出ると重複して見える
- **値の無い項目は行ごと詰める。**「未設定」の代わりの文言を置かない。値のある項目だけを
  上から順に罫線へ割り当て、余った罫線は空のまま残す（手書きのスタンプ帳と同じ見え方になる）
- **`src/utils/shareCard/` は文言を持たない。**項目名は `label` として受け取る
  （`docs/front-architecture.md`「文言」）
- **`renderShareCard.ts` 以下はファイルシステムに触らない。**PNG のバイト列を返すところまでが
  `io.ts` の責務で、書き出すのは `src/libs/shareCardFile/`
- **置き場は cacheDirectory。**共有シートへ渡すためだけの一時ファイルで、DB の行からは
  参照されない。documentDirectory へ置くと `deleteUnreferencedFiles()` が掃く対象と混ざる
- **文字は Paragraph で描く。**`SkFont` + `drawText()` は渡した typeface 1 つだけで描くため、
  日本語を含む文字列が豆腐になる。フォントは同梱せず端末のものを使うので、字形は iOS と
  Android で変わる

## `expo-sharing` ではなく React Native の Share を使う

`Sharing.shareAsync()` はファイルしか渡せず、共有シートの本文欄を埋められない。
`Share.share()` なら画像（`url`）と本文（`message`）を一緒に渡せるので、
ハッシュタグ入りの文章（`share.postText` / `share.postTextWithSpot`）が
投稿先のアプリに最初から入った状態になる。

**この渡し方が効くのは iOS。**Android の `Share.share()` は `url` を無視してテキストだけ
送るため画像が落ちる。たびぽんの対象は iOS なのでこの形にしている。

ハッシュタグは投稿先で拾われる文字列なので、どの言語でも `#たびぽん` のままにする。
