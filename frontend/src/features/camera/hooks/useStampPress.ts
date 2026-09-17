import React from "react";
import { useRouter, type Href } from "expo-router";

import { useTabBarItems } from "@/src/commons/layout/hooks/useTabBarItems";
import { FRAME_STYLE_OPTIONS } from "@/src/features/camera/constants/frameStyleOptions";
import type { StampPress } from "@/src/features/camera/types/stampPress";
import { createStamp } from "@/src/features/camera/utils/createStamp";
import { DEFAULT_STAMP_COLOR } from "@/src/utils/stamp/constants/constants";
import type { StampFrame } from "@/src/utils/stamp/types/stampFrame";
import type { PressGestureFinish } from "@/src/utils/stampPress/types/pressGesture";

type Params = {
  imageUri: string | undefined;
  /** 撮影地。ルートパラメータなので文字列で来る */
  latitude: string | undefined;
  longitude: string | undefined;
  address: string | undefined;
};

/** 押印画面の状態と操作をまとめて持つ */
export function useStampPress({
  imageUri,
  latitude,
  longitude,
  address,
}: Params): StampPress {
  const router = useRouter();

  const [helpVisible, setHelpVisible] = React.useState(false);
  const [designSheetVisible, setDesignSheetVisible] = React.useState(false);
  const [pendingTab, setPendingTab] = React.useState<Href | null>(null);
  const [color, setColor] = React.useState(DEFAULT_STAMP_COLOR);
  const [frameStyleId, setFrameStyleId] = React.useState<StampFrame>(
    FRAME_STYLE_OPTIONS[0].id,
  );
  const [draftColor, setDraftColor] = React.useState(color);
  const [draftFrameStyleId, setDraftFrameStyleId] =
    React.useState(frameStyleId);
  const [showLandmarkName, setShowLandmarkName] = React.useState(true);
  const [waiting, setWaiting] = React.useState(false);
  const [saveFailed, setSaveFailed] = React.useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = React.useState("");

  // 押す前のスタンプを捨てることになるので、遷移前に確認ダイアログを出す
  const tabItems = useTabBarItems(
    React.useCallback((tab) => setPendingTab(tab.href), []),
  );

  /**
   * 直近の押印。失敗して再試行するとき、同じ演出値と同じ画面座標で
   * やり直すために覚えておく（表示には使わないので ref）
   */
  const lastPressRef = React.useRef<{
    finish: PressGestureFinish;
    stampTop: number;
  } | null>(null);

  const run = React.useCallback(
    async (finish: PressGestureFinish, stampTop: number) => {
      lastPressRef.current = { finish, stampTop };
      const stampTopParam = String(Math.round(stampTop));
      if (!imageUri) {
        router.push({
          pathname: "/stamp-done",
          params: { stampTop: stampTopParam },
        });
        return;
      }
      setWaiting(true);
      try {
        const { id } = await createStamp({
          photoUri: imageUri,
          color,
          frameId: frameStyleId,
          scratchLevel: finish.scratchLevel,
          tiltAngle: finish.tiltAngle,
          location:
            latitude && longitude
              ? { latitude: Number(latitude), longitude: Number(longitude) }
              : null,
          address: address ?? null,
        });
        router.push({
          pathname: "/stamp-done",
          params: { stampTop: stampTopParam, stampId: id },
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
    [address, color, frameStyleId, imageUri, latitude, longitude, router],
  );

  return {
    imageUri,
    tabItems,

    color,
    frameStyleId,
    draftColor,
    draftFrameStyleId,
    selectDraftColor: setDraftColor,
    selectDraftFrameStyle: setDraftFrameStyleId,
    // ガイドは選択中の見た目を確かめるためのものなので、シートを開いている間だけ選択中を映す。
    // 閉じている間に選択中を映すと、「適用」せずに閉じたときガイドと押されるスタンプが食い違う
    guideColor: designSheetVisible ? draftColor : color,
    guideFrameStyleId: designSheetVisible ? draftFrameStyleId : frameStyleId,

    designSheetVisible,
    openDesignSheet: () => {
      // 開くたびに確定済みの値へ戻す。前回「適用」せずに閉じた選択を残さない
      setDraftColor(color);
      setDraftFrameStyleId(frameStyleId);
      setDesignSheetVisible(true);
    },
    closeDesignSheet: () => setDesignSheetVisible(false),
    // 生成はスタンプを押した時点で走るので、ここでは選択を確定するだけでよい
    confirmDesign: () => {
      setColor(draftColor);
      setFrameStyleId(draftFrameStyleId);
      setDesignSheetVisible(false);
    },

    showLandmarkName,
    toggleShowLandmarkName: setShowLandmarkName,

    helpVisible,
    toggleHelp: () => setHelpVisible((visible) => !visible),
    closeHelp: () => setHelpVisible(false),

    waiting,
    saveFailed,
    saveErrorMessage,
    dismissSaveFailed: () => setSaveFailed(false),
    retrySave: () => {
      setSaveFailed(false);
      const last = lastPressRef.current;
      if (last) void run(last.finish, last.stampTop);
    },

    discardDialogVisible: pendingTab !== null,
    cancelDiscard: () => setPendingTab(null),
    confirmDiscard: () => {
      if (pendingTab) router.replace(pendingTab);
      setPendingTab(null);
    },

    back: router.back,
    createStamp: (finish, stampTop) => {
      void run(finish, stampTop);
    },
  };
}
