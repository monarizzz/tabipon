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
  // 作成時の演出値。デザイン変更でも同じ見た目になるよう引き継いで再適用する
  const stampTiltAngle = stamp?.tiltAngle ?? 0;
  const stampScratchLevel = stamp?.scratchLevel ?? 0;
  const [designMode, setDesignMode] = React.useState(false);
  const [selectedFrameStyleId, setSelectedFrameStyleId] = React.useState(
    FRAME_STYLE_OPTIONS[0].id,
  );
  const [selectedColor, setSelectedColor] = React.useState(DEFAULT_STAMP_COLOR);
  const [showLandmarkName, setShowLandmarkName] = React.useState(true);

  const editors = useStampFieldEditors({
    stampId: id,
    stamp,
    editableDate: true,
    onUpdated: setStamp,
    logTag: "[stamp-detail]",
  });

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
    let cancelled = false;
    getStamp(id)
      .then((loaded) => {
        if (cancelled) return;
        if (!loaded) {
          setStampUnavailable(true);
          return;
        }
        setStamp(loaded);
        setCurrentImageUri(stampImageUri(loaded));
        setOriginalUri(originalPhotoUri(loaded));
        setSelectedColor(loaded.color);
        setSelectedFrameStyleId(loaded.frameId);
      })
      .catch((error) => {
        console.error("[stamp-detail] failed to load stamp", error);
        if (!cancelled) setStampUnavailable(true);
      });
    return () => {
      cancelled = true;
    };
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
        imageUri={displayImageUri || undefined}
        onPressDesignChange={handleOpenDesignChange}
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
