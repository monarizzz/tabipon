/**
 * @jest-environment node
 */
// `migrations.test.ts` と同じ理由で、SQL は本物の SQLite（node:sqlite）に流す。
// モックした DB では「スキーマに対してこの SQL が通るか」を確かめられないため。
//
// expo-sqlite / expo-file-system / expo-crypto は jest.mock で差し替える。
// 置き換え先は node:sqlite と node:fs の薄い実装で、`stamps.ts` 側には
// テスト用の差し込み口を作っていない。
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { MIGRATIONS } from "@/src/infra/db/migrations";
import {
  deleteOrphanFiles,
  deleteStamp,
  getStamp,
  listStamps,
  newStampId,
  replaceStampImage,
  saveStamp,
  updateStamp,
  type NewStamp,
} from "@/src/infra/db/stamps";

type SqliteDatabase = {
  exec(sql: string): void;
  prepare(sql: string): {
    all(...params: unknown[]): unknown[];
    get(...params: unknown[]): unknown;
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

let mockSqlite: SqliteDatabase;
let mockDocumentRoot: string;
let mockNextUuid = 0;

// expo-sqlite の `SQLiteBindParams` は「位置パラメータの配列」と
// 「名前付きパラメータのオブジェクト」の両方を取る。node:sqlite は前者を可変長引数で
// 受けるので、配列はそのまま展開し、オブジェクトは 1 個の引数として渡す
const bindParams = (params: unknown): unknown[] =>
  params === undefined ? [] : Array.isArray(params) ? params : [params];

jest.mock("expo-sqlite", () => ({
  openDatabaseSync: () => ({
    runAsync: async (source: string, params?: unknown) =>
      mockSqlite.prepare(source).run(...bindParams(params)),
    getAllAsync: async (source: string, params?: unknown) =>
      mockSqlite.prepare(source).all(...bindParams(params)),
    getFirstAsync: async (source: string, params?: unknown) =>
      mockSqlite.prepare(source).get(...bindParams(params)) ?? null,
  }),
}));

jest.mock("expo-crypto", () => ({
  // uuid は 36 文字である必要がある（`id` 列の CHECK）
  randomUUID: () =>
    `00000000-0000-4000-8000-${String(++mockNextUuid).padStart(12, "0")}`,
}));

jest.mock("expo-file-system", () => {
  const fs = jest.requireActual<typeof import("node:fs")>("node:fs");
  const path = jest.requireActual<typeof import("node:path")>("node:path");

  class Directory {
    path: string;
    constructor(...segments: (Directory | string)[]) {
      this.path = segments
        .map((s) => (typeof s === "string" ? s : s.path))
        .join("/");
    }
    get uri() {
      return `file://${this.path}`;
    }
    get name() {
      return path.basename(this.path);
    }
    get exists() {
      return fs.existsSync(this.path);
    }
    create() {
      fs.mkdirSync(this.path, { recursive: true });
    }
    list() {
      return fs
        .readdirSync(this.path)
        .map((name: string) => new File(this.path, name));
    }
  }

  class File {
    path: string;
    constructor(...segments: (Directory | string)[]) {
      this.path = segments
        .map((s) => (typeof s === "string" ? s : s.path))
        .join("/")
        .replace(/^file:\/\//, "");
    }
    get uri() {
      return `file://${this.path}`;
    }
    get name() {
      return path.basename(this.path);
    }
    get exists() {
      return fs.existsSync(this.path);
    }
    write(contents: Uint8Array) {
      fs.mkdirSync(path.dirname(this.path), { recursive: true });
      fs.writeFileSync(this.path, contents);
    }
    copy(destination: File) {
      fs.mkdirSync(path.dirname(destination.path), { recursive: true });
      fs.copyFileSync(this.path, destination.path);
    }
    delete() {
      fs.rmSync(this.path);
    }
  }

  return {
    Directory,
    File,
    // `mockDocumentRoot` はテストごとに差し替わるので getter で読む
    Paths: {
      get document() {
        return new Directory(mockDocumentRoot);
      },
    },
  };
});

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

function newStamp(overrides: Partial<NewStamp> = {}): NewStamp {
  const photo = join(mockDocumentRoot, "source.jpg");
  jest
    .requireActual<typeof import("node:fs")>("node:fs")
    .writeFileSync(photo, "photo");
  return {
    id: newStampId(),
    stampPng: PNG,
    photoUri: photo,
    capturedAt: "2026-09-15T01:00:00.000Z",
    location: null,
    color: "#DC321E",
    frameId: "classic",
    scratchLevel: 0.5,
    tiltAngle: 10,
    ...overrides,
  };
}

beforeEach(() => {
  mockDocumentRoot = mkdtempSync(join(tmpdir(), "tabipon-"));
  mockSqlite = new DatabaseSync(":memory:");
  for (const migration of MIGRATIONS) {
    mockSqlite.exec(migration);
  }
  mockNextUuid = 0;
});

afterEach(() => {
  rmSync(mockDocumentRoot, { recursive: true, force: true });
});

describe("saveStamp", () => {
  it("行と画像の両方を作り、再読み込みできる", async () => {
    const saved = await saveStamp(newStamp());

    const loaded = await getStamp(saved.id);
    expect(loaded).toEqual(saved);
    expect(loaded?.color).toBe("#DC321E");
    expect(loaded?.scratchLevel).toBe(0.5);
    expect(loaded?.tiltAngle).toBe(10);
  });

  it("撮影日時は編集用と原本の両方に同じ値が入る", async () => {
    const saved = await saveStamp(
      newStamp({ capturedAt: "2026-09-15T02:00:00.000Z" }),
    );
    expect(saved.capturedAt).toBe("2026-09-15T02:00:00.000Z");
    expect(saved.capturedAtOriginal).toBe(saved.capturedAt);
  });

  it("位置情報を持たせると住所ごと往復する", async () => {
    const saved = await saveStamp(
      newStamp({
        location: {
          latitude: 34.8894,
          longitude: 135.8077,
          country: "日本",
          region: "京都府",
          city: "宇治市",
          detail: "平等院",
        },
      }),
    );
    expect((await getStamp(saved.id))?.location).toEqual(saved.location);
  });

  it("位置情報が無ければ null のまま", async () => {
    const saved = await saveStamp(newStamp({ location: null }));
    expect(saved.location).toBeNull();
    expect((await getStamp(saved.id))?.location).toBeNull();
  });

  it("スキーマの CHECK に反する値は保存できない", async () => {
    // 小文字の hex は `color` 列の CHECK に弾かれる
    await expect(saveStamp(newStamp({ color: "#dc321e" }))).rejects.toThrow();
  });
});

describe("newStampId", () => {
  it("払い出した id がそのまま保存される", async () => {
    // 呼び出し側は PNG を描く前にこの id を得て、掠れの seed にも使う。
    // ここで採番し直すと初回と再生成で模様が変わる
    const id = newStampId();
    const saved = await saveStamp(newStamp({ id }));

    expect(saved.id).toBe(id);
    expect((await getStamp(id))?.id).toBe(id);
  });

  it("呼ぶたびに違う id を返す", () => {
    expect(newStampId()).not.toBe(newStampId());
  });
});

describe("listStamps", () => {
  it("撮影日時の新しい順に返す", async () => {
    await saveStamp(newStamp({ capturedAt: "2026-09-13T00:00:00.000Z" }));
    await saveStamp(newStamp({ capturedAt: "2026-09-15T00:00:00.000Z" }));
    await saveStamp(newStamp({ capturedAt: "2026-09-14T00:00:00.000Z" }));

    expect((await listStamps()).map((s) => s.capturedAt)).toEqual([
      "2026-09-15T00:00:00.000Z",
      "2026-09-14T00:00:00.000Z",
      "2026-09-13T00:00:00.000Z",
    ]);
  });

  it("1 件も無ければ空配列", async () => {
    expect(await listStamps()).toEqual([]);
  });
});

describe("getStamp", () => {
  it("無い id には null を返す", async () => {
    expect(await getStamp("00000000-0000-4000-8000-999999999999")).toBeNull();
  });
});

describe("updateStamp", () => {
  it("渡した項目だけを変える", async () => {
    const saved = await saveStamp(newStamp());
    const updated = await updateStamp(saved.id, { memo: "ここに来た" });

    expect(updated.memo).toBe("ここに来た");
    expect(updated.title).toBeNull();
    expect(updated.color).toBe(saved.color);
    expect(updated.capturedAt).toBe(saved.capturedAt);
  });

  it("撮影日時を編集しても原本は変わらない", async () => {
    const saved = await saveStamp(newStamp());
    const updated = await updateStamp(saved.id, {
      capturedAt: "2026-09-10T00:00:00.000Z",
    });

    expect(updated.capturedAt).toBe("2026-09-10T00:00:00.000Z");
    expect(updated.capturedAtOriginal).toBe(saved.capturedAtOriginal);
  });

  it("空の patch でも落ちない", async () => {
    const saved = await saveStamp(newStamp());
    expect(await updateStamp(saved.id, {})).toEqual(saved);
  });

  it("無い id は例外", async () => {
    await expect(
      updateStamp("00000000-0000-4000-8000-999999999999", { memo: "x" }),
    ).rejects.toThrow();
  });
});

describe("replaceStampImage", () => {
  it("パスを変えずに中身だけ差し替える", async () => {
    const saved = await saveStamp(newStamp());
    await replaceStampImage(saved.id, new Uint8Array([1, 2, 3]));

    const loaded = await getStamp(saved.id);
    expect(loaded?.stampImagePath).toBe(saved.stampImagePath);
    expect(
      jest
        .requireActual<typeof import("node:fs")>("node:fs")
        .readFileSync(join(mockDocumentRoot, saved.stampImagePath)),
    ).toEqual(Buffer.from([1, 2, 3]));
  });
});

describe("deleteStamp", () => {
  it("行と画像の両方が消える", async () => {
    const fs = jest.requireActual<typeof import("node:fs")>("node:fs");
    const saved = await saveStamp(newStamp());

    await deleteStamp(saved.id);

    expect(await getStamp(saved.id)).toBeNull();
    expect(fs.existsSync(join(mockDocumentRoot, saved.stampImagePath))).toBe(
      false,
    );
    expect(fs.existsSync(join(mockDocumentRoot, saved.lineArtPath))).toBe(
      false,
    );
  });

  it("他のスタンプの画像は消さない", async () => {
    const fs = jest.requireActual<typeof import("node:fs")>("node:fs");
    const kept = await saveStamp(newStamp());
    const removed = await saveStamp(newStamp());

    await deleteStamp(removed.id);

    expect(await getStamp(kept.id)).not.toBeNull();
    expect(fs.existsSync(join(mockDocumentRoot, kept.stampImagePath))).toBe(
      true,
    );
  });

  it("無い id は何もしない", async () => {
    await expect(
      deleteStamp("00000000-0000-4000-8000-999999999999"),
    ).resolves.toBeUndefined();
  });
});

describe("deleteOrphanFiles", () => {
  it("どの行からも参照されていない画像だけ消す", async () => {
    const fs = jest.requireActual<typeof import("node:fs")>("node:fs");
    const kept = await saveStamp(newStamp());
    fs.writeFileSync(join(mockDocumentRoot, "stamps", "orphan.png"), "x");

    expect(await deleteOrphanFiles()).toBe(1);
    expect(fs.existsSync(join(mockDocumentRoot, "stamps", "orphan.png"))).toBe(
      false,
    );
    expect(fs.existsSync(join(mockDocumentRoot, kept.stampImagePath))).toBe(
      true,
    );
  });

  it("保存の途中で落ちて残ったファイルを拾える", async () => {
    const fs = jest.requireActual<typeof import("node:fs")>("node:fs");
    const saved = await saveStamp(newStamp());
    // 行だけを消す = 画像を書いた後に INSERT が失敗した状態と同じ
    mockSqlite.prepare("DELETE FROM stamps").run();

    expect(await deleteOrphanFiles()).toBe(2);
    expect(fs.existsSync(join(mockDocumentRoot, saved.stampImagePath))).toBe(
      false,
    );
    expect(fs.existsSync(join(mockDocumentRoot, saved.lineArtPath))).toBe(
      false,
    );
  });

  it("画像の置き場がまだ無くても落ちない", async () => {
    expect(await deleteOrphanFiles()).toBe(0);
  });
});
