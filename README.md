# progate_hack_7

## ログ

ログはルート直下の `log/` に出力します。`log/` は `.gitignore` 済みなので Git には入りません。

- フロントエンド: `log/frontend.log`
- バックエンド: `log/backend.log`

AI にエラーを読ませたいときは、該当するログファイルの中身を貼ってください。



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
