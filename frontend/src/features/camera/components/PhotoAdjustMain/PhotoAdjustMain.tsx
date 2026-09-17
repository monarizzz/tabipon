import React from "react";
import { View, StyleSheet } from "react-native";

import { NavBar } from "@/src/commons/layout/components/NavBar/NavBar";
import { TabBar } from "@/src/commons/layout/components/TabBar/TabBar";
import { CommonDialog } from "@/src/commons/sheet/components/CommonDialog/CommonDialog";
import { PhotoAdjustControls } from "@/src/features/camera/components/PhotoAdjustControls/PhotoAdjustControls";
import {
  PhotoCropArea,
  type PhotoCropAreaHandle,
} from "@/src/features/camera/components/PhotoCropArea/PhotoCropArea";
import type { PhotoAdjust } from "@/src/features/camera/types/photoAdjust";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { colors } from "@/src/style/tokens";

type Props = PhotoAdjust;

export function PhotoAdjustMain({
  imageUri,
  zoom,
  changeZoom,
  tabItems,
  discardDialogVisible,
  back,
  confirm,
  cancelDiscard,
  confirmDiscard,
}: Props) {
  const { t } = useTranslation();
  // 切り出しは実際に表示している領域から作るので、この中に持つ
  const cropAreaRef = React.useRef<PhotoCropAreaHandle>(null);

  const handleConfirm = async () => {
    // 円ガイド内に実際に見えている範囲を切り出す
    const croppedUri = imageUri
      ? ((await cropAreaRef.current?.getCroppedImageUri()) ?? null)
      : null;
    await confirm(croppedUri);
  };

  return (
    <View style={styles.container}>
      <NavBar title={t("photoAdjust.title")} onBack={back} />
      <PhotoCropArea
        ref={cropAreaRef}
        imageUri={imageUri}
        zoom={zoom}
        onChangeZoom={changeZoom}
      />
      <PhotoAdjustControls
        zoom={zoom}
        onChangeZoom={changeZoom}
        onConfirm={handleConfirm}
      />
      <TabBar items={tabItems} />
      <CommonDialog
        visible={discardDialogVisible}
        title={t("discardDialog.title")}
        message={t("discardDialog.message")}
        confirmLabel={t("common.discard")}
        onCancel={cancelDiscard}
        onConfirm={confirmDiscard}
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
