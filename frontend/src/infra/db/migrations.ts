// 端末ローカル DB（expo-sqlite）のスキーマとマイグレーション。
//
// バージョン管理は Expo 公式の `PRAGMA user_version` 方式で行う。
// user_version は DB ファイルのヘッダに入る整数で、どこまでマイグレーションを
// 適用したかを表す。MIGRATIONS[i] を適用すると user_version が i + 1 になる。
//
// **一度リリースしたマイグレーションは書き換えない。**既に適用済みの端末では
// 二度と実行されないため、書き換えても既存の DB には反映されない。
// 変更は必ず末尾に新しい要素を足して行う。

export const DATABASE_NAME = "tabipon.db";

/** マイグレーションを流す対象。テストで本物の SQLite を差し込めるよう、使う操作だけに絞る */
export type MigrationTarget = {
  execAsync(source: string): Promise<void>;
  getFirstAsync<T>(source: string): Promise<T | null>;
  withExclusiveTransactionAsync(
    task: (txn: { execAsync(source: string): Promise<void> }) => Promise<void>,
  ): Promise<void>;
};

// 日時は `Date.prototype.toISOString()` の形式（UTC・ミリ秒まで・末尾 Z）に固定する。
// 形式を揃えると文字列の大小がそのまま時刻の前後になり、ORDER BY がそのまま使える。
// `+09:00` のようなオフセット付きを弾くことで「UTC で保存する」も DB が保証する
const ISO_UTC_GLOB =
  "'[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'";

// 画像のパスは documentDirectory からの相対パスで持つ。iOS はアプリの更新で
// コンテナのパスが変わるため、絶対パスや file:// URI を保存すると更新後に画像を見失う
const relativePathCheck = (column: string) =>
  `CHECK (${column} <> '' AND ${column} NOT GLOB '/*' AND ${column} NOT GLOB '*:*')`;

const V1_CREATE_STAMPS = `
CREATE TABLE stamps (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(id) = 36),
  -- v1 では中間画像を作れないため元写真のパスが入る
  line_art_path TEXT NOT NULL ${relativePathCheck("line_art_path")},
  stamp_image_path TEXT NOT NULL ${relativePathCheck("stamp_image_path")},
  title TEXT,
  memo TEXT,
  captured_at TEXT NOT NULL CHECK (captured_at GLOB ${ISO_UTC_GLOB}),
  captured_at_original TEXT NOT NULL CHECK (captured_at_original GLOB ${ISO_UTC_GLOB}),
  created_at TEXT NOT NULL CHECK (created_at GLOB ${ISO_UTC_GLOB}),
  latitude REAL CHECK (latitude BETWEEN -90 AND 90),
  longitude REAL CHECK (longitude BETWEEN -180 AND 180),
  address_country TEXT,
  address_region TEXT,
  address_city TEXT,
  address_detail TEXT,
  -- '#' 付き・大文字・6桁・透明度なし
  color TEXT NOT NULL CHECK (color GLOB '#[0-9A-F][0-9A-F][0-9A-F][0-9A-F][0-9A-F][0-9A-F]'),
  -- フレームは増減するので値の一覧では縛らない（廃止済みの識別子も残り続ける）
  frame_id TEXT NOT NULL CHECK (frame_id <> ''),
  -- 以下2列は中間画像へ移行するまでの v1 限定。撮影時の DeviceMotion でしか決まらない
  scratch_level REAL NOT NULL CHECK (scratch_level BETWEEN 0 AND 1),
  tilt_angle REAL NOT NULL CHECK (tilt_angle BETWEEN -180 AND 180),
  -- 緯度と経度は両方揃うか両方無いか
  CHECK ((latitude IS NULL) = (longitude IS NULL))
) STRICT;
`;

export const MIGRATIONS: readonly string[] = [V1_CREATE_STAMPS];

/**
 * DB を最新のスキーマまで進める。`SQLiteProvider` の `onInit` に渡す。
 * 各マイグレーションは user_version の更新と同じトランザクションで適用するので、
 * 途中で落ちても「テーブルはあるのに user_version が古い」状態にはならない。
 */
export async function migrateDbIfNeeded(db: MigrationTarget): Promise<void> {
  // 接続ごとの設定。foreign_keys はトランザクションの中では切り替えられないので先に行う
  await db.execAsync("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");

  const row = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  const currentVersion = row?.user_version ?? 0;

  // 新しいアプリで進めた DB を古いアプリで開いた場合。知らないスキーマを
  // 触ると壊しかねないので、黙って進めずに止める
  if (currentVersion > MIGRATIONS.length) {
    throw new Error(
      `DB のバージョン (${currentVersion}) がアプリの想定 (${MIGRATIONS.length}) より新しい`,
    );
  }

  for (let version = currentVersion; version < MIGRATIONS.length; version++) {
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync(MIGRATIONS[version]);
      await txn.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
  }
}
