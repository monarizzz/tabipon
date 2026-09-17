import React from "react";
import { Alert } from "react-native";

import {
  updateStamp,
  type Stamp,
  type StampPatch,
} from "@/src/infra/db/stamps";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { geocodeAddress } from "@/src/libs/location/geocode";
import { parseIso } from "@/src/utils/datetime/format";

/** 空文字は「未設定」として null で保存する。DB 側で "" と null が混ざらないようにする */
function normalizeOptionalText(value: string): string | null {
  return value.trim() || null;
}

/** 撮影日時が壊れている場合でもピッカーは開けるようにし、現在時刻から選ばせる */
function parseCapturedAt(isoDate: string): Date {
  return parseIso(isoDate) ?? new Date();
}

type EditingField = "spotName" | "date" | "location" | "memo" | null;

export type StampFieldEditors = {
  /** 表示に使う値。`stamp` から導出する */
  spotName: string;
  memo: string;
  capturedAt: string;
  location: string;

  openSpotName: () => void;
  openDate: () => void;
  openLocation: () => void;
  openMemo: () => void;

  /** `<StampFieldSheets editors={...} />` に渡す。画面から直接は触らない */
  editingField: EditingField;
  editableDate: boolean;
  draftSpotName: string;
  draftLocation: string;
  draftDate: Date;
  draftMemo: string;
  setDraftSpotName: (value: string) => void;
  setDraftLocation: (value: string) => void;
  setDraftDate: (value: Date) => void;
  setDraftMemo: (value: string) => void;
  closeEditor: () => void;
  saveSpotName: () => void;
  saveDate: () => void;
  saveLocation: () => void;
  saveMemo: () => void;
};

type Options = {
  stampId: string | undefined;
  stamp: Stamp | null;
  /** 日時の編集欄を出すか。完了画面では出さない */
  editableDate?: boolean;
  /** 保存に成功したときに呼ぶ。画面側の `stamp` を差し替える */
  onUpdated: (stamp: Stamp) => void;
  /** 失敗ログの接頭辞。どの画面から失敗したか分かるようにする */
  logTag: string;
};

/**
 * スタンプ情報（スポット名 / 日時 / 場所 / メモ）の編集状態をまとめて持つ。
 *
 * **表示する値は `stamp` から導出し、このフックでは持たない。**保存のたびに
 * `updateStamp()` の戻り値を `onUpdated` で返し、画面側の `stamp` を差し替える。
 * 値をこちらでも持つと、DB と画面のどちらが正かが増えるうえ、`stamp` の読み込み
 * 完了に合わせて `setState` する effect が要る。
 */
export function useStampFieldEditors({
  stampId,
  stamp,
  editableDate = false,
  onUpdated,
  logTag,
}: Options): StampFieldEditors {
  const { t } = useTranslation();

  const spotName = stamp?.title ?? "";
  const memo = stamp?.memo ?? "";
  const capturedAt = stamp?.capturedAt ?? "";
  // 取得時に逆引きして保存済みの住所。手で直せば同じ列が上書きされる
  const location = stamp?.address ?? "";

  const [editingField, setEditingField] = React.useState<EditingField>(null);
  const [draftSpotName, setDraftSpotName] = React.useState("");
  const [draftLocation, setDraftLocation] = React.useState("");
  const [draftDate, setDraftDate] = React.useState(() => new Date());
  const [draftMemo, setDraftMemo] = React.useState("");
  const [updating, setUpdating] = React.useState(false);

  const closeEditor = React.useCallback(() => setEditingField(null), []);

  /**
   * 1 項目を保存する。
   *
   * 保存中の二度押しを弾き、失敗したらログと Alert を出して編集欄を開いたままにする。
   * 閉じてしまうと、入力した内容が消えたうえに失敗したことも分からなくなる。
   *
   * **patch は関数で受け取る。**場所の保存は書き込む前にジオコーディングを挟むので、
   * patch を先に組ませると、その通信中だけ二度押しの guard が外れる
   */
  const save = React.useCallback(
    async (
      field: string,
      buildPatch: () => StampPatch | Promise<StampPatch>,
    ) => {
      if (!stampId || updating) return;
      setUpdating(true);
      try {
        onUpdated(await updateStamp(stampId, await buildPatch()));
        closeEditor();
      } catch (error) {
        console.error(`${logTag} failed to update ${field}`, error);
        Alert.alert(
          t("stampDetail.saveFailedTitle"),
          t("stampDetail.saveFailedMessage"),
        );
      } finally {
        setUpdating(false);
      }
    },
    [closeEditor, logTag, onUpdated, stampId, t, updating],
  );

  return {
    spotName,
    memo,
    capturedAt,
    location,

    openSpotName: () => {
      setDraftSpotName(spotName);
      setEditingField("spotName");
    },
    openDate: () => {
      setDraftDate(parseCapturedAt(capturedAt));
      setEditingField("date");
    },
    openLocation: () => {
      setDraftLocation(location);
      setEditingField("location");
    },
    openMemo: () => {
      setDraftMemo(memo);
      setEditingField("memo");
    },

    editingField,
    editableDate,
    draftSpotName,
    draftLocation,
    draftDate,
    draftMemo,
    setDraftSpotName,
    setDraftLocation,
    setDraftDate,
    setDraftMemo,
    closeEditor,
    saveSpotName: () => {
      void save("spot name", () => ({
        title: normalizeOptionalText(draftSpotName),
      }));
    },
    saveMemo: () => {
      void save("memo", () => ({ memo: normalizeOptionalText(draftMemo) }));
    },
    saveDate: () => {
      void save("date", () => ({ capturedAt: draftDate.toISOString() }));
    },
    // **住所を直したら座標も引き直す。**そうしないと地図が前の場所を指したまま
    // 住所だけ変わり、表示が食い違う（#87）。
    //
    // 引けなかったときは座標を据え置く。「おばあちゃんち」のような住所として
    // 引けない文字列は入りうるし、そこで座標を消すと地図ごと出なくなる
    saveLocation: () => {
      void save("location", async () => {
        const address = normalizeOptionalText(draftLocation);
        if (!address) {
          return { address };
        }
        const geocoded = await geocodeAddress(address);
        return geocoded ? { address, location: geocoded } : { address };
      });
    },
  };
}
