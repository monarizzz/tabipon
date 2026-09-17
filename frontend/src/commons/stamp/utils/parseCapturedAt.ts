import { parseIso } from "@/src/utils/datetime/format";

/** 撮影日時が壊れている場合でもピッカーは開けるようにし、現在時刻から選ばせる */
export function parseCapturedAt(isoDate: string): Date {
  return parseIso(isoDate) ?? new Date();
}
