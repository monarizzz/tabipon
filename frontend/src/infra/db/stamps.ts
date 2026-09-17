import { randomUUID } from "expo-crypto";
import { openDatabaseSync } from "expo-sqlite";

import { DATABASE_NAME } from "@/src/infra/db/migrations";
import {
  copyOriginalPhoto,
  deleteFiles,
  deleteUnreferencedFiles,
  ensureImageDirs,
  existingFileUriOf,
  fileUriOf,
  nextStampImagePathOf,
  originalPhotoPathOf,
  stampImagePathOf,
  writeStampImage,
} from "@/src/libs/stampFile";
import {
  DEFAULT_STAMP_FRAME,
  isStampFrame,
  type StampFrame,
} from "@/src/utils/stamp/types/stampFrame";

/**
 * 画面から呼ぶ素の関数として書くため、`useSQLiteContext()`（フック）ではなく
 * 同期 API で 1 本開いて使い回す。マイグレーションは `app/_layout.tsx` の
 * `SQLiteProvider` が済ませており、その子孫からしか呼ばれないので、
 * この接続がスキーマの無い DB を見ることはない。
 */
const db = openDatabaseSync(DATABASE_NAME);

export type StampLocation = {
  latitude: number;
  longitude: number;
};

export type Stamp = {
  id: string;
  /** documentDirectory からの相対パス。表示に使う uri は `stampImageUri()` で作る */
  stampImagePath: string;
  lineArtPath: string;
  title: string | null;
  memo: string | null;
  /** 表示・並び替えに使う撮影日時。利用者が編集できる */
  capturedAt: string;
  /** 撮影時の実際の日時。編集されない */
  capturedAtOriginal: string;
  createdAt: string;
  location: StampLocation | null;
  /**
   * 「場所」として出す 1 行。取得時に座標から逆引きした住所が入る。
   * 利用者が編集すればその文字列で置き換わる。
   *
   * **座標とは独立に持つ。**逆引きに失敗しても手で入れられるし、
   * 手で入れた場所を座標の有無で消したくない
   */
  address: string | null;
  color: string;
  frameId: StampFrame;
  scratchLevel: number;
  tiltAngle: number;
};

export type NewStamp = {
  /** `newStampId()` で払い出した id。PNG を描くときの seed と同じものを渡す */
  id: string;
  /** 仕上げ済みスタンプの PNG。`generateStampPngFromUri()` の戻り値 */
  stampPng: Uint8Array;
  /** 元写真の uri。デザイン変更で再生成するために取っておく */
  photoUri: string;
  capturedAt: string;
  location: StampLocation | null;
  /** 取得時に逆引きした住所。引けなければ null で保存し、あとから手で入れられる */
  address: string | null;
  color: string;
  frameId: StampFrame;
  scratchLevel: number;
  tiltAngle: number;
};

/** 後から編集できる項目だけ。省略した項目は変更しない */
export type StampPatch = {
  title?: string | null;
  memo?: string | null;
  capturedAt?: string;
  address?: string | null;
  /**
   * 緯度・経度。2 列にまたがるので、片方だけ書けないように
   * `StampLocation` ごと差し替える形にしてある（スキーマの
   * `CHECK ((latitude IS NULL) = (longitude IS NULL))` を破らないため）
   */
  location?: StampLocation | null;
  color?: string;
  frameId?: StampFrame;
  /**
   * 画像の相対パス。デザインを変えて画像を書き直したときだけ渡す。
   * 値は `replaceStampImage()` の戻り値をそのまま使う
   */
  stampImagePath?: string;
};

/** 1 キー = 1 列で書ける項目。`location` だけは 2 列にまたがるので別扱いにする */
type ScalarStampPatch = Omit<StampPatch, "location">;

type StampRow = {
  id: string;
  line_art_path: string;
  stamp_image_path: string;
  title: string | null;
  memo: string | null;
  captured_at: string;
  captured_at_original: string;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  color: string;
  frame_id: string;
  scratch_level: number;
  tilt_angle: number;
};

function toStamp(row: StampRow): Stamp {
  return {
    id: row.id,
    stampImagePath: row.stamp_image_path,
    lineArtPath: row.line_art_path,
    title: row.title,
    memo: row.memo,
    capturedAt: row.captured_at,
    capturedAtOriginal: row.captured_at_original,
    createdAt: row.created_at,
    location:
      row.latitude === null || row.longitude === null
        ? null
        : { latitude: row.latitude, longitude: row.longitude },
    address: row.address,
    color: row.color,
    // 知らない識別子（廃止済みのフレームなど）が入っていても描画側が分岐を持たないので、
    // 型どおりの値まで読み出しの時点で寄せる
    frameId: isStampFrame(row.frame_id) ? row.frame_id : DEFAULT_STAMP_FRAME,
    scratchLevel: row.scratch_level,
    tiltAngle: row.tilt_angle,
  };
}

/** 画像を `<Image>` などに渡せる uri にする */
export function stampImageUri(stamp: Stamp): string {
  return fileUriOf(stamp.stampImagePath);
}

/** 元写真の uri。デザイン変更の再生成に使う。失われていれば null */
export function originalPhotoUri(stamp: Stamp): string | null {
  return existingFileUriOf(stamp.lineArtPath);
}

/**
 * スタンプ id を払い出す。
 *
 * **PNG を描く前に呼ぶ。**掠れ模様の seed は `seedFromStampId(id)` で id から導出する
 * 決まりで（`seed.ts`）、そうすることで色やフレームを変えて再生成しても模様が
 * 変わらないようにしている。`saveStamp()` の中で採番すると、呼び出し側は初回だけ
 * id を知らないまま描くことになり、**再生成した時点で掠れ模様が変わってしまう。**
 */
export function newStampId(): string {
  return randomUUID();
}

/**
 * スタンプを保存する。ファイルへの書き出しと行の追加を順に組み立てる。
 *
 * **画像を書いてから行を入れる。**逆にすると、書き込みに失敗したときに
 * 存在しない画像を指す行が残り、一覧が壊れる。行が入らずファイルだけ残った場合は
 * `deleteOrphanFiles()` が拾える。
 */
export async function saveStamp(input: NewStamp): Promise<Stamp> {
  const { id } = input;
  const now = new Date().toISOString();

  const stampImagePath = stampImagePathOf(id, 1);
  const lineArtPath = originalPhotoPathOf(id);

  ensureImageDirs();
  writeStampImage(stampImagePath, input.stampPng);
  copyOriginalPhoto(input.photoUri, lineArtPath);

  const row: StampRow = {
    id,
    line_art_path: lineArtPath,
    stamp_image_path: stampImagePath,
    title: null,
    memo: null,
    captured_at: input.capturedAt,
    captured_at_original: input.capturedAt,
    created_at: now,
    latitude: input.location?.latitude ?? null,
    longitude: input.location?.longitude ?? null,
    address: input.address,
    color: input.color,
    frame_id: input.frameId,
    scratch_level: input.scratchLevel,
    tilt_angle: input.tiltAngle,
  };

  // 列名を並べて `$name` で束縛する。`?` の位置合わせだと、列を足したときに
  // 値の並びだけずれても型で気付けない
  const columns = Object.keys(row) as (keyof StampRow)[];
  await db.runAsync(
    `INSERT INTO stamps (${columns.join(", ")})
     VALUES (${columns.map((column) => `$${column}`).join(", ")})`,
    Object.fromEntries(columns.map((column) => [`$${column}`, row[column]])),
  );

  return toStamp(row);
}

/** 新しい順（撮影日時）。アルバム一覧が使う */
export async function listStamps(): Promise<Stamp[]> {
  const rows = await db.getAllAsync<StampRow>(
    "SELECT * FROM stamps ORDER BY captured_at DESC, created_at DESC",
  );
  return rows.map(toStamp);
}

export async function getStamp(id: string): Promise<Stamp | null> {
  const row = await db.getFirstAsync<StampRow>(
    "SELECT * FROM stamps WHERE id = ?",
    id,
  );
  return row ? toStamp(row) : null;
}

/**
 * 編集できる項目だけを更新する。
 *
 * 色とフレームを変えても画像は差し替えない。呼び出し側が再生成した PNG で
 * `replaceStampImage()` を呼び、戻り値のパスを `stampImagePath` に渡す。
 */
export async function updateStamp(
  id: string,
  patch: StampPatch,
): Promise<Stamp> {
  const columns: Record<keyof ScalarStampPatch, string> = {
    title: "title",
    memo: "memo",
    capturedAt: "captured_at",
    address: "address",
    color: "color",
    frameId: "frame_id",
    stampImagePath: "stamp_image_path",
  };

  const assignments: string[] = [];
  const values: (string | number | null)[] = [];
  for (const [key, column] of Object.entries(columns)) {
    const value = patch[key as keyof ScalarStampPatch];
    if (value !== undefined) {
      assignments.push(`${column} = ?`);
      values.push(value);
    }
  }

  // 緯度と経度は必ず揃えて書く。片方だけ更新するとスキーマの CHECK に弾かれる
  if (patch.location !== undefined) {
    assignments.push("latitude = ?", "longitude = ?");
    values.push(
      patch.location?.latitude ?? null,
      patch.location?.longitude ?? null,
    );
  }

  if (assignments.length > 0) {
    await db.runAsync(
      `UPDATE stamps SET ${assignments.join(", ")} WHERE id = ?`,
      [...values, id],
    );
  }

  const updated = await getStamp(id);
  if (!updated) {
    throw new Error(`スタンプが見つからない: ${id}`);
  }
  return updated;
}

/**
 * デザイン変更で作り直した画像を、次の版のパスへ書いてそのパスを返す。
 *
 * **上書きせずに別のパスへ書く。**`<Image source={{ uri }}>` は uri をキーに
 * 画像をキャッシュするので、同じパスに書くと一覧も詳細も古い絵を出し続ける
 * （`stampImagePathOf()`）。
 *
 * **返したパスを `updateStamp()` の `stampImagePath` に渡すこと。**渡さないと
 * 行が前の版を指したままになり、書いた画像はどこからも参照されない。
 * 差し替え後に参照されなくなった前の版は `deleteOrphanFiles()` が拾う。
 */
export async function replaceStampImage(
  id: string,
  stampPng: Uint8Array,
): Promise<string> {
  const stamp = await getStamp(id);
  if (!stamp) {
    throw new Error(`スタンプが見つからない: ${id}`);
  }
  const stampImagePath = nextStampImagePathOf(id, stamp.stampImagePath);

  ensureImageDirs();
  writeStampImage(stampImagePath, stampPng);

  return stampImagePath;
}

/**
 * スタンプを消す。行の削除とファイルの削除を順に組み立てる。
 *
 * **行を先に消し、画像はその後。**逆にすると、ファイルだけ消えて行が残ったとき
 * 一覧に壊れた項目が出る。行が消えた後にファイル削除が失敗しても、残るのは
 * どこからも参照されないファイルだけで、`deleteOrphanFiles()` が拾える。
 */
export async function deleteStamp(id: string): Promise<void> {
  const stamp = await getStamp(id);
  if (!stamp) {
    return;
  }

  await db.runAsync("DELETE FROM stamps WHERE id = ?", id);

  deleteFiles([stamp.stampImagePath, stamp.lineArtPath]);
}

/**
 * どの行からも参照されていない画像を消す。
 *
 * 保存中や削除中に落ちると取り残しが出る。起動のたびに掃く前提の後始末で、
 * 消し漏れがあっても次の起動で拾えるため、失敗しても呼び出し側は止めない。
 *
 * **行を読んでからファイルを消す。**参照されているパスの一覧は DB にしか無いので、
 * それを渡してファイル側に掃かせる。
 */
export async function deleteOrphanFiles(): Promise<number> {
  const rows = await db.getAllAsync<{
    stamp_image_path: string;
    line_art_path: string;
  }>("SELECT stamp_image_path, line_art_path FROM stamps");

  const referenced = new Set(
    rows.flatMap((row) => [row.stamp_image_path, row.line_art_path]),
  );

  return deleteUnreferencedFiles(referenced);
}
