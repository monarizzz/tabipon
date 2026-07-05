-- スタンプ作成時の掠れ具合(振り強度から算出)を保存する列を追加。
-- アルバム詳細のデザイン変更で元スタンプの掠れを引き継ぐために使用する。
-- Supabase の SQL Editor で実行すること。

-- scratch_level: 掠れ演出の強度(0=なし)。既存レコードは NULL(=掠れなし扱い)。
alter table public.stamps
  add column if not exists scratch_level double precision;
