import React from "react";
import { useFocusEffect, useRouter } from "expo-router";

import type { StampGridItem } from "@/src/features/album/components/StampGrid/StampGrid";
import type { Album } from "@/src/features/album/types/album";
import { toGridItem } from "@/src/features/album/utils/toGridItem";
import { listStamps } from "@/src/infra/db/stamps";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";

/** アルバム画面の状態と操作をまとめて持つ */
export function useAlbum(): Album {
  const router = useRouter();
  const { t } = useTranslation();

  const [selectedFilterId, setSelectedFilterId] = React.useState("all");
  const [collectionSheetVisible, setCollectionSheetVisible] =
    React.useState(false);
  const [collectionName, setCollectionName] = React.useState("");
  const [stamps, setStamps] = React.useState<StampGridItem[] | null>(null);
  const [loadFailed, setLoadFailed] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadStamps = React.useCallback(() => {
    setLoadFailed(false);
    // 削除は端末ローカルで即座に効くので、消したはずの行が返ってくることはない。
    // サーバー反映を待つ間だけ一覧から隠す仕組みは要らなくなった
    return listStamps()
      .then((items) =>
        setStamps(
          items.map((item) => toGridItem(item, t("album.unknownSpotName"))),
        ),
      )
      .catch((error) => {
        console.error("[album] failed to load stamps", error);
        setLoadFailed(true);
      });
  }, [t]);

  // スタンプ獲得直後にタブへ戻ったときも最新化する
  useFocusEffect(
    React.useCallback(() => {
      loadStamps();
    }, [loadStamps]),
  );

  return {
    stamps,
    loadFailed,
    refreshing,
    selectedFilterId,
    collectionSheetVisible,
    collectionName,

    selectFilter: setSelectedFilterId,
    reload: loadStamps,
    // 一覧を下に引っ張ったときの再読み込み
    refresh: React.useCallback(() => {
      setRefreshing(true);
      loadStamps().finally(() => setRefreshing(false));
    }, [loadStamps]),
    // 詳細画面は id から DB を引くので、渡すのは id だけでよい
    pressStamp: (item) =>
      router.push({ pathname: "/album-stamp-detail", params: { id: item.id } }),
    openCollectionSheet: () => setCollectionSheetVisible(true),
    closeCollectionSheet: () => setCollectionSheetVisible(false),
    changeCollectionName: setCollectionName,
    addCollection: () => {
      setCollectionName("");
      setCollectionSheetVisible(false);
    },
  };
}
