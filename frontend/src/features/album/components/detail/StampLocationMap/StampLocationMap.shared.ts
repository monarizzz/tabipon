import { StyleSheet } from "react-native";
import { colors, radii, spacing, typography } from "@/src/style/tokens";

/**
 * `StampLocationMap.tsx`（native）と `StampLocationMap.web.tsx` の共有分。
 * 分ける理由は `docs/front-architecture.md` の「native / web の出し分け」を参照
 */
export type StampLocationMapProps = {
  /** ピンをタップしたときの吹き出しに出す名前（docs/front-architecture.md「スポット名の描画」） */
  spotName: string;
  latitude: number | null;
  longitude: number | null;
  zoom?: number;
  /**
   * 地図カードに指が触れた / 離れたときに呼ぶ。置く側が横スワイプを止めるのに使う
   * （docs/front-architecture.md「地図の操作とページャの競合」）
   */
  onTouchStart?: () => void;
  onTouchEnd?: () => void;
};

export const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: spacing.l,
    paddingVertical: spacing.l,
  },
  mapCard: {
    width: 350,
    height: 260,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  unavailable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.l,
  },
  unavailableText: {
    fontSize: typography.body.fontSize,
    color: colors.textPlaceholder,
    textAlign: "center",
  },
});
