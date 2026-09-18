import React from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";

import { useTabBarItems } from "@/src/commons/layout/hooks/useTabBarItems";
import { useStampFieldEditors } from "@/src/commons/stamp/hooks/useStampFieldEditors";
import type { StampDone } from "@/src/features/camera/types/stampDone";
import { headerAnchorHeight } from "@/src/features/camera/utils/headerAnchorHeight";
import {
  deleteStamp,
  getStamp,
  stampImageUri,
  type Stamp,
} from "@/src/infra/db/stamps";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";

type Params = {
  stampId: string | undefined;
  /** 前の画面でスタンプがあった画面座標。遷移しても位置がズレないように使う */
  stampTop: string | undefined;
};

/** スタンプ完成画面の状態と操作をまとめて持つ */
export function useStampDone({ stampId, stampTop }: Params): StampDone {
  const router = useRouter();
  const { t } = useTranslation();
  const [stamp, setStamp] = React.useState<Stamp | null>(null);
  const [retakeDialogVisible, setRetakeDialogVisible] = React.useState(false);

  const editors = useStampFieldEditors({
    stampId,
    stamp,
    onUpdated: setStamp,
    logTag: "[stamp-done]",
  });

  // 撮影フローはここで終わりなので確認は挟まない。
  // カメラへ戻るときだけ履歴を積まないよう replace する
  const tabItems = useTabBarItems(
    React.useCallback(
      (tab) => {
        if (tab.key === "index") {
          router.replace(tab.href);
          return;
        }
        router.push(tab.href);
      },
      [router],
    ),
  );

  // 保存済みのスタンプを読み込む。前の画面で保存まで済ませてあるので必ず在る
  React.useEffect(() => {
    if (!stampId) return;
    getStamp(stampId).then((loaded) => {
      if (loaded) setStamp(loaded);
    });
  }, [stampId]);

  const imageUri = stamp ? stampImageUri(stamp) : undefined;

  return {
    imageUri,
    editors,
    tabItems,
    headerAnchorHeight: headerAnchorHeight(stampTop),
    retakeDialogVisible,

    share: () => {
      void (async () => {
        if (!imageUri) return;
        try {
          if (!(await Sharing.isAvailableAsync())) {
            Alert.alert(
              t("stampDone.shareUnavailableTitle"),
              t("stampDone.shareUnavailableMessage"),
            );
            return;
          }
          // 画像は端末の documentDirectory にあるので、そのまま渡せる。
          // shareAsync は本文テキストを渡せないため、文言は dialogTitle に入れる
          await Sharing.shareAsync(imageUri, {
            dialogTitle: editors.spotName || t("stampDone.shareMessage"),
          });
        } catch (error) {
          console.error("[stamp-done] failed to share image", error);
          Alert.alert(
            t("stampDone.shareFailedTitle"),
            t("stampDone.shareFailedMessage"),
          );
        }
      })();
    },
    openRetakeDialog: () => setRetakeDialogVisible(true),
    cancelRetake: () => setRetakeDialogVisible(false),
    confirmRetake: () => {
      setRetakeDialogVisible(false);
      void (async () => {
        if (stampId) {
          // 端末ローカルの削除は即座に効くので、完了を待ってから戻る。
          // サーバー反映を待つ必要が無くなったため、一覧から隠すための細工も要らない
          try {
            await deleteStamp(stampId);
          } catch (error) {
            console.error("[stamp-done] failed to delete stamp", error);
            // カメラへ戻すとスタンプが残ったまま撮り直せたように見えるので、
            // この画面に留めて知らせる
            Alert.alert(
              t("stampDone.retakeFailedTitle"),
              t("stampDone.retakeFailedMessage"),
            );
            return;
          }
        }
        router.replace("/(tabs)");
      })();
    },
    continueShooting: () => router.replace("/(tabs)"),
    goToAlbum: () => router.push("/(tabs)/album"),
  };
}
