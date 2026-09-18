# フロントエンド設計ルール

`frontend/` 配下（React Native / Expo / TypeScript）の構成とコンポーネント設計ルール。

## なぜこのルールがあるか

似た責務のコンポーネント（Button、Cardなど）が画面ごとに別名で重複生成されると、後からデザインや挙動を一括で直したいときに全箇所を探して直す必要が出る。1つの責務は1つのコンポーネントに集約し、見た目の差分は props で吸収する。

---

## frontend/ のディレクトリ構成

```txt
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

**画面ファイルはルートパラメータを読んで Main に渡すだけにする。**
JSX も状態もハンドラも持たない。

```tsx
// app/album-stamp-detail.tsx
export default function StampDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  return <StampDetailMain {...useStampDetail(id)} />;
}
```

判断に迷ったら、**テストしたいものは `app/` に置かない。**
`jest.config.js` の `testMatch` が拾うのは `frontend/src/` 配下だけなので、
`app/` に書いた時点で Jest からも Storybook からも触れなくなる。

`useLocalSearchParams()` だけは `app/` の仕事。ルーティングの一部であり、
`src/` に持ち込むと画面の遷移構造が `src/` に漏れる。

### 画面を 3 つに分ける

| 置き場                                         | 持つもの                                       |
| ---------------------------------------------- | ---------------------------------------------- |
| `app/<画面>.tsx`                               | ルートパラメータの読み出しと Main の呼び出し   |
| `src/features/<領域>/hooks/use<画面名>.ts`     | 状態・DB・遷移。戻り値の型は `types/` に置く   |
| `src/features/<領域>/components/<画面名>Main/` | 描画。props で受け取り、自分では状態を持たない |

**Main は props だけで描けるようにする。**そうすれば `*.stories.tsx` が
モック無しで書け、読み込み中・失敗・空といった状態も並べられる。
フックが DB と router を直接叩くので、その境目が props になる。

例外は **画面固有の演出**。押し込みアニメーションのように、その画面のレイアウトと
一体で他から呼ばれないものは Main に置いてよい（例: `StampPressMain`）。

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

### 外枠は features、中身は commons

同じ入力 UI を複数の画面が持つ場合、**共通化するのは中身だけで、外枠は画面ごとに置いたままにする。**
外枠（ボトムシート / 全画面パネル）は開き方・閉じ方・付随する表示がそれぞれ違い、
1 つにまとめると分岐だけが増える。

例）デザイン変更（枠・色・適用ボタン）

```txt
commons/stamp/components/DesignChangeForm/   枠 / 色 / 適用ボタン
 ├ features/camera/…/DesignChangeSheet       ボトムシートで包む
 └ features/album/…/DesignChangePanel        上部バー + プレビュー + スクロールで包む
```

中身のコンポーネントは外枠でのレイアウトを決め打ちせず、`style` を受け取って外枠側から渡す。

### スポット名の描画

画面の見出しとしてのスポット名を描くのは `src/commons/stamp/components/SpotNameLabel/` だけとする。
同じ値を複数のコンポーネントがそれぞれ描くと、スタイルと編集導線の有無が揃わなくなる。

スタンプ詳細（`src/features/album/components/detail/`）では、`StampDetailMediaPager` が
横スクロールの `ScrollView` の外に `SpotNameLabel` を 1 つ置く。スポット名はページ固有の情報ではなく
スタンプの属性なので、ページ側（`StampDetailPhoto` / `StampLocationMap`）は描かない。
ページャの外に置けば横スワイプしても位置と内容が変わらず、編集導線もページに関係なく 1 つで済む。

`StampLocationMap` の `spotName` は地図のピンの吹き出し（`Marker` の `title`）専用で、見出しとは別物。

横幅の制約は `SpotNameLabel` 自身が持つ（名前が長いときは名前側だけを縮めて省略し、鉛筆アイコンを
押し出さない）。置く側は中央寄せと余白だけを決めればよい。

---

## src/utils/stamp/ のディレクトリ構成

写真からスタンプ画像を作る処理。構成・工程順・ルールは [stamp-pipeline.md](stamp-pipeline.md) を参照。

## 端末に置くものの分け方

撮影フローから呼ぶヘルパー（位置情報・押印音・画像の置き場）は、画像を作る処理ではなく端末の機能を使う処理なので `src/libs/` に置く。

```txt
src/libs/
  location/         # 撮影地の取得・逆ジオコーディング
  sound/            # 押印音の再生
  stampFile/        # スタンプ画像と元写真の置き場（読み書き・削除）
  i18n/             # 文言
src/infra/
  db/               # SQLite（マイグレーションと行の読み書き）
```

**行とファイルは分ける。**`src/infra/db/` が SQLite の行、`src/libs/stampFile/` が端末上のファイルを扱い、`stampFile/` は DB を知らない（documentDirectory からの相対パスだけを受け取る）。行が入らないのとファイルが書けないのは別々の失敗なので、両方をまたぐ手続き（保存・削除・孤児ファイルの掃除）とその順序は `src/infra/db/stamps.ts` にだけ置く。

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

## native / web の出し分け

アプリの動作対象は iOS / Android で、web は Storybook（`npm run storybook:web`）を出すためだけに動かす。そのため「native では使うが web では読み込めない依存」が出てくる。

**native のバンドルにしか載らない依存は、`Platform.OS` の実行時分岐ではなく `.web.tsx` / `.web.ts` のファイル分割で出し分ける。**
import は分岐より先に評価されるので、分岐では import そのものを止められない。Metro は同じディレクトリに `<名前>.web.tsx` があれば web のバンドルでそちらを選ぶため、呼ぶ側の import 文（`./StampLocationMap`）は native / web で変えなくてよい。

該当するもの:

| 依存                                 | 分けているファイル                                                               | web で読めない理由                                                                                                                      |
| ------------------------------------ | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `react-native-maps`                  | `src/features/album/components/detail/StampLocationMap/StampLocationMap.web.tsx` | `Marker` などが読む `src/decorateMapComponent.ts` が `codegenNativeComponent` を import するが、`react-native-web` は export していない |
| `canvaskit-wasm`（Skia の web 実装） | `.rnstorybook/bootstrap.web.ts`                                                  | node の `fs` を require しており、native のバンドルに混ざると解決できない                                                               |

### `<名前>.shared.ts` に置くもの

**native と web の両方から読む props 型とスタイルは `<名前>.shared.ts` に置く。**
分割した 2 ファイルは同じ props で呼ばれ、枠やテキストの見た目も揃っている必要がある。それぞれに持たせると、片方だけ直したときにずれる。

置くのは描画に依存しないものだけ（型・`StyleSheet`・定数）。JSX と、プラットフォーム固有の依存を使う処理は `.tsx` / `.web.tsx` 側に残す。

### web 版の振る舞い

**web 版は native の機能を代替実装で再現せず、その機能が使えないときの表示に合わせる。**
web は Storybook のための実行環境であり、代替実装を足すとそれ自体が保守対象になる。`StampLocationMap.web.tsx` は地図を出さず、座標が無いときと同じ「地図を表示できませんでした」を出す。
