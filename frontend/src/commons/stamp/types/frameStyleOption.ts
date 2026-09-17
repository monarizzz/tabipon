import type { TranslationKey } from "@/src/libs/i18n/types/i18n";
import type { StampFrame } from "@/src/utils/stamp/types";

/** デザイン変更UIに並べるフレームの選択肢 */
export type FrameStyleOption = {
  id: StampFrame;
  /** design.frameClassic のような翻訳キー。表示時に t() で解決する。 */
  label: TranslationKey;
};
