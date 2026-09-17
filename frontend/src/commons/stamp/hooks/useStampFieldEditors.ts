import React from "react";
import { Alert } from "react-native";

import { updateStamp, type StampPatch } from "@/src/infra/db/stamps";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { geocodeAddress } from "@/src/libs/location/geocode";
import type {
  EditableField,
  EditingField,
  GeocodeWarning,
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

  const [geocodeWarning, setGeocodeWarning] =
    React.useState<GeocodeWarning | null>(null);

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
   *
   * **patch が null なら書き込まない。**場所の保存は、座標が引けなかったときに
   * 利用者へ確認してから書き込むため、ここでいったん降りる（`saveLocation`）
   */
  const save = React.useCallback(
    async (
      field: EditableField,
      buildPatch: () => StampPatch | null | Promise<StampPatch | null>,
    ) => {
      if (!stampId || savingFields.current.has(field)) return;
      savingFields.current.add(field);
      try {
        const patch = await buildPatch();
        if (!patch) return;
        onUpdated(await updateStamp(stampId, patch));
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
    // 住所を直したら `geocodeAddress()` で座標も引き直し、引けなければ座標を
    // 据え置いたまま保存を保留して警告を出す
    // （方針は docs/front-architecture.md「場所の編集と座標の追従」）
    saveLocation: () => {
      // 住所が変わっていなければ引き直さない。引けなかったときに「住所だけが
      // 変わる」という確認が出るが、実際には住所も変わらず選ばせる意味が無い
      if (
        normalizeOptionalText(draftLocation) === normalizeOptionalText(location)
      ) {
        closeEditor();
        return;
      }
      void save("location", async () => {
        const address = normalizeOptionalText(draftLocation);
        if (!address) {
          return { address };
        }
        const geocoded = await geocodeAddress(address);
        if (geocoded.status === "found") {
          return { address, location: geocoded.location };
        }
        setGeocodeWarning({ address, reason: geocoded.status });
        return null;
      });
    },

    geocodeWarning,
    // **閉じるのではなく開き直す。**ジオコーディングを待っているあいだも場所の
    // シートはスワイプで閉じられるので、警告が出た時点で開いているとは限らない。
    // ドラフトは閉じても残るため、開き直せば入力内容がそのまま戻る
    cancelGeocodeWarning: () => {
      setGeocodeWarning(null);
      setEditingField("location");
    },
    saveLocationAnyway: () => {
      const pending = geocodeWarning;
      setGeocodeWarning(null);
      if (!pending) return;
      // 引き直しはしない。警告を出す前に引いた結果をそのまま採用する
      void save("location", () => ({ address: pending.address }));
    },
  };
}
