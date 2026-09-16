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
  API_FRAME_BY_ID,
  FRAME_STYLE_OPTIONS,
} from "@/src/components/features/camera/DesignChangeSheet/frameStyleOptions";
import {
  DEFAULT_STAMP_COLOR,
  STAMP_INK_COLORS,
} from "@/src/utils/stamp/constants/constants";
import { StampOrientationGuide } from "@/src/components/features/camera/StampOrientationGuide/StampOrientationGuide";
import { newStampId, saveStamp } from "@/src/infra/db/stamps";
import { generateStampPngFromUri } from "@/src/utils/stamp/io";
import { seedFromStampId } from "@/src/utils/stamp/seed";
import { playStampSound } from "@/src/libs/sound";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { colors, typography, spacing } from "@/src/style/tokens";

export default function StampPressScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { uri, latitude, longitude } = useLocalSearchParams<{
    uri?: string;
    latitude?: string;
    longitude?: string;
  }>();
  const [helpVisible, setHelpVisible] = React.useState(false);
  const [designSheetVisible, setDesignSheetVisible] = React.useState(false);
  const [pendingTab, setPendingTab] = React.useState<Href | null>(null);
  // 確定済みのデザイン。スタンプを押したときに生成へ渡すのはこちら
  const [frameStyleId, setFrameStyleId] = React.useState(
    FRAME_STYLE_OPTIONS[0].id,
  );
  const [color, setColor] = React.useState(DEFAULT_STAMP_COLOR);
  // シートで選択中のデザイン。**確定と分けてある。**
  // シートはスワイプや背景タップでも閉じられるので、選択をそのまま確定扱いにすると
  // 「適用」を押さずに閉じたつもりでも生成に使われてしまう
  const [draftFrameStyleId, setDraftFrameStyleId] =
    React.useState(frameStyleId);
  const [draftColor, setDraftColor] = React.useState(color);
  const [showLandmarkName, setShowLandmarkName] = React.useState(true);

  const openDesignSheet = () => {
    setDraftFrameStyleId(frameStyleId);
    setDraftColor(color);
    setDesignSheetVisible(true);
  };
  const [saveFailed, setSaveFailed] = React.useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = React.useState("");
  const [waiting, setWaiting] = React.useState(false);
  const [stampPressed, setStampPressed] = React.useState(false);
  const longPressTriggeredRef = React.useRef(false);
  const stampScale = useSharedValue(1);
  const stampWrapRef = React.useRef<View>(null);
  const shakeTriggeredRef = React.useRef(false);
  const stampLiftDetectedRef = React.useRef(false);
  const stampLiftTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const stampDownPeakRef = React.useRef(0);
  // 押した瞬間に決まる演出値。長押しで押した場合は 0 のまま（掠れも傾きも無し）
  const finishRef = React.useRef({ scratchLevel: 0, tiltAngle: 0 });
  const currentRotationAlphaRef = React.useRef(0);
  const referenceAlphaRef = React.useRef<number | null>(null);
  const stampRotation = useSharedValue(0);
  const stampAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: stampScale.value },
      { rotate: `${stampRotation.value}deg` },
    ],
  }));

  // 生成と保存をまとめて行い、スタンプ完成画面へ進む。
  //
  // **id を先に払い出す。**掠れ模様の seed は id から導くので（`seed.ts`）、
  // 描く前に確定していないと、あとで色やフレームを変えて再生成したときに
  // 模様が変わってしまう
  const createAndSave = React.useCallback(
    async (stampTop: string) => {
      if (!uri) {
        router.push({ pathname: "/stamp-done", params: { stampTop } });
        return;
      }
      setWaiting(true);
      try {
        const id = newStampId();
        const { scratchLevel, tiltAngle } = finishRef.current;
        const frameId = API_FRAME_BY_ID[frameStyleId] ?? "classic";
        const stampPng = await generateStampPngFromUri(uri, {
          color,
          frame: frameId,
          scratchLevel,
          tiltAngle,
          seed: seedFromStampId(id),
        });
        await saveStamp({
          id,
          stampPng,
          photoUri: uri,
          capturedAt: new Date().toISOString(),
          location:
            latitude && longitude
              ? { latitude: Number(latitude), longitude: Number(longitude) }
              : null,
          color,
          frameId,
          scratchLevel,
          tiltAngle,
        });
        router.push({
          pathname: "/stamp-done",
          params: { stampTop, stampId: id },
        });
      } catch (error) {
        console.error("[stamp-press] failed to create stamp", error);
        setSaveErrorMessage(
          error instanceof Error ? `${error.name}: ${error.message}` : "",
        );
        setSaveFailed(true);
      } finally {
        setWaiting(false);
      }
    },
    [color, frameStyleId, latitude, longitude, router, uri],
  );

  const goToStampDone = React.useCallback(() => {
    // 次の画面(animation: 'none')でも同じ画面座標にスタンプが来るよう、押した位置を引き継ぐ
    stampWrapRef.current?.measureInWindow((_x, y) => {
      void createAndSave(String(Math.round(y)));
    });
  }, [createAndSave]);

  React.useEffect(() => {
    DeviceMotion.setUpdateInterval(50);
    const subscription = DeviceMotion.addListener(
      ({ acceleration, rotation }) => {
        if (rotation?.alpha != null) {
          if (referenceAlphaRef.current === null)
            referenceAlphaRef.current = rotation.alpha;
          const relativeAlpha = rotation.alpha - referenceAlphaRef.current;
          currentRotationAlphaRef.current = relativeAlpha;
          // -180〜180度に正規化してプレビューをリアルタイム回転
          let deg = -(relativeAlpha * (180 / Math.PI));
          if (deg > 180) deg -= 360;
          if (deg < -180) deg += 360;
          stampRotation.value = deg;
        }
        if (shakeTriggeredRef.current) return;

        const z = acceleration?.z ?? 0;

        // ①持ち上げ検知（z がプラスに振れたら準備OK、800ms以内に押し付けが来なければリセット）
        if (z > 2) {
          stampLiftDetectedRef.current = true;
          stampDownPeakRef.current = 0;
          if (stampLiftTimerRef.current)
            clearTimeout(stampLiftTimerRef.current);
          stampLiftTimerRef.current = setTimeout(() => {
            stampLiftDetectedRef.current = false;
          }, 800);
        }

        // ②持ち上げ後に z < -2 まで下がったら押し付け中とみなしてpeak記録
        if (
          stampLiftDetectedRef.current &&
          z < -2 &&
          z < stampDownPeakRef.current
        ) {
          stampDownPeakRef.current = z;
        }

        // ③押し付けピーク後にニュートラル(z > -0.5)に戻ったらスタンプ確定（縦持ち方式）
        if (
          stampLiftDetectedRef.current &&
          stampDownPeakRef.current < -2 &&
          z > -0.5
        ) {
          shakeTriggeredRef.current = true;
          stampLiftDetectedRef.current = false;
          if (stampLiftTimerRef.current)
            clearTimeout(stampLiftTimerRef.current);
          const peak = stampDownPeakRef.current;
          stampDownPeakRef.current = 0;

          // 弱い押し付け(peak=-2) → scratch=1.0、強い押し付け(peak=-75) → scratch=0.0
          const scratchLevel = Math.max(
            0,
            Math.min(1.0, (peak - -75) / (-2 - -75)),
          );
          let tiltAngle = -(currentRotationAlphaRef.current * (180 / Math.PI));
          if (tiltAngle > 180) tiltAngle -= 360;
          if (tiltAngle < -180) tiltAngle += 360;
          runOnJS(setStampPressed)(true);
          // 生成は押し込みアニメーションの完了後（goToStampDone）に走るので、
          // このとき決まった値を持ち回す
          finishRef.current = { scratchLevel, tiltAngle };
          playStampSound();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Vibration.vibrate([0, 40, 30, 80]);
          cancelAnimation(stampScale);
          stampScale.value = withSequence(
            withTiming(0.74, { duration: 90, easing: Easing.out(Easing.quad) }),
            withTiming(1.06, {
              duration: 20,
              easing: Easing.out(Easing.back(2)),
            }),
            withTiming(1, { duration: 120 }, (finished) => {
              if (finished) runOnJS(goToStampDone)();
            }),
          );
        }
      },
    );
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
    stampScale.set(
      withTiming(0.82, {
        duration: 500,
        easing: Easing.out(Easing.quad),
      }),
    );
  };

  const handleStampLongPress = () => {
    if (shakeTriggeredRef.current) return;
    shakeTriggeredRef.current = true;
    longPressTriggeredRef.current = true;
    setStampPressed(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // 押し込み中の振動を止めて、「ドン」と強めの二段振動を鳴らす
    Vibration.cancel();
    Vibration.vibrate([0, 40, 30, 80]);
    cancelAnimation(stampScale);
    stampScale.set(
      withSequence(
        withTiming(0.74, { duration: 90, easing: Easing.out(Easing.quad) }),
        withTiming(1.06, { duration: 20, easing: Easing.out(Easing.back(2)) }),
        withTiming(1, { duration: 120 }, (finished) => {
          if (finished) runOnJS(goToStampDone)();
        }),
      ),
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
    stampScale.set(withSpring(1, { damping: 14, stiffness: 180 }));
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
            {stampPressed ? (
              <Stamp imageUri={uri} />
            ) : (
              <StampOrientationGuide
                color={color}
                frameId={
                  frameStyleId as "classic" | "vintage" | "minimal" | "wave"
                }
              />
            )}
          </Animated.View>
        </Pressable>
        <Text style={styles.hint}>{t("stampPress.shakeHint")}</Text>
        <CommonButton
          label={t("design.changeDesign")}
          onPress={openDesignSheet}
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
        // 「適用」を押さずに閉じた場合は選択を捨てる
        onClose={() => setDesignSheetVisible(false)}
        frameStyles={FRAME_STYLE_OPTIONS}
        selectedFrameStyleId={draftFrameStyleId}
        onSelectFrameStyle={setDraftFrameStyleId}
        colorOptions={STAMP_INK_COLORS}
        selectedColor={draftColor}
        onSelectColor={setDraftColor}
        showLandmarkName={showLandmarkName}
        onToggleShowLandmarkName={setShowLandmarkName}
        // 生成はスタンプを押した時点で走るので、ここでは選択を確定するだけでよい
        onConfirm={() => {
          setFrameStyleId(draftFrameStyleId);
          setColor(draftColor);
          setDesignSheetVisible(false);
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
        visible={saveFailed}
        title={t("stampPress.saveFailedTitle")}
        message={saveErrorMessage}
        confirmLabel={t("common.retry")}
        onCancel={() => setSaveFailed(false)}
        onConfirm={() => {
          setSaveFailed(false);
          goToStampDone();
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 999,
  },
});
