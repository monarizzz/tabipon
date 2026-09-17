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
