import React from "react";

import { EditFieldSheet } from "@/src/commons/sheet/components/EditFieldSheet/EditFieldSheet";
import type { StampFieldEditors } from "@/src/commons/stamp/hooks/useStampFieldEditors";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";

type Props = {
  /** `useStampFieldEditors()` の戻り値をそのまま渡す */
  editors: StampFieldEditors;
};

/**
 * スタンプ情報の編集シート 4 枚。
 *
 * 開いている 1 枚だけが `visible` になる。日時の欄は `editableDate` で出し分ける
 * （完了画面には日時の編集が無い）。
 */
export function StampFieldSheets({ editors }: Props) {
  const { t } = useTranslation();
  return (
    <>
      <EditFieldSheet
        visible={editors.editingField === "spotName"}
        onClose={editors.closeEditor}
        title={t("stampDetail.editTitle")}
        mode="text"
        value={editors.draftSpotName}
        onChangeValue={editors.setDraftSpotName}
        placeholder={t("stampDetail.editTitlePlaceholder")}
        onSave={editors.saveSpotName}
      />
      <EditFieldSheet
        visible={editors.editingField === "location"}
        onClose={editors.closeEditor}
        title={t("stampDetail.editPlace")}
        mode="text"
        value={editors.draftLocation}
        onChangeValue={editors.setDraftLocation}
        placeholder={t("stampDetail.editPlacePlaceholder")}
        onSave={editors.saveLocation}
      />
      {editors.editableDate && (
        <EditFieldSheet
          visible={editors.editingField === "date"}
          onClose={editors.closeEditor}
          title={t("stampDetail.editDate")}
          mode="datetime"
          value={editors.draftDate}
          onChangeValue={editors.setDraftDate}
          onSave={editors.saveDate}
        />
      )}
      <EditFieldSheet
        visible={editors.editingField === "memo"}
        onClose={editors.closeEditor}
        title={t("stampDetail.editMemo")}
        mode="text"
        value={editors.draftMemo}
        onChangeValue={editors.setDraftMemo}
        placeholder={t("stampDetail.editMemoPlaceholder")}
        multiline
        onSave={editors.saveMemo}
      />
    </>
  );
}
