import React from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { useStampFieldEditors } from "@/src/commons/stamp/hooks/useStampFieldEditors";
import { useStampShare } from "@/src/commons/stamp/hooks/useStampShare";
import { useStampDesignChange } from "@/src/features/album/hooks/useStampDesignChange";
import type { StampDetail } from "@/src/features/album/types/stampDetail";
import { deleteStamp, getStamp, type Stamp } from "@/src/infra/db/stamps";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";

/** スタンプ詳細画面の状態と操作をまとめて持つ */
export function useStampDetail(id: string | undefined): StampDetail {
  const router = useRouter();
  const { t } = useTranslation();
  /**
   * 取得の結果。どの `id` の何回目の取得に対する結果かを一緒に持つ。
   *
   * **`stamp` だけを持たない。**`stamp` の有無からは「失敗して null」と
   * 「まだ読み込み中」が区別できず、スピナーのまま止まる。`id` と `attempt` を
   * 付けておくと、取得を始めるときに state を書き戻さなくても、別の `id` や
   * 前回の試行に対する結果を読み捨てられる
   */
  const [loaded, setLoaded] = React.useState<{
    id: string;
    attempt: number;
    stamp: Stamp | null;
  } | null>(null);
  const [loadAttempt, setLoadAttempt] = React.useState(0);
  const current =
    loaded && loaded.id === id && loaded.attempt === loadAttempt
      ? loaded
      : null;
  const stamp = current?.stamp ?? null;
  const loading = current === null;
  const unavailable = current !== null && current.stamp === null;

  const applyUpdated = React.useCallback((updated: Stamp) => {
    setLoaded((prev) => (prev ? { ...prev, stamp: updated } : prev));
  }, []);
  const [deleteDialogVisible, setDeleteDialogVisible] = React.useState(false);

  const editors = useStampFieldEditors({
    stampId: id,
    stamp,
    editableDate: true,
    onUpdated: applyUpdated,
    logTag: "[stamp-detail]",
  });

  const design = useStampDesignChange({
    stampId: id,
    stamp,
    onUpdated: applyUpdated,
  });

  const { share, toastMessage } = useStampShare({
    stamp,
    logTag: "[stamp-detail]",
  });

  React.useEffect(() => {
    if (!id) return;
    const attempt = loadAttempt;
    let cancelled = false;
    getStamp(id)
      .then((stamp) => {
        if (cancelled) return;
        setLoaded({ id, attempt, stamp });
      })
      .catch((error) => {
        console.error("[stamp-detail] failed to load stamp", error);
        if (cancelled) return;
        setLoaded({ id, attempt, stamp: null });
      });
    return () => {
      cancelled = true;
    };
  }, [id, loadAttempt]);

  return {
    // id が無ければ読み込むものが無いので、待たせずに `unavailable` の表示へ倒す
    loading: Boolean(id) && loading,
    unavailable: !id || unavailable,

    latitude: stamp?.location?.latitude ?? null,
    longitude: stamp?.location?.longitude ?? null,

    reload: React.useCallback(() => {
      setLoadAttempt((attempt) => attempt + 1);
    }, []),

    editors,
    design,

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
            // 戻すとスタンプが残ったまま消えたように見えるので、この画面に留めて知らせる
            Alert.alert(
              t("stampDetail.deleteFailedTitle"),
              t("stampDetail.deleteFailedMessage"),
            );
            return;
          }
        }
        router.back();
      })();
    },

    back: router.back,
    // replace だと履歴に残っているアルバムの上へ積むだけで同じ画面が 2 枚になる。
    // dismissTo は履歴のアルバムまで戻り、履歴に無ければ現在の画面を置き換える
    backToAlbum: () => router.dismissTo("/(tabs)/album"),
    share,
    toastMessage,
  };
}
