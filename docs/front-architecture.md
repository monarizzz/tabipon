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
    api/                  # バックエンド API 呼び出し
    components/           # UIコンポーネント（詳細は次節）
    contexts/             # React Context（AuthContext）
    i18n/                 # 多言語化。I18nProvider と translations/（ja / en / ko / zh）
    lib/                  # 外部SDKの初期化（supabase クライアント）
    theme/                # tokens.ts（色・タイポグラフィ・spacing・角丸）
    utils/                # 画面に依存しない純粋なヘルパー
  .rnstorybook/           # Storybook の設定。story ファイル自体はここに置かない
  assets/                 # 画像・音声
  android/ , ios/         # prebuild で生成されるネイティブプロジェクト
```

### `app/` と `src/` の役割分担

- `app/` — **ルーティングと画面の組み立てのみ**。画面固有の状態管理・API 呼び出し・ナビゲーション制御はここに置く。見た目のマークアップは `src/components/` のコンポーネントに切り出す
- `src/` — 画面から呼ばれる部品。`src/` から `app/` を import しない

現在の画面（ルート）:

| ルートファイル | 画面 |
| --- | --- |
| `app/_layout.tsx` | ルートレイアウト（Provider 群） |
| `app/(tabs)/_layout.tsx` | タブナビゲーション |
| `app/(tabs)/index.tsx` | カメラ（撮影） |
| `app/(tabs)/album.tsx` | アルバム |
| `app/(tabs)/mypage.tsx` | マイページ |
| `app/photo-adjust.tsx` | 写真調整 |
| `app/stamp-press.tsx` | スタンプを押す |
| `app/stamp-done.tsx` | スタンプを押しました |
| `app/album-stamp-detail.tsx` | スタンプ詳細 |
| `app/mypage/notifications.tsx` | 通知設定 |
| `app/mypage/language.tsx` | 言語設定 |
| `app/mypage/privacy.tsx` | プライバシー |
| `app/mypage/help.tsx` | ヘルプ |

---

## src/components/ のディレクトリ構成

```
src/components/
  common/                 # 見た目のみの責務。ロジック・API呼び出しを持たない
    CommonButton/
      CommonButton.tsx
      CommonButton.stories.tsx  # CommonButton と同じフォルダに同居させる
    Card/
      Card.tsx
      Card.stories.tsx
    layout/               # 画面の骨組みになるコンポーネントだけをまとめる中間フォルダ
      Header/
      NavBar/
      TabBar/
  features/
    <feature>/              # app/ 配下のページ（ルート）が属する機能ドメインに対応させる
      <domain>/             # ページ内をさらに機能単位で分けたい場合の中間フォルダ（任意。無くてもよい）
        StampDetailPhoto/
          StampDetailPhoto.tsx
          StampDetailPhoto.stories.tsx
      ScanOverlay/          # 中間フォルダを挟まず <feature>/ 直下に置いてもよい
        ScanOverlay.tsx
        ScanOverlay.stories.tsx
```

`features/<feature>/` 配下も `common/` と同じく、コンポーネントごとに専用フォルダを作る。フォルダ直下に `.tsx` を裸で置かない（Stamp は common へ昇格済み。実体は `common/Stamp/` にある）。

### features配下とページの対応

`features/` の第一階層は `app/` 配下のページ（ルート）が属する機能ドメインに対応させる。1つのドメインに複数のページがまたがる場合は、それらのページのコンポーネントをすべて同じ `features/<feature>/` 配下に置く。

現在の対応関係（実装済み）:

| `features/` 配下 | 対応する `app/` のページ |
|---|---|
| `features/camera/` | `app/(tabs)/index.tsx`（カメラ）、`app/photo-adjust.tsx`（写真調整）、`app/stamp-press.tsx`（スタンプを押す）、`app/stamp-done.tsx`（スタンプを押しました） |
| `features/album/` | `app/(tabs)/album.tsx`（アルバム一覧） |
| `features/album/detail/` | `app/album-stamp-detail.tsx`（スタンプ詳細） |
| `features/album/stamp-rally/` | `app/album-stamp-detail.tsx` のデザイン変更パネル |
| `features/mypage/` | `app/(tabs)/mypage.tsx`、`app/mypage/*.tsx`（通知・言語・プライバシー・ヘルプ） |

`features/album/detail/` のように、ドメイン名を中間フォルダとして挟むかどうかは任意。挟む場合も挟まない場合も、コンポーネントは必ず「コンポーネント名のフォルダ」に入れる（下記参照）。新しいページを追加するときは、まずこの表に近いどのドメインに属するかを判断し、既存の `features/<feature>/` があればそこに追記する。どのドメインにも当てはまらない新しいページなら新規に `features/<feature>/` を作る。

> 注: `features/album/` 配下は `detail/` と `stamp-rally/` の2つの中間フォルダが並存していて、`stamp-rally/` には `DesignChangePanel` 1つしか入っていない。どちらも「スタンプ詳細画面のコンポーネント」であり、中間フォルダの切り方が揃っていない。整理する場合は `detail/` に寄せる。

> 注: `app/album-stamp-detail.tsx`（album 系）が `features/camera/DesignChangeSheet/frameStyleOptions` を import しており、feature をまたいだ依存になっている。フレームスタイルの定義はデザイン変更シート／パネルの両方から使われる共通データなので、本来は `common/` か feature 非依存の場所に置くのが分類基準に沿う。

### コンポーネントとStorybookファイルの配置

- コンポーネントごとに `コンポーネント名/` フォルダを作る。**フォルダ名はコンポーネント名と同じPascalCase**（`Button/` であって `button/` ではない）にする。`common/layout/` のような分類用の中間フォルダだけは例外で、小文字ケバブケースにする
- 本体ファイルと `*.stories.tsx` を同じフォルダに同居させる（story を別階層の `.rnstorybook/stories/` にまとめない）
- `index.ts` によるre-exportは置かない。他のファイルからは `import { CommonButton } from '@/src/components/common/CommonButton/CommonButton'` のように、コンポーネントファイルを直接importする
- Storybook 側は `.rnstorybook/main.ts` の `stories` に `../src/components/**/*.stories.?(ts|tsx|js|jsx)` を指定し、この配置を自動検出する

### ストーリーのテスト

`cd frontend && npm test` で、`src/components/**/*.stories.tsx` を Storybook の
portable stories（`composeStories`）として Jest から描画する。CI（`.github/workflows/ci.yml` の
`Storybook stories` ジョブ）でも同じコマンドを実行する。

- 走査は `src/components/stories.test.tsx` が実行時に行うので、**ストーリーを追加してもテスト側の修正は不要**
- 検証するのは「例外を投げずに描画できること」だけ。見た目の崩れは検出できない（見た目は実機の Storybook で確認する）
- ストーリーに `play` があれば併せて実行される。ただし React Native + Jest では
  `play` に `canvasElement` / `canvas` / `userEvent` が渡らない（`document` が無いため）。
  web の作法どおり `({ canvas, userEvent })` を分割代入する `play` は動かないので、
  操作は `@testing-library/react-native` の `screen` / `fireEvent` で書くこと
- グローバルな Provider は `.rnstorybook/preview.tsx` の `decorators` に置く。テスト側は
  `jest.setup.storybook.ts` の `setProjectAnnotations` で同じ設定を読み込むため、Storybook と条件が揃う
- ネイティブモジュールに触れる依存（AsyncStorage・WebView・BottomSheet など）は `jest.setup.ts` でモックしている。
  そのため、それらの内部描画はテストの対象外

### 分類基準
- **common** : 「このコンポーネントはスタンプラリーの仕様を何も知らない」もの
- **features/\<feature\>** : 特定機能のデータ構造・状態・ロジックに依存するもの

判断基準は使用箇所の数：

- 使用箇所が1つだけ → `features/<feature>/` に置く（最初から common に置かない）
- 2つ以上の機能から必要になった時点で → `common/` に引き上げ、feature固有のロジックは取り除いて汎用化する

1箇所でしか使わないものを先回りして common に置くと、将来の用途を見越してpropsや条件分岐を過剰に汎用化してしまい、結局誰も使わない複雑さだけが残ることがある（早すぎる抽象化）。

---

## 新規UIコンポーネントを作成する前に必ず行う手順

1. 本ドキュメント末尾の「既存コンポーネント カタログ」で一覧を確認する
2. 同じ責務（見た目の役割）の既存コンポーネントが common にあるか確認する
3. ある場合 → 新規作成せず、既存コンポーネントに `variant` / `size` などのpropsを追加して対応する
4. ない場合 → 今回が最初の利用なら `features/<feature>/` に作る。すでに他の機能で似たものを features 側に作っていたなら、その時点で `common/` に引き上げて汎用化し、末尾の「既存コンポーネント カタログ」に登録する
5. common 側のファイルやpropsを機能名（例: `StampButton`）で汚さない
6. 作成・削除・移動したら、同じ PR でカタログの表を更新する

---

## 命名固定

以下を正式名として固定する。似た役割の別名コンポーネント（`CustomButton`, `MyCard`, `StampButton` 等）を新たに作らない。

`CommonButton`, `Card`, `Badge`, `Modal`, `ListItem`, `ColorSwatch`, `Toggle`, `BottomSheet`, `SelectableTile`, `Header`, `NavBar`, `CommonDialog`, `Stamp`, `TabBar`, `ShareButton`, `StampInfoCard`, `EditFieldSheet`, `SpotNameLabel`

新しい基本パーツが必要になった場合は、このリストに追記してから作成する。

---

## 文言

画面に出す文言はコンポーネント内に直書きせず、`src/i18n/translations/` のキーを `useTranslation()` 経由で参照する。ja / en / ko / zh の4言語すべてにキーを追加する。

---

## スタイルトークン

色・spacing・角丸・フォントサイズは `src/theme/tokens.ts`（`colors` / `typography` / `spacing` / `radii`）を参照し、コンポーネント内に直接値を書かない（`#4F46E5` のようなハードコードは重複・ズレの原因になる）。

---

## 既存コンポーネント カタログ（作成のたびに追記する）

### common/

| コンポーネント | 役割 | variant / 主なprops | 使用箇所 |
|---|---|---|---|
| CommonButton | 汎用ボタン | primary / secondary / ghost / accent / danger（`icon` 対応） | カメラ・アルバム・スタンプを押す／押しました・スタンプ詳細ほか多数 |
| Card | 汎用カード | `style` で上書き | マイページ（設定メニュー）、言語設定、StampCard |
| Badge | ラベル付きバッジ | `color` | **未使用**（現状どこからも import されていない） |
| SkiaCanvasSample | Skia の `Canvas` で円を1つ描くだけの動作確認用コンポーネント（#119） | - | **未使用**（画面には組み込んでいない。ストーリー上での描画確認のみ） |
| Modal | オーバーレイ+中央コンテンツの素のモーダル | - | CommonDialog の内部のみ |
| ListItem | アイコン+ラベル+右要素の行 | `icon` / `rightElement` / `showChevron` | マイページ（設定メニュー）、言語設定 |
| ColorSwatch | 色選択ドット | selected | デザイン変更シート／パネル |
| Toggle | ON/OFFトグルスイッチ | - | デザイン変更シート／パネル |
| BottomSheet | 下からせり出すシートコンテナ | - | デザイン変更シート、コレクション追加、EditFieldSheet、StampHelp |
| SelectableTile | 選択式サムネイルカード | selected | デザイン変更シート／パネル（フレームスタイル選択） |
| Stamp | 二重リング円形のスタンプ/写真プレビュー | - | スタンプを押す・スタンプ詳細・スタンプを押しました・StampCard |
| ShareButton | 円形の共有アイコンボタン（Share2アイコン） | `size` | スタンプ詳細画面、StampShowcase、DesignChangePanel（※ storiesファイル無し） |
| StampInfoCard | 日付/場所セル+メモセクション（すべてタップで編集・追加可、未入力時はプレースホルダー表示） | - | スタンプ詳細画面、スタンプを押しました画面 |
| EditFieldSheet | BottomSheet+入力欄 or DateTimePickerの単項目編集シート | text / date | スタンプ詳細画面、スタンプを押しました画面 |
| SpotNameLabel | タップで編集可能なスポット名テキスト（未入力時はプレースホルダー表示） | - | StampDetailPhoto、StampShowcase |
| CommonDialog | Modal+CommonButtonで組んだ確認ダイアログ | `destructive` | タブ切替時の編集破棄確認（写真調整／スタンプを押す／押しました）、スタンプ削除確認（スタンプ詳細） |

### common/layout/

| コンポーネント | 役割 | 使用箇所 |
|---|---|---|
| Header | タイトル＋サブテキストの画面ヘッダー | アルバム画面 |
| NavBar | 戻る/タイトル/右アクションのナビゲーションバー | 写真調整・スタンプを押す・マイページ・マイページ配下4画面 |
| TabBar | アクティブタブに丸背景を敷くlucideアイコン+ラベルの下部タブバー | ルートタブナビゲーション、写真調整・スタンプを押す・押しました |

### features/album/

| コンポーネント | 役割 | 使用箇所 |
|---|---|---|
| FilterChip | 65×65正方形の選択式フィルタータイル | FilterRow |
| FilterRow | FilterChipを並べたフィルター行 | アルバム画面 |
| StampCard | Card+Stampのスタンプ1件のカード | StampGrid |
| StampGrid | StampCardの2列グリッド＋空状態 | アルバム画面 |
| CollectionSheet | BottomSheet+入力欄+CommonButtonのコレクション追加シート | アルバム画面 |

### features/album/detail/

| コンポーネント | 役割 | 使用箇所 |
|---|---|---|
| StampDetailPhoto | Stamp+デザイン変更ボタン+SpotNameLabel | StampDetailMediaPager |
| StampLocationMap | WebViewでGoogleマップ埋め込みを表示する地図カード+スポット名 | StampDetailMediaPager |
| StampDetailMediaPager | StampDetailPhotoとStampLocationMapを横スクロールで切り替えるページャー+ドットインジケーター | スタンプ詳細画面 |

### features/album/stamp-rally/

| コンポーネント | 役割 | 使用箇所 |
|---|---|---|
| DesignChangePanel | プレビュー+フレーム/カラー選択+トグル+適用ボタンを全画面インライン表示するデザイン変更パネル | スタンプ詳細画面（デザイン変更）。stamp-press はボトムシート版 DesignChangeSheet を使用 |

### features/camera/

| コンポーネント | 役割 | 使用箇所 |
|---|---|---|
| CameraPreview | 全画面expo-cameraプレビュー＋円形ガイドオーバーレイ＋ズームバッジ | カメラ画面 |
| CameraControls | フラッシュ/シャッター/カメラ切替の下部コントロール行 | カメラ画面 |
| CameraHintBar | 撮影ガイドのヒントテキストバー | カメラ画面 |
| ScanOverlay | スキャン風のオーバーレイ | **未使用**（現状どこからも import されていない） |
| PhotoCropArea | 円形クロップ枠+ドラッグハンドル | 写真調整画面 |
| PhotoAdjustControls | ジェスチャーヒント+ズームスライダー+次へボタン | 写真調整画面 |
| DesignChangeSheet | BottomSheet版のデザイン変更シート（フレーム/カラー/ランドマーク名トグル） | スタンプを押す画面 |
| StampOrientationGuide | フレーム形状に合わせたスタンプの向きガイド | スタンプを押す画面（※ storiesファイル無し） |
| StampHelp | 手順バッジ付きのハウツーボトムシート | スタンプを押す画面（ヘルプ表示） |
| StampResultHeader | 獲得バッジ+タイトル+日付の結果ヘッダー | スタンプを押しました画面 |
| StampShowcase | Stamp+ShareButton+SpotNameLabelのショーケース | スタンプを押しました画面 |
| StampDoneActions | 続けて撮影/アルバムへボタン行 | スタンプを押しました画面 |

### features/mypage/

| コンポーネント | 役割 | 使用箇所 |
|---|---|---|
| ProfileSection | アバター+名前+登録日 | マイページ |
| RecentCollectionsSection | 最近のコレクション見出し+サムネ行 | マイページ |
| SettingsMenuSection | Card+ListItemの設定メニュー | マイページ |
