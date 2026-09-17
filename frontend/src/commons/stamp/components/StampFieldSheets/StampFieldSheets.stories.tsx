import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { View } from "react-native";
import { StampFieldSheets } from "./StampFieldSheets";
import type { StampFieldEditors } from "@/src/commons/stamp/hooks/useStampFieldEditors";

/**
 * フックを呼ばずに描くための値。
 *
 * `useStampFieldEditors()` は `updateStamp()`（SQLite）に触れるので、
 * ストーリーからは呼ばず、戻り値と同じ形の値を直接渡す。
 */
const editors: StampFieldEditors = {
  spotName: "東京スカイツリー",
  memo: "晴れた日に行ってきた！",
  capturedAt: "2026-06-28T10:30:00.000Z",
  location: "東京・墨田区",
  openSpotName: fn(),
  openDate: fn(),
  openLocation: fn(),
  openMemo: fn(),
  editingField: null,
  editableDate: true,
  draftSpotName: "東京スカイツリー",
  draftLocation: "東京・墨田区",
  draftDate: new Date("2026-06-28T10:30:00.000Z"),
  draftMemo: "晴れた日に行ってきた！",
  setDraftSpotName: fn(),
  setDraftLocation: fn(),
  setDraftDate: fn(),
  setDraftMemo: fn(),
  closeEditor: fn(),
  saveSpotName: fn(),
  saveDate: fn(),
  saveLocation: fn(),
  saveMemo: fn(),
};

const meta = {
  component: StampFieldSheets,
  decorators: [
    (Story) => (
      <View style={{ flex: 1 }}>
        <Story />
      </View>
    ),
  ],
  args: { editors },
} satisfies Meta<typeof StampFieldSheets>;

export default meta;

type Story = StoryObj<typeof meta>;

/** どのシートも開いていない状態 */
export const Closed: Story = {};

export const SpotNameOpen: Story = {
  args: { editors: { ...editors, editingField: "spotName" } },
};

export const MemoOpen: Story = {
  args: { editors: { ...editors, editingField: "memo" } },
};

export const DateOpen: Story = {
  args: { editors: { ...editors, editingField: "date" } },
};

/** 完了画面。日時の編集欄を出さないので、date を開こうとしても何も出ない */
export const WithoutDateField: Story = {
  args: { editors: { ...editors, editableDate: false, editingField: "date" } },
};
