import type { InkRgb, StampColor } from "@/src/utils/stamp/types";

/** 生成する画像サイズ */
export const STAMP_SIZE = 512;

/** 線画のサイズ。*/
export const LINE_ART_SIZE = STAMP_SIZE;

/** インク色 4 色（RGB 順、各 0..255） */
export const STAMP_INK_COLORS: Record<StampColor, InkRgb> = {
  red: [220, 50, 30],
  blue: [30, 60, 180],
  black: [30, 30, 30],
  green: [40, 130, 100],
};

/** 円マスク・フレームの半径 */
export const FRAME_RADIUS = Math.floor(STAMP_SIZE / 2) - 8;

/** 円の中心 */
export const FRAME_CENTER = Math.floor(STAMP_SIZE / 2);

/** `simple`: 一重円の線幅 */
export const SIMPLE_THICKNESS = 3;

/** `classic`: 外周の線幅と、内側の円の線幅・半径差 */
export const CLASSIC_OUTER_THICKNESS = 10;
export const CLASSIC_INNER_THICKNESS = 3;
export const CLASSIC_INNER_RADIUS_OFFSET = 30;

/** `dash`: 円周の分割数と線幅。奇数番だけ描くので実際の破線は 12 本 */
export const DASH_COUNT = 24;
export const DASH_THICKNESS = 4;

/** `wave`: 波の数・振幅・線幅と、パスに打つ点の数 */
export const WAVE_COUNT = 12;
export const WAVE_AMPLITUDE = 6;
export const WAVE_THICKNESS = 4;
export const WAVE_POINT_COUNT = 720;
