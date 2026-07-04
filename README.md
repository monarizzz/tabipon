front

cd frontend
`npm install expo --legacy-peer-deps && npx expo install`

実行方法
npm run start

backend

cd backend

実行方法
`.venv/bin/uvicorn main:app --reload`

確認URL
- http://127.0.0.1:8000/health
- http://127.0.0.1:8000/docs

8000番ポートが使われている場合
`.venv/bin/uvicorn main:app --reload --port 8001`

---

# 追記: ログ付き実行方法

## ログ

ログはルート直下の `log/` に出力します。`log/` は `.gitignore` 済みなので Git には入りません。

- フロントエンド: `log/frontend.log`
- バックエンド: `log/backend.log`

AI にエラーを読ませたいときは、該当するログファイルの中身を貼ってください。

## 同時起動

フロントエンドとバックエンドを同時に起動し、それぞれログファイルへ書き出します。

```bash
./scripts/dev-with-logs.sh
```

停止するときは `Ctrl+C` です。

実機で確認するときは、このコマンドのフロントエンド側に表示される QR コードを Expo Go で読み取ります。

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
npm install
```

通常起動:

```bash
cd frontend
npm run start
```

トンネル起動 + ログ保存:

```bash
cd frontend
npm run start:tunnel:log
```

このコマンドは QR コードをターミナルに表示しつつ、`log/frontend.log` にログを書き出します。

またはルートから:

```bash
./scripts/start-frontend-log.sh
```

## バックエンド

役割: FastAPI の API サーバーを起動します。スタンプ画像処理や API エンドポイントを担当します。

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

ログ保存付き起動:

```bash
./scripts/start-backend-log.sh
```

実機から接続できるように、このログ保存付き起動では `--host 0.0.0.0` を付けて起動します。

確認URL:

- http://127.0.0.1:8000/health
- http://127.0.0.1:8000/docs

8000番ポートが使われている場合:

```bash
cd backend
.venv/bin/uvicorn main:app --reload --port 8001
```
