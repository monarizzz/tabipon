import type { Stamp } from "@/src/infra/db/stamps";

/** 編集できるフィールド */
export type EditableField = "spotName" | "date" | "location" | "memo";

/** いま開いている編集欄。どれも開いていないときは null */
export type EditingField = EditableField | null;

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

/** `useStampFieldEditors()` の引数 */
export type StampFieldEditorsOptions = {
  stampId: string | undefined;
  stamp: Stamp | null;
  /** 日時の編集欄を出すか。完了画面では出さない */
  editableDate?: boolean;
  /** 保存に成功したときに呼ぶ。画面側の `stamp` を差し替える */
  onUpdated: (stamp: Stamp) => void;
  /** 失敗ログの接頭辞。どの画面から失敗したか分かるようにする */
  logTag: string;
};
