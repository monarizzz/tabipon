import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { DesignChangePanel } from "@/src/components/features/album/stamp-rally/DesignChangePanel/DesignChangePanel";
import {
  FRAME_STYLE_OPTIONS,
  STAMP_COLOR_OPTIONS,
  API_COLOR_BY_HEX,
  API_FRAME_BY_ID,
} from "@/src/components/features/camera/DesignChangeSheet/frameStyleOptions";
import { ShareButton } from "@/src/components/common/ShareButton/ShareButton";
import { CommonButton } from "@/src/components/common/CommonButton/CommonButton";
import { CommonDialog } from "@/src/components/common/CommonDialog/CommonDialog";
import { Trash2 } from "lucide-react-native";
import {
  deleteStamp,
  updateStampDetails,
  updateStampImage,
  previewStampImage,
} from "@/src/api/stamps";
import { markStampDeleted } from "@/src/api/deletedStamps";
import { getOriginalPhotoUri } from "@/src/utils/originalPhotoStore";
import { useTranslation } from "@/src/i18n/I18nProvider";
import { colors, radii, spacing } from "@/src/theme/tokens";
import { StampDetailMediaPager } from "@/src/components/features/album/detail/StampDetailMediaPager/StampDetailMediaPager";
import { StampInfoCard } from "@/src/components/features/album/detail/StampInfoCard/StampInfoCard";
import { EditFieldSheet } from "@/src/components/features/album/detail/EditFieldSheet/EditFieldSheet";

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}/${month}/${day}`;
}

function formatDateParam(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return formatDate(date);
}

function parseDate(value: string): Date {
  const [year, month, day] = value.split(/[/.]/).map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function normalizeParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function normalizeOptionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}

type EditingField = "spotName" | "date" | "location" | "memo" | null;

export default function StampDetailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const {
    id,
    imageUri,
    date: paramDate,
    latitude: paramLat,
    longitude: paramLon,
    spotName: paramSpotName,
    memo: paramMemo,
  } = useLocalSearchParams<{
    id?: string;
    imageUri?: string;
    date?: string;
    latitude?: string;
    longitude?: string;
    spotName?: string;
    memo?: string;
  }>();
  const stampLatitude = paramLat ? parseFloat(paramLat) : null;
  const stampLongitude = paramLon ? parseFloat(paramLon) : null;
  const [designMode, setDesignMode] = React.useState(false);
  const [selectedFrameStyleId, setSelectedFrameStyleId] = React.useState(
    FRAME_STYLE_OPTIONS[0].id,
  );
  const [selectedColor, setSelectedColor] = React.useState(
    STAMP_COLOR_OPTIONS[0],
  );
  const [showLandmarkName, setShowLandmarkName] = React.useState(true);

  // 表示中のスタンプ画像。デザイン変更後に即差し替える
  const [currentImageUri, setCurrentImageUri] = React.useState(imageUri || "");
  // この端末に保存された元写真の uri(無ければデザイン変更不可)
  const [originalUri, setOriginalUri] = React.useState<string | null>(null);
  const [designUpdating, setDesignUpdating] = React.useState(false);
  // デザイン変更中の、選択中デザインのリアルタイムプレビュー(data-URI)
  const [previewUri, setPreviewUri] = React.useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);

  React.useEffect(() => {
    setCurrentImageUri(imageUri || "");
  }, [imageUri]);

  React.useEffect(() => {
    if (!id) return;
    getOriginalPhotoUri(id).then(setOriginalUri);
  }, [id]);

  // デザイン変更中は選択中の色/フレームでプレビューを生成する(作成画面と同じ cancelled フラグ方式)
  React.useEffect(() => {
    if (!designMode || !originalUri) {
      setPreviewUri(null);
      return;
    }
    const color = API_COLOR_BY_HEX[selectedColor] ?? "red";
    const frame = API_FRAME_BY_ID[selectedFrameStyleId] ?? "classic";
    let cancelled = false;
    setPreviewLoading(true);
    previewStampImage(originalUri, color, 0, frame)
      .then((dataUri) => {
        if (!cancelled) {
          setPreviewUri(dataUri);
          setPreviewLoading(false);
        }
      })
      .catch((error) => {
        if (!cancelled) setPreviewLoading(false);
        console.warn("[stamp-detail] preview generation failed", error);
      });
    return () => {
      cancelled = true;
    };
  }, [designMode, originalUri, selectedColor, selectedFrameStyleId]);

  const handleOpenDesignChange = () => {
    if (!originalUri) {
      Alert.alert(
        t("stampDetail.designUnavailableTitle"),
        t("stampDetail.designUnavailableMessage"),
      );
      return;
    }
    setDesignMode(true);
  };

  const handleCloseDesignChange = () => {
    setDesignMode(false);
    setPreviewUri(null);
  };

  const handleConfirmDesign = async () => {
    if (!id || !originalUri || designUpdating) return;
    const color = API_COLOR_BY_HEX[selectedColor];
    const frame = API_FRAME_BY_ID[selectedFrameStyleId];
    if (!color || !frame) return;
    setDesignUpdating(true);
    try {
      const updated = await updateStampImage(id, originalUri, color, 0, frame);
      setCurrentImageUri(updated.image_url);
      setPreviewUri(null);
      setDesignMode(false);
    } catch (error) {
      console.error("[stamp-detail] failed to update design", error);
      Alert.alert(t("stampDetail.designUpdateFailedTitle"), t("stampDetail.designUpdateFailedMessage"));
    } finally {
      setDesignUpdating(false);
    }
  };

  const [spotName, setSpotName] = React.useState(() => normalizeParam(paramSpotName));
  const [date, setDate] = React.useState(() => normalizeParam(paramDate));
  const [location, setLocation] = React.useState("");
  const [memo, setMemo] = React.useState(() => normalizeParam(paramMemo));
  const [detailUpdating, setDetailUpdating] = React.useState(false);

  React.useEffect(() => {
    if (!stampLatitude || !stampLongitude) return;
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
    fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${stampLatitude},${stampLongitude}&key=${apiKey}&language=ja`
    )
      .then((res) => res.json())
      .then((data) => {
        const address = data.results?.[0]?.formatted_address;
        if (address) setLocation(address);
      })
      .catch(() => {});
  }, [stampLatitude, stampLongitude]);

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

  const handleSaveSpotName = async () => {
    if (!id || detailUpdating) return;
    const nextSpotName = normalizeOptionalText(draftSpotName);
    setDetailUpdating(true);
    try {
      const updated = await updateStampDetails(id, { spot_name: nextSpotName });
      setSpotName(updated.spot_name ?? "");
      closeEditor();
    } catch (error) {
      console.error("[stamp-detail] failed to update spot name", error);
      Alert.alert(t("stampDetail.saveFailedTitle"), t("stampDetail.saveFailedMessage"));
    } finally {
      setDetailUpdating(false);
    }
  };

  const handleSaveMemo = async () => {
    if (!id || detailUpdating) return;
    const nextMemo = normalizeOptionalText(draftMemo);
    setDetailUpdating(true);
    try {
      const updated = await updateStampDetails(id, { memo: nextMemo });
      setMemo(updated.memo ?? "");
      closeEditor();
    } catch (error) {
      console.error("[stamp-detail] failed to update memo", error);
      Alert.alert(t("stampDetail.saveFailedTitle"), t("stampDetail.saveFailedMessage"));
    } finally {
      setDetailUpdating(false);
    }
  };

  const handleSaveDate = async () => {
    if (!id || detailUpdating) return;
    setDetailUpdating(true);
    try {
      const updated = await updateStampDetails(id, {
        acquired_at: draftDate.toISOString(),
      });
      setDate(formatDateParam(updated.acquired_at ?? draftDate.toISOString()));
      closeEditor();
    } catch (error) {
      console.error("[stamp-detail] failed to update date", error);
      Alert.alert(t("stampDetail.saveFailedTitle"), t("stampDetail.saveFailedMessage"));
    } finally {
      setDetailUpdating(false);
    }
  };

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
    if (!currentImageUri) return;
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(t("stampDetail.shareUnavailableTitle"), t("stampDetail.shareUnavailableMessage"));
        return;
      }

      let localUri = currentImageUri;
      if (/^https?:\/\//.test(currentImageUri)) {
        const ext = currentImageUri.split(/[?#]/)[0].split(".").pop()?.toLowerCase();
        const fileName = `share-${Date.now()}.${ext && ext.length <= 4 ? ext : "png"}`;
        const downloaded = await File.downloadFileAsync(currentImageUri, new File(Paths.cache, fileName));
        localUri = downloaded.uri;
      }

      await Sharing.shareAsync(localUri, { dialogTitle: spotName || undefined });
    } catch (error) {
      console.error("[stamp-detail] failed to share image", error);
      Alert.alert(t("stampDetail.shareFailedTitle"), t("stampDetail.shareFailedMessage"));
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
        imageUri={currentImageUri || undefined}
        onPressDesignChange={handleOpenDesignChange}
        onPressSpotName={openSpotNameEditor}
        latitude={stampLatitude}
        longitude={stampLongitude}
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
          onBack={handleCloseDesignChange}
          onShare={handleShare}
          imageUri={(designMode && previewUri ? previewUri : currentImageUri) || undefined}
          loading={previewLoading}
          confirming={designUpdating}
          frameStyles={FRAME_STYLE_OPTIONS}
          selectedFrameStyleId={selectedFrameStyleId}
          onSelectFrameStyle={setSelectedFrameStyleId}
          colorOptions={STAMP_COLOR_OPTIONS}
          selectedColor={selectedColor}
          onSelectColor={setSelectedColor}
          showLandmarkName={showLandmarkName}
          onToggleShowLandmarkName={setShowLandmarkName}
          onConfirm={handleConfirmDesign}
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
        onSave={handleSaveSpotName}
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
        onSave={handleSaveDate}
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
        onSave={handleSaveMemo}
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
