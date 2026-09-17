import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Share,
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
import { StampFieldSheets } from "@/src/commons/stamp/components/StampFieldSheets/StampFieldSheets";
import { useStampFieldEditors } from "@/src/commons/stamp/hooks/useStampFieldEditors";
import { StampResultHeader } from "@/src/features/camera/components/StampResultHeader/StampResultHeader";
import { StampShowcase } from "@/src/features/camera/components/StampShowcase/StampShowcase";
import { StampDoneActions } from "@/src/features/camera/components/StampDoneActions/StampDoneActions";
import {
  deleteStamp,
  getStamp,
  stampImageUri,
  type Stamp,
} from "@/src/infra/db/stamps";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { formatIsoDateTime } from "@/src/utils/datetime/format";
import { colors, spacing } from "@/src/style/tokens";

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
  const editors = useStampFieldEditors({
    stampId,
    stamp,
    onUpdated: setStamp,
    logTag: "[stamp-done]",
  });
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
      if (loaded) setStamp(loaded);
    });
  }, [stampId]);

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
            spotName={editors.spotName}
            onPressSpotName={editors.openSpotName}
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
              date={formatIsoDateTime(editors.capturedAt)}
              location={editors.location}
              memo={editors.memo}
              onPressLocation={editors.openLocation}
              onPressMemo={editors.openMemo}
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
      <StampFieldSheets editors={editors} />
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
