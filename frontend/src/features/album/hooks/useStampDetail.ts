import React from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";

import { useStampFieldEditors } from "@/src/commons/stamp/hooks/useStampFieldEditors";
import { useStampDesignChange } from "@/src/features/album/hooks/useStampDesignChange";
import type { StampDetail } from "@/src/features/album/types/stampDetail";
import { deleteStamp, getStamp, type Stamp } from "@/src/infra/db/stamps";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";

/** スタンプ詳細画面の状態と操作をまとめて持つ */
export function useStampDetail(id: string | undefined): StampDetail {
  const router = useRouter();
  const { t } = useTranslation();
  const [stamp, setStamp] = React.useState<Stamp | null>(null);
  const [unavailable, setUnavailable] = React.useState(false);
  /**
   * 読み込みが片付いたかどうか。`stamp` の有無から導くと、失敗して `stamp` が
   * null のままのときに読み込み中と区別が付かず、スピナーのまま止まる
   */
  const [loading, setLoading] = React.useState(true);
  const [showLandmarkName, setShowLandmarkName] = React.useState(true);
  const [deleteDialogVisible, setDeleteDialogVisible] = React.useState(false);

  const editors = useStampFieldEditors({
    stampId: id,
    stamp,
    editableDate: true,
    onUpdated: setStamp,
    logTag: "[stamp-detail]",
  });

  const design = useStampDesignChange({
    stampId: id,
    stamp,
    onUpdated: setStamp,
  });

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getStamp(id)
      .then((loaded) => {
        if (cancelled) return;
        if (loaded) setStamp(loaded);
        else setUnavailable(true);
        setLoading(false);
      })
      .catch((error) => {
        console.error("[stamp-detail] failed to load stamp", error);
        if (cancelled) return;
        setUnavailable(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return {
    // id が無ければ読み込むものが無いので、待たせずに `unavailable` の表示へ倒す
    loading: Boolean(id) && loading,
    unavailable: !id || unavailable,

    latitude: stamp?.location?.latitude ?? null,
    longitude: stamp?.location?.longitude ?? null,

    editors,
    design,

    showLandmarkName,
    toggleShowLandmarkName: setShowLandmarkName,

    deleteDialogVisible,
    openDeleteDialog: () => setDeleteDialogVisible(true),
    cancelDelete: () => setDeleteDialogVisible(false),
    confirmDelete: () => {
      setDeleteDialogVisible(false);
      void (async () => {
        if (id) {
          // 端末ローカルの削除は即座に効くので、完了を待ってからアルバムへ戻る。
          // 一覧はフォーカス時に読み直すため、消えた行が再表示されることはない
          try {
            await deleteStamp(id);
          } catch (error) {
            console.error("[stamp-detail] failed to delete stamp", error);
          }
        }
        router.back();
      })();
    },

    back: router.back,
    // replace だと履歴に残っているアルバムの上へ積むだけで同じ画面が 2 枚になる。
    // dismissTo は履歴のアルバムまで戻り、履歴に無ければ現在の画面を置き換える
    backToAlbum: () => router.dismissTo("/(tabs)/album"),
    share: () => {
      void (async () => {
        if (!design.imageUri) return;
        try {
          if (!(await Sharing.isAvailableAsync())) {
            Alert.alert(
              t("stampDetail.shareUnavailableTitle"),
              t("stampDetail.shareUnavailableMessage"),
            );
            return;
          }
          // 画像は端末の documentDirectory にあるので、そのまま渡せる
          await Sharing.shareAsync(design.imageUri, {
            dialogTitle: editors.spotName || undefined,
          });
        } catch (error) {
          console.error("[stamp-detail] failed to share image", error);
          Alert.alert(
            t("stampDetail.shareFailedTitle"),
            t("stampDetail.shareFailedMessage"),
          );
        }
      })();
    },
  };
}
