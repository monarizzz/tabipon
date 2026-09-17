import React from "react";
import { Alert } from "react-native";

import { updateStamp, type StampPatch } from "@/src/infra/db/stamps";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { geocodeAddress } from "@/src/libs/location/geocode";
import type {
  EditableField,
  EditingField,
  StampFieldEditors,
  StampFieldEditorsOptions,
} from "@/src/commons/stamp/types/stampField";
import { normalizeOptionalText } from "@/src/commons/stamp/utils/normalizeOptionalText";
import { parseCapturedAt } from "@/src/commons/stamp/utils/parseCapturedAt";

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
}: StampFieldEditorsOptions): StampFieldEditors {
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

  /**
   * 保存中のフィールド。二度押しの guard にだけ使う。
   *
   * **フィールドごとに持つ。**場所の保存はジオコーディングの通信を挟むので、
   * 1 つの真偽値にすると、その待ち時間のあいだメモなど他の項目の保存まで弾かれる。
   * 早期 return なので押しても何も起きず、失敗したことも分からない。
   *
   * 表示には使わないので state ではなく ref で持つ。
   */
  const savingFields = React.useRef(new Set<EditableField>());

  const closeEditor = React.useCallback(() => setEditingField(null), []);

  /**
   * 1 項目を保存する。
   *
   * 同じ項目の保存中は二度押しを弾き、失敗したらログと Alert を出して編集欄を
   * 開いたままにする。閉じてしまうと、入力した内容が消えたうえに失敗したことも
   * 分からなくなる。
   *
   * **patch は関数で受け取る。**場所の保存は書き込む前にジオコーディングを挟むので、
   * patch を先に組ませると、その通信中だけ二度押しの guard が外れる
   */
  const save = React.useCallback(
    async (
      field: EditableField,
      buildPatch: () => StampPatch | Promise<StampPatch>,
    ) => {
      if (!stampId || savingFields.current.has(field)) return;
      savingFields.current.add(field);
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
        savingFields.current.delete(field);
      }
    },
    [closeEditor, logTag, onUpdated, stampId, t],
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
      void save("spotName", () => ({
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
        return geocoded.status === "found"
          ? { address, location: geocoded.location }
          : { address };
      });
    },
  };
}
