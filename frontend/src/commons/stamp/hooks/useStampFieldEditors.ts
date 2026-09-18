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
   * フィールドごとの保存の順番待ち。最後に流した保存の Promise を持つ。
   *
   * **フィールドごとに持つ。**場所の保存はジオコーディングの通信を挟むので、
   * 1 本の待ち行列にすると、その待ち時間のあいだメモなど他の項目の保存まで待たされる。
   *
   * 表示には使わないので state ではなく ref で持つ。
   */
  const saveQueues = React.useRef(new Map<EditableField, Promise<void>>());

  const [geocodeWarning, setGeocodeWarning] =
    React.useState<GeocodeWarning | null>(null);

  /**
   * 最新の `draftLocation`。ジオコーディングを待っているあいだに住所が打ち直され
   * たかどうかを見るために持つ（`saveLocation`）。
   *
   * 待ち時間のあいだも場所のシートは開いたままで入力できるので、保存を押した
   * 時点の値しか見ないと、警告が指す住所と画面の住所がずれる。
   */
  const draftLocationRef = React.useRef(draftLocation);
  React.useEffect(() => {
    draftLocationRef.current = draftLocation;
  }, [draftLocation]);

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
   * **編集欄を閉じるのは、その項目の待ち行列の最後の保存が成功したときだけ。**
   * 古い保存の成功で閉じると、閉じて開き直したあとに積んだ保存用の編集欄まで
   * 閉じてしまう。その保存が失敗しても編集欄は閉じたままなので、開き直したときに
   * `openMemo()` などが古い保存済みの値でドラフトを初期化し、入力が消える。
   *
   * **patch は関数で受け取る。**場所の保存は書き込む前にジオコーディングを挟むので、
   * patch を先に組ませると、順番待ちに入る前の古い入力値で書き込むことになる
   *
   * **patch が null なら書き込まず、編集欄も閉じない。**場所の保存は、座標が
   * 引けなかったときに利用者へ確認してから書き込むため、ここでいったん降りる
   * （`saveLocation`）
   */
  const save = React.useCallback(
    async (
      field: EditableField,
      buildPatch: () => StampPatch | null | Promise<StampPatch | null>,
    ) => {
      if (!stampId) return;
      const run = async () => {
        try {
          const patch = await buildPatch();
          if (!patch) return;
          onUpdated(await updateStamp(stampId, patch));
          // 自分がこの項目の待ち行列の最後なら閉じる。後ろに保存が積まれていれば、
          // その編集欄は後続の保存が自分で閉じる
          if (saveQueues.current.get(field) === next) closeEditor();
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
        // 待っているあいだに住所が打ち直されていたら、引いた結果は捨てて画面に
        // ある住所で引き直す。古い結果のまま警告を出すと、「このまま保存」が
        // 打ち直す前の住所を書き込む
        let address = normalizeOptionalText(draftLocation);
        for (;;) {
          if (!address) {
            return { address };
          }
          const geocoded = await geocodeAddress(address);
          const latest = normalizeOptionalText(draftLocationRef.current);
          if (latest !== address) {
            address = latest;
            continue;
          }
          if (geocoded.status === "found") {
            return { address, location: geocoded.location };
          }
          setGeocodeWarning({ address, reason: geocoded.status });
          return null;
        }
      });
    },

    geocodeWarning,
    cancelGeocodeWarning: () => {
      setGeocodeWarning(null);
      // 開き直すのは、どの編集欄も開いていないときだけ。待っているあいだに
      // 別の項目を開いていたら、そのシートを閉じることになり、開き直したときに
      // `openMemo()` などがドラフトを保存済みの値へ巻き戻して入力が消える
      setEditingField((current) => current ?? "location");
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
