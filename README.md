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
