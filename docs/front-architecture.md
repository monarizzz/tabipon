# フロントエンド設計ルール

`frontend/` 配下（React Native / Expo / TypeScript）の構成とコンポーネント設計ルール。

## なぜこのルールがあるか

似た責務のコンポーネント（Button、Cardなど）が画面ごとに別名で重複生成されると、後からデザインや挙動を一括で直したいときに全箇所を探して直す必要が出る。1つの責務は1つのコンポーネントに集約し、見た目の差分は props で吸収する。

---

## frontend/ のディレクトリ構成

```
frontend/
  app/                    # expo-router のルーティング。ファイル = 画面
  src/
    commons/              # 複数箇所で共通して使うもの
    features/             # 特定の領域でのみ使うもの
    infra/                # データアクセス層
    libs/                 # ライブラリ類
    style/                # スタイルに関するもの
    utils/                # 画面にも領域にも依存しない関数類
  .rnstorybook/           # Storybook の設定。story ファイル自体はここに置かない
  assets/                 # 画像・音声
  android/ , ios/         # prebuild で生成されるネイティブプロジェクト
```

### `app/` と `src/` の役割分担

- `app/` — ルーティングの役割
- `src/` — 画面から呼ばれるコンポーネント・フック・関数類。`src/` から `app/` はimportされない

### `app/` が持ってよいもの

**画面が持ってよいのは、状態の保持とコンポーネントの配置まで。**
それ以外は `src/` の関数・フック・コンポーネントに出し、画面はそれを呼ぶだけにする。

判断に迷ったら、**テストしたいものは `app/` に置かない。**
`jest.config.js` の `testMatch` が拾うのは `frontend/src/` 配下だけなので、
`app/` に書いた時点で Jest からも Storybook からも触れなくなる。

例外は 2 つ。

- **画面固有の演出は `app/` に残してよい。**押し込みアニメーションのように、
  その画面のレイアウトと一体で、他から呼ばれないもの。切り出しても呼び出し側が 1 つのまま
- **ルートパラメータの読み出しと復元は `app/` の仕事。**`useLocalSearchParams()` は
  ルーティングの一部であり、`src/` に持ち込むと画面の遷移構造が `src/` に漏れる

切り出す側では、**ネイティブに触る層と触らない層を分ける。**
センサーやアニメーションを購読するフックと、そのフックが使う判定ロジックを別ファイルにすると、
判定ロジックだけは素の Jest で回せる（例: `src/utils/stampPress/`）。


## src/commons/ と src/features/ のディレクトリ構成

```txt
src/
  commons/                # 複数箇所で共通して使うもの
    button/  sheet/  layout/  stamp/  other/
  features/               # 特定の領域でのみ使うもの
    album/  camera/  mypage/
```

**グループ（`commons/` の下）と領域（`features/` の下）が第 1 階層で、その中を種類ごとに分ける。**

例）

```txt
src/commons/layout/
  components/             # UIコンポーネント
  constants/              # 定数
  hooks/                  # フック
```

種類のフォルダ（`components/` / `constants/` / `hooks/` / `types/`）は**必要になった時点で作る。**
先に空で用意しない。

`components/` の下は原則コンポーネント名のフォルダを直に並べるが、画面単位のまとまりが
はっきりしている場合は入れ子にしてよい（例: `features/album/components/detail/`）。

### コンポーネントとStorybookファイルの配置

- コンポーネントごとに `コンポーネント名/` フォルダを作る。フォルダ名はコンポーネント名と同じPascalCaseにする。
- 本体ファイルと `*.stories.tsx` を同じフォルダに同居させる
- Storybook 側は `.rnstorybook/main.ts` の `stories` に `../src/commons/**` と `../src/features/**` の 2 つを指定し、この配置を自動検出する

---

## src/utils/stamp/ のディレクトリ構成

写真からスタンプ画像を作る処理
撮影フローから呼ぶヘルパー（位置情報・元写真の保存・押印音）もスタンプという同じ関心事なのでここに置く。

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
  location.ts       # 撮影地の取得・逆ジオコーディング
  originalPhotoStore.ts  # 加工前の写真の保存
  stampSound.ts     # 押印音の再生
```

ルールは 3 つ。

- **工程ファイルは順序を知らない。**どの工程の次に自分が来るかを書かない。順序を持つのは `pipeline.ts` だけで、工程順の見直し（#138）で触るのはそこ 1 箇所になる
- **`pipeline.ts` 以下はファイルシステムに触らない。**PNG のバイト列を返すところまでが`io.ts` の責務で、`expo-file-system` で書き出すのは呼び出し側（永続化）の仕事
- **SkSL 文字列は工程ファイルに同居させる。**`uniform` の宣言と、それを埋める JS 側の平坦な配列は並び順で対応しており、離すと片方だけ直したときに気付けない。共通化したのはコンパイルとキャッシュ（`runtimeEffect.ts`）だけ

### モジュールのトップレベルで `Skia.*` を呼ばない

Skia のネイティブモジュールが無い環境（Jest のモック）では、**import しただけで落ちる**。
`Skia.Color()` や `Skia.XYWHRect()` を定数にせず、呼ばれた時点で作ること。`constants/` に素の数値しか置いていないのもこの理由による。

### テストの置き場

`cd frontend && npm test`（`jest.config.js` の `testMatch`）が拾うのは
`frontend/src/**/*.test.ts(x)`。現在は次の 2 種類が入っている。

- **ストーリーのスモークテスト**: `src/stories.test.tsx` の 1 本（下記）
- **ユーティリティの単体テスト**: 対象ファイルと同じフォルダに `<対象>.test.ts`

### ストーリーのテスト

`cd frontend && npm test` で、`src/commons/` と `src/features/` の `*.stories.tsx` を Storybook のportable stories（`composeStories`）として Jest から描画する。CI（`.github/workflows/ci.yml` の`Storybook stories` ジョブ）でも同じコマンドを実行する。

- 検証するのは「例外を投げずに描画できること」だけ。見た目の崩れは検出できない（見た目は実機の Storybook で確認する）
- ストーリーに `play` があれば併せて実行される。ただし React Native + Jest では`play` に `canvasElement` / `canvas` / `userEvent` が渡らない（`document` が無いため）。web の作法どおり `({ canvas, userEvent })` を分割代入する `play` は動かないので、操作は `@testing-library/react-native` の `screen` / `fireEvent` で書くこと
- グローバルな Provider は `.rnstorybook/preview.tsx` の `decorators` に置く。テスト側は`jest.setup.storybook.ts` の `setProjectAnnotations` で同じ設定を読み込むため、Storybook と条件が揃う
- ネイティブモジュールに触れる依存（AsyncStorage・WebView・BottomSheet など）は `jest.setup.ts` でモックしている。そのため、それらの内部描画はテストの対象外


## 文言

画面に出す文言はコンポーネント内に直書きせず、`src/libs/i18n/constants/` のキーを `useTranslation()`（`@/src/libs/i18n/I18nProvider`）経由で参照する。ja / en / ko / zh の4言語すべてにキーを追加する。

## スタイルトークン

色・spacing・角丸・フォントサイズは `src/style/tokens.ts`（`colors` / `typography` / `spacing` / `radii`）を参照し、コンポーネント内に直接値を書かない
