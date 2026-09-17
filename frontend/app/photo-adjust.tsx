import React from "react";
import { View, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams, type Href } from "expo-router";
import { NavBar } from "@/src/commons/layout/components/NavBar/NavBar";
import { TabBar } from "@/src/commons/layout/components/TabBar/TabBar";
import { useTabBarItems } from "@/src/commons/layout/components/TabBar/useTabBarItems";
import { CommonDialog } from "@/src/commons/sheet/components/CommonDialog/CommonDialog";
import {
  PhotoCropArea,
  type PhotoCropAreaHandle,
} from "@/src/features/camera/components/PhotoCropArea/PhotoCropArea";
import { PhotoAdjustControls } from "@/src/features/camera/components/PhotoAdjustControls/PhotoAdjustControls";
import { getCurrentStampLocation } from "@/src/libs/location";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { colors } from "@/src/style/tokens";

export default function PhotoAdjustScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const [zoom, setZoom] = React.useState(0);
  const [pendingTab, setPendingTab] = React.useState<Href | null>(null);
  const cropAreaRef = React.useRef<PhotoCropAreaHandle>(null);
  // 調整中の内容を捨てることになるので、遷移前に確認ダイアログを出す
  const tabItems = useTabBarItems(
    React.useCallback((tab) => setPendingTab(tab.href), []),
  );

  return (
    <View style={styles.container}>
      <NavBar title={t("photoAdjust.title")} onBack={() => router.back()} />
      <PhotoCropArea
        ref={cropAreaRef}
        imageUri={uri}
        zoom={zoom}
        onChangeZoom={setZoom}
      />
      <PhotoAdjustControls
        zoom={zoom}
        onChangeZoom={setZoom}
        onConfirm={async () => {
          // 円ガイド内に実際に見えている範囲を切り出す
          const croppedUri = uri
            ? await cropAreaRef.current?.getCroppedImageUri()
            : null;
          const photoUri = croppedUri ?? uri;
          // 取得時の現在地(GPS)を記録する。権限拒否や失敗時は null のまま続行する。
          // スタンプの生成と保存は次の画面（押した瞬間）で行うので、ここでは渡すだけ
          const location = photoUri ? await getCurrentStampLocation() : null;
          router.push({
            pathname: "/stamp-press",
            params: {
              uri: photoUri,
              ...(location && {
                latitude: String(location.latitude),
                longitude: String(location.longitude),
              }),
            },
          });
        }}
      />
      <TabBar items={tabItems} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
