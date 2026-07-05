-- スタンプ作成/デザイン変更時の色・フレームを保存する列を追加。
-- 完成済み PNG からは色・枠を復元できないため、アルバム詳細の
-- デザイン変更パネルを元の色・枠で初期化できるように保持する。
-- Supabase の SQL Editor で実行すること。

-- color: red/blue/black/green のいずれか。frame: simple/classic/dash/wave のいずれか。
-- 既存レコードは NULL(=フロント側で既定値 red/classic にフォールバック)。
alter table public.stamps
  add column if not exists color text,
  add column if not exists frame text;
