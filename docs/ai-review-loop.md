# AI PR レビューループ

PR をマージする前に、Codex または Claude で同じ完了条件のレビューを行う。レビューの実行場所はローカルと GitHub のどちらでもよく、レビュー観点と言語は `AGENTS.md` の「コードレビュー」節を正とする。

## 実行経路

### ローカル AI

PR の作成者が使用中の Codex または Claude が、各自の契約・認証でレビューする。対象 PR の diff と現在のコードを取得できるよう、`gh auth status` が成功する環境で実行する。

- AI が PR の作成または更新を担当した場合は、リモート反映後、ユーザーから別途レビューを依頼されるのを待たずに同じセッションで開始する
- レビューを行うのは現在のセッションを実行している AI 自身とし、別プロセスの AI を起動したり新しい API key を要求したりしない
- Codex は `.agents/skills/ai-review-loop/SKILL.md` を使う
- Claude は `.claude/skills/ai-review-loop/SKILL.md` を使う
- GitHub に結果を残す場合、投稿者は `gh` で認証している GitHub アカウントになる
- PC または AI セッションが停止している間は実行されない

この自動実行は、AI が同じセッションで PR の作成または更新まで担当した場合を対象とする。人間が GitHub UI や別の端末から更新した PR を、停止中のローカル AI が検知するものではない。その場合の常時実行には GitHub AI を使う。

### GitHub AI

リポジトリに設定済みの provider を使う。

| provider | 起動方法                                                       | 必要な設定                                                                |
| -------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Codex    | PR コメントの `@codex review`、または Codex の自動レビュー     | Codex Cloud のリポジトリ接続とコードレビューの有効化                      |
| Claude   | PR コメントの `@claude`、または PR event の Claude Code Action | GitHub App / Action と、リポジトリまたは Organization 側の Anthropic 認証 |

GitHub Actions の secret はリポジトリ、Organization、Environment の単位で管理する。PR 投稿者ごとの個人トークンを自動選択する前提にはしない。Claude の認証が用意されていないリポジトリでは、Claude の workflow を追加しただけでは動作しないため、ローカル Claude または設定済みの Codex を使う。

## 対象と provider の選択

1. PR 番号が指定されていればその PR、指定がなければ現在のブランチに紐づく open PR を対象にする。特定できなければ確認して停止する。全 open PR の巡回は明示された場合だけ行う。
2. provider が指定されていればそれを使う。指定がなく、現在の AI が PR の作成または更新を行った直後なら、その AI をローカル provider として自動的に使う。GitHub では設定済みと確認できた provider を使う。
3. 未設定の provider、応答の無い provider、対象 commit を特定できないレビューを成功として扱わない。別 provider への無断切り替えもしない。

## 1 回のレビュー

### 状態を固定する

レビュー開始時に PR の `headRefOid`、base、head、状態を取得し、diff とコメントを確認する。

```bash
pr_number="${PR_NUMBER:-$(gh pr view --json number --jq .number)}"
gh pr view "$pr_number" --json number,state,headRefName,headRefOid,baseRefName,commits
gh pr diff "$pr_number"
gh api --paginate --slurp "repos/{owner}/{repo}/pulls/$pr_number/comments"
gh api --paginate --slurp "repos/{owner}/{repo}/pulls/$pr_number/reviews"
gh api --paginate --slurp "repos/{owner}/{repo}/issues/$pr_number/comments"
```

全 open PR を明示的に依頼された場合は、作成者で絞らず全ページ取得する。

```bash
gh api --paginate --slurp 'repos/{owner}/{repo}/pulls?state=open&per_page=100'
```

### レビューする

- ローカル AI は、base と `headRefOid` の差分を `AGENTS.md` の観点で読み、指摘のタイトル、本文、要約を日本語で出す。レビューだけの段階ではコードを変更しない。
- GitHub AI は、provider のレビュー依頼を送る前に、同じ provider への未応答の依頼が無いことを確認する。未応答なら重複してメンションせず、応答待ちにする。
- Codex は review、review 本文、inline comment、issue comment を確認する。Claude は設定した Action の tracking comment、inline comment、issue comment を確認する。
- 「inline comment が無い」「workflow が成功した」「bot が何か返信した」だけでは指摘なしと判定しない。

### 結果を判定する

各指摘を現行コードと現在の PR diff で確認し、次のいずれかに分類する。

- **未対応**: 指摘が妥当で、現在のコードに問題が残る
- **対応済み**: 現在のコードで解消している
- **妥当でない**: 事実またはリポジトリの要件と一致しない。根拠を記録する
- **応答待ち**: 最新の依頼に provider がまだ応答していない
- **レビュー未実施**: 最新 HEAD を対象にしたレビュー結果が無い

レビュー完了には、次をすべて満たす必要がある。

1. レビュー結果が対象にした commit SHA を確認できる
2. その SHA が現在の `headRefOid` と一致する
3. 未対応の妥当な指摘が無い

古い HEAD への承認、指摘後に commit が存在するだけの状態、SHA を確認できない応答は完了にしない。ローカルレビューを GitHub に記録する場合は、provider、完全な commit SHA、指摘の有無、検証結果を PR コメントに含める。

## 修正と再レビュー

未対応の指摘があれば、妥当性を確認できたものだけを最小差分で修正し、関連する検証を行う。フロントエンドを変更した場合は `frontend/` で `npm run typecheck` と `npm run lint` を実行し、必要に応じて `npm test` も実行する。

修正対象が現在の worktree と異なる場合は、編集前に次を確認する。

```bash
git worktree list
git branch --show-current
git status --short
```

- 別 PR のブランチや未コミット変更のある worktree を流用しない
- fork PR の head がローカルに無ければ `refs/pull/<PR番号>/head` を固有のローカル参照へ fetch し、取得 SHA と `headRefOid` の一致を確認してから worktree を作る
- 新規 worktree は、未コミット変更が無いことを確認して作業終了時に削除する

修正を commit したら、権限がある場合だけ通常の push を行う。push 前に GitHub の `headRefOid` を再取得し、調査開始後に第三者の更新があればレビュー取得からやり直す。force push と `--no-verify` は使わない。

push 後は最新 `headRefOid` に対して再レビューする。GitHub AI へ依頼する場合は provider に応じて `@codex review` または `@claude` で始め、日本語で対応内容、レビュー対象の最新 SHA、再レビュー依頼を伝える。ローカル AI の場合も、push 済みの最新 SHA を対象に新しいレビューを行う。

このループは、最新 HEAD に未対応の妥当な指摘が無くなるまで続ける。認証・ネットワーク・provider 設定・権限・worktree の問題、または判断できない指摘があれば完了扱いにせず停止理由を報告する。

## 権限

- PR、diff、レビュー、コメント、commit の読み取りは行ってよい
- 依頼範囲のコード編集とローカル commit は `AGENTS.md` に従う
- push、PR コメント、レビュー依頼、workflow や secret の設定は外部変更である。現在の依頼で許可されている場合だけ実行する
- provider の認証情報をコード、ログ、PR コメントへ出さない
