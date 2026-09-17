import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Sharing from "expo-sharing";
import { DesignChangePanel } from "@/src/features/album/components/stamp-rally/DesignChangePanel/DesignChangePanel";
import { FRAME_STYLE_OPTIONS } from "@/src/features/camera/constants/frameStyleOptions";
import {
  DEFAULT_STAMP_COLOR,
  STAMP_INK_COLORS,
} from "@/src/utils/stamp/constants/constants";
import { ShareButton } from "@/src/commons/button/components/ShareButton/ShareButton";
import { CommonButton } from "@/src/commons/button/components/CommonButton/CommonButton";
import { CommonDialog } from "@/src/commons/sheet/components/CommonDialog/CommonDialog";
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
import { StampDetailMediaPager } from "@/src/features/album/components/detail/StampDetailMediaPager/StampDetailMediaPager";
import { StampInfoCard } from "@/src/commons/stamp/components/StampInfoCard/StampInfoCard";
import { EditFieldSheet } from "@/src/commons/sheet/components/EditFieldSheet/EditFieldSheet";
import { formatIsoDateTime, parseIso } from "@/src/utils/datetime/format";
import { useReverseGeocode } from "@/src/libs/location/useReverseGeocode";

// 撮影日時が壊れている場合でもピッカーは開けるようにし、現在時刻から選ばせる
function parseCapturedAt(isoDate: string): Date {
  return parseIso(isoDate) ?? new Date();
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

  const [spotName, setSpotName] = React.useState("");
  // 撮影日時は ISO 文字列のまま保持する。表示のときだけ整形する
  const [capturedAt, setCapturedAt] = React.useState("");
  // 利用者が入力した場所。入っていれば逆引きした住所より優先する
  const [editedLocation, setEditedLocation] = React.useState("");
  const geocoded = useReverseGeocode(stamp?.location ?? null);
  const location = editedLocation || geocoded.address;
  const [memo, setMemo] = React.useState("");
  const [detailUpdating, setDetailUpdating] = React.useState(false);

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
      setSelectedFrameStyleId(loaded.frameId);
      setSpotName(loaded.title ?? "");
      setMemo(loaded.memo ?? "");
      setCapturedAt(loaded.capturedAt);
    });
  }, [id]);

  // デザイン変更中は選択中の色/フレームでプレビューを生成する(作成画面と同じ cancelled フラグ方式)
  React.useEffect(() => {
    if (!designMode || !originalUri) {
      // プレビューの生成を止めたときの後始末。描画は外部（Skia）で走らせており、
      // 捨てる操作をレンダー側に寄せられないためここで消す
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreviewUri(null);
      return;
    }
    const color = selectedColor;
    const frame = selectedFrameStyleId;
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
    // 適用せずに閉じたので選択を捨て、保存済みのデザインに戻す。
    // 残したままだと、開き直したときに実際のスタンプと違う選択が出る
    if (stamp) {
      setSelectedColor(stamp.color);
      setSelectedFrameStyleId(stamp.frameId);
    }
  };

  const handleConfirmDesign = async () => {
    if (!id || !originalUri || designUpdating) return;
    const color = selectedColor;
    const frame = selectedFrameStyleId;
    if (!color) return;
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

  const [editingField, setEditingField] = React.useState<EditingField>(null);
  const [draftSpotName, setDraftSpotName] = React.useState(spotName);
  const [draftLocation, setDraftLocation] = React.useState(location);
  const [draftDate, setDraftDate] = React.useState(() =>
    parseCapturedAt(capturedAt),
  );
  const [draftMemo, setDraftMemo] = React.useState(memo);

  const openSpotNameEditor = () => {
    setDraftSpotName(spotName);
    setEditingField("spotName");
  };
  const openDateEditor = () => {
    setDraftDate(parseCapturedAt(capturedAt));
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
      setCapturedAt(updated.capturedAt);
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
        date={formatIsoDateTime(capturedAt)}
        location={location}
        locationPlaceholder={
          geocoded.failed ? t("stampDetail.placeLookupFailed") : undefined
        }
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
          setEditedLocation(draftLocation.trim() || location);
          closeEditor();
        }}
      />
      <EditFieldSheet
        visible={editingField === "date"}
        onClose={closeEditor}
        title={t("stampDetail.editDate")}
        mode="datetime"
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
