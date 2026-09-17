import React from "react";
import { useRouter, type Href } from "expo-router";

import { useTabBarItems } from "@/src/commons/layout/hooks/useTabBarItems";
import type { PhotoAdjust } from "@/src/features/camera/types/photoAdjust";
import { stampPressParams } from "@/src/features/camera/utils/stampPressParams";
import { getCurrentStampPlace } from "@/src/libs/location";

/** 写真調整画面の状態と操作をまとめて持つ */
export function usePhotoAdjust(imageUri: string | undefined): PhotoAdjust {
  const router = useRouter();
  const [zoom, setZoom] = React.useState(0);
  const [pendingTab, setPendingTab] = React.useState<Href | null>(null);
  // 調整中の内容を捨てることになるので、遷移前に確認ダイアログを出す
  const tabItems = useTabBarItems(
    React.useCallback((tab) => setPendingTab(tab.href), []),
  );

  return {
    imageUri,
    zoom,
    changeZoom: setZoom,
    tabItems,
    discardDialogVisible: pendingTab !== null,

    back: router.back,
    confirm: async (croppedUri) => {
      const photoUri = croppedUri ?? imageUri;
      // 取得時の現在地(GPS)と、そこから引いた住所を記録する。
      // 権限拒否や失敗時は null のまま続行する。
      // スタンプの生成と保存は次の画面（押した瞬間）で行うので、ここでは渡すだけ
      const place = photoUri
        ? await getCurrentStampPlace()
        : { location: null, address: null };
      router.push({
        pathname: "/stamp-press",
        params: stampPressParams(photoUri, place),
      });
    },
    cancelDiscard: () => setPendingTab(null),
    confirmDiscard: () => {
      if (pendingTab) router.replace(pendingTab);
      setPendingTab(null);
    },
  };
}
