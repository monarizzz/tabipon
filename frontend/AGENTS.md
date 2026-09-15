# AGENTS.md

## フロントエンドのアーキテクチャ

`docs/front-architecture.md`準拠

## コンポーネント作成時のルール

新規コンポーネント作成時はコンポーネント（`.tsx`）とStorybook（`.stories.tsx`）を追加すること

## デザインシステム

UI コードを生成する際は、`design/DESIGN.md`に定義されたビジュアルデザインシステムに必ず従うこと。

## 初回起動時

Node は `.nvmrc` のバージョン（24）
`package-lock.json`準拠でインストールする

```bash
npm ci
```

### パッケージの追加

**`npm install` ではなく `npx expo install` を使う。**
SDK に対応したバージョンが選ぶ必要があるため。

```bash
npx expo install <パッケージ名>
```

## 起動

### Expo Go

```bash
 npm run start
```

- **Expo Go 57 以降、Expo CLI と Expo Go アプリの両方に、同じアカウントでログインしている必要がある**
- `@shopify/react-native-skia` は Expo Go に同梱されているため development build は不要
- `.env` を変更したらキャッシュを消して再起動する: `npx expo start -c --tunnel`

### Storybook

`STORYBOOK_ENABLED=true` が付くと、アプリの代わりに Storybook が起動する
（`npm run storybook:ios` などが設定済み）。web は `--port 6006` で開く。

## コマンド

いずれも `frontend/` で実行する。
リポジトリルートには `package.json` も `tsconfig.json` も無いため、ルートから `npx tsc --noEmit` を実行すると frontend が検査されないまま**終了コード 0 で成功したように見える**。

|              |                                                       |
| ------------ | ----------------------------------------------------- |
| 型チェック   | `npm run typecheck`                                   |
| Lint         | `npm run lint`                                        |
| フォーマット | `npm run format:check`（自動修正は `npm run format`） |
| テスト       | `npm test`                                            |
| Storybook    | `npm run storybook:ios` / `storybook:web`             |

テストは `src/components/**/*.stories.tsx` を Jest で描画するスモークテスト（詳細は `docs/front-architecture.md`）。
CI（`.github/workflows/ci.yml`）は PR に対して typecheck / lint / format:check / test を `frontend/` で実行する。
