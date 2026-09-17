import type { FrameStyleOption } from "@/src/commons/stamp/types/frameStyleOption";

// 表示名を持つのは label（翻訳キー）だけ。id は描画側と同じ StampFrame をそのまま使う
export const FRAME_STYLE_OPTIONS: FrameStyleOption[] = [
  { id: "classic", label: "design.frameClassic" },
  { id: "dash", label: "design.frameVintage" },
  { id: "simple", label: "design.frameMinimal" },
  { id: "wave", label: "design.frameWave" },
];
