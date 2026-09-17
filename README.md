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
| データ保存 | 端末ローカル（expo-sqlite / expo-file-system） |

ドキュメントの一覧と役割は [`docs/README.md`](docs/README.md) にまとめています。詳しい仕様は [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md)、アーキテクチャは [`docs/front-architecture.md`](docs/front-architecture.md)　デザインは [`design/DESIGN.MD`](design/DESIGN.MD) を参照してください。

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
npm ci             # リポジトリルート。Git フック（husky）を有効にする
cd frontend
npm ci
```

ルートの `npm ci` は Git フックを入れるためのもので、アプリの依存とは別物です。
これを実行すると、コミット時に次が自動で走るようになります。

- ステージした差分の整形（Prettier が自動修正して再ステージ）と Lint（ESLint）
- TypeScript を変更した場合のみ、`frontend/` 全体の型チェック
- コミット件名の prefix の検査

いずれかが失敗するとコミットは中断されます。

環境変数の設定:

```bash
cd frontend
cp .env.example .env    # Google Maps の API キーを設定する
```

住所表示と地図表示に `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` を使います。キーの取得手順は `.env.example` のコメントを参照してください（**Maps JavaScript API と Geocoding API の両方**を有効化する必要があります）。未設定でもアプリは起動しますが、スタンプの住所と地図は表示されません。`.env` を変更したら `npx expo start -c` でキャッシュを消して起動し直します。

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
