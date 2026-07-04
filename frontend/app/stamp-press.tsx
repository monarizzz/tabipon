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
  FRAME_STYLE_OPTIONS,
  STAMP_COLOR_OPTIONS,
} from "@/src/components/features/camera/DesignChangeSheet/frameStyleOptions";
import { type StampCreateResponse } from "@/src/api/stamps";
import {
  changeColor,
  getSession,
  retryUpload,
  waitForResult,
} from "@/src/api/stampSession";
import { colors, typography, spacing } from "@/src/theme/tokens";

export default function StampPressScreen() {
  const router = useRouter();
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
  const [waiting, setWaiting] = React.useState(false);
  const longPressTriggeredRef = React.useRef(false);
  const stampScale = useSharedValue(1);
  const stampWrapRef = React.useRef<View>(null);

  const stampAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: stampScale.value }],
  }));

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
      () => {
        if (getSession()?.promise !== watched) return;
        setUploadFailed(true);
      },
    );
  }, []);

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
      } catch {
        setUploadFailed(true);
      } finally {
        setWaiting(false);
      }
    });
  }, [router]);

  React.useEffect(() => () => Vibration.cancel(), []);

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
        title="スタンプを押す"
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
            <Stamp imageUri={stampResult?.image_url ?? uri} />
          </Animated.View>
        </Pressable>
        <Text style={styles.hint}>スマホを上下に振ってスタンプ！</Text>
        <CommonButton
          label="デザインを変更する"
          onPress={() => setDesignSheetVisible(true)}
          variant="secondary"
          icon={<Palette size={14} color={colors.secondary} />}
        />
      </View>
      <TabBar
        items={[
          {
            key: "index",
            label: "カメラ",
            icon: Camera,
            active: true,
            onPress: () => setPendingTab("/(tabs)"),
          },
          {
            key: "album",
            label: "アルバム",
            icon: Image,
            active: false,
            onPress: () => setPendingTab("/(tabs)/album"),
          },
          {
            key: "mypage",
            label: "マイページ",
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
          watchSession();
        }}
      />
      <CommonDialog
        visible={pendingTab !== null}
        title="編集内容を破棄しますか？"
        message="タブを切り替えると、現在の編集内容が失われます。"
        confirmLabel="破棄する"
        onCancel={() => setPendingTab(null)}
        onConfirm={() => {
          if (pendingTab) router.replace(pendingTab);
          setPendingTab(null);
        }}
      />
      <CommonDialog
        visible={uploadFailed}
        title="送信に失敗しました"
        message="通信環境を確認して、もう一度お試しください。"
        confirmLabel="再試行"
        onCancel={() => setUploadFailed(false)}
        onConfirm={() => {
          setUploadFailed(false);
          retryUpload();
          watchSession();
        }}
      />
      {waiting && (
        <View style={styles.waitingOverlay}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.waitingText}>スタンプを作成中…</Text>
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
});
