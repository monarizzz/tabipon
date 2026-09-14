/**
 * @jest-environment node
 */
// expo-sqlite はネイティブモジュールなので Jest では動かない。
// 制約が SQLite に本当に効くかを確かめたいので、モックではなく Node 組み込みの
// SQLite（node:sqlite）に同じ SQL を流す。Jest のモジュール解決は node:sqlite を
// 知らないため、process.getBuiltinModule で直接取り出す
import {
  MIGRATIONS,
  migrateDbIfNeeded,
  type MigrationTarget,
} from "@/src/infra/db/migrations";

type SqliteDatabase = {
  exec(sql: string): void;
  prepare(sql: string): {
    get(...params: unknown[]): Record<string, unknown> | undefined;
    run(...params: unknown[]): unknown;
  };
};

const { DatabaseSync } = (
  process as unknown as {
    getBuiltinModule(id: "node:sqlite"): {
      DatabaseSync: new (path: string) => SqliteDatabase;
    };
  }
).getBuiltinModule("node:sqlite");

function createTarget(sqlite: SqliteDatabase): MigrationTarget {
  const target: MigrationTarget = {
    execAsync: async (source) => sqlite.exec(source),
    getFirstAsync: async <T>(source: string) =>
      (sqlite.prepare(source).get() as T | undefined) ?? null,
    withExclusiveTransactionAsync: async (task) => {
      sqlite.exec("BEGIN EXCLUSIVE");
      try {
        await task(target);
        sqlite.exec("COMMIT");
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
  };
  return target;
}

function userVersion(sqlite: SqliteDatabase): number {
  return sqlite.prepare("PRAGMA user_version").get()?.user_version as number;
}

const validStamp = {
  id: "0b6f1c1e-7a3d-4c0e-9f1a-2b3c4d5e6f70",
  line_art_path: "stamp-originals/0b6f1c1e.jpg",
  stamp_image_path: "stamps/0b6f1c1e.png",
  title: null,
  memo: null,
  captured_at: "2026-09-14T03:00:00.000Z",
  captured_at_original: "2026-09-14T03:00:00.000Z",
  created_at: "2026-09-14T03:00:00.000Z",
  latitude: 35.68,
  longitude: 139.76,
  address_country: "日本",
  address_region: "東京都",
  address_city: "千代田区",
  address_detail: null,
  color: "#DC321E",
  frame_id: "classic",
  scratch_level: 0.4,
  tilt_angle: -12.5,
};

type StampRow = typeof validStamp;

function insertStamp(
  sqlite: SqliteDatabase,
  overrides: Partial<Record<keyof StampRow, unknown>> = {},
) {
  const row = { ...validStamp, ...overrides };
  const columns = Object.keys(row);
  sqlite
    .prepare(
      `INSERT INTO stamps (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
    )
    .run(...Object.values(row));
}

describe("migrateDbIfNeeded", () => {
  let sqlite: SqliteDatabase;

  beforeEach(() => {
    sqlite = new DatabaseSync(":memory:");
  });

  it("空の DB を最新バージョンまで進め、stamps テーブルを作る", async () => {
    await migrateDbIfNeeded(createTarget(sqlite));

    expect(userVersion(sqlite)).toBe(MIGRATIONS.length);
    expect(
      sqlite
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
        .get(),
    ).toEqual(expect.objectContaining({ name: "stamps" }));
  });

  it("適用済みの DB に再度流しても何もしない", async () => {
    await migrateDbIfNeeded(createTarget(sqlite));
    await expect(migrateDbIfNeeded(createTarget(sqlite))).resolves.toBe(
      undefined,
    );
    expect(userVersion(sqlite)).toBe(MIGRATIONS.length);
  });

  it("アプリが知らない新しいバージョンの DB では止まる", async () => {
    sqlite.exec(`PRAGMA user_version = ${MIGRATIONS.length + 1}`);
    await expect(migrateDbIfNeeded(createTarget(sqlite))).rejects.toThrow();
  });
});

describe("v1 の stamps テーブルの制約", () => {
  let sqlite: SqliteDatabase;

  beforeEach(async () => {
    sqlite = new DatabaseSync(":memory:");
    await migrateDbIfNeeded(createTarget(sqlite));
  });

  it("正しい行は入る", () => {
    expect(() => insertStamp(sqlite)).not.toThrow();
  });

  it("座標も住所も無い行は入る（位置情報の許可が無い・圏外）", () => {
    expect(() =>
      insertStamp(sqlite, {
        latitude: null,
        longitude: null,
        address_country: null,
        address_region: null,
        address_city: null,
      }),
    ).not.toThrow();
  });

  it.each<[string, Partial<Record<keyof StampRow, unknown>>]>([
    ["緯度だけある", { longitude: null }],
    ["経度だけある", { latitude: null }],
    ["緯度が範囲外", { latitude: 91 }],
    ["色が小文字", { color: "#dc321e" }],
    ["色に # が無い", { color: "DC321E" }],
    ["色に透明度が付いている", { color: "#DC321EFF" }],
    ["色がプリセット名", { color: "red" }],
    ["画像パスが絶対パス", { stamp_image_path: "/var/mobile/a.png" }],
    ["画像パスが file:// URI", { line_art_path: "file:///a.jpg" }],
    ["画像パスが無い", { stamp_image_path: null }],
    ["撮影日時がオフセット付き", { captured_at: "2026-09-14T12:00:00+09:00" }],
    ["撮影日時がミリ秒なし", { captured_at: "2026-09-14T03:00:00Z" }],
    ["フレームが無い", { frame_id: null }],
    ["フレームが空文字", { frame_id: "" }],
    ["掠れが 1 を超える", { scratch_level: 1.5 }],
    ["傾きが 180 を超える", { tilt_angle: 181 }],
    ["緯度が文字列（STRICT）", { latitude: "abc" }],
    ["id が uuid の長さでない", { id: "1" }],
  ])("弾く: %s", (_, overrides) => {
    expect(() => insertStamp(sqlite, overrides)).toThrow();
  });
});
