import React from "react";
import { Alert } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";

import type {
  StampShare,
  StampShareOptions,
} from "@/src/commons/stamp/types/stampShare";
import { stampImageUri, type Stamp } from "@/src/infra/db/stamps";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import type { I18nContextValue } from "@/src/libs/i18n/types/i18n";
import { writeShareCard } from "@/src/libs/shareCardFile";
import { generateShareCardPng } from "@/src/utils/shareCard/io";
import { formatIsoDate } from "@/src/utils/datetime/format";

/** トーストを出しておく時間 */
const TOAST_DURATION = 2500;

/**
 * X などへ貼る本文。スポット名があれば入れる。
 *
 * **画像とは別に用意する。**`Sharing.shareAsync()` はファイルしか渡せず本文を
 * 添えられないため、ハッシュタグはカードへ焼き込んだうえで、投稿欄へ貼れる文章を
 * クリップボードにも入れる
 */
function postTextOf(t: I18nContextValue["t"], spotName: string): string {
  return spotName
    ? t("share.postTextWithSpot", { spot: spotName })
    : t("share.postText");
}

/**
 * 共有カードを作って共有する操作をまとめて持つ。
 *
 * スタンプ完成画面（`useStampDone`）とスタンプ詳細画面（`useStampDetail`）の
 * どちらからも同じ手順で呼ぶ。カードに載せる値はすべて `stamp` から導出するので、
 * 画面側は読み込んだ行をそのまま渡せばよい
 */
export function useStampShare({
  stamp,
  logTag,
}: StampShareOptions): StampShare {
  const { t } = useTranslation();
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // 合成には時間が掛かる。終わる前にもう一度押されても二重に走らせない
  const running = React.useRef(false);

  React.useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );

  const notify = React.useCallback((message: string) => {
    setToastMessage(message);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setToastMessage(null), TOAST_DURATION);
  }, []);

  const shareStamp = React.useCallback(
    async (stamp: Stamp) => {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(t("share.unavailableTitle"), t("share.unavailableMessage"));
        return;
      }

      const spotName = stamp.title ?? "";
      const png = await generateShareCardPng({
        stampUri: stampImageUri(stamp),
        spotName,
        date: formatIsoDate(stamp.capturedAt),
        address: stamp.address ?? "",
        brand: t("share.brand"),
        hashtag: t("share.hashtag"),
      });
      const cardUri = writeShareCard(stamp.id, png);

      // 共有シートを開く前にコピーする。シートを閉じた後だと、投稿先のアプリへ
      // 移ってから貼るまでの間にコピーが間に合わない
      await Clipboard.setStringAsync(postTextOf(t, spotName));
      notify(t("share.copied"));

      await Sharing.shareAsync(cardUri, {
        dialogTitle: spotName || t("share.dialogTitle"),
        mimeType: "image/png",
        UTI: "public.png",
      });
    },
    [notify, t],
  );

  return {
    toastMessage,
    share: () => {
      if (!stamp || running.current) return;
      running.current = true;
      void shareStamp(stamp)
        .catch((error) => {
          console.error(`${logTag} failed to share stamp`, error);
          Alert.alert(t("share.failedTitle"), t("share.failedMessage"));
        })
        .finally(() => {
          running.current = false;
        });
    },
  };
}
