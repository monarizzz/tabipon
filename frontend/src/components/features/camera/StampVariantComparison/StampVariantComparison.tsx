/**
 * 現行 backend (OpenCV) のスタンプ出力と `src/utils/skiaStamp.ts` の出力を、
 * インク色 4 色 × フレーム 4 種の 16 通りで見比べるための検証用コンポーネント。
 *
 * Refs: #122 / #98
 *
 * #122 の完了条件が「16 通りを実機で描画した」「#120 の現行出力と見比べて差分が
 * 許容範囲であることを確認した」の 2 つなので、その両方をこの 1 画面で満たす。
 * `LineArtComparison`（#121）と同じく**一時的な検証用**で、
 * **#123 の完了時にこのフォルダと `frontend/assets/stamp-samples/` ごと削除する。**
 * プロダクトの画面には組み込まない（Storybook からのみ確認する）。
 *
 * ## 16 通りを一度に作ってから、4 枚ずつ表示している
 *
 * 生成は「色を選んだとき」ではなく初回にまとめて 16 通り走らせる。完了条件が
 * 16 通りすべての描画なので、画面を切り替えないと生成されない作りだと
 * 「見ていない組み合わせ」が残ってしまうため。
 *
 * 一方で表示は 4 枚（選択中の色のフレーム 4 種）に絞っている。16 枚を一度に
 * 並べると 1 枚 70px 程度になり、枠線の太さや破線の位置といった**差を見るための
 * 情報が潰れる**。比較が目的なので、枚数より 1 枚の大きさを優先した。
 *
 * 線画化（#121 の `generateLineArtFromImage()`）は 16 通りで共通なので 1 回だけ走らせ、
 * 着色とフレームだけを 16 回繰り返す。
 *
 * ## OpenCV / Skia は重ねずに切り替える
 *
 * 左右に並べるより、同じ位置で切り替えた方が枠線の 1〜2 画素のずれに気付きやすい。
 * `LineArtComparison` は左右比較だったが、あちらは絵の中身（黒画素の分布）を見るのが
 * 目的で、こちらは枠線の形を見るのが目的なので作りを変えている。
 *
 * ## 画像アセットと文言について
 *
 * どちらも `LineArtComparison` と同じ判断。
 *
 * - Metro の projectRoot は `frontend/` なので `docs/stamp-samples/` を直接
 *   `require()` できない。`frontend/assets/stamp-samples/` へコピーしている
 *   （#120 が書き出した `output/base/` の 16 枚。元写真は平等院）
 * - 開発者しか見ない検証用ラベルなので、i18n のキーは足さず直書きしている
 *
 * ## 表示経路も `LineArtComparison` に合わせて PNG 経由にしている
 *
 * 生成した `SkImage` を Skia の `<Canvas>` に直接渡すのではなく、
 * `encodeToBase64()` で PNG にして RN の `<Image>` で表示する。
 * オフスクリーンで作ったテクスチャと `<Canvas>` の Skia コンテキストが
 * 別で描画が空になる問題を踏んだためで、詳細は `LineArtComparison` の
 * コメントを参照。OpenCV 側の PNG と同じ経路に揃うので、拡大縮小の条件も一致する。
 */
import { useImage } from "@shopify/react-native-skia";
import { useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

import type { StampColor, StampFrame } from "@/src/api/stamps";
import { CommonButton } from "@/src/components/common/CommonButton/CommonButton";
import { colors, radii, spacing, typography } from "@/src/theme/tokens";
import { generateLineArtFromImage } from "@/src/utils/skiaLineArt";
import { composeStampFromLineArt } from "@/src/utils/skiaStamp";

const STAMP_COLORS: StampColor[] = ["red", "blue", "black", "green"];
const STAMP_FRAMES: StampFrame[] = ["simple", "classic", "dash", "wave"];

/** 比較元の写真。#120 のサンプルと同じ平等院（`LineArtComparison` と共用） */
const SOURCE_PHOTO = require("@/assets/line-art-samples/byodoin.jpg");

/**
 * #120 が書き出した現行 backend の出力 16 枚。
 * `require()` は静的なパスしか解決できないので、16 通りを直に列挙する。
 */
const OPENCV_SAMPLES: Record<StampColor, Record<StampFrame, number>> = {
  red: {
    simple: require("@/assets/stamp-samples/red_simple.png"),
    classic: require("@/assets/stamp-samples/red_classic.png"),
    dash: require("@/assets/stamp-samples/red_dash.png"),
    wave: require("@/assets/stamp-samples/red_wave.png"),
  },
  blue: {
    simple: require("@/assets/stamp-samples/blue_simple.png"),
    classic: require("@/assets/stamp-samples/blue_classic.png"),
    dash: require("@/assets/stamp-samples/blue_dash.png"),
    wave: require("@/assets/stamp-samples/blue_wave.png"),
  },
  black: {
    simple: require("@/assets/stamp-samples/black_simple.png"),
    classic: require("@/assets/stamp-samples/black_classic.png"),
    dash: require("@/assets/stamp-samples/black_dash.png"),
    wave: require("@/assets/stamp-samples/black_wave.png"),
  },
  green: {
    simple: require("@/assets/stamp-samples/green_simple.png"),
    classic: require("@/assets/stamp-samples/green_classic.png"),
    dash: require("@/assets/stamp-samples/green_dash.png"),
    wave: require("@/assets/stamp-samples/green_wave.png"),
  },
};

/** プレビュー1枚の一辺。2 列で並べる想定の固定値（出力自体は 512x512） */
const PREVIEW_SIZE = 140;

/** 生成した 16 通り。キーは `${color}_${frame}` */
type StampVariants = Record<string, string>;

type GenerateResult =
  | { status: "pending" }
  | { status: "ok"; variants: StampVariants }
  | { status: "error"; message: string };

function variantKey(color: StampColor, frame: StampFrame): string {
  return `${color}_${frame}`;
}

export function StampVariantComparison() {
  const [selectedColor, setSelectedColor] = useState<StampColor>("red");
  const [showOpenCv, setShowOpenCv] = useState(false);

  const photo = useImage(SOURCE_PHOTO);

  const result = useMemo<GenerateResult>(() => {
    if (!photo) {
      return { status: "pending" };
    }
    try {
      // 線画は 16 通りで共通なので 1 回だけ作り、着色とフレームだけを繰り返す
      const lineArt = generateLineArtFromImage(photo);
      const variants: StampVariants = {};
      for (const color of STAMP_COLORS) {
        for (const frame of STAMP_FRAMES) {
          const stamp = composeStampFromLineArt(lineArt, color, frame);
          const base64 = stamp.encodeToBase64();
          if (!base64) {
            return {
              status: "error",
              message: `PNG への符号化に失敗した (${variantKey(color, frame)})`,
            };
          }
          variants[variantKey(color, frame)] =
            `data:image/png;base64,${base64}`;
        }
      }
      return { status: "ok", variants };
    } catch (error) {
      return {
        status: "error",
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }, [photo]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.switcher}>
        {STAMP_COLORS.map((color) => (
          <CommonButton
            key={color}
            label={color}
            variant={color === selectedColor ? "primary" : "secondary"}
            onPress={() => setSelectedColor(color)}
            style={styles.switcherButton}
          />
        ))}
      </View>

      <CommonButton
        label={
          showOpenCv ? "表示中: OpenCV（現行 BE）" : "表示中: Skia（#122）"
        }
        variant="secondary"
        onPress={() => setShowOpenCv((current) => !current)}
      />

      <View style={styles.grid}>
        {STAMP_FRAMES.map((frame) => (
          <View key={frame} style={styles.cell}>
            <Text style={styles.cellTitle}>{frame}</Text>
            <View style={styles.preview}>
              {showOpenCv ? (
                <Image
                  source={OPENCV_SAMPLES[selectedColor][frame]}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              ) : result.status === "ok" ? (
                <Image
                  source={{
                    uri: result.variants[variantKey(selectedColor, frame)],
                  }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.placeholder}>
                  {result.status === "pending"
                    ? "生成中…"
                    : `生成に失敗: ${result.message}`}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.note}>
        #122 の判定用。#123 の完了時に削除する。ボタンで同じ位置のまま OpenCV と
        Skia を切り替えられる。16
        通りは初回にまとめて生成しており、色の切り替えは
        生成済みのものを出しているだけ。元写真は #120 と同じ平等院。
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.l,
    gap: spacing.l,
  },
  switcher: {
    flexDirection: "row",
    gap: spacing.s,
    justifyContent: "center",
  },
  switcherButton: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.m,
    justifyContent: "center",
  },
  cell: {
    gap: spacing.s,
    alignItems: "center",
  },
  cellTitle: {
    ...typography.labelBold,
    color: colors.textPrimary,
    textAlign: "center",
  },
  preview: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  // 枠（borderWidth 分だけ内側が狭い）にぴったり収める
  previewImage: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    ...typography.caption,
    color: colors.textMuted,
    padding: spacing.m,
    textAlign: "center",
  },
  note: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
