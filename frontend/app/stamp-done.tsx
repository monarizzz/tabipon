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
import { RotateCcw } from "lucide-react-native";
import { TabBar } from "@/src/commons/layout/components/TabBar/TabBar";
import { useTabBarItems } from "@/src/commons/layout/hooks/useTabBarItems";
import { CommonButton } from "@/src/commons/button/components/CommonButton/CommonButton";
import { CommonDialog } from "@/src/commons/sheet/components/CommonDialog/CommonDialog";
import { StampInfoCard } from "@/src/commons/stamp/components/StampInfoCard/StampInfoCard";
import { EditFieldSheet } from "@/src/commons/sheet/components/EditFieldSheet/EditFieldSheet";
import { StampResultHeader } from "@/src/features/camera/components/StampResultHeader/StampResultHeader";
import { StampShowcase } from "@/src/features/camera/components/StampShowcase/StampShowcase";
import { StampDoneActions } from "@/src/features/camera/components/StampDoneActions/StampDoneActions";
import {
  deleteStamp,
  getStamp,
  stampImageUri,
  updateStamp,
  type Stamp,
} from "@/src/infra/db/stamps";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { formatIsoDateTime } from "@/src/utils/datetime/format";
import { useReverseGeocode } from "@/src/libs/location/useReverseGeocode";
import { colors, spacing } from "@/src/style/tokens";

function normalizeOptionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}

type EditingField = "spotName" | "location" | "memo" | null;

export default function StampDoneScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    stampTop: stampTopParam,
    stampId,
    scratchLevel,
    peak,
  } = useLocalSearchParams<{
    stampTop?: string;
    stampId?: string;
    scratchLevel?: string;
    peak?: string;
  }>();
  const [stamp, setStamp] = React.useState<Stamp | null>(null);
  const [spotName, setSpotName] = React.useState("");
  // 利用者が入力した場所。入っていれば逆引きした住所より優先する
  const [editedLocation, setEditedLocation] = React.useState("");
  const geocoded = useReverseGeocode(stamp?.location ?? null);
  const location = editedLocation || geocoded.address;
  const [memo, setMemo] = React.useState("");
  const [detailUpdating, setDetailUpdating] = React.useState(false);
  const [retakeDialogVisible, setRetakeDialogVisible] = React.useState(false);
  // 撮影フローはここで終わりなので確認は挟まない。
  // カメラへ戻るときだけ履歴を積まないよう replace する
  const tabItems = useTabBarItems(
    React.useCallback(
      (tab) => {
        if (tab.key === "index") {
          router.replace(tab.href);
          return;
        }
        router.push(tab.href);
      },
      [router],
    ),
  );

  // 保存済みのスタンプを読み込む。前の画面で保存まで済ませてあるので必ず在る
  React.useEffect(() => {
    if (!stampId) return;
    getStamp(stampId).then((loaded) => {
      if (!loaded) return;
      setStamp(loaded);
      setSpotName(loaded.title ?? "");
      setMemo(loaded.memo ?? "");
    });
  }, [stampId]);

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
      const updated = await updateStamp(stampId, { title: nextSpotName });
      setSpotName(updated.title ?? "");
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
      const updated = await updateStamp(stampId, { memo: nextMemo });
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

  const handleConfirmRetake = async () => {
    setRetakeDialogVisible(false);
    if (stampId) {
      // 端末ローカルの削除は即座に効くので、完了を待ってから戻る。
      // サーバー反映を待つ必要が無くなったため、一覧から隠すための細工も要らない
      try {
        await deleteStamp(stampId);
      } catch (error) {
        console.error("[stamp-done] failed to delete stamp", error);
      }
    }
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
            imageUri={stamp ? stampImageUri(stamp) : undefined}
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
              date={stamp ? formatIsoDateTime(stamp.capturedAt) : ""}
              location={location}
              locationPlaceholder={
                geocoded.failed ? t("stampDetail.placeLookupFailed") : undefined
              }
              memo={memo}
              onPressLocation={openLocationEditor}
              onPressMemo={openMemoEditor}
            />
            <StampDoneActions
              onContinueShooting={() => {
                router.replace("/(tabs)");
              }}
              onGoToAlbum={() => {
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
          setEditedLocation(draftLocation.trim() || location);
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
      <TabBar items={tabItems} />
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
