# ドキュメント一覧

たびぽんのドキュメントの入口。どこに何が書いてあるかはここから辿る。

| ドキュメント | 何が書いてあるか | こんなときに読む |
| --- | --- | --- |
| [REQUIREMENTS.md](REQUIREMENTS.md) | 作るもの・ユーザー体験フロー・画面定義・画面遷移・主要機能・技術スタック | 仕様を確認したい / 新しい画面や機能の位置づけを知りたい |
| [front-architecture.md](front-architecture.md) | フロントエンドのディレクトリ構成（`app/` と `src/`）、コンポーネントの分類基準、命名規則、Storybook の配置、既存コンポーネントカタログ | フロントのコードを書く前 / 新しいコンポーネントを作る前（**必読**） |
| [data-model.md](data-model.md) | 端末ローカル DB に保存する対象と構造、およびそう決めた理由。原本とキャッシュの区別、守るべき不変条件 | スタンプの保存まわりを実装・変更する前（**必読**。Refs #100） |
| [backend-architecture.md](backend-architecture.md) | バックエンドの責務分割とディレクトリ構成 | バックエンドのコードを変更する前（※ローカルストレージ移行でバックエンドごと廃止予定。Refs #103） |
| [stamp-samples/README.md](stamp-samples/README.md) | 現行 backend のスタンプ画像生成（4色×4フレーム他）の出力サンプルと再生成手順 | Skia 移植後の見た目を現行出力と比較したいとき（Refs #120, #121, #122） |
| [../design/DESIGN.MD](../design/DESIGN.MD) | ビジュアルデザインシステム（配色・タイポグラフィ・コンポーネントのスタイル定義） | UI を実装する前（**必読**） |

デザインファイルの実体は `design/` 配下にある。

- `design/color-ui.pen` — カラー付きの UI デザイン
- `design/wireframe.pen` — ワイヤーフレーム

リポジトリ全体のセットアップ・起動手順は [ルートの README.md](../README.md) を参照。

コーディングエージェント向けの指示は `docs/` ではなく AGENTS.md 側にある（`CLAUDE.md` は `AGENTS.md` を読み込むだけ）。

- [`../AGENTS.md`](../AGENTS.md) — リポジトリ共通のルール（コミット粒度・PR・ブランチ運用など）
- [`../frontend/AGENTS.md`](../frontend/AGENTS.md) — frontend 固有のルールとコマンド

## ドキュメントを分割していない理由

blog リポジトリでは `docs/architecture/` 配下を `directory-structure.md` / `data-model.md` / `component-structure.md` の3枚に分けている。たびぽんでは現時点で**分割していない**。

枚数を増やすほど実装への追従コストが上がる一方、たびぽんのフロントエンドは画面数・コンポーネント数ともに1枚で見通せる規模にとどまっているため。分割を検討するのは次のいずれかが起きたときとする。

- ~~データモデルを書き起こす必要が出たとき（ローカル DB 移行。Refs #100）~~ → `data-model.md` として切り出した
- `front-architecture.md` が長くなり、目的の節に辿り着けなくなったとき

データモデルは `front-architecture.md` には入れず独立した1枚にした。参照する場面（保存まわりの実装）とコンポーネント設計を読む場面が重ならないため。

## ドキュメント更新のルール

- コンポーネントを新規作成・削除・移動したら、同じ PR で `front-architecture.md` の「既存コンポーネント カタログ」とディレクトリ構成を更新する
- 画面（`app/` 配下のルート）を追加したら、`front-architecture.md` の `features/` 対応表と `REQUIREMENTS.md` の画面定義を更新する
- このファイルの表は、`docs/` にファイルを増やしたら必ず行を足す
