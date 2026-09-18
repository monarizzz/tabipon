import { newStampId, saveStamp, type Stamp } from "@/src/infra/db/stamps";
import { generateStampPngFromUri } from "@/src/utils/stamp/io";
import { seedFromStampId } from "@/src/utils/stamp/seed";
import type { CreateStampInput } from "@/src/features/camera/types/createStampInput";

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
  capturedAt,
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
    capturedAt,
    location,
    address,
    color,
    frameId,
    scratchLevel,
    tiltAngle,
  });
}
