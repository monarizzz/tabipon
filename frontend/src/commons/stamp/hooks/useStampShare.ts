import React from "react";
import { Alert, Share } from "react-native";

import type {
  StampShare,
  StampShareOptions,
} from "@/src/commons/stamp/types/stampShare";
import { stampImageUri, type Stamp } from "@/src/infra/db/stamps";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import type { I18nContextValue } from "@/src/libs/i18n/types/i18n";
import { writeShareCard } from "@/src/libs/shareCardFile";
import { generateShareCardPng } from "@/src/utils/shareCard/io";
import type { ShareCardField } from "@/src/utils/shareCard/types/shareCardContent";
import { formatIsoDateTime } from "@/src/utils/datetime/format";

/**
 * 共有シートの本文。スポット名があれば入れる。
 *
 * ハッシュタグを持つのはこの本文だけで、カードには描かない（`docs/share-card.md`）
 */
function postTextOf(t: I18nContextValue["t"], spotName: string): string {
  return spotName
    ? t("share.postTextWithSpot", { spot: spotName })
    : t("share.postText");
}

/**
 * カードの罫線に書き込む項目。
 *
 * 並び順がそのまま行の位置になるので、値が空でも要素は外さない
 * （`ShareCardContent`）
 */
function fieldsOf(t: I18nContextValue["t"], stamp: Stamp): ShareCardField[] {
  return [
    {
      label: t("stampDetail.labelDate"),
      // 画面（`StampInfoCard`）と同じく時刻まで出す
      value: formatIsoDateTime(stamp.capturedAt),
    },
    { label: t("stampDetail.labelPlace"), value: stamp.address ?? "" },
    { label: t("stampDetail.labelMemo"), value: stamp.memo ?? "" },
  ];
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
  // 合成には時間が掛かる。終わる前にもう一度押されても二重に走らせない
  const running = React.useRef(false);
  /**
   * 画面がまだ生きているか。
   *
   * 合成の間に「続けて撮影」やタブ切替で離脱できる。待っている間に画面が変わったら、
   * 移動先の画面の上に共有シートが出てしまうので開かない
   */
  const mounted = React.useRef(true);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const shareStamp = React.useCallback(
    async (stamp: Stamp) => {
      const spotName = stamp.title ?? "";
      const png = await generateShareCardPng({
        stampUri: stampImageUri(stamp),
        spotName,
        fields: fieldsOf(t, stamp),
      });
      if (!mounted.current) return;

      // **`expo-sharing` ではなく React Native の Share を使う。**
      // `Sharing.shareAsync()` はファイルしか渡せず、共有シートの本文欄を
      // 埋められない。`Share.share()` なら画像（url）と本文（message）を
      // 一緒に渡せる（iOS）
      await Share.share({
        message: postTextOf(t, spotName),
        url: writeShareCard(stamp.id, png),
      });
    },
    [t],
  );

  return {
    share: () => {
      if (!stamp || running.current) return;
      running.current = true;
      void shareStamp(stamp)
        .catch((error) => {
          console.error(`${logTag} failed to share stamp`, error);
          // 離脱後は知らせる相手がいない。移動先の画面にダイアログを出さない
          if (!mounted.current) return;
          Alert.alert(t("share.failedTitle"), t("share.failedMessage"));
        })
        .finally(() => {
          running.current = false;
        });
    },
  };
}
