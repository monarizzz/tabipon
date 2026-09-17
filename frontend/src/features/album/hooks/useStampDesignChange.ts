import React from "react";
import { Alert } from "react-native";

import {
  originalPhotoUri,
  replaceStampImage,
  stampImageUri,
  updateStamp,
  type Stamp,
} from "@/src/infra/db/stamps";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import {
  generateStampFromUri,
  generateStampPngFromUri,
} from "@/src/utils/stamp/io";
import { seedFromStampId } from "@/src/utils/stamp/seed";
import { DEFAULT_STAMP_COLOR } from "@/src/utils/stamp/constants/constants";
import { DEFAULT_STAMP_FRAME, type StampFrame } from "@/src/utils/stamp/types";

export type StampDesignChange = {
  /** 画面に出す uri。デザイン変更のたびに変わる（キャッシュ避け） */
  displayImageUri: string;
  /** ファイルそのものを渡すときの uri。共有はこちらを使う */
  imageUri: string;

  designMode: boolean;
  /** 選択中デザインのプレビュー（data-URI）。生成前と変更中でない間は null */
  previewUri: string | null;
  previewLoading: boolean;
  /** 確定の処理中。二度押しはこの間だけ弾く */
  updating: boolean;

  selectedColor: string;
  selectedFrameStyleId: StampFrame;
  setSelectedColor: (color: string) => void;
  setSelectedFrameStyleId: (frameId: StampFrame) => void;

  open: () => void;
  close: () => void;
  confirm: () => void;
};

type Options = {
  stampId: string | undefined;
  stamp: Stamp | null;
  /** 確定に成功したときに呼ぶ。画面側の `stamp` を差し替える */
  onUpdated: (stamp: Stamp) => void;
};

/**
 * スタンプのデザイン（色・フレーム）変更をまとめて持つ。
 *
 * **選択は「保存済みからの差分」として持つ。**`stamp` の値をコピーして初期化すると、
 * 読み込み完了に合わせて `setState` する effect が要るうえ、確定後にどちらが正かが増える。
 * 未選択を `null` で表し、表示のたびに `stamp` へフォールバックすれば、適用せずに
 * 閉じる操作は `null` に戻すだけで済む。
 *
 * 表示用の uri（`displayImageUri`）だけはクエリを足して返す。デザインを変えても
 * ファイルのパスは変わらないので、同じ uri のままだと画像側のキャッシュが効いて古い絵が出る。
 */
export function useStampDesignChange({
  stampId,
  stamp,
  onUpdated,
}: Options): StampDesignChange {
  const { t } = useTranslation();

  const [designMode, setDesignMode] = React.useState(false);
  const [draftColor, setDraftColor] = React.useState<string | null>(null);
  const [draftFrameId, setDraftFrameId] = React.useState<StampFrame | null>(
    null,
  );
  const [imageVersion, setImageVersion] = React.useState(0);
  const [updating, setUpdating] = React.useState(false);
  const [previewUri, setPreviewUri] = React.useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);

  const imageUri = stamp ? stampImageUri(stamp) : "";
  const displayImageUri = imageUri
    ? `${imageUri}${imageVersion ? `?v=${imageVersion}` : ""}`
    : "";

  // この端末に残っている元写真の uri（無ければデザイン変更できない）。
  // 実ファイルの有無を見にいくので、行が入れ替わったときだけ引き直す
  const originalUri = React.useMemo(
    () => (stamp ? originalPhotoUri(stamp) : null),
    [stamp],
  );

  const selectedColor = draftColor ?? stamp?.color ?? DEFAULT_STAMP_COLOR;
  const selectedFrameStyleId =
    draftFrameId ?? stamp?.frameId ?? DEFAULT_STAMP_FRAME;

  // 作成時の演出値。デザインを変えても同じ見た目になるよう引き継いで再適用する
  const scratchLevel = stamp?.scratchLevel ?? 0;
  const tiltAngle = stamp?.tiltAngle ?? 0;

  // デザイン変更中は選択中の色/フレームでプレビューを生成する(作成画面と同じ cancelled フラグ方式)
  React.useEffect(() => {
    if (!designMode || !originalUri) {
      // プレビューの生成を止めたときの後始末。描画は外部（Skia）で走らせており、
      // 捨てる操作をレンダー側に寄せられないためここで消す
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreviewUri(null);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    // 掠れの seed は id から導くので、色やフレームを変えても模様は変わらない
    generateStampFromUri(originalUri, {
      color: selectedColor,
      frame: selectedFrameStyleId,
      scratchLevel,
      tiltAngle,
      seed: stampId ? seedFromStampId(stampId) : 0,
    })
      .then((image) => {
        if (cancelled) return;
        const base64 = image.encodeToBase64();
        if (base64) setPreviewUri(`data:image/png;base64,${base64}`);
        setPreviewLoading(false);
      })
      .catch((error) => {
        if (!cancelled) setPreviewLoading(false);
        console.warn("[stamp-detail] preview generation failed", error);
      });
    return () => {
      cancelled = true;
    };
  }, [
    designMode,
    originalUri,
    scratchLevel,
    selectedColor,
    selectedFrameStyleId,
    stampId,
    tiltAngle,
  ]);

  const confirm = React.useCallback(async () => {
    if (!stampId || !originalUri || updating) return;
    const color = selectedColor;
    const frameId = selectedFrameStyleId;
    setUpdating(true);
    try {
      const stampPng = await generateStampPngFromUri(originalUri, {
        color,
        frame: frameId,
        scratchLevel,
        tiltAngle,
        seed: seedFromStampId(stampId),
      });
      // 画像を差し替えてから行を書く。逆にすると、書き込みに失敗したときに
      // 行だけ新しいデザインになり、実際の絵と食い違う
      await replaceStampImage(stampId, stampPng);
      onUpdated(await updateStamp(stampId, { color, frameId }));
      setImageVersion((version) => version + 1);
      setPreviewUri(null);
      setDraftColor(null);
      setDraftFrameId(null);
      setDesignMode(false);
    } catch (error) {
      console.error("[stamp-detail] failed to update design", error);
      Alert.alert(
        t("stampDetail.designUpdateFailedTitle"),
        t("stampDetail.designUpdateFailedMessage"),
      );
    } finally {
      setUpdating(false);
    }
  }, [
    onUpdated,
    originalUri,
    scratchLevel,
    selectedColor,
    selectedFrameStyleId,
    stampId,
    t,
    tiltAngle,
    updating,
  ]);

  return {
    displayImageUri,
    imageUri,

    designMode,
    previewUri,
    previewLoading,
    updating,

    selectedColor,
    selectedFrameStyleId,
    setSelectedColor: setDraftColor,
    setSelectedFrameStyleId: setDraftFrameId,

    open: () => {
      // 元写真が消えていると再生成できない。開いてから気付かせない
      if (!originalUri) {
        Alert.alert(
          t("stampDetail.designUnavailableTitle"),
          t("stampDetail.designUnavailableMessage"),
        );
        return;
      }
      setDesignMode(true);
    },
    close: () => {
      setDesignMode(false);
      setPreviewUri(null);
      // 適用せずに閉じたので選択を捨て、保存済みのデザインに戻す。
      // 残したままだと、開き直したときに実際のスタンプと違う選択が出る
      setDraftColor(null);
      setDraftFrameId(null);
    },
    confirm: () => {
      void confirm();
    },
  };
}
