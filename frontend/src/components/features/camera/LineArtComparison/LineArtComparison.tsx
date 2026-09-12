/**
 * 現行 backend (OpenCV) の線画と Skia (SkSL) の線画を左右に並べて見比べるための
 * 検証用コンポーネント。
 *
 * Refs: #121 / #98
 *
 * #121 は Epic #98 の判定ゲートで、「線画化を SkSL でどこまで再現できるか」を
 * 実機で見比べて判断するためだけに存在する。**#122 / #123 が終わった時点で
 * このコンポーネントとフォルダ、`assets/line-art-samples/` は削除する。**
 * プロダクトの画面には組み込まない（Storybook からのみ確認する）。
 *
 * 左が `docs/stamp-samples/output/line-art/` に固定した OpenCV の出力、
 * 右が `generateLineArtFromImage()` によるその場の生成結果。
 *
 * ## 画像アセットの置き場所について
 *
 * 比較したいのは `docs/stamp-samples/` 配下の PNG だが、Metro の projectRoot は
 * `frontend/` なのでその外側を `require()` しても解決できない（watchFolders にも
 * 入っていない）。projectRoot を広げるとバンドル対象が増えて副作用が大きいため、
 * **`frontend/assets/line-art-samples/` へコピーする**方を選んだ。
 * 検証が終われば消えるファイルなので、二重管理の負債にはならない。
 *
 * ## 文言について
 *
 * 画面に出す文言は i18n 経由にするのがルールだが、ここはプロダクト画面ではなく
 * 開発者しか見ない検証用ラベルなので、4言語ぶんのキーは足さず直書きしている。
 *
 * ## 右側の表示に Skia の `<Canvas>` を使っていない理由
 *
 * 当初は生成した `SkImage` をそのまま `<Canvas>` + Skia の `<Image>` で描いていたが、
 * iOS シミュレータ（Expo Go / iOS 26.5）で**枠が空白のまま**になった。黒画素率は
 * 正しく出ていたので生成自体は完走しており、描画経路だけが壊れていた。
 *
 * `Skia.Surface.MakeOffscreen()` は GPU バックエンドのサーフェスを作るため、
 * その `makeImageSnapshot()` は生成したスレッドの Skia コンテキストに属する
 * テクスチャになる。一方 `<Canvas>` は UI スレッドのコンテキストで描画するので、
 * JS スレッドで作ったテクスチャは共有されない（公式の Canvas overview が
 * `makeImageSnapshotAsync` を「UI スレッドで実行されるのでオンスクリーンの Canvas と
 * 同じコンテキストにアクセスできる」と説明しているのがこの裏返し）。
 *
 * `generateLineArtFromImage()` 側で `makeNonTextureImage()` を通すようにしたので
 * `<Canvas>` でも描けるはずだが、**ここは #121 の判定を人間が目視するための
 * 検証用コンポーネントであり、確実に映ることを最優先する**。そのため
 * `encodeToBase64()` で PNG にして RN の `<Image>` に渡す、GPU コンテキストに
 * 一切依存しない経路へ切り替えた。左（OpenCV の PNG）と同じ `<Image>` 経由に
 * 揃うので、リサイズやスケーリングの条件も左右で一致する。
 * 512x512 を 1 回符号化するだけなので、検証用途では速度も問題にならない。
 */
import { useImage } from "@shopify/react-native-skia";
import { useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { CommonButton } from "@/src/components/common/CommonButton/CommonButton";
import { colors, radii, spacing, typography } from "@/src/theme/tokens";
import {
  generateLineArtFromImage,
  measureBlackPixelRatio,
} from "@/src/utils/skiaLineArt";

type SampleKey = "byodoin" | "hida-mountains";

/**
 * 比較対象のサンプル。`black_pixel_ratio` は
 * `docs/stamp-samples/manifest.json` に記録した OpenCV 側の実測値。
 */
const SAMPLES: Record<
  SampleKey,
  {
    label: string;
    photo: number;
    opencv: number;
    opencvBlackRatio: number;
  }
> = {
  byodoin: {
    label: "平等院",
    photo: require("@/assets/line-art-samples/byodoin.jpg"),
    opencv: require("@/assets/line-art-samples/byodoin-opencv.png"),
    opencvBlackRatio: 0.3101,
  },
  "hida-mountains": {
    label: "雪山",
    photo: require("@/assets/line-art-samples/hida-mountains.jpg"),
    opencv: require("@/assets/line-art-samples/hida-mountains-opencv.png"),
    opencvBlackRatio: 0.1029,
  },
};

const SAMPLE_KEYS = Object.keys(SAMPLES) as SampleKey[];

/** プレビュー1枚の一辺。左右で条件を揃えるため固定値にしている（出力自体は 512x512） */
const PREVIEW_SIZE = 150;

type LineArtResult =
  | { status: "pending" }
  | { status: "ok"; dataUri: string; blackRatio: number | null }
  | { status: "error"; message: string };

function formatRatio(ratio: number | null): string {
  return ratio === null ? "-" : `${(ratio * 100).toFixed(1)}%`;
}

export function LineArtComparison() {
  const [selected, setSelected] = useState<SampleKey>("byodoin");

  // useImage はフックなので、選択中のものだけ呼ぶ形にはできない。
  // サンプルは 2 枚だけなので両方読み込んでから選ぶ
  const byodoinPhoto = useImage(SAMPLES.byodoin.photo);
  const hidaPhoto = useImage(SAMPLES["hida-mountains"].photo);
  const photo = selected === "byodoin" ? byodoinPhoto : hidaPhoto;

  const result = useMemo<LineArtResult>(() => {
    if (!photo) {
      return { status: "pending" };
    }
    try {
      const image = generateLineArtFromImage(photo);
      // 黒画素率は SkImage から直接測る（PNG に落とす前の値）
      const blackRatio = measureBlackPixelRatio(image);
      const base64 = image.encodeToBase64();
      if (!base64) {
        return { status: "error", message: "PNG への符号化に失敗した" };
      }
      return {
        status: "ok",
        dataUri: `data:image/png;base64,${base64}`,
        blackRatio,
      };
    } catch (error) {
      return {
        status: "error",
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }, [photo]);

  const sample = SAMPLES[selected];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.switcher}>
        {SAMPLE_KEYS.map((key) => (
          <CommonButton
            key={key}
            label={SAMPLES[key].label}
            variant={key === selected ? "primary" : "secondary"}
            onPress={() => setSelected(key)}
            style={styles.switcherButton}
          />
        ))}
      </View>

      <View style={styles.row}>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>OpenCV（現行 BE）</Text>
          <Image
            source={sample.opencv}
            style={styles.preview}
            resizeMode="contain"
          />
          <Text style={styles.metric}>
            黒画素率 {formatRatio(sample.opencvBlackRatio)}
          </Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Skia（SkSL）</Text>
          <View style={styles.preview}>
            {result.status === "ok" ? (
              // 生成結果を PNG に符号化して RN の Image で表示する。
              // GPU コンテキストに依存しないので確実に映る（冒頭のコメント参照）
              <Image
                source={{ uri: result.dataUri }}
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
          <Text style={styles.metric}>
            黒画素率{" "}
            {result.status === "ok" ? formatRatio(result.blackRatio) : "-"}
          </Text>
        </View>
      </View>

      <Text style={styles.note}>
        #121 の判定用。#122 / #123 の完了時に削除する。左は
        docs/stamp-samples/output/line-art/ に固定した現行 BE
        の出力、右はその場で SkSL が生成したもの。
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
    gap: spacing.m,
    justifyContent: "center",
  },
  switcherButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.m,
  },
  row: {
    flexDirection: "row",
    gap: spacing.m,
    justifyContent: "center",
  },
  panel: {
    gap: spacing.s,
    alignItems: "center",
  },
  panelTitle: {
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
  metric: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
  },
  note: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
