import type { Meta, StoryObj } from "@storybook/react-native";

import { StampPressMain } from "./StampPressMain";

const meta = {
  component: StampPressMain,
  tags: ["autodocs"],
  args: {
    imageUri: undefined,
    tabItems: [],
    color: "#1F2937",
    frameStyleId: "classic",
    draftColor: "#1F2937",
    draftFrameStyleId: "classic",
    selectDraftColor: () => {},
    selectDraftFrameStyle: () => {},
    designSheetVisible: false,
    openDesignSheet: () => {},
    closeDesignSheet: () => {},
    confirmDesign: () => {},
    showLandmarkName: true,
    toggleShowLandmarkName: () => {},
    helpVisible: false,
    toggleHelp: () => {},
    closeHelp: () => {},
    waiting: false,
    saveFailed: false,
    saveErrorMessage: "",
    dismissSaveFailed: () => {},
    retrySave: () => {},
    discardDialogVisible: false,
    cancelDiscard: () => {},
    confirmDiscard: () => {},
    back: () => {},
    createStamp: () => {},
  },
} satisfies Meta<typeof StampPressMain>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 生成と保存を待っている間。全面にオーバーレイを出す */
export const Waiting: Story = {
  args: { waiting: true },
};

export const SaveFailed: Story = {
  args: {
    saveFailed: true,
    saveErrorMessage: "Error: PNG への符号化に失敗した",
  },
};

export const Help: Story = {
  args: { helpVisible: true },
};

/** タブへ移ろうとして、押す前のスタンプを捨てるか聞いている状態 */
export const DiscardConfirm: Story = {
  args: { discardDialogVisible: true },
};
