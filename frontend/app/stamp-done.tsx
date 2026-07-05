import React from "react";
import { View, Text, StyleSheet, Share, KeyboardAvoidingView, ScrollView, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Camera, Image, User, RotateCcw } from "lucide-react-native";
import { TabBar } from "@/src/components/common/layout/TabBar/TabBar";
import { CommonButton } from "@/src/components/common/CommonButton/CommonButton";
import { CommonDialog } from "@/src/components/common/CommonDialog/CommonDialog";
import { StampResultHeader } from "@/src/components/features/camera/StampResultHeader/StampResultHeader";
import { StampShowcase } from "@/src/components/features/camera/StampShowcase/StampShowcase";
import { StampDoneActions } from "@/src/components/features/camera/StampDoneActions/StampDoneActions";
import { clearSession, getChosenPreviewUri } from "@/src/api/stampSession";
import { deleteStamp } from "@/src/api/stamps";
import { markStampDeleted } from "@/src/api/deletedStamps";
import { useTranslation } from "@/src/i18n/I18nProvider";
import { colors, spacing } from "@/src/theme/tokens";

const today = new Date();
const formattedDate = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;

export default function StampDoneScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { stampTop: stampTopParam, stampId, imageUrl, scratchLevel, peak } = useLocalSearchParams<{
    stampTop?: string;
    stampId?: string;
    imageUrl?: string;
  }>();
  const previewUri = getChosenPreviewUri();
  const [spotName, setSpotName] = React.useState("");
  const [memo, setMemo] = React.useState("");
  const [retakeDialogVisible, setRetakeDialogVisible] = React.useState(false);

  const handleConfirmRetake = () => {
    setRetakeDialogVisible(false);
    if (stampId) {
      // アルバムで即座に一覧から除外し、削除反映前のリフェッチで再表示されるのを防ぐ
      markStampDeleted(stampId);
      // 削除はバックグラウンドで実行し、結果を待たずにカメラへ戻る
      deleteStamp(stampId).catch((error) => {
        console.error("[stamp-done] failed to delete stamp", error);
      });
    }
    clearSession();
    router.replace("/(tabs)");
  };

  // 前の画面(押し込みアニメーション)でスタンプがあった位置を引き継ぎ、
  // 遷移(animation: 'none')してもスタンプの見た目の位置がズレないようにする
  const stampTop = stampTopParam !== undefined ? Number(stampTopParam) : NaN;
  // StampShowcase 側の上部余白の分だけ差し引き、リング自体の位置を合わせる
  const headerAnchorHeight = Number.isFinite(stampTop) ? Math.max(0, stampTop - spacing.m) : undefined;

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            headerAnchorHeight === undefined && styles.scrollContentSpread,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[styles.headerAnchor, headerAnchorHeight !== undefined && { height: headerAnchorHeight }]}
          >
            <StampResultHeader date={formattedDate} />
          </View>
          <StampShowcase
            imageUri={imageUrl ?? previewUri}
            onShare={() => Share.share({ message: t("stampDone.shareMessage") })}
          />
          {scratchLevel !== undefined && (
            <Text style={styles.debugText}>[DEBUG] scratch: {scratchLevel} / peak: {peak}</Text>
          )}
          <View style={styles.actionsAnchor}>
            <StampDoneActions
              spotName={spotName}
              onChangeSpotName={setSpotName}
              memo={memo}
              onChangeMemo={setMemo}
              onContinueShooting={() => {
                clearSession();
                router.replace("/(tabs)");
              }}
              onGoToAlbum={() => {
                clearSession();
                router.push("/(tabs)/album");
              }}
            />
            <View style={styles.deleteSection}>
              <CommonButton
                label={t("stampDone.retake")}
                onPress={() => setRetakeDialogVisible(true)}
                variant="ghost"
                icon={<RotateCcw size={16} color={colors.danger} />}
                textStyle={styles.retakeLabel}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <CommonDialog
        visible={retakeDialogVisible}
        title={t("stampDone.retakeConfirmTitle")}
        message={t("stampDone.retakeConfirmMessage")}
        confirmLabel={t("stampDone.retake")}
        destructive
        onCancel={() => setRetakeDialogVisible(false)}
        onConfirm={handleConfirmRetake}
      />
      <TabBar
        items={[
          {
            key: "index",
            label: t("tabs.camera"),
            icon: Camera,
            active: true,
            onPress: () => {
              clearSession();
              router.replace("/(tabs)");
            },
          },
          {
            key: "album",
            label: t("tabs.album"),
            icon: Image,
            active: false,
            onPress: () => {
              clearSession();
              router.push("/(tabs)/album");
            },
          },
          {
            key: "mypage",
            label: t("tabs.mypage"),
            icon: User,
            active: false,
            onPress: () => {
              clearSession();
              router.push("/(tabs)/mypage");
            },
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollContentSpread: {
    justifyContent: "space-between",
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl * 3,
  },
  headerAnchor: {
    justifyContent: "flex-end",
  },
  actionsAnchor: {
    justifyContent: "flex-start",
  },
  deleteSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.m,
  },
  retakeLabel: {
    color: colors.danger,
  },
});
