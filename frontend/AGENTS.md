# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

## コンポーネント作成時のルール

新しいコンポーネントを作成する前に、必ず `docs/front-architecture.md`（リポジトリルートから見た相対パス）を
読んでルールを確認すること。

## デザインシステム

UI コードを生成する際は、`design/DESIGN.MD`（リポジトリルートから見た相対パス。拡張子は大文字の `.MD`）に
定義されたビジュアルデザインシステムに必ず従うこと。

## コマンド

いずれも `frontend/` で実行する。リポジトリルートには `package.json` も `tsconfig.json` も無いため、
ルートから `npx tsc --noEmit` を実行すると frontend が検査されないまま**終了コード 0 で成功したように見える**。
作業ディレクトリを取り違えないよう、コマンドに `cd frontend` を含めた形で記載する。

- 型チェック: `cd frontend && npm run typecheck`
- Lint: `cd frontend && npm run lint`
- フォーマット確認: `cd frontend && npm run format:check`（自動修正は `npm run format`）
- Storybook: `cd frontend && npm run storybook:ios` / `storybook:android` / `storybook:web`

CI（`.github/workflows/ci.yml`）は PR に対して上の typecheck / lint / format:check を
`frontend/` で実行する。`backend/` 向けのジョブは無い。
