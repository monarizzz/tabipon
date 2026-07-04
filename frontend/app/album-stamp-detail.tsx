import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Share } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DesignChangePanel } from "@/src/components/features/album/stamp-rally/DesignChangePanel/DesignChangePanel";
import {
  FRAME_STYLE_OPTIONS,
  STAMP_COLOR_OPTIONS,
} from "@/src/components/features/camera/DesignChangeSheet/frameStyleOptions";
import { ShareButton } from "@/src/components/common/ShareButton/ShareButton";
import { CommonButton } from "@/src/components/common/CommonButton/CommonButton";
import { CommonDialog } from "@/src/components/common/CommonDialog/CommonDialog";
import { Trash2 } from "lucide-react-native";
import { deleteStamp } from "@/src/api/stamps";
import { markStampDeleted } from "@/src/api/deletedStamps";
import { useTranslation } from "@/src/i18n/I18nProvider";
import { colors, radii, spacing } from "@/src/theme/tokens";
import { StampDetailMediaPager } from "@/src/components/features/album/detail/StampDetailMediaPager/StampDetailMediaPager";
import { StampInfoCard } from "@/src/components/features/album/detail/StampInfoCard/StampInfoCard";
import { EditFieldSheet } from "@/src/components/features/album/detail/EditFieldSheet/EditFieldSheet";

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function parseDate(value: string): Date {
  const [year, month, day] = value.split(".").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

type EditingField = "spotName" | "date" | "location" | "memo" | null;

export default function StampDetailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { id, imageUri, date: paramDate } = useLocalSearchParams<{
    id?: string;
    imageUri?: string;
    date?: string;
  }>();
  const [designMode, setDesignMode] = React.useState(false);
  const [selectedFrameStyleId, setSelectedFrameStyleId] = React.useState(
    FRAME_STYLE_OPTIONS[0].id,
  );
  const [selectedColor, setSelectedColor] = React.useState(
    STAMP_COLOR_OPTIONS[0],
  );
  const [showLandmarkName, setShowLandmarkName] = React.useState(true);

  const [spotName, setSpotName] = React.useState("");
  const [date, setDate] = React.useState(paramDate || "");
  const [location, setLocation] = React.useState("");
  const [memo, setMemo] = React.useState("");

  const [editingField, setEditingField] = React.useState<EditingField>(null);
  const [draftSpotName, setDraftSpotName] = React.useState(spotName);
  const [draftLocation, setDraftLocation] = React.useState(location);
  const [draftDate, setDraftDate] = React.useState(() =>
    date ? parseDate(date) : new Date(),
  );
  const [draftMemo, setDraftMemo] = React.useState(memo);

  const openSpotNameEditor = () => {
    setDraftSpotName(spotName);
    setEditingField("spotName");
  };
  const openDateEditor = () => {
    setDraftDate(date ? parseDate(date) : new Date());
    setEditingField("date");
  };
  const openLocationEditor = () => {
    setDraftLocation(location);
    setEditingField("location");
  };
  const openMemoEditor = () => {
    setDraftMemo(memo);
    setEditingField("memo");
  };
  const closeEditor = () => setEditingField(null);

  const [deleteDialogVisible, setDeleteDialogVisible] = React.useState(false);

  const handleConfirmDelete = () => {
    setDeleteDialogVisible(false);
    if (id) {
      // アルバム側で即座に一覧から除外し、削除反映前のリフェッチで再表示されるのを防ぐ
      markStampDeleted(id);
      // 削除はバックグラウンドで実行し、結果を待たずにアルバムへ戻る
      deleteStamp(id).catch((error) => {
        console.error("[stamp-detail] failed to delete stamp", error);
      });
    }
    router.back();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: [spotName, location, memo].filter(Boolean).join("\n"),
        url: imageUri,
      });
    } catch {
      // ユーザーによるキャンセル等は無視
    }
  };

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
        spotName={spotName}
        imageUri={imageUri || undefined}
        onPressDesignChange={() => setDesignMode(true)}
        onPressSpotName={openSpotNameEditor}
        latitude={0}
        longitude={0}
      />
      <StampInfoCard
        date={date}
        location={location}
        memo={memo}
        onPressDate={openDateEditor}
        onPressLocation={openLocationEditor}
        onPressMemo={openMemoEditor}
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
      {designMode && (
        <DesignChangePanel
          onBack={() => setDesignMode(false)}
          onShare={handleShare}
          imageUri={imageUri || undefined}
          frameStyles={FRAME_STYLE_OPTIONS}
          selectedFrameStyleId={selectedFrameStyleId}
          onSelectFrameStyle={setSelectedFrameStyleId}
          colorOptions={STAMP_COLOR_OPTIONS}
          selectedColor={selectedColor}
          onSelectColor={setSelectedColor}
          showLandmarkName={showLandmarkName}
          onToggleShowLandmarkName={setShowLandmarkName}
          onConfirm={() => setDesignMode(false)}
        />
      )}
      <EditFieldSheet
        visible={editingField === "spotName"}
        onClose={closeEditor}
        title={t("stampDetail.editTitle")}
        mode="text"
        value={draftSpotName}
        onChangeValue={setDraftSpotName}
        placeholder={t("stampDetail.editTitlePlaceholder")}
        onSave={() => {
          setSpotName(draftSpotName.trim() || spotName);
          closeEditor();
        }}
      />
      <EditFieldSheet
        visible={editingField === "location"}
        onClose={closeEditor}
        title={t("stampDetail.editPlace")}
        mode="text"
        value={draftLocation}
        onChangeValue={setDraftLocation}
        placeholder={t("stampDetail.editPlacePlaceholder")}
        onSave={() => {
          setLocation(draftLocation.trim() || location);
          closeEditor();
        }}
      />
      <EditFieldSheet
        visible={editingField === "date"}
        onClose={closeEditor}
        title={t("stampDetail.editDate")}
        mode="date"
        value={draftDate}
        onChangeValue={setDraftDate}
        onSave={() => {
          setDate(formatDate(draftDate));
          closeEditor();
        }}
      />
      <EditFieldSheet
        visible={editingField === "memo"}
        onClose={closeEditor}
        title={t("stampDetail.editMemo")}
        mode="text"
        value={draftMemo}
        onChangeValue={setDraftMemo}
        placeholder={t("stampDetail.editMemoPlaceholder")}
        multiline
        onSave={() => {
          setMemo(draftMemo.trim());
          closeEditor();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  deleteSection: {
    marginTop: "auto",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  deleteLabel: {
    color: colors.danger,
  },
});
