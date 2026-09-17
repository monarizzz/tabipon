import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Sharing from "expo-sharing";
import { DesignChangePanel } from "@/src/features/album/components/stamp-rally/DesignChangePanel/DesignChangePanel";
import { useStampDesignChange } from "@/src/features/album/hooks/useStampDesignChange";
import { FRAME_STYLE_OPTIONS } from "@/src/features/camera/constants/frameStyleOptions";
import { STAMP_INK_COLORS } from "@/src/utils/stamp/constants/constants";
import { ShareButton } from "@/src/commons/button/components/ShareButton/ShareButton";
import { CommonButton } from "@/src/commons/button/components/CommonButton/CommonButton";
import { CommonDialog } from "@/src/commons/sheet/components/CommonDialog/CommonDialog";
import { Trash2 } from "lucide-react-native";
import { deleteStamp, getStamp, type Stamp } from "@/src/infra/db/stamps";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { colors, radii, spacing, typography } from "@/src/style/tokens";
import { StampDetailMediaPager } from "@/src/features/album/components/detail/StampDetailMediaPager/StampDetailMediaPager";
import { StampInfoCard } from "@/src/commons/stamp/components/StampInfoCard/StampInfoCard";
import { StampFieldSheets } from "@/src/commons/stamp/components/StampFieldSheets/StampFieldSheets";
import { useStampFieldEditors } from "@/src/commons/stamp/hooks/useStampFieldEditors";
import { formatIsoDateTime } from "@/src/utils/datetime/format";

export default function StampDetailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [stamp, setStamp] = React.useState<Stamp | null>(null);
  // id が無い／DB に該当行が無い／読み込みに失敗した、のいずれか。
  // どれも「このスタンプは出せない」なので同じ表示にまとめる
  const [stampUnavailable, setStampUnavailable] = React.useState(false);
  const stampLatitude = stamp?.location?.latitude ?? null;
  const stampLongitude = stamp?.location?.longitude ?? null;
  const [showLandmarkName, setShowLandmarkName] = React.useState(true);

  const editors = useStampFieldEditors({
    stampId: id,
    stamp,
    editableDate: true,
    onUpdated: setStamp,
    logTag: "[stamp-detail]",
  });

  const design = useStampDesignChange({
    stampId: id,
    stamp,
    onUpdated: setStamp,
  });

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getStamp(id)
      .then((loaded) => {
        if (cancelled) return;
        if (!loaded) {
          setStampUnavailable(true);
          return;
        }
        setStamp(loaded);
      })
      .catch((error) => {
        console.error("[stamp-detail] failed to load stamp", error);
        if (!cancelled) setStampUnavailable(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const [deleteDialogVisible, setDeleteDialogVisible] = React.useState(false);

  const handleConfirmDelete = async () => {
    setDeleteDialogVisible(false);
    if (id) {
      // 端末ローカルの削除は即座に効くので、完了を待ってからアルバムへ戻る。
      // 一覧はフォーカス時に読み直すため、消えた行が再表示されることはない
      try {
        await deleteStamp(id);
      } catch (error) {
        console.error("[stamp-detail] failed to delete stamp", error);
      }
    }
    router.back();
  };

  const handleShare = async () => {
    if (!design.imageUri) return;
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          t("stampDetail.shareUnavailableTitle"),
          t("stampDetail.shareUnavailableMessage"),
        );
        return;
      }

      // 画像は端末の documentDirectory にあるので、そのまま渡せる
      await Sharing.shareAsync(design.imageUri, {
        dialogTitle: editors.spotName || undefined,
      });
    } catch (error) {
      console.error("[stamp-detail] failed to share image", error);
      Alert.alert(
        t("stampDetail.shareFailedTitle"),
        t("stampDetail.shareFailedMessage"),
      );
    }
  };

  if (!id || stampUnavailable) {
    return (
      <View style={[styles.container, styles.status]}>
        <Text style={styles.statusText}>{t("stampDetail.notFound")}</Text>
        <CommonButton
          label={t("stampDetail.backToAlbum")}
          // replace だと履歴に残っているアルバムの上へ積むだけで同じ画面が 2 枚になる。
          // dismissTo は履歴のアルバムまで戻り、履歴に無ければ現在の画面を置き換える
          onPress={() => router.dismissTo("/(tabs)/album")}
          variant="secondary"
        />
      </View>
    );
  }

  if (!stamp) {
    return (
      <View style={[styles.container, styles.status]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.xl }]}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.iconGlyph}>‹</Text>
        </TouchableOpacity>
        <ShareButton onPress={handleShare} size={44} />
      </View>
      <StampDetailMediaPager
        spotName={editors.spotName}
        imageUri={design.displayImageUri || undefined}
        onPressDesignChange={design.open}
        onPressSpotName={editors.openSpotName}
        latitude={stampLatitude}
        longitude={stampLongitude}
      />
      <StampInfoCard
        date={formatIsoDateTime(editors.capturedAt)}
        location={editors.location}
        memo={editors.memo}
        onPressDate={editors.openDate}
        onPressLocation={editors.openLocation}
        onPressMemo={editors.openMemo}
      />
      <View style={styles.deleteSection}>
        <CommonButton
          label={t("stampDetail.delete")}
          onPress={() => setDeleteDialogVisible(true)}
          variant="ghost"
          icon={<Trash2 size={16} color={colors.danger} />}
          textStyle={styles.deleteLabel}
        />
      </View>
      <CommonDialog
        visible={deleteDialogVisible}
        title={t("stampDetail.deleteConfirmTitle")}
        message={t("stampDetail.deleteConfirmMessage")}
        confirmLabel={t("stampDetail.delete")}
        destructive
        onCancel={() => setDeleteDialogVisible(false)}
        onConfirm={handleConfirmDelete}
      />
      {design.designMode && (
        <DesignChangePanel
          onBack={design.close}
          onShare={handleShare}
          // プレビューが出来るまでは保存済みの絵を出しておく
          imageUri={design.previewUri || design.imageUri || undefined}
          loading={design.previewLoading}
          confirming={design.updating}
          frameStyles={FRAME_STYLE_OPTIONS}
          selectedFrameStyleId={design.selectedFrameStyleId}
          onSelectFrameStyle={design.setSelectedFrameStyleId}
          colorOptions={STAMP_INK_COLORS}
          selectedColor={design.selectedColor}
          onSelectColor={design.setSelectedColor}
          showLandmarkName={showLandmarkName}
          onToggleShowLandmarkName={setShowLandmarkName}
          onConfirm={design.confirm}
        />
      )}
      <StampFieldSheets editors={editors} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  status: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.l,
  },
  statusText: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
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
  deleteSection: {
    marginTop: "auto",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  deleteLabel: {
    color: colors.danger,
  },
});
