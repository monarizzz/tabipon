#!/usr/bin/env bash
#
# worktree の依存を、本体 worktree の node_modules から APFS の clonefile で複製する。
# 使い方: npm run worktree:setup <worktree のパス>
#
# 前提: macOS / APFS。cp -c は他のファイルシステムでは使えないため、
# 失敗した場合は npm ci を案内して中断する。
set -euo pipefail

usage() {
  echo "使い方: npm run worktree:setup <worktree のパス>" >&2
}

if [ $# -ne 1 ]; then
  usage
  exit 1
fi

target=$(cd "$1" 2>/dev/null && pwd) || {
  echo "✗ ディレクトリが見つからない: $1" >&2
  exit 1
}

# 複製元は git worktree list の先頭（= main worktree）。スクリプト内に決め打ちしない。
source_root=$(git -C "$target" worktree list --porcelain | head -1 | cut -d' ' -f2-)

if [ "$source_root" = "$target" ]; then
  echo "✗ $target は本体 worktree。複製先には使えない" >&2
  exit 1
fi

echo "複製元: $source_root"
echo "複製先: $target"

# 1. lock ファイルの一致を確認する。
#    依存を変えるブランチで複製すると、本体と食い違った node_modules になるため弾く。
for lock in package-lock.json frontend/package-lock.json; do
  if ! cmp -s "$source_root/$lock" "$target/$lock"; then
    echo "✗ $lock が本体と異なる。依存を変更するブランチでは複製を使えない" >&2
    echo "  npm ci をルートと frontend/ の両方で実行すること" >&2
    exit 1
  fi
done
echo "✓ lock ファイルは本体と一致"

# 2. node_modules を clonefile で複製する（copy-on-write。実ディスク消費はほぼ 0）。
for dir in node_modules frontend/node_modules; do
  if [ -e "$target/$dir" ]; then
    echo "- $dir は既にある (skip)"
    continue
  fi
  echo "▶ $dir を複製中..."
  if ! cp -Rc "$source_root/$dir" "$target/$dir"; then
    echo "✗ clonefile による複製に失敗した。APFS 以外のファイルシステムの可能性がある" >&2
    echo "  npm ci をルートと frontend/ の両方で実行すること" >&2
    exit 1
  fi
  echo "✓ $dir"
done

# 3. .husky/_ を用意する。core.hooksPath は .git/config にあり worktree 間で共有されるが、
#    実体の .husky/_ は gitignore されているため worktree ごとに要る。
if [ -e "$target/.husky/_" ]; then
  echo "- .husky/_ は既にある (skip)"
else
  cp -R "$source_root/.husky/_" "$target/.husky/_"
  echo "✓ .husky/_"
fi

echo "完了。"
