import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Vibration,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams, type Href } from "expo-router";
import * as Haptics from "expo-haptics";
import { DeviceMotion } from "expo-sensors";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  cancelAnimation,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { Camera, Image, Palette, User } from "lucide-react-native";
import { CommonButton } from "@/src/components/common/CommonButton/CommonButton";
import { NavBar } from "@/src/components/common/layout/NavBar/NavBar";
import { TabBar } from "@/src/components/common/layout/TabBar/TabBar";
import { CommonDialog } from "@/src/components/common/CommonDialog/CommonDialog";
import { Stamp } from "@/src/components/common/Stamp/Stamp";
import { StampHelp } from "@/src/components/features/camera/StampHelp/StampHelp";
import { DesignChangeSheet } from "@/src/components/features/camera/DesignChangeSheet/DesignChangeSheet";
import {
  API_COLOR_BY_HEX,
  API_FRAME_BY_ID,
  FRAME_STYLE_OPTIONS,
  STAMP_COLOR_OPTIONS,
} from "@/src/components/features/camera/DesignChangeSheet/frameStyleOptions";
import { type StampCreateResponse, previewStampImage } from "@/src/api/stamps";
import { ApiError } from "@/src/api/client";
import {
  applyScratch,
  changeColor,
  changeFrame,
  getSession,
  retryUpload,
  setChosenPreviewUri,
  waitForResult,
} from "@/src/api/stampSession";
import { useTranslation } from "@/src/i18n/I18nProvider";
import { colors, typography, spacing } from "@/src/theme/tokens";

export default function StampPressScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const [helpVisible, setHelpVisible] = React.useState(false);
  const [designSheetVisible, setDesignSheetVisible] = React.useState(false);
  const [pendingTab, setPendingTab] = React.useState<Href | null>(null);
  const [selectedFrameStyleId, setSelectedFrameStyleId] = React.useState(
    FRAME_STYLE_OPTIONS[0].id,
  );
  const [selectedColor, setSelectedColor] = React.useState(STAMP_COLOR_OPTIONS[0]);
  const [showLandmarkName, setShowLandmarkName] = React.useState(true);
  const [stampResult, setStampResult] = React.useState<StampCreateResponse | null>(null);
  const [uploadFailed, setUploadFailed] = React.useState(false);
  const [uploadErrorMessage, setUploadErrorMessage] = React.useState(() =>
    t("stampPress.networkError"),
  );
  const [waiting, setWaiting] = React.useState(false);
  const longPressTriggeredRef = React.useRef(false);
  const stampScale = useSharedValue(1);
  const stampWrapRef = React.useRef<View>(null);
  const shakeTriggeredRef = React.useRef(false);
  const stampDownDetectedRef = React.useRef(false);
  const stampDownPeakRef = React.useRef(0);
  const currentRotationAlphaRef = React.useRef(0);
  const [previewImages, setPreviewImages] = React.useState<{ low: string; mid: string; high: string } | null>(null);
  const previewImagesRef = React.useRef<{ low: string; mid: string; high: string } | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const chosenScratchLevelRef = React.useRef(0);
  const [debugInfo, setDebugInfo] = React.useState({ z: 0, alpha: 0, scratch: 0 });

  const stampAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: stampScale.value }],
  }));

  React.useEffect(() => {
    previewImagesRef.current = previewImages;
  }, [previewImages]);

  React.useEffect(() => {
    if (!uri) return;
    const apiColor = API_COLOR_BY_HEX[selectedColor] ?? "red";
    const apiFrame = API_FRAME_BY_ID[selectedFrameStyleId] ?? "classic";
    let cancelled = false;
    setPreviewLoading(true);
    console.log(`[preview] start color=${apiColor} frame=${apiFrame}`);
    Promise.all([
      previewStampImage(uri, apiColor, 0.0, apiFrame),
      previewStampImage(uri, apiColor, 0.4, apiFrame),
      previewStampImage(uri, apiColor, 0.8, apiFrame),
    ]).then(([low, mid, high]) => {
      if (!cancelled) {
        console.log(`[preview] done color=${apiColor} frame=${apiFrame}`);
        setPreviewImages({ low, mid, high });
        setPreviewLoading(false);
      }
    }).catch((err) => {
      if (!cancelled) setPreviewLoading(false);
      console.warn("[stamp-press] preview generation failed", err);
    });
    return () => { cancelled = true; setPreviewLoading(false); };
  }, [uri, selectedColor, selectedFrameStyleId]);

  const showUploadError = React.useCallback((error: unknown) => {
    let message = t("stampPress.networkError");
    if (error instanceof ApiError) {
      message = t("stampPress.apiError", { status: error.status, detail: String(error.detail) });
    } else if (error instanceof Error) {
      message = `${error.name}: ${error.message}`;
    }
    setUploadErrorMessage(message);
    setUploadFailed(true);
  }, [t]);

  // 送信結果を購読し、長押し前でもエラーを先出しする(色変更でチェーンが
  // 差し替わった後の結果は無視して、常に最新のものだけ反映する)
  const watchSession = React.useCallback(() => {
    const session = getSession();
    if (!session) return;
    const watched = session.promise;
    watched.then(
      (created) => {
        if (getSession()?.promise !== watched) return;
        setStampResult(created);
        setUploadFailed(false);
      },
      (error) => {
        if (getSession()?.promise !== watched) return;
        console.error("[stamp-press] watched upload failed", error);
        showUploadError(error);
      },
    );
  }, [showUploadError]);

  React.useEffect(() => {
    watchSession();
  }, [watchSession]);

  const goToStampDone = React.useCallback(() => {
    // 次の画面(animation: 'none')でも同じ画面座標にスタンプが来るよう、押した位置を引き継ぐ
    stampWrapRef.current?.measureInWindow(async (_x, y) => {
      const baseParams = { stampTop: String(Math.round(y)) };
      if (!getSession()) {
        router.push({ pathname: "/stamp-done", params: baseParams });
        return;
      }
      setWaiting(true);
      try {
        const created = await waitForResult();
        router.push({
          pathname: "/stamp-done",
          params: {
            ...baseParams,
            stampId: created.id,
            imageUrl: created.image_url,
          },
        });
      } catch (error) {
        console.error("[stamp-press] waitForResult failed", error);
        showUploadError(error);
      } finally {
        setWaiting(false);
      }
    });
  }, [router]);

  React.useEffect(() => {
    DeviceMotion.setUpdateInterval(50);
    const subscription = DeviceMotion.addListener(({ acceleration, rotation }) => {
      if (rotation?.alpha != null) {
        currentRotationAlphaRef.current = rotation.alpha;
      }
      if (shakeTriggeredRef.current) return;

      const z = acceleration?.z ?? 0;

      // 下方向への加速度を検知（端末を水平に持って押し付ける）
      if (z < -2) {
        stampDownDetectedRef.current = true;
        stampDownPeakRef.current = Math.min(stampDownPeakRef.current, z);
      }

      // 押し付けから戻ったタイミングでスタンプ確定
      if (stampDownDetectedRef.current && z > -0.5) {
        shakeTriggeredRef.current = true;
        stampDownDetectedRef.current = false;
        const peak = stampDownPeakRef.current;
        stampDownPeakRef.current = 0;

        // 弱い押し付け(peak=-2) → scratch=1.0、強い押し付け(peak=-15) → scratch=0.0
        const scratchLevel = Math.max(0, Math.min(1.0, (-2 - peak) / (-2 - (-15))));
        chosenScratchLevelRef.current = scratchLevel;
        const tiltAngle = currentRotationAlphaRef.current;
        setDebugInfo({ z: Math.round(peak * 100) / 100, alpha: Math.round(tiltAngle), scratch: Math.round(scratchLevel * 100) / 100 });
        applyScratch(scratchLevel, tiltAngle);
        const previews = previewImagesRef.current;
        if (previews) {
          setChosenPreviewUri(
            scratchLevel >= 0.8 ? previews.high : scratchLevel >= 0.4 ? previews.mid : previews.low,
          );
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Vibration.vibrate([0, 40, 30, 80]);
        cancelAnimation(stampScale);
        stampScale.value = withSequence(
          withTiming(0.74, { duration: 90, easing: Easing.out(Easing.quad) }),
          withTiming(1.06, { duration: 20, easing: Easing.out(Easing.back(2)) }),
          withTiming(1, { duration: 120 }, (finished) => {
            if (finished) runOnJS(goToStampDone)();
          }),
        );
      }
    });
    return () => {
      subscription.remove();
      Vibration.cancel();
    };
  }, [goToStampDone, stampScale]);

  const handleStampPressIn = () => {
    longPressTriggeredRef.current = false;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // 沈み込みに合わせて端末を振動させる(押し込み中はブーッと鳴らし続ける)
    Vibration.vibrate(500);
    cancelAnimation(stampScale);
    // 長押し判定時間(500ms)にかけてゆっくり沈み込ませる
    stampScale.value = withTiming(0.82, {
      duration: 500,
      easing: Easing.out(Easing.quad),
    });
  };

  const handleStampLongPress = () => {
    longPressTriggeredRef.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // 押し込み中の振動を止めて、「ドン」と強めの二段振動を鳴らす
    Vibration.cancel();
    Vibration.vibrate([0, 40, 30, 80]);
    cancelAnimation(stampScale);
    stampScale.value = withSequence(
      withTiming(0.74, { duration: 90, easing: Easing.out(Easing.quad) }),
      withTiming(1.06, { duration: 20, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 120 }, (finished) => {
        if (finished) runOnJS(goToStampDone)();
      }),
    );
  };

  const handleStampPressOut = () => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    // 長押し確定前に離した場合は振動を止めて元の大きさへ戻す
    Vibration.cancel();
    cancelAnimation(stampScale);
    stampScale.value = withSpring(1, { damping: 14, stiffness: 180 });
  };

  return (
    <View style={styles.container}>
      <NavBar
        title={t("stampPress.title")}
        onBack={() => router.back()}
        rightIcon={<Text style={styles.helpIcon}>？</Text>}
        onRightPress={() => setHelpVisible((visible) => !visible)}
      />
      <View style={styles.content}>
        <Pressable
          ref={stampWrapRef}
          onPressIn={handleStampPressIn}
          onLongPress={handleStampLongPress}
          onPressOut={handleStampPressOut}
        >
          <Animated.View style={stampAnimatedStyle}>
            <Stamp imageUri={stampResult?.image_url ?? previewImages?.mid ?? uri} />
            {previewLoading && (
              <View style={styles.previewLoadingOverlay}>
                <ActivityIndicator size="small" color={colors.white} />
              </View>
            )}
          </Animated.View>
        </Pressable>
        <Text style={styles.hint}>{t("stampPress.shakeHint")}</Text>
        <Text style={styles.debug}>z: {debugInfo.z}  α: {debugInfo.alpha}°  scratch: {debugInfo.scratch}</Text>
        <CommonButton
          label={t("design.changeDesign")}
          onPress={() => setDesignSheetVisible(true)}
          variant="secondary"
          icon={<Palette size={14} color={colors.secondary} />}
        />
      </View>
      <TabBar
        items={[
          {
            key: "index",
            label: t("tabs.camera"),
            icon: Camera,
            active: true,
            onPress: () => setPendingTab("/(tabs)"),
          },
          {
            key: "album",
            label: t("tabs.album"),
            icon: Image,
            active: false,
            onPress: () => setPendingTab("/(tabs)/album"),
          },
          {
            key: "mypage",
            label: t("tabs.mypage"),
            icon: User,
            active: false,
            onPress: () => setPendingTab("/(tabs)/mypage"),
          },
        ]}
      />
      <StampHelp visible={helpVisible} onClose={() => setHelpVisible(false)} />
      <DesignChangeSheet
        visible={designSheetVisible}
        onClose={() => setDesignSheetVisible(false)}
        frameStyles={FRAME_STYLE_OPTIONS}
        selectedFrameStyleId={selectedFrameStyleId}
        onSelectFrameStyle={setSelectedFrameStyleId}
        colorOptions={STAMP_COLOR_OPTIONS}
        selectedColor={selectedColor}
        onSelectColor={setSelectedColor}
        showLandmarkName={showLandmarkName}
        onToggleShowLandmarkName={setShowLandmarkName}
        onConfirm={() => {
          setDesignSheetVisible(false);
          changeColor(API_COLOR_BY_HEX[selectedColor] ?? "red");
          changeFrame(API_FRAME_BY_ID[selectedFrameStyleId] ?? "classic");
          watchSession();
        }}
      />
      <CommonDialog
        visible={pendingTab !== null}
        title={t("discardDialog.title")}
        message={t("discardDialog.message")}
        confirmLabel={t("common.discard")}
        onCancel={() => setPendingTab(null)}
        onConfirm={() => {
          if (pendingTab) router.replace(pendingTab);
          setPendingTab(null);
        }}
      />
      <CommonDialog
        visible={uploadFailed}
        title={t("stampPress.uploadFailedTitle")}
        message={uploadErrorMessage}
        confirmLabel={t("common.retry")}
        onCancel={() => setUploadFailed(false)}
        onConfirm={() => {
          setUploadFailed(false);
          setUploadErrorMessage(t("stampPress.networkError"));
          retryUpload();
          watchSession();
        }}
      />
      {waiting && (
        <View style={styles.waitingOverlay}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.waitingText}>{t("stampPress.creating")}</Text>
        </View>
      )}
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
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxl,
  },
  hint: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  debug: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: "monospace",
  },
  helpIcon: {
    fontSize: 14,
    color: colors.textMuted,
  },
  waitingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.cropDimOverlay,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.l,
  },
  waitingText: {
    fontSize: typography.body.fontSize,
    color: colors.white,
  },
  previewLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 999,
  },
});
