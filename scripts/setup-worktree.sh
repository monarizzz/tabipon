#!/usr/bin/env bash
#
# worktree の依存を、本体 worktree の node_modules から APFS の clonefile で複製する。
# 使い方: npm run worktree:setup <worktree のパス>
#
# 前提: macOS / APFS。cp -c は clonefile に失敗しても通常コピーへ黙って落ちるため
# （cp(1) 参照）、複製前にファイルシステムを検査して弾く。
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

# 0. clonefile が成立する条件を先に検査する。
#    cp -c は clonefile に失敗すると copyfile(2) による通常コピーへ黙って落ちる。
#    そのまま走らせると、CoW で複製できたように見えて 2.3G を実コピーしてしまう。
fs_type() {
  local device
  device=$(df -P "$1" | awk 'NR == 2 { print $1 }')
  mount | sed -n "s|^${device} on .*(\([^,)]*\).*|\1|p" | head -1
}

for path in "$source_root" "$target"; do
  type=$(fs_type "$path")
  if [ "$type" != "apfs" ]; then
    # 直後に全角文字が続く変数は、波括弧で括らないと変数名の一部として解釈される。
    echo "✗ $path は apfs ではない（${type}）。clonefile による複製は使えない" >&2
    echo "  npm ci をルートと frontend/ の両方で実行すること" >&2
    exit 1
  fi
done

# ボリュームが違うと、どちらも APFS でも clonefile は成立しない。
if [ "$(stat -f %d "$source_root")" != "$(stat -f %d "$target")" ]; then
  echo "✗ 複製元と複製先が別ボリュームにある。clonefile による複製は使えない" >&2
  echo "  npm ci をルートと frontend/ の両方で実行すること" >&2
  exit 1
fi
echo "✓ 複製元・複製先とも同一の APFS ボリューム"

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
    echo "✗ $dir の複製に失敗した" >&2
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
