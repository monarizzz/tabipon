import React from "react";
import { View, StyleSheet, Share, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Camera, Image, User } from "lucide-react-native";
import { TabBar } from "@/src/components/common/layout/TabBar/TabBar";
import { StampResultHeader } from "@/src/components/features/camera/StampResultHeader/StampResultHeader";
import { StampShowcase } from "@/src/components/features/camera/StampShowcase/StampShowcase";
import { StampDoneActions } from "@/src/components/features/camera/StampDoneActions/StampDoneActions";
import { colors } from "@/src/theme/tokens";

const today = new Date();
const formattedDate = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;

export default function StampDoneScreen() {
  const router = useRouter();
  const [memo, setMemo] = React.useState("");

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <StampResultHeader date={formattedDate} />
        <StampShowcase onShare={() => Share.share({ message: "スタンプを獲得しました！" })} />
        <StampDoneActions
          memo={memo}
          onChangeMemo={setMemo}
          onContinueShooting={() => router.replace("/(tabs)")}
          onGoToAlbum={() => router.push("/(tabs)/album")}
        />
      </KeyboardAvoidingView>
      <TabBar
        items={[
          {
            key: "index",
            label: "カメラ",
            icon: Camera,
            active: true,
            onPress: () => router.replace("/(tabs)"),
          },
          {
            key: "album",
            label: "アルバム",
            icon: Image,
            active: false,
            onPress: () => router.push("/(tabs)/album"),
          },
          {
            key: "mypage",
            label: "マイページ",
            icon: User,
            active: false,
            onPress: () => router.push("/(tabs)/mypage"),
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
    justifyContent: "center",
  },
});
