import {
  newStampId,
  saveStamp,
  type Stamp,
  type StampLocation,
} from "@/src/infra/db/stamps";
import { generateStampPngFromUri } from "@/src/utils/stamp/io";
import { seedFromStampId } from "@/src/utils/stamp/seed";
import type { StampFrame } from "@/src/utils/stamp/types";

export type CreateStampInput = {
  /** 元写真の uri。この 1 枚からスタンプを描き、再生成用にそのまま保存する */
  photoUri: string;
  color: string;
  frameId: StampFrame;
  /** 押した勢いから決まる演出値。長押しで押した場合はどちらも 0 */
  scratchLevel: number;
  tiltAngle: number;
  location: StampLocation | null;
  address: string | null;
};

/**
 * 写真 1 枚からスタンプを作って保存する。
 *
 * **id を先に払い出す。**掠れ模様の seed は `seedFromStampId(id)` で id から導く決まりで
 * （`src/utils/stamp/seed.ts`）、描く前に確定していないと、あとで色やフレームを変えて
 * 再生成したときに模様が変わってしまう。
 *
 * 途中で失敗したら投げ返す。PNG の生成に失敗すれば行もファイルも増えず、保存に失敗した
 * ときにファイルだけ残る場合は `deleteOrphanFiles()` が拾う（`src/infra/db/stamps.ts`）。
 */
export async function createStamp({
  photoUri,
  color,
  frameId,
  scratchLevel,
  tiltAngle,
  location,
  address,
}: CreateStampInput): Promise<Stamp> {
  const id = newStampId();
  const stampPng = await generateStampPngFromUri(photoUri, {
    color,
    frame: frameId,
    scratchLevel,
    tiltAngle,
    seed: seedFromStampId(id),
  });
  return saveStamp({
    id,
    stampPng,
    photoUri,
    capturedAt: new Date().toISOString(),
    location,
    address,
    color,
    frameId,
    scratchLevel,
    tiltAngle,
  });
}
