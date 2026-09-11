# プロジェクトガイドライン

## ドキュメント

ドキュメントの一覧と役割は `docs/README.md` にまとめてある。どこに何が書いてあるか分からないときはまずここを読む。

- 仕様書: `docs/REQUIREMENTS.md`
- フロントエンド設計: `docs/front-architecture.md`
- バックエンド設計: `docs/backend-architecture.md`
- デザインシステム: `design/DESIGN.MD`

## ディレクトリ構成

このリポジトリはフロントエンドとバックエンドをモノレポで管理する。

```text
/
├── frontend/   # React Native / Expo アプリ (TypeScript)
├── backend/    # Python / FastAPI サーバー
├── docs/       # 仕様書・アーキテクチャドキュメント
└── design/     # デザインファイル・スタイルガイド
```

## フロントエンドのルール

### デザインシステム

UIコードを生成する際は、`design/DESIGN.MD` に定義されたビジュアルデザインシステムに必ず従ってください

### コンポーネント作成時のルール

新しいコンポーネントを作成する前に、必ず `docs/front-architecture.md` を読んでルールを確認すること

## バックエンドのルール

バックエンドのコードを変更する前に、`docs/backend-architecture.md` を読んで責務分割のルールを確認すること
