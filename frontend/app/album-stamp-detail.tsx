import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Share, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DesignChangeSheet } from "@/src/components/features/camera/DesignChangeSheet/DesignChangeSheet";
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
import { deleteStamp, updateStampImage, previewStampImage } from "@/src/api/stamps";
import { getOriginalPhotoUri } from "@/src/utils/originalPhotoStore";
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
  const insets = useSafeAreaInsets();
  const { id, imageUri, date: paramDate } = useLocalSearchParams<{
    id?: string;
    imageUri?: string;
    date?: string;
  }>();
  const [designSheetVisible, setDesignSheetVisible] = React.useState(false);
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
  // デザインシートを開いている間の、選択中デザインのリアルタイムプレビュー(data-URI)
  const [previewUri, setPreviewUri] = React.useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);

  React.useEffect(() => {
    setCurrentImageUri(imageUri || "");
  }, [imageUri]);

  React.useEffect(() => {
    if (!id) return;
    getOriginalPhotoUri(id).then(setOriginalUri);
  }, [id]);

  // シート表示中は選択中の色/フレームでプレビューを生成する(作成画面と同じ cancelled フラグ方式)
  React.useEffect(() => {
    if (!designSheetVisible || !originalUri) {
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
  }, [designSheetVisible, originalUri, selectedColor, selectedFrameStyleId]);

  const handleOpenDesignChange = () => {
    if (!originalUri) {
      Alert.alert(
        "デザインを変更できません",
        "このスタンプはこの端末で作成されていないため、デザインを変更できません。",
      );
      return;
    }
    setDesignSheetVisible(true);
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
      setDesignSheetVisible(false);
    } catch (error) {
      console.error("[stamp-detail] failed to update design", error);
      Alert.alert("エラー", "デザインの変更に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setDesignUpdating(false);
    }
  };

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
      // 削除はバックグラウンドで実行し、結果を待たずにアルバムへ戻る
      deleteStamp(id).catch((error) => {
        console.error("[stamp-detail] failed to delete stamp", error);
      });
    }
    router.replace("/(tabs)/album");
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: [spotName, location, memo].filter(Boolean).join("\n"),
        url: currentImageUri,
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
        imageUri={(designSheetVisible && previewUri ? previewUri : currentImageUri) || undefined}
        previewLoading={designSheetVisible && previewLoading}
        onPressDesignChange={handleOpenDesignChange}
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
          label="削除する"
          onPress={() => setDeleteDialogVisible(true)}
          variant="ghost"
          icon={<Trash2 size={16} color={colors.danger} />}
          textStyle={styles.deleteLabel}
        />
      </View>
      <CommonDialog
        visible={deleteDialogVisible}
        title="スタンプを削除しますか?"
        message="削除したスタンプは元に戻せません。"
        confirmLabel="削除する"
        destructive
        onCancel={() => setDeleteDialogVisible(false)}
        onConfirm={handleConfirmDelete}
      />
      <DesignChangeSheet
        visible={designSheetVisible}
        onClose={() => {
          setDesignSheetVisible(false);
          setPreviewUri(null);
        }}
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
      <EditFieldSheet
        visible={editingField === "spotName"}
        onClose={closeEditor}
        title="タイトルを編集"
        mode="text"
        value={draftSpotName}
        onChangeValue={setDraftSpotName}
        placeholder="スポット名を入力"
        onSave={() => {
          setSpotName(draftSpotName.trim() || spotName);
          closeEditor();
        }}
      />
      <EditFieldSheet
        visible={editingField === "location"}
        onClose={closeEditor}
        title="場所を編集"
        mode="text"
        value={draftLocation}
        onChangeValue={setDraftLocation}
        placeholder="場所を入力"
        onSave={() => {
          setLocation(draftLocation.trim() || location);
          closeEditor();
        }}
      />
      <EditFieldSheet
        visible={editingField === "date"}
        onClose={closeEditor}
        title="日付を編集"
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
        title="メモを編集"
        mode="text"
        value={draftMemo}
        onChangeValue={setDraftMemo}
        placeholder="メモを入力"
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
