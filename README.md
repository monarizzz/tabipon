# たびぽん

<img width="1600" height="900" alt="26" src="https://github.com/user-attachments/assets/29fc2e0b-bdbe-462e-86ad-4333a425a6a4" />

## プロジェクト概要

スポットに行き、スマホのカメラでランドマークを撮影し、その写真からオリジナルのスタンプを作成するスタンプ集めアプリです。撮影後はスマホを振りかぶって振り下ろすことで、実際にスタンプを押したような体験ができます。
詳細は、[こちら](https://topaz.dev/projects/8af82f7dea8d61828a3e)をご覧ください

### 体験フロー

1. スポットへ行き、スマホのカメラでランドマークを撮影する
2. 円形ガイド内に収まるように写真を調整する
3. 写真を円形に切り抜いてフレーム・色を選択、スタンプ調に加工する
4. スマホを振り下ろしてスタンプを押す（振りかぶりで軽い振動、押し込みで強い振動、傾けると斜めに押される）
5. 作成したスタンプをアルバムに保存する

### 主な画面

- **カメラ**: 撮影 / 写真調整 / スタンプを押す / スタンプを押しました
- **アルバム**: スタンプ一覧 / スタンプ詳細
- **マイページ**: アカウント情報 / 各種設定

### 技術スタック

| 領域 | 使用技術 |
| --- | --- |
| フロントエンド | React Native / Expo / TypeScript（expo-camera, expo-sensors, expo-haptics, react-native-reanimated ほか） |
| DB・ストレージ | Supabase Postgres / Supabase Storage |
| デプロイ | Railway |

ドキュメントの一覧と役割は [`docs/README.md`](docs/README.md) にまとめています。詳しい仕様は [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md)、アーキテクチャは [`docs/front-architecture.md`](docs/front-architecture.md) / [`docs/backend-architecture.md`](docs/backend-architecture.md)、デザインは [`design/DESIGN.MD`](design/DESIGN.MD) を参照してください。

## リポジトリ構成

```text
/
├── frontend/   # React Native / Expo アプリ (TypeScript)
├── docs/       # 仕様書・アーキテクチャドキュメント
└── design/     # デザインファイル・スタイルガイド
```

## フロントエンド

Expo / React Native アプリを起動方法
注意：Expo Go 57 以降は、開発モードでアプリを起動する際に Expo CLI と Expo Go アプリの両方へ同じアカウントでログインしている必要があります（詳細: https://expo.dev/changelog/expo-go-57-login）

初回パッケージインストール:

```bash
cd frontend
npm ci
```

通常起動:

```bash
cd frontend
npm run start
```

トンネル起動（公共Wifiなど）：

```bash
cd frontend
npx expo start --tunnel
```

キャッシュクリアして起動：

```bash
cd frontend
npx expo start -c
```
