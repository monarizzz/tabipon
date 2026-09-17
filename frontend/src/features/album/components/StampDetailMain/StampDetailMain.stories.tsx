import type { Meta, StoryObj } from "@storybook/react-native";

import type { StampFieldEditors } from "@/src/commons/stamp/types/stampField";
import type { StampDesignChange } from "@/src/features/album/types/stampDesignChange";

import { StampDetailMain } from "./StampDetailMain";

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
  editableDate: true,
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
};

const DESIGN: StampDesignChange = {
  displayImageUri: "",
  imageUri: "",
  designMode: false,
  previewUri: null,
  previewLoading: false,
  updating: false,
  selectedColor: "#1F2937",
  selectedFrameStyleId: "simple",
  setSelectedColor: () => {},
  setSelectedFrameStyleId: () => {},
  open: () => {},
  close: () => {},
  confirm: () => {},
};

const meta = {
  component: StampDetailMain,
  tags: ["autodocs"],
  args: {
    loading: false,
    unavailable: false,
    reload: () => {},
    latitude: 35.6586,
    longitude: 139.7454,
    editors: EDITORS,
    design: DESIGN,
    showLandmarkName: true,
    toggleShowLandmarkName: () => {},
    deleteDialogVisible: false,
    openDeleteDialog: () => {},
    cancelDelete: () => {},
    confirmDelete: () => {},
    back: () => {},
    backToAlbum: () => {},
    share: () => {},
  },
} satisfies Meta<typeof StampDetailMain>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: { loading: true },
};

/**
 * id が無い／DB に行が無い／読み込みに失敗した、のいずれか。
 * どれかを問わず、再読み込みとアルバムへ戻る導線を出す
 */
export const Unavailable: Story = {
  args: { unavailable: true },
};

/** 位置情報が取れていないスタンプ。地図は出ない */
export const WithoutLocation: Story = {
  args: { latitude: null, longitude: null },
};

export const DeleteConfirm: Story = {
  args: { deleteDialogVisible: true },
};

/** デザイン変更を開き、プレビューを作っている最中 */
export const DesignChanging: Story = {
  args: { design: { ...DESIGN, designMode: true, previewLoading: true } },
};
