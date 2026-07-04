import React from "react";
import { View, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams, type Href } from "expo-router";
import { Camera, Image, User } from "lucide-react-native";
import { NavBar } from "@/src/components/common/layout/NavBar/NavBar";
import { TabBar } from "@/src/components/common/layout/TabBar/TabBar";
import { CommonDialog } from "@/src/components/common/CommonDialog/CommonDialog";
import {
  PhotoCropArea,
  type PhotoCropAreaHandle,
} from "@/src/components/features/camera/PhotoCropArea/PhotoCropArea";
import { PhotoAdjustControls } from "@/src/components/features/camera/PhotoAdjustControls/PhotoAdjustControls";
import { startUpload } from "@/src/api/stampSession";
import { getCurrentStampLocation } from "@/src/utils/location";
import { colors } from "@/src/theme/tokens";

export default function PhotoAdjustScreen() {
  const router = useRouter();
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const [zoom, setZoom] = React.useState(0);
  const [pendingTab, setPendingTab] = React.useState<Href | null>(null);
  const cropAreaRef = React.useRef<PhotoCropAreaHandle>(null);

  return (
    <View style={styles.container}>
      <NavBar title="写真を調整" onBack={() => router.back()} />
      <PhotoCropArea ref={cropAreaRef} imageUri={uri} zoom={zoom} onChangeZoom={setZoom} />
      <PhotoAdjustControls
        zoom={zoom}
        onChangeZoom={setZoom}
        onConfirm={async () => {
          // 円ガイド内に実際に見えている範囲を切り出してからアップロードする。
          // 待たずに送信開始し、結果はスタンプを押す画面で待ち合わせる
          const croppedUri = uri ? await cropAreaRef.current?.getCroppedImageUri() : null;
          const uploadUri = croppedUri ?? uri;
          if (uploadUri) {
            // 取得時の現在地(GPS)を記録する。権限拒否や失敗時は null のまま続行する
            const location = await getCurrentStampLocation();
            startUpload(uploadUri, "red", location);
          }
          router.push({ pathname: "/stamp-press", params: { uri: uploadUri } });
        }}
      />
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
});
