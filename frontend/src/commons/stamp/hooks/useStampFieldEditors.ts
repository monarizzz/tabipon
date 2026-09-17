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
   * フィールドごとの保存の順番待ち。最後に流した保存の Promise を持つ。
   *
   * **フィールドごとに持つ。**場所の保存はジオコーディングの通信を挟むので、
   * 1 本の待ち行列にすると、その待ち時間のあいだメモなど他の項目の保存まで待たされる。
   *
   * 表示には使わないので state ではなく ref で持つ。
   */
  const saveQueues = React.useRef(new Map<EditableField, Promise<void>>());

  const closeEditor = React.useCallback(() => setEditingField(null), []);

  /**
   * 1 項目を保存する。
   *
   * 同じ項目の保存中に来た保存は捨てずに順番待ちにし、前の保存が終わってから流す。
   * 弾くと、押した保存が黙って無かったことになるうえ、先に走っていた保存の完了で
   * 編集欄が閉じるので、保存されたように見えてしまう。
   *
   * 失敗したらログと Alert を出して編集欄を開いたままにする。閉じてしまうと、
   * 入力した内容が消えたうえに失敗したことも分からなくなる。
   *
   * **patch は関数で受け取る。**場所の保存は書き込む前にジオコーディングを挟むので、
   * patch を先に組ませると、順番待ちに入る前の古い入力値で書き込むことになる
   */
  const save = React.useCallback(
    async (
      field: EditableField,
      buildPatch: () => StampPatch | Promise<StampPatch>,
    ) => {
      if (!stampId) return;
      const run = async () => {
        try {
          onUpdated(await updateStamp(stampId, await buildPatch()));
          closeEditor();
        } catch (error) {
          console.error(`${logTag} failed to update ${field}`, error);
          Alert.alert(
            t("stampDetail.saveFailedTitle"),
            t("stampDetail.saveFailedMessage"),
          );
        }
      };
      // 前の保存が失敗しても後続は流す（`run` は自分で握るので reject しないが、念のため両方に渡す）
      const previous = saveQueues.current.get(field) ?? Promise.resolve();
      const next = previous.then(run, run);
      saveQueues.current.set(field, next);
      await next;
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
        return geocoded ? { address, location: geocoded } : { address };
      });
    },
  };
}
