import React from "react";
import { View, Text, StyleSheet, Share, KeyboardAvoidingView, ScrollView, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Camera, Image, User } from "lucide-react-native";
import { TabBar } from "@/src/components/common/layout/TabBar/TabBar";
import { StampResultHeader } from "@/src/components/features/camera/StampResultHeader/StampResultHeader";
import { StampShowcase } from "@/src/components/features/camera/StampShowcase/StampShowcase";
import { StampDoneActions } from "@/src/components/features/camera/StampDoneActions/StampDoneActions";
import { clearSession, getChosenPreviewUri } from "@/src/api/stampSession";
import { colors, spacing } from "@/src/theme/tokens";

const today = new Date();
const formattedDate = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;

export default function StampDoneScreen() {
  const router = useRouter();
  const { stampTop: stampTopParam, imageUrl, scratchLevel, peak } = useLocalSearchParams<{
    stampTop?: string;
    stampId?: string;
    imageUrl?: string;
    scratchLevel?: string;
    peak?: string;
  }>();
  const previewUri = getChosenPreviewUri();
  const [spotName, setSpotName] = React.useState("");
  const [memo, setMemo] = React.useState("");

  // 前の画面(押し込みアニメーション)でスタンプがあった位置を引き継ぎ、
  // 遷移(animation: 'none')してもスタンプの見た目の位置がズレないようにする
  const stampTop = stampTopParam !== undefined ? Number(stampTopParam) : NaN;
  // StampShowcase 側の上部余白の分だけ差し引き、リング自体の位置を合わせる
  const headerAnchorHeight = Number.isFinite(stampTop) ? Math.max(0, stampTop - spacing.l) : undefined;

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
            style={[styles.headerAnchor, headerAnchorHeight !== undefined && { height: headerAnchorHeight }]}
          >
            <StampResultHeader date={formattedDate} />
          </View>
          <StampShowcase
            imageUri={imageUrl ?? previewUri}
            onShare={() => Share.share({ message: "スタンプを獲得しました！" })}
          />
          {scratchLevel !== undefined && (
            <Text style={styles.debugText}>[DEBUG] scratch: {scratchLevel} / peak: {peak}</Text>
          )}
          <View style={styles.actionsAnchor}>
            <StampDoneActions
              spotName={spotName}
              onChangeSpotName={setSpotName}
              memo={memo}
              onChangeMemo={setMemo}
              onContinueShooting={() => {
                clearSession();
                router.replace("/(tabs)");
              }}
              onGoToAlbum={() => {
                clearSession();
                router.push("/(tabs)/album");
              }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <TabBar
        items={[
          {
            key: "index",
            label: "カメラ",
            icon: Camera,
            active: true,
            onPress: () => {
              clearSession();
              router.replace("/(tabs)");
            },
          },
          {
            key: "album",
            label: "アルバム",
            icon: Image,
            active: false,
            onPress: () => {
              clearSession();
              router.push("/(tabs)/album");
            },
          },
          {
            key: "mypage",
            label: "マイページ",
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
  debugText: {
    fontSize: 12,
    color: "red",
    textAlign: "center",
    marginTop: 4,
  },
});
