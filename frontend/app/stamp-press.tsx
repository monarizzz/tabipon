import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter, type Href } from "expo-router";
import { Camera, Image, Palette, User } from "lucide-react-native";
import { CommonButton } from "@/src/components/common/CommonButton/CommonButton";
import { NavBar } from "@/src/components/common/layout/NavBar/NavBar";
import { TabBar } from "@/src/components/common/layout/TabBar/TabBar";
import { CommonDialog } from "@/src/components/common/CommonDialog/CommonDialog";
import { Stamp } from "@/src/components/common/Stamp/Stamp";
import { StampHelp } from "@/src/components/features/camera/StampHelp/StampHelp";
import { DesignChangeSheet } from "@/src/components/features/camera/DesignChangeSheet/DesignChangeSheet";
import { colors, typography, spacing } from "@/src/theme/tokens";

export default function StampPressScreen() {
  const router = useRouter();
  const [helpVisible, setHelpVisible] = React.useState(false);
  const [designSheetVisible, setDesignSheetVisible] = React.useState(false);
  const [pendingTab, setPendingTab] = React.useState<Href | null>(null);

  return (
    <View style={styles.container}>
      <NavBar
        title="スタンプを押す"
        onBack={() => router.back()}
        rightIcon={<Text style={styles.helpIcon}>？</Text>}
        onRightPress={() => setHelpVisible((visible) => !visible)}
      />
      <View style={styles.content}>
        <Stamp />
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
        frameStyles={[]}
        selectedFrameStyleId=""
        onSelectFrameStyle={() => {}}
        colorOptions={[]}
        selectedColor=""
        onSelectColor={() => {}}
        showLandmarkName
        onToggleShowLandmarkName={() => {}}
        onConfirm={() => setDesignSheetVisible(false)}
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
});
