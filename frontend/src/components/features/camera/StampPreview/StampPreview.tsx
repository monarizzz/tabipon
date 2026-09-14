/**
 * `src/utils/stamp/` の生成パイプラインを実機で走らせて目視するためのコンポーネント。
 *
 * Refs: #134 / #98
 *
 * ## なぜ要るか
 *
 * **このパイプラインを呼んでいる画面が現時点で存在しない。**#123 で生成関数は
 * 完成しているが結線（#125）が済んでおらず、画面側は削除済みの
 * `src/api/stampSession` を向いたままになっている。さらに #121〜#123 で使っていた
 * 比較用コンポーネントとサンプル画像は #147 で削除済みなので、
 * **コードが動くかどうかを確かめる手段が無い状態**だった。
 *
 * #134 の分割が出力を壊していないことを見るために、Storybook から叩ける経路として
 * 置いている。#125 の結線でも、画面を組む前にここで挙動を確認できる。
 *
 * ## 現行 backend との「比較」はしない
 *
 * #121〜#123 の `LineArtComparison` / `StampVariantComparison` は OpenCV の出力 PNG を
 * 同梱して重ね比べる作りだったが、その 20 枚あまりのサンプルは #147 で削除済みで、
 * backend 自体も #98 で消えている。**再生成できない参照と比べる作りにはしない。**
 * ここで見るのは「破綻せず、意図した見た目のスタンプが出ること」までに留める。
 *
 * 唯一の数値的な手掛かりが線画の黒画素率で、backend 側の実測値（平等院 31.0%）を
 * `EXPECTED_BLACK_PIXEL_RATIO` に残してある。これは #147 で消えた
 * `docs/stamp-samples/manifest.json` の
 * `sources.byodoin.line_art.black_pixel_ratio` の値。
 *
 * ## プロダクトの画面には組み込まない
 *
 * Storybook からのみ確認する。開発者しか見ないので i18n のキーは足さず直書きする
 * （削除済みの検証用コンポーネント 2 つと同じ判断）。
 *
 * ## 表示は PNG 経由にしている
 *
 * 生成した `SkImage` を Skia の `<Canvas>` に直接渡すのではなく、
 * `encodeToBase64()` で PNG にして RN の `<Image>` で表示する。
 * オフスクリーンで作ったテクスチャと `<Canvas>` の Skia コンテキストが別で、
 * 描画が空になるため（`surface.ts` の `toRasterImage()` のコメントを参照）。
 */
import { useImage, type SkImage } from "@shopify/react-native-skia";
import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { CommonButton } from "@/src/components/common/CommonButton/CommonButton";
import {
  colors,
  radii,
  spacing,
  typography,
} from "@/src/constants/design-tokens";
import {
  generateLineArtFromImage,
  measureBlackPixelRatio,
} from "@/src/utils/stamp/lineArt";
import {
  composeStampFromLineArt,
  renderStampFromLineArt,
} from "@/src/utils/stamp/pipeline";
import { seedFromStampId } from "@/src/utils/stamp/seed";
import type { StampColor, StampFrame } from "@/src/utils/stamp/types";

const STAMP_COLORS: StampColor[] = ["red", "blue", "black", "green"];
const STAMP_FRAMES: StampFrame[] = ["simple", "classic", "dash", "wave"];

/**
 * 元写真。平等院（京都府宇治市）。Wikimedia Commons の CC0 1.0、著作者 GiveMeMollusks。
 * #120 が backend のサンプルを書き出したときの主サンプルと同じ 1 枚で、
 * エッジが多く線画化の結果を判断しやすい。
 */
const SOURCE_PHOTO = require("@/assets/stamp-preview/byodoin.jpg");

/**
 * 上の写真に対する backend (OpenCV) の線画の黒画素率。
 * 出力が大きく崩れていないことの唯一の数値的な目安。
 *
 * **完全一致はしない。**#121 のとおり Canny のヒステリシスは 1 段で打ち切っており、
 * リサイズも `INTER_AREA` の近似なので、数 % のずれは想定内。
 * 桁が変わる（数 % や 60% になる）ようなら線画化が壊れている。
 */
const EXPECTED_BLACK_PIXEL_RATIO = 0.31;

/**
 * 仕上げ（掠れ・傾き）の確認用パターン。
 *
 * ## 掠れは 0.8 あたりまでほとんど効かない
 *
 * 閾値は backend 由来の `1.0 - level * 0.4` を σ 単位に戻したもの
 * （`scratch.ts` の `scratchThreshold()`）。ぼかし後のノイズは平均 0.5 の
 * ほぼ正規分布なので、白抜きされる画素の割合は level に対して極端に非線形になる。
 *
 * | level | 白抜き率（全画素） | インク部分に対して |
 * | --- | --- | --- |
 * | 0.2 | 0.0000% | ほぼゼロ |
 * | 0.4 | 0.0030% | 0.0008% |
 * | 0.6 | 0.1107% | 0.031% |
 * | 0.8 | 1.7701% | 0.496% |
 * | 0.9 | 5.2022% | 1.457% |
 * | 1.0 | 12.5608% | 3.517% |
 *
 * backend の実測平均（0.2 → 0.004% / 0.6 → 0.364% / 1.0 → 16.06%）とも桁が合うので、
 * **移植のずれではなく元の曲線がこうなっている。**
 *
 * そのため確認用のサンプルは 0.6 以上に寄せてある。0.6 は「効いていないこと」を
 * 見るために残した比較用で、実際に掠れとして見えるのは 0.9 以上。
 * 撮影フローが渡す値の範囲を含めた見直しは #155。
 */
const FINISH_SAMPLES = [
  { key: "plain", label: "掠れ・傾きなし", scratchLevel: 0, tiltAngle: 0 },
  { key: "scratch_060", label: "掠れ 0.6（ほぼ無変化）", scratchLevel: 0.6, tiltAngle: 0 }, // prettier-ignore
  { key: "scratch_090", label: "掠れ 0.9", scratchLevel: 0.9, tiltAngle: 0 },
  { key: "scratch_100", label: "掠れ 1.0", scratchLevel: 1.0, tiltAngle: 0 },
  { key: "tilt", label: "傾き 15°", scratchLevel: 0, tiltAngle: 15 },
  {
    key: "scratch_and_tilt",
    label: "掠れ 1.0 + 傾き 20°",
    scratchLevel: 1.0,
    tiltAngle: 20,
  },
] as const;

/**
 * 掠れのシード。実際は `seedFromStampId(スタンプの uuid)` で決まるが、
 * ここは固定の文字列から作って毎回同じ模様が出るようにしている
 * （模様が毎回変わると、掠れの「濃さ」を見比べられない）。
 */
const SAMPLE_SEED = seedFromStampId("byodoin-preview");

/** プレビュー1枚の一辺。2 列で並べる想定の固定値（出力自体は 512x512） */
const PREVIEW_SIZE = 140;

type Generated = {
  /** キーは `${color}_${frame}` */
  variants: Record<string, string>;
  /** キーは `FINISH_SAMPLES` の key */
  finish: Record<string, string>;
  /** 線画の黒画素率（0..1）。`readPixels` に失敗したら null */
  blackPixelRatio: number | null;
  lineArtMs: number;
  /** 着色 + フレームだけの 1 枚あたり。16 枚とも同じ工程なので平均で良い */
  perVariantMs: number;
};

type GenerateResult =
  | { status: "pending" }
  | { status: "ok"; generated: Generated }
  | { status: "error"; message: string };

type Mode = "variants" | "finish";

function variantKey(color: StampColor, frame: StampFrame): string {
  return `${color}_${frame}`;
}

function toDataUri(base64: string): string {
  return `data:image/png;base64,${base64}`;
}

/**
 * 16 通り + 仕上げ 5 通りをまとめて生成する。
 *
 * **コンポーネントの外に出してある。**中で `Date.now()` を呼んで所要時間を測るが、
 * React Compiler は描画中の不純な呼び出しを許さない（`react-hooks/purity`）。
 * 生成は副作用として `useEffect` から 1 回だけ走らせ、この関数自体は
 * React の管理外に置く。
 */
function generateAll(photo: SkImage): GenerateResult {
  try {
    // 線画は全通りで共通なので 1 回だけ作り、仕上げだけを繰り返す
    const lineArtStartedAt = Date.now();
    const lineArt = generateLineArtFromImage(photo);
    const lineArtMs = Date.now() - lineArtStartedAt;
    const blackPixelRatio = measureBlackPixelRatio(lineArt);

    const variantsStartedAt = Date.now();
    const variants: Record<string, string> = {};
    for (const color of STAMP_COLORS) {
      for (const frame of STAMP_FRAMES) {
        const base64 = composeStampFromLineArt(
          lineArt,
          color,
          frame,
        ).encodeToBase64();
        if (!base64) {
          return {
            status: "error",
            message: `PNG への符号化に失敗した (${variantKey(color, frame)})`,
          };
        }
        variants[variantKey(color, frame)] = toDataUri(base64);
      }
    }
    const perVariantMs = Math.round(
      (Date.now() - variantsStartedAt) /
        (STAMP_COLORS.length * STAMP_FRAMES.length),
    );

    const finish: Record<string, string> = {};
    for (const sample of FINISH_SAMPLES) {
      const base64 = renderStampFromLineArt(lineArt, {
        color: "red",
        frame: "classic",
        scratchLevel: sample.scratchLevel,
        tiltAngle: sample.tiltAngle,
        seed: SAMPLE_SEED,
      }).encodeToBase64();
      if (!base64) {
        return {
          status: "error",
          message: `PNG への符号化に失敗した (${sample.key})`,
        };
      }
      finish[sample.key] = toDataUri(base64);
    }

    return {
      status: "ok",
      generated: {
        variants,
        finish,
        blackPixelRatio,
        lineArtMs,
        perVariantMs,
      },
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

export function StampPreview() {
  const [mode, setMode] = useState<Mode>("variants");
  const [selectedColor, setSelectedColor] = useState<StampColor>("red");
  const [result, setResult] = useState<GenerateResult>({ status: "pending" });

  const photo = useImage(SOURCE_PHOTO);

  useEffect(() => {
    // Skia のネイティブモジュールが無い環境（Jest のモック）では null のままなので、
    // ストーリーのスモークテストは生成を走らせず placeholder のまま描画される
    if (!photo) {
      return;
    }
    // 21 枚ぶんのオフスクリーン描画と PNG 符号化を回すので、同期に走らせると
    // 「生成中…」が描画される前に画面が固まる。1 フレーム遅らせて結果だけを反映する
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) {
        setResult(generateAll(photo));
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [photo]);

  const placeholder =
    result.status === "pending"
      ? "生成中…"
      : result.status === "error"
        ? `生成に失敗: ${result.message}`
        : null;

  const cells =
    mode === "variants"
      ? STAMP_FRAMES.map((frame) => ({
          key: frame,
          label: frame,
          uri:
            result.status === "ok"
              ? result.generated.variants[variantKey(selectedColor, frame)]
              : null,
        }))
      : FINISH_SAMPLES.map((sample) => ({
          key: sample.key,
          label: sample.label,
          uri:
            result.status === "ok" ? result.generated.finish[sample.key] : null,
        }));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.switcher}>
        <CommonButton
          label="色 / フレーム"
          variant={mode === "variants" ? "primary" : "secondary"}
          onPress={() => setMode("variants")}
          style={styles.switcherButton}
        />
        <CommonButton
          label="仕上げ"
          variant={mode === "finish" ? "primary" : "secondary"}
          onPress={() => setMode("finish")}
          style={styles.switcherButton}
        />
      </View>

      {mode === "variants" ? (
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
      ) : null}

      <View style={styles.grid}>
        {cells.map((cell) => (
          <View key={cell.key} style={styles.cell}>
            <Text style={styles.cellTitle}>{cell.label}</Text>
            <View style={styles.preview}>
              {cell.uri ? (
                <Image
                  source={{ uri: cell.uri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.placeholder}>{placeholder}</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {result.status === "ok" ? (
        <Text style={styles.metric}>
          線画 {result.generated.lineArtMs}ms / 着色+フレーム1枚{" "}
          {result.generated.perVariantMs}ms（16 枚の平均。PNG 符号化を含む）
          {"\n"}
          線画の黒画素率{" "}
          {result.generated.blackPixelRatio === null
            ? "測定不可"
            : `${(result.generated.blackPixelRatio * 100).toFixed(1)}%`}
          （backend の実測値 {(EXPECTED_BLACK_PIXEL_RATIO * 100).toFixed(1)}%）
        </Text>
      ) : null}

      <Text style={styles.note}>
        `src/utils/stamp/`
        のパイプラインを実機で走らせる確認用。プロダクトの画面には
        組み込まない。黒画素率は Canny とリサイズの近似ぶん数 %
        ずれるのが正常で、桁が変わるようなら線画化が壊れている。元写真は平等院（CC0
        1.0 / Wikimedia Commons / GiveMeMollusks）。
        {"\n\n"}
        掠れは level 0.8 あたりまでほとんど効かない（0.6 で白抜きされるインクは
        全画素の 0.03%）。backend
        由来の閾値がそういう曲線になっているためで、移植のずれではない。詳細と見直しは
        #155。
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
  metric: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
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
