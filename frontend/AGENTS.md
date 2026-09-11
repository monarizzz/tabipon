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

- 型チェック: `cd frontend && npx tsc --noEmit`
- ストーリーのスモークテスト: `cd frontend && npm test`
  （`src/components/**/*.stories.tsx` を Jest で描画する。詳細は `docs/front-architecture.md`）
- ESLint / Prettier の導入と `npm run lint` / `npm run format:check` / `npm run typecheck` の追加は
  [PR #112](https://github.com/monarizzz/tabipon/pull/112) で進行中。マージ後はそちらの npm scripts を
  （同じく `frontend/` で）使うこと
