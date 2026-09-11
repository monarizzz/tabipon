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
| バックエンド | Python / FastAPI / OpenCV |
| DB・ストレージ | Supabase Postgres / Supabase Storage |
| デプロイ | Railway |

ドキュメントの一覧と役割は [`docs/README.md`](docs/README.md) にまとめています。詳しい仕様は [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md)、アーキテクチャは [`docs/front-architecture.md`](docs/front-architecture.md) / [`docs/backend-architecture.md`](docs/backend-architecture.md)、デザインは [`design/DESIGN.MD`](design/DESIGN.MD) を参照してください。

## リポジトリ構成

```text
/
├── frontend/   # React Native / Expo アプリ (TypeScript)
├── backend/    # Python / FastAPI サーバー
├── docs/       # 仕様書・アーキテクチャドキュメント
└── design/     # デザインファイル・スタイルガイド
```

## フロントエンド

役割: Expo / React Native アプリを起動します。スマホや Expo Go から画面確認します。

Railway デプロイ済みバックエンド:

```env
EXPO_PUBLIC_API_URL=https://progate-20266-oogishima-production.up.railway.app
```

`frontend/.env` を変更したあとは、Expo をキャッシュクリア付きで再起動してください。

```bash
cd frontend
npx expo start -c --tunnel
```

初回セットアップ:

```bash
cd frontend
npm install expo --legacy-peer-deps && npx expo install
```

通常起動:

```bash
cd frontend
npm run start
```

## バックエンド

役割: FastAPI の API サーバーを起動します。スタンプ画像処理や API エンドポイントを担当します。

Railway に設定する環境変数:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

写真送信時に失敗する場合は、Railway の Variables に上記が入っているか確認してください。古い名前の `SUPABASE_KEY` もコード側では読めますが、基本は `SUPABASE_SERVICE_KEY` に揃えます。

初回セットアップ:

```bash
cd backend
python -m venv .venv
.venv/bin/pip install -r requirements.txt
```

通常起動:

```bash
cd backend
.venv/bin/uvicorn main:app --reload
```
