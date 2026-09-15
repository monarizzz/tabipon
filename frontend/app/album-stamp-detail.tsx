import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Sharing from "expo-sharing";
import { DesignChangePanel } from "@/src/components/features/album/stamp-rally/DesignChangePanel/DesignChangePanel";
import {
  FRAME_STYLE_OPTIONS,
  API_FRAME_BY_ID,
  FRAME_ID_BY_API,
} from "@/src/components/features/camera/DesignChangeSheet/frameStyleOptions";
import {
  DEFAULT_STAMP_COLOR,
  STAMP_INK_COLORS,
} from "@/src/utils/stamp/constants/constants";
import { ShareButton } from "@/src/components/common/ShareButton/ShareButton";
import { CommonButton } from "@/src/components/common/CommonButton/CommonButton";
import { CommonDialog } from "@/src/components/common/CommonDialog/CommonDialog";
import { Trash2 } from "lucide-react-native";
import {
  deleteStamp,
  getStamp,
  originalPhotoUri,
  replaceStampImage,
  stampImageUri,
  updateStamp,
  type Stamp,
} from "@/src/infra/db/stamps";
import {
  generateStampFromUri,
  generateStampPngFromUri,
} from "@/src/utils/stamp/io";
import { seedFromStampId } from "@/src/utils/stamp/seed";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { colors, radii, spacing } from "@/src/style/tokens";
import { StampDetailMediaPager } from "@/src/components/features/album/detail/StampDetailMediaPager/StampDetailMediaPager";
import { StampInfoCard } from "@/src/components/common/StampInfoCard/StampInfoCard";
import { EditFieldSheet } from "@/src/components/common/EditFieldSheet/EditFieldSheet";

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

function normalizeOptionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}

type EditingField = "spotName" | "date" | "location" | "memo" | null;

export default function StampDetailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [stamp, setStamp] = React.useState<Stamp | null>(null);
  const stampLatitude = stamp?.location?.latitude ?? null;
  const stampLongitude = stamp?.location?.longitude ?? null;
  // 作成時の演出値。デザイン変更でも同じ見た目になるよう引き継いで再適用する
  const stampTiltAngle = stamp?.tiltAngle ?? 0;
  const stampScratchLevel = stamp?.scratchLevel ?? 0;
  const [designMode, setDesignMode] = React.useState(false);
  const [selectedFrameStyleId, setSelectedFrameStyleId] = React.useState(
    FRAME_STYLE_OPTIONS[0].id,
  );
  const [selectedColor, setSelectedColor] = React.useState(DEFAULT_STAMP_COLOR);
  const [showLandmarkName, setShowLandmarkName] = React.useState(true);

  // 表示中のスタンプ画像の uri（file://）。共有もこの値を使う
  const [currentImageUri, setCurrentImageUri] = React.useState("");
  // デザイン変更しても画像のパスは変わらないため、同じ uri のままだと
  // 画像側のキャッシュが効いて古い絵が出る。表示のときだけクエリを足して別物として読ませる
  const [imageVersion, setImageVersion] = React.useState(0);
  const displayImageUri = currentImageUri
    ? `${currentImageUri}${imageVersion ? `?v=${imageVersion}` : ""}`
    : "";
  // この端末に残っている元写真の uri(無ければデザイン変更不可)
  const [originalUri, setOriginalUri] = React.useState<string | null>(null);
  const [designUpdating, setDesignUpdating] = React.useState(false);
  // デザイン変更中の、選択中デザインのリアルタイムプレビュー(data-URI)
  const [previewUri, setPreviewUri] = React.useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    getStamp(id).then((loaded) => {
      if (!loaded) return;
      setStamp(loaded);
      setCurrentImageUri(stampImageUri(loaded));
      setOriginalUri(originalPhotoUri(loaded));
      setSelectedColor(loaded.color);
      setSelectedFrameStyleId(
        FRAME_ID_BY_API[loaded.frameId] ?? FRAME_STYLE_OPTIONS[0].id,
      );
      setSpotName(loaded.title ?? "");
      setMemo(loaded.memo ?? "");
      setDate(formatDateParam(loaded.capturedAt));
    });
  }, [id]);

  // デザイン変更中は選択中の色/フレームでプレビューを生成する(作成画面と同じ cancelled フラグ方式)
  React.useEffect(() => {
    if (!designMode || !originalUri) {
      setPreviewUri(null);
      return;
    }
    const color = selectedColor;
    const frame = API_FRAME_BY_ID[selectedFrameStyleId] ?? "classic";
    let cancelled = false;
    setPreviewLoading(true);
    // 掠れの seed は id から導くので、色やフレームを変えても模様は変わらない
    generateStampFromUri(originalUri, {
      color,
      frame,
      scratchLevel: stampScratchLevel,
      tiltAngle: stampTiltAngle,
      seed: id ? seedFromStampId(id) : 0,
    })
      .then((image) => {
        if (cancelled) return;
        const base64 = image.encodeToBase64();
        if (base64) setPreviewUri(`data:image/png;base64,${base64}`);
        setPreviewLoading(false);
      })
      .catch((error) => {
        if (!cancelled) setPreviewLoading(false);
        console.warn("[stamp-detail] preview generation failed", error);
      });
    return () => {
      cancelled = true;
    };
  }, [
    designMode,
    id,
    originalUri,
    selectedColor,
    selectedFrameStyleId,
    stampScratchLevel,
    stampTiltAngle,
  ]);

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
    const color = selectedColor;
    const frame = API_FRAME_BY_ID[selectedFrameStyleId];
    if (!color || !frame) return;
    setDesignUpdating(true);
    try {
      const stampPng = await generateStampPngFromUri(originalUri, {
        color,
        frame,
        scratchLevel: stampScratchLevel,
        tiltAngle: stampTiltAngle,
        seed: seedFromStampId(id),
      });
      await replaceStampImage(id, stampPng);
      const updated = await updateStamp(id, { color, frameId: frame });
      setStamp(updated);
      setCurrentImageUri(stampImageUri(updated));
      setImageVersion((version) => version + 1);
      setPreviewUri(null);
      setDesignMode(false);
    } catch (error) {
      console.error("[stamp-detail] failed to update design", error);
      Alert.alert(
        t("stampDetail.designUpdateFailedTitle"),
        t("stampDetail.designUpdateFailedMessage"),
      );
    } finally {
      setDesignUpdating(false);
    }
  };

  const [spotName, setSpotName] = React.useState("");
  const [date, setDate] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [memo, setMemo] = React.useState("");
  const [detailUpdating, setDetailUpdating] = React.useState(false);

  React.useEffect(() => {
    if (!stampLatitude || !stampLongitude) return;
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
    fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${stampLatitude},${stampLongitude}&key=${apiKey}&language=ja`,
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
      const updated = await updateStamp(id, { title: nextSpotName });
      setSpotName(updated.title ?? "");
      closeEditor();
    } catch (error) {
      console.error("[stamp-detail] failed to update spot name", error);
      Alert.alert(
        t("stampDetail.saveFailedTitle"),
        t("stampDetail.saveFailedMessage"),
      );
    } finally {
      setDetailUpdating(false);
    }
  };

  const handleSaveMemo = async () => {
    if (!id || detailUpdating) return;
    const nextMemo = normalizeOptionalText(draftMemo);
    setDetailUpdating(true);
    try {
      const updated = await updateStamp(id, { memo: nextMemo });
      setMemo(updated.memo ?? "");
      closeEditor();
    } catch (error) {
      console.error("[stamp-detail] failed to update memo", error);
      Alert.alert(
        t("stampDetail.saveFailedTitle"),
        t("stampDetail.saveFailedMessage"),
      );
    } finally {
      setDetailUpdating(false);
    }
  };

  const handleSaveDate = async () => {
    if (!id || detailUpdating) return;
    setDetailUpdating(true);
    try {
      const updated = await updateStamp(id, {
        capturedAt: draftDate.toISOString(),
      });
      setDate(formatDateParam(updated.capturedAt));
      closeEditor();
    } catch (error) {
      console.error("[stamp-detail] failed to update date", error);
      Alert.alert(
        t("stampDetail.saveFailedTitle"),
        t("stampDetail.saveFailedMessage"),
      );
    } finally {
      setDetailUpdating(false);
    }
  };

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
    if (!currentImageUri) return;
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
      await Sharing.shareAsync(currentImageUri, {
        dialogTitle: spotName || undefined,
      });
    } catch (error) {
      console.error("[stamp-detail] failed to share image", error);
      Alert.alert(
        t("stampDetail.shareFailedTitle"),
        t("stampDetail.shareFailedMessage"),
      );
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
        imageUri={displayImageUri || undefined}
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
          imageUri={
            (designMode && previewUri ? previewUri : currentImageUri) ||
            undefined
          }
          loading={previewLoading}
          confirming={designUpdating}
          frameStyles={FRAME_STYLE_OPTIONS}
          selectedFrameStyleId={selectedFrameStyleId}
          onSelectFrameStyle={setSelectedFrameStyleId}
          colorOptions={STAMP_INK_COLORS}
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
