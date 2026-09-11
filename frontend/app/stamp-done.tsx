import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Share,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Camera, Image, User, RotateCcw } from "lucide-react-native";
import { TabBar } from "@/src/components/common/layout/TabBar/TabBar";
import { CommonButton } from "@/src/components/common/CommonButton/CommonButton";
import { CommonDialog } from "@/src/components/common/CommonDialog/CommonDialog";
import { StampInfoCard } from "@/src/components/common/StampInfoCard/StampInfoCard";
import { EditFieldSheet } from "@/src/components/common/EditFieldSheet/EditFieldSheet";
import { StampResultHeader } from "@/src/components/features/camera/StampResultHeader/StampResultHeader";
import { StampShowcase } from "@/src/components/features/camera/StampShowcase/StampShowcase";
import { StampDoneActions } from "@/src/components/features/camera/StampDoneActions/StampDoneActions";
import {
  clearSession,
  getChosenPreviewUri,
  getSession,
} from "@/src/api/stampSession";
import { deleteStamp, updateStampDetails } from "@/src/api/stamps";
import { markStampDeleted } from "@/src/api/deletedStamps";
import { useTranslation } from "@/src/i18n/I18nProvider";
import { colors, spacing } from "@/src/theme/tokens";

function normalizeOptionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}

type EditingField = "spotName" | "location" | "memo" | null;

const today = new Date();
const formattedDate = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;

export default function StampDoneScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    stampTop: stampTopParam,
    stampId,
    imageUrl,
    scratchLevel,
    peak,
  } = useLocalSearchParams<{
    stampTop?: string;
    stampId?: string;
    imageUrl?: string;
    scratchLevel?: string;
    peak?: string;
  }>();
  const previewUri = getChosenPreviewUri();
  const [spotName, setSpotName] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [memo, setMemo] = React.useState("");
  const [detailUpdating, setDetailUpdating] = React.useState(false);
  const [retakeDialogVisible, setRetakeDialogVisible] = React.useState(false);

  // 撮影時に記録した位置情報から住所を逆引きする(アルバム詳細画面と同じ方式)
  React.useEffect(() => {
    const sessionLocation = getSession()?.location;
    if (!sessionLocation) return;
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
    fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${sessionLocation.latitude},${sessionLocation.longitude}&key=${apiKey}&language=ja`,
    )
      .then((res) => res.json())
      .then((data) => {
        const address = data.results?.[0]?.formatted_address;
        if (address) setLocation(address);
      })
      .catch(() => {});
  }, []);

  const [editingField, setEditingField] = React.useState<EditingField>(null);
  const [draftSpotName, setDraftSpotName] = React.useState(spotName);
  const [draftLocation, setDraftLocation] = React.useState(location);
  const [draftMemo, setDraftMemo] = React.useState(memo);

  const openSpotNameEditor = () => {
    setDraftSpotName(spotName);
    setEditingField("spotName");
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
    if (!stampId || detailUpdating) return;
    const nextSpotName = normalizeOptionalText(draftSpotName);
    setDetailUpdating(true);
    try {
      const updated = await updateStampDetails(stampId, {
        spot_name: nextSpotName,
      });
      setSpotName(updated.spot_name ?? "");
      closeEditor();
    } catch (error) {
      console.error("[stamp-done] failed to update spot name", error);
      Alert.alert(
        t("stampDetail.saveFailedTitle"),
        t("stampDetail.saveFailedMessage"),
      );
    } finally {
      setDetailUpdating(false);
    }
  };

  const handleSaveMemo = async () => {
    if (!stampId || detailUpdating) return;
    const nextMemo = normalizeOptionalText(draftMemo);
    setDetailUpdating(true);
    try {
      const updated = await updateStampDetails(stampId, { memo: nextMemo });
      setMemo(updated.memo ?? "");
      closeEditor();
    } catch (error) {
      console.error("[stamp-done] failed to update memo", error);
      Alert.alert(
        t("stampDetail.saveFailedTitle"),
        t("stampDetail.saveFailedMessage"),
      );
    } finally {
      setDetailUpdating(false);
    }
  };

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
  // (スポット名/場所/メモの入力欄が増えた分、全体を少し上に詰めてスクロール不要にする)
  const headerAnchorHeight = Number.isFinite(stampTop)
    ? Math.max(0, stampTop - spacing.m - spacing.xxxl * 3)
    : undefined;

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
            style={[
              styles.headerAnchor,
              headerAnchorHeight !== undefined && {
                height: headerAnchorHeight,
              },
            ]}
          >
            <StampResultHeader />
          </View>
          <StampShowcase
            imageUri={imageUrl ?? previewUri ?? undefined}
            onShare={() =>
              Share.share({ message: t("stampDone.shareMessage") })
            }
            spotName={spotName}
            onPressSpotName={openSpotNameEditor}
          />
          {/* styles.debugText は定義されておらず、これまでも未適用のまま描画されていた。
              見た目を変えないよう参照だけ外している。この DEBUG 表示自体の要否は別途判断する */}
          {scratchLevel !== undefined && (
            <Text>
              [DEBUG] scratch: {scratchLevel} / peak: {peak}
            </Text>
          )}
          <View style={styles.actionsAnchor}>
            <StampInfoCard
              date={formattedDate}
              location={location}
              memo={memo}
              onPressLocation={openLocationEditor}
              onPressMemo={openMemoEditor}
            />
            <StampDoneActions
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
