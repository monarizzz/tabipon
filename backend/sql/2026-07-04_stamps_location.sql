-- Vision API(ランドマーク自動判定)廃止に伴う stamps テーブルの再設計。
-- 場所情報を spots テーブルではなく stamp 本体に持たせる(取得時GPS)。
-- Supabase の SQL Editor で実行すること。

-- 取得時の位置情報(GPS)。将来 Google Map 上にピン表示するために使用する。
alter table public.stamps
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists spot_name text;

-- 既存列 user_id / spot_id / tilt_angle は既に存在(すべて nullable)。
--   - tilt_angle: 傾き演出の保存に利用(任意)
--   - user_id   : 将来の認証で利用
--   - spot_id   : Vision 時代の正規化(spots への FK)。現在は未使用。

-- 任意のクリーンアップ(spots 正規化をやめて stamp に一本化する場合):
-- 　※ spots は現在空。参照が無いことを確認してから実行する。
-- alter table public.stamps drop column if exists spot_id;
-- drop table if exists public.spots;
