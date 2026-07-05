-- スタンプ詳細画面のメモを保存するための列。
-- Supabase の SQL Editor で実行すること。

alter table public.stamps
  add column if not exists memo text;
