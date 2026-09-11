# バックエンド設計ルール

## なぜこのルールがあるか
APIの入口、HTTPリクエストの扱い、画像処理、設定値が同じファイルに混ざると、機能追加のたびに `main.py` が肥大化する。特に今後 Google Vision API、Supabase、認証を追加すると、どこを変更すればよいか分かりにくくなる。

責務ごとにファイルを分け、APIの見た目とアプリ内部の処理を切り離す。

---

## ディレクトリ構成

```
backend/
  main.py                         # FastAPIアプリの作成、CORS設定、router登録
  requirements.txt
  app/
    api/
      routes/
        health.py                 # GET /health
        stamp_image.py            # POST /stamp-image。HTTP入出力とバリデーション
        stamps.py                 # スタンプCRUD。HTTP入出力とバリデーション
    clients/
      supabase_client.py          # Supabase接続クライアント
    core/
      auth.py                     # リクエスト認証
      config.py                   # アプリ全体で使う設定値・定数
    repositories/
      stamp_repository.py         # スタンプのDB操作
    services/
      stamp_processor.py          # OpenCVによる画像処理
  tests/
    test_api.py
    test_config.py
```

---

## 分類基準

- **main.py** : アプリ全体の配線だけを行う。画像処理やDB処理を書かない
- **api/routes/** : HTTPの世界を担当する。URL、method、UploadFile、Response、HTTPエラーを扱う
- **services/** : アプリが実際に行う処理を書く。今回ならOpenCVによるスタンプ画像生成
- **repositories/** : DB（Supabase）への読み書き。SQL・テーブル名の知識はここに閉じる
- **clients/** : 外部サービスへの接続クライアントの生成
- **core/** : 複数箇所で使う設定値や認証など、基盤的なコードを置く

依存の向きは外側から内側へ流す。

```
main.py
  -> api/routes
      -> services / repositories
          -> clients / core
```

`services` から `api/routes` を import しない。OpenCVの処理を `main.py` や route ファイルに直接書かない。

---

## 新規ファイルを作成する前に必ず行う手順

1. その処理が HTTP の都合なのか、アプリ内部の処理なのかを分ける
2. HTTP の都合なら `api/routes/` に置く
3. 画像処理や外部API連携などの処理本体なら `services/` に置く
4. 複数箇所で使う設定値なら `core/config.py` に置く
5. `main.py` には router 登録とアプリ全体設定以外を増やさない

---

## 今後増やす候補

`clients/` と `repositories/` は追加済み。残りは必要になった段階で増やす。

```
app/
  schemas/        # request / response の型（未作成。現状は route 内で定義）
```

最初から作りすぎず、必要になったタイミングで追加する。

---

## 実行方法

backendディレクトリで起動する。

```
cd backend
.venv/bin/uvicorn main:app --reload
```

起動後に確認するURL。

```
http://127.0.0.1:8000/health
http://127.0.0.1:8000/docs
```
