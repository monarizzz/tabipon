import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Trash2 } from "lucide-react-native";

import { CommonButton } from "@/src/commons/button/components/CommonButton/CommonButton";
import { ShareButton } from "@/src/commons/button/components/ShareButton/ShareButton";
import { CommonDialog } from "@/src/commons/sheet/components/CommonDialog/CommonDialog";
import { StampFieldSheets } from "@/src/commons/stamp/components/StampFieldSheets/StampFieldSheets";
import { StampInfoCard } from "@/src/commons/stamp/components/StampInfoCard/StampInfoCard";
import { StampDetailMediaPager } from "@/src/features/album/components/detail/StampDetailMediaPager/StampDetailMediaPager";
import { DesignChangePanel } from "@/src/features/album/components/stamp-rally/DesignChangePanel/DesignChangePanel";
import type { StampDetail } from "@/src/features/album/types/stampDetail";
import { FRAME_STYLE_OPTIONS } from "@/src/features/camera/constants/frameStyleOptions";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { formatIsoDateTime } from "@/src/utils/datetime/format";
import { STAMP_INK_COLORS } from "@/src/utils/stamp/constants/constants";
import { colors, radii, spacing, typography } from "@/src/style/tokens";

type Props = StampDetail;

export function StampDetailMain({
  loading,
  unavailable,
  latitude,
  longitude,
  editors,
  design,
  showLandmarkName,
  toggleShowLandmarkName,
  deleteDialogVisible,
  openDeleteDialog,
  cancelDelete,
  confirmDelete,
  back,
  backToAlbum,
  share,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  if (unavailable) {
    return (
      <View style={[styles.container, styles.status]}>
        <Text style={styles.statusText}>{t("stampDetail.notFound")}</Text>
        <CommonButton
          label={t("stampDetail.backToAlbum")}
          onPress={backToAlbum}
          variant="secondary"
        />
      </View>
    );
  }

  if (loading) {
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
          onPress={back}
          activeOpacity={0.7}
        >
          <Text style={styles.iconGlyph}>‹</Text>
        </TouchableOpacity>
        <ShareButton onPress={share} size={44} />
      </View>
      <StampDetailMediaPager
        spotName={editors.spotName}
        imageUri={design.displayImageUri || undefined}
        onPressDesignChange={design.open}
        onPressSpotName={editors.openSpotName}
        latitude={latitude}
        longitude={longitude}
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
          onPress={openDeleteDialog}
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
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />
      {design.designMode && (
        <DesignChangePanel
          onBack={design.close}
          onShare={share}
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
          onToggleShowLandmarkName={toggleShowLandmarkName}
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
