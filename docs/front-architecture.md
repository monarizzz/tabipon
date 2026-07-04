# コンポーネント設計ルール

## なぜこのルールがあるか
似た責務のコンポーネント（Button、Cardなど）が画面ごとに別名で重複生成されると、後からデザインや挙動を一括で直したいときに全箇所を探して直す必要が出る。1つの責務は1つのコンポーネントに集約し、見た目の差分は props で吸収する。

---

## ディレクトリ構成

```
src/components/
  common/                 # 見た目のみの責務。ロジック・API呼び出しを持たない
    CommonButton/
      CommonButton.tsx
      CommonButton.stories.tsx  # CommonButton と同じフォルダに同居させる
    Card/
      Card.tsx
      Card.stories.tsx
  features/
    <page>/                 # app/ 配下のページ（ルート）が属する機能ドメインに対応させる
      <domain>/             # ページ内をさらに機能単位で分けたい場合の中間フォルダ（任意。無くてもよい）
        StampCard/            # common/Card をラップし、スタンプ固有のロジックを持つ
          StampCard.tsx
          StampCard.stories.tsx
      ScanOverlay/            # 中間フォルダを挟まず <page>/ 直下に置いてもよい
        ScanOverlay.tsx
        ScanOverlay.stories.tsx
```

`features/<page>/` 配下も `common/` と同じく、コンポーネントごとに専用フォルダを作る。フォルダ直下に `.tsx` を裸で置かない（Stamp は common へ昇格済み。実体は `common/Stamp/` にある）。

### features配下とページの対応

`features/` の第一階層は `app/` 配下のページ（ルート）が属する機能ドメインに対応させる。1つのドメインに複数のページがまたがる場合は、それらのページのコンポーネントをすべて同じ `features/<page>/` 配下に置く。

現在の対応関係（実装済み）:

| `features/` 配下 | 対応する `app/` のページ |
|---|---|
| `features/camera/` | `app/(tabs)/index.tsx`（カメラ）、`app/photo-adjust.tsx`（写真調整）、`app/stamp-press.tsx`（スタンプを押す）、`app/album-stamp-detail.tsx` の一部（`DesignChangeSheet`） |
| `features/album/stamp-rally/` | `app/(tabs)/album.tsx`、`app/album-stamp-detail.tsx` |
| `features/mypage/` | `app/(tabs)/mypage.tsx` |

`features/album/stamp-rally/` のように、ドメイン名（`stamp-rally`）を中間フォルダとして挟むかどうかは任意。挟む場合も挟まない場合も、コンポーネントは必ず「コンポーネント名のフォルダ」に入れる（下記参照）。新しいページを追加するときは、まずこの表に近いどのドメインに属するかを判断し、既存の `features/<page>/` があればそこに追記する。どのドメインにも当てはまらない新しいページなら新規に `features/<page>/` を作る。

### コンポーネントとStorybookファイルの配置

- コンポーネントごとに `コンポーネント名/` フォルダを作る。**フォルダ名はコンポーネント名と同じPascalCase**（`Button/` であって `button/` ではない）にする
- 本体ファイルと `*.stories.tsx` を同じフォルダに同居させる（story を別階層の `.rnstorybook/stories/` にまとめない）
- `index.ts` によるre-exportは置かない。他のファイルからは `import { CommonButton } from '@/src/components/common/CommonButton/CommonButton'` のように、コンポーネントファイルを直接importする
- Storybook 側は `.rnstorybook/main.ts` の `stories` に `../src/components/**/*.stories.?(ts|tsx|js|jsx)` を指定し、この配置を自動検出する

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

---

## 命名固定

以下を正式名として固定する。似た役割の別名コンポーネント（`CustomButton`, `MyCard`, `StampButton` 等）を新たに作らない。

`CommonButton`, `Card`, `Badge`, `Modal`, `ListItem`, `ColorSwatch`, `Toggle`, `BottomSheet`, `SelectableTile`, `Header`, `NavBar`, `ConfirmDialog`, `Stamp`, `TabBar`, `ShareButton`

新しい基本パーツが必要になった場合は、このリストに追記してから作成する。

---
## スタイルトークン

色・spacing・角丸・フォントサイズは `theme/tokens.ts` を参照し、コンポーネント内に直接値を書かない（`#4F46E5` のようなハードコードはBefore例のように重複・ズレの原因になる）。

---

## 既存コンポーネント カタログ（作成のたびに追記する）

| コンポーネント | 役割 | variant | 使用箇所 |
|---|---|---|---|
| CommonButton | 汎用ボタン | primary / secondary / ghost / accent / danger（icon prop対応） | - |
| Card | 汎用カード | - | - |
| Badge | - | - | - |
| Modal | - | - | - |
| ListItem | - | - | - |
| ColorSwatch | 色選択ドット | selected | デザイン変更ボトムシート |
| Toggle | ON/OFFトグルスイッチ | - | デザイン変更ボトムシート |
| BottomSheet | 下からせり出すシートコンテナ | - | デザイン変更ボトムシート |
| SelectableTile | 選択式サムネイルカード | selected | デザイン変更ボトムシート（フレームスタイル選択） |
| Header | タイトル＋サブテキストの画面ヘッダー | - | アルバム画面 |
| NavBar | 戻る/タイトル/右アクションのナビゲーションバー | - | 写真調整・スタンプを押す・マイページ・スタンプ詳細 系画面 |
| ConfirmDialog | Modal+Buttonで組んだ確認ダイアログ | destructive | タブ切替時の編集破棄確認（写真調整／スタンプを押す）、スタンプ削除確認（スタンプ詳細） |
| Stamp | 二重リング円形のスタンプ/写真プレビュー | - | スタンプを押す・スタンプ詳細・スタンプを押しました（camera機能から昇格） |
| ShareButton | 円形の共有アイコンボタン（Share2アイコン） | size指定可 | スタンプ詳細画面・スタンプを押しました画面 |
| TabBar | アクティブタブに丸背景を敷くlucideアイコン+ラベルの下部タブバー | - | ルートタブナビゲーション（カメラ／アルバム／マイページ） |
| FilterChip | 65×65正方形の選択式フィルタータイル（features/stamp-rally固有） | filter / add | アルバム画面のフィルター行（FilterRow） |
| FilterRow | FilterChipを並べたフィルター行（features/stamp-rally固有） | - | アルバム画面 |
| StampGrid | StampCardの2列グリッド＋空状態（features/stamp-rally固有） | - | アルバム画面 |
| CollectionSheet | BottomSheet+入力欄+CommonButtonのコレクション追加シート（features/stamp-rally固有） | - | アルバム画面 |
| StampDetailPhoto | Stamp+デザイン変更ボタン+スポット名（タップで編集可）（features/stamp-rally固有） | - | スタンプ詳細画面 |
| DesignChangePanel | プレビュー+フレーム/カラー選択+トグル+適用ボタンを全画面インライン表示するデザイン変更パネル（features/stamp-rally固有）。stamp-press はボトムシート版 DesignChangeSheet を使用 | - | スタンプ詳細画面（デザイン変更） |
| StampInfoCard | 日付/場所セル+メモセクション（すべてタップで編集・追加可、未入力時はプレースホルダー表示）（features/stamp-rally固有） | - | スタンプ詳細画面 |
| StampLocationMap | WebViewでGoogleマップ埋め込みを表示する地図カード+スポット名（features/stamp-rally固有） | - | スタンプ詳細画面（マップページ） |
| StampDetailMediaPager | StampDetailPhotoとStampLocationMapを横スクロールで切り替えるページャー+ドットインジケーター（features/stamp-rally固有） | - | スタンプ詳細画面 |
| EditFieldSheet | BottomSheet+入力欄 or DateTimePickerの単項目編集シート（features/stamp-rally固有） | text / date | スタンプ詳細画面（タイトル・場所・日付の編集） |
| PhotoCropArea | 円形クロップ枠+ドラッグハンドル（features/camera固有） | - | 写真調整画面 |
| PhotoAdjustControls | ジェスチャーヒント+ズームスライダー+次へボタン（features/camera固有） | - | 写真調整画面 |
| CameraHintBar | 撮影ガイドのヒントテキストバー（features/camera固有） | - | カメラ画面 |
| CameraPreview | 全画面expo-cameraプレビュー＋円形ガイドオーバーレイ（features/camera固有） | - | カメラ画面 |
| CameraControls | フラッシュ/シャッター/カメラ切替の下部コントロール行（features/camera固有） | - | カメラ画面 |
| InstructionSheet | 手順バッジ付きのハウツーボトムシート（features/camera固有） | - | スタンプを押す画面（ヘルプ表示） |
| StampResultHeader | 獲得バッジ+タイトル+日付の結果ヘッダー（features/camera固有） | - | スタンプを押しました画面 |
| StampShowcase | Stamp+共有ボタンのショーケース（features/camera固有） | - | スタンプを押しました画面 |
| StampDoneActions | メモ入力欄+続けて撮影/アルバムへボタン行（features/camera固有） | - | スタンプを押しました画面 |
| ProfileSection | アバター+名前+登録日（features/mypage固有） | - | マイページ |
| RecentCollectionsSection | 最近のコレクション見出し+サムネ行（features/mypage固有） | - | マイページ |
| SettingsMenuSection | Card+ListItemの設定メニュー（features/mypage固有） | - | マイページ |
