import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ShareButton } from "@/src/commons/button/components/ShareButton/ShareButton";
import { Stamp } from "@/src/commons/stamp/components/Stamp/Stamp";
import { DesignChangeForm } from "@/src/commons/stamp/components/DesignChangeForm/DesignChangeForm";
import type { FrameStyleOption } from "@/src/commons/stamp/types/frameStyleOption";
import { colors, radii, spacing } from "@/src/style/tokens";
import type { StampFrame } from "@/src/utils/stamp/types/stampFrame";

type Props = {
  onBack: () => void;
  onShare?: () => void;
  imageUri?: string;
  loading?: boolean;
  frameStyles: FrameStyleOption[];
  selectedFrameStyleId: StampFrame;
  onSelectFrameStyle: (id: StampFrame) => void;
  colorOptions: readonly string[];
  selectedColor: string;
  onSelectColor: (color: string) => void;
  onConfirm: () => void;
  confirming?: boolean;
};

export function DesignChangePanel({
  onBack,
  onShare,
  imageUri,
  loading,
  frameStyles,
  selectedFrameStyleId,
  onSelectFrameStyle,
  colorOptions,
  selectedColor,
  onSelectColor,
  onConfirm,
  confirming,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.xl }]}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.iconGlyph}>‹</Text>
        </TouchableOpacity>
        <ShareButton onPress={onShare} size={44} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.previewArea}>
          <Stamp imageUri={imageUri} />
          {loading ? (
            <View style={styles.loadingOverlay} pointerEvents="none">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null}
        </View>

        <DesignChangeForm
          style={styles.form}
          frameStyles={frameStyles}
          selectedFrameStyleId={selectedFrameStyleId}
          onSelectFrameStyle={onSelectFrameStyle}
          colorOptions={colorOptions}
          selectedColor={selectedColor}
          onSelectColor={onSelectColor}
          onConfirm={onConfirm}
          confirming={confirming}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radii.tab,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGlyph: {
    fontSize: 16,
    color: colors.textMuted,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  previewArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.l,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  // 適用ボタンを下端に寄せるため、プレビューの下の余白をフォームが受け取る。
  // flex: 1 だと flexBasis: 0 + flexShrink: 1 で中身の実高より縮み、
  // 画面が狭いときに下端のボタンまでスクロールできなくなるので flexGrow だけにする
  form: {
    flexGrow: 1,
  },
});
