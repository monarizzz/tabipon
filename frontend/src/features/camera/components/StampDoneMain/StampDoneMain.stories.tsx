import type { Meta, StoryObj } from "@storybook/react-native";

import type { StampFieldEditors } from "@/src/commons/stamp/types/stampField";

import { StampDoneMain } from "./StampDoneMain";

/** 編集シートは開いていない状態。押しても何も起きない */
const EDITORS: StampFieldEditors = {
  spotName: "東京タワー",
  memo: "夕方に行った",
  capturedAt: "2026-09-18T09:30:00.000Z",
  location: "東京都港区芝公園",

  openSpotName: () => {},
  openDate: () => {},
  openLocation: () => {},
  openMemo: () => {},

  editingField: null,
  editableDate: false,
  draftSpotName: "",
  draftLocation: "",
  draftDate: new Date("2026-09-18T09:30:00.000Z"),
  draftMemo: "",
  setDraftSpotName: () => {},
  setDraftLocation: () => {},
  setDraftDate: () => {},
  setDraftMemo: () => {},
  closeEditor: () => {},
  saveSpotName: () => {},
  saveDate: () => {},
  saveLocation: () => {},
  saveMemo: () => {},

  geocodeWarning: null,
  cancelGeocodeWarning: () => {},
  saveLocationAnyway: () => {},
};

const meta = {
  component: StampDoneMain,
  tags: ["autodocs"],
  args: {
    imageUri: undefined,
    editors: EDITORS,
    tabItems: [],
    headerAnchorHeight: 240,
    retakeDialogVisible: false,
    share: () => {},
    openRetakeDialog: () => {},
    cancelRetake: () => {},
    confirmRetake: () => {},
    continueShooting: () => {},
    goToAlbum: () => {},
  },
} satisfies Meta<typeof StampDoneMain>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 押した位置を引き継げなかったとき。余白を固定せず全体を上下に散らす */
export const WithoutStampPosition: Story = {
  args: { headerAnchorHeight: undefined },
};

/** スポット名がまだ未設定のとき */
export const NoSpotName: Story = {
  args: { editors: { ...EDITORS, spotName: "", memo: "", location: "" } },
};

export const RetakeConfirm: Story = {
  args: { retakeDialogVisible: true },
};
