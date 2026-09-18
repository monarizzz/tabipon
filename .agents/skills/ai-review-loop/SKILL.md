---
name: ai-review-loop
description: PR の作成・更新後に Codex または Claude のレビューを取得し、指摘の検証、修正、最新 HEAD の再レビューを完了まで繰り返す。PR の AI レビュー、レビュー指摘への対応、再レビュー確認で使う。
---

# AI PR レビューループ

`docs/ai-review-loop.md` を最初に最後まで読み、その共通手順に従う。

ローカルレビューでは、現在の Codex 自身が `AGENTS.md` の観点と言語に従って対象 diff をレビューする。GitHub の Codex を選択した場合は、同文書の GitHub AI 手順で `@codex review` の結果を扱う。Claude が選択された場合も provider を無断で変更せず、同じ完了条件を適用する。
