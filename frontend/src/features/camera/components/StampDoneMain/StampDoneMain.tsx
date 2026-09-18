import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { RotateCcw } from "lucide-react-native";

import { CommonButton } from "@/src/commons/button/components/CommonButton/CommonButton";
import { TabBar } from "@/src/commons/layout/components/TabBar/TabBar";
import { Toast } from "@/src/commons/other/components/Toast/Toast";
import { CommonDialog } from "@/src/commons/sheet/components/CommonDialog/CommonDialog";
import { StampFieldSheets } from "@/src/commons/stamp/components/StampFieldSheets/StampFieldSheets";
import { StampInfoCard } from "@/src/commons/stamp/components/StampInfoCard/StampInfoCard";
import { StampDoneActions } from "@/src/features/camera/components/StampDoneActions/StampDoneActions";
import { StampResultHeader } from "@/src/features/camera/components/StampResultHeader/StampResultHeader";
import { StampShowcase } from "@/src/features/camera/components/StampShowcase/StampShowcase";
import type { StampDone } from "@/src/features/camera/types/stampDone";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { formatIsoDateTime } from "@/src/utils/datetime/format";
import { colors, spacing } from "@/src/style/tokens";

type Props = StampDone;

export function StampDoneMain({
  imageUri,
  editors,
  tabItems,
  headerAnchorHeight,
  retakeDialogVisible,
  toastMessage,
  share,
  openRetakeDialog,
  cancelRetake,
  confirmRetake,
  continueShooting,
  goToAlbum,
}: Props) {
  const { t } = useTranslation();

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
            imageUri={imageUri}
            onShare={share}
            spotName={editors.spotName}
            onPressSpotName={editors.openSpotName}
          />
          <View style={styles.actionsAnchor}>
            <StampInfoCard
              date={formatIsoDateTime(editors.capturedAt)}
              location={editors.location}
              memo={editors.memo}
              onPressLocation={editors.openLocation}
              onPressMemo={editors.openMemo}
            />
            <StampDoneActions
              onContinueShooting={continueShooting}
              onGoToAlbum={goToAlbum}
            />
            <View style={styles.deleteSection}>
              <CommonButton
                label={t("stampDone.retake")}
                onPress={openRetakeDialog}
                variant="ghost"
                icon={<RotateCcw size={16} color={colors.danger} />}
                textStyle={styles.retakeLabel}
              />
            </View>
          </View>
        </ScrollView>
        {/* タブバーに被せないよう、タブバーの外側ではなくこの中に置く */}
        <Toast message={toastMessage} />
      </KeyboardAvoidingView>
      <CommonDialog
        visible={retakeDialogVisible}
        title={t("stampDone.retakeConfirmTitle")}
        message={t("stampDone.retakeConfirmMessage")}
        confirmLabel={t("stampDone.retake")}
        destructive
        onCancel={cancelRetake}
        onConfirm={confirmRetake}
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
