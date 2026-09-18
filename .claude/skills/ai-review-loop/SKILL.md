---
name: ai-review-loop
description: PR の作成・更新を現在の AI が行った直後に自動でローカルレビューを開始し、指摘の検証、修正、最新 HEAD の再レビューを完了まで繰り返す。PR の AI レビュー、レビュー指摘への対応、再レビュー確認でも使う。
---

# AI PR レビューループ

`docs/ai-review-loop.md` を最初に最後まで読み、その共通手順に従う。

現在の Claude が PR の作成または更新を行った場合は、ユーザーからこのスキルを明示的に呼ばれるのを待たず、リモート反映後に同じセッションでローカルレビューを開始する。別の AI プロセスや GitHub AI は起動せず、現在ログイン中の Claude をそのまま使う。

ローカルレビューでは、現在の Claude 自身が `AGENTS.md` の観点と言語に従って対象 diff をレビューする。GitHub の Claude を選択した場合は、同文書の GitHub AI 手順で `@claude` または設定済み Action の結果を扱う。Codex が選択された場合も provider を無断で変更せず、同じ完了条件を適用する。
