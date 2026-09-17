#!/usr/bin/env bash
#
# worktree の依存を、本体 worktree の node_modules への symlink で用意する。
# 使い方: npm run worktree:setup <worktree のパス>
#
# node_modules は複製せず本体と共有する。Node も Metro も symlink を realpath で
# 解決するため、本体側の実体がそのまま使われる。
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

# 参照先は git worktree list の先頭（= main worktree）。スクリプト内に決め打ちしない。
source_root=$(git -C "$target" worktree list --porcelain | head -1 | cut -d' ' -f2-)

if [ "$source_root" = "$target" ]; then
  echo "✗ $target は本体 worktree。セットアップの対象にはできない" >&2
  exit 1
fi

echo "参照元: $source_root"
echo "対象:   $target"

# 1. 本体の node_modules が lock に追いついているかを確認する。
#    lock の更新を pull しただけの状態や npm ci が途中で止まった状態を共有すると、
#    古い依存や欠けた依存のまま作業を始めることになる。
#    npm は install を終えた時点の実体を node_modules/.package-lock.json に書くので、
#    lock の各パッケージがそこに同じバージョンで載っているかを見る。
#    mtime では git checkout が lock を書き戻しただけで誤検知するため、中身で比べる。
#    optional は環境によって入らない（他プラットフォーム向けの esbuild など）ので除く。
for dir in "" frontend/; do
  installed="$source_root/${dir}node_modules/.package-lock.json"

  if [ ! -f "$installed" ]; then
    echo "✗ 本体の ${dir}node_modules が npm でインストールされていない" >&2
    echo "  本体で npm ci を実行してから実行すること" >&2
    exit 1
  fi

  if ! stale=$(node -e '
    const fs = require("fs");
    const lock = JSON.parse(fs.readFileSync(process.argv[1]));
    const installed = JSON.parse(fs.readFileSync(process.argv[2]));
    const stale = [];
    for (const [path, entry] of Object.entries(lock.packages)) {
      if (!path || entry.optional || entry.link) continue;
      const got = installed.packages[path];
      if (!got) stale.push(path + " (未インストール)");
      else if (entry.version && got.version && entry.version !== got.version) {
        stale.push(path + " (" + got.version + " != " + entry.version + ")");
      }
    }
    if (stale.length === 0) process.exit(0);
    console.error("  " + stale.slice(0, 5).join("\n  "));
    if (stale.length > 5) console.error("  ... 他 " + (stale.length - 5) + " 件");
    process.exit(1);
  ' "$source_root/${dir}package-lock.json" "$installed" 2>&1); then
    echo "✗ 本体の ${dir}node_modules が ${dir}package-lock.json と食い違っている" >&2
    echo "$stale" >&2
    echo "  本体で npm ci を実行してから実行すること" >&2
    exit 1
  fi
done
echo "✓ 本体の node_modules は lock に追いついている"

# 2. lock ファイルが本体と食い違っていたら警告する。止めはしない。
#    node_modules は共有なので、この worktree で npm ci を実行すると
#    他の worktree の依存も入れ替わる。
lock_differs=0
for lock in package-lock.json frontend/package-lock.json; do
  if ! cmp -s "$source_root/$lock" "$target/$lock"; then
    lock_differs=1
  fi
done
if [ "$lock_differs" -eq 1 ]; then
  echo "⚠ この worktree の lock は本体と異なる（依存を変更するブランチ）" >&2
  echo "  node_modules は本体と共有される。ここで npm ci を実行すると" >&2
  echo "  他の worktree の依存も同時に入れ替わる点に注意すること" >&2
else
  echo "✓ lock ファイルは本体と一致"
fi

# 3. 本体を指す symlink を張る。
link_to() {
  local src=$1 dest=$2 label=$3

  # リンク切れ（本体を移動・リネームした後など）は張り直す。
  if [ -L "$dest" ] && [ ! -e "$dest" ]; then
    rm -f "$dest"
    echo "- $label はリンク切れだったので張り直す"
  fi

  if [ -L "$dest" ]; then
    echo "- $label は既にある (skip)"
    return
  fi
  # symlink ではない実体がある場合は、中身が分からないので触らない。
  if [ -e "$dest" ]; then
    echo "- $label は実体がある。symlink にするなら手で消すこと (skip)"
    return
  fi

  ln -s "$src" "$dest"
  echo "✓ $label"
}

for dir in node_modules frontend/node_modules; do
  link_to "$source_root/$dir" "$target/$dir" "$dir"
done

# core.hooksPath は .git/config にあり worktree 間で共有されるが、
# 実体の .husky/_ は gitignore されているため worktree ごとに要る。
link_to "$source_root/.husky/_" "$target/.husky/_" ".husky/_"

echo "完了。"
