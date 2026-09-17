// 削除そのもの（行とファイルをどの順で消すか）は `stamps.test.ts` で見ている。
// ここで確かめるのは画面から外した後始末 — 削除の成否で戻るかどうかが分かれること。
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { useStampFieldEditors } from "@/src/commons/stamp/hooks/useStampFieldEditors";
import { useStampDesignChange } from "@/src/features/album/hooks/useStampDesignChange";
import { useStampDetail } from "@/src/features/album/hooks/useStampDetail";
import { deleteStamp, getStamp, type Stamp } from "@/src/infra/db/stamps";

jest.mock("@/src/infra/db/stamps", () => ({
  deleteStamp: jest.fn(),
  getStamp: jest.fn(),
}));
jest.mock("@/src/commons/stamp/hooks/useStampFieldEditors", () => ({
  useStampFieldEditors: jest.fn(),
}));
jest.mock("@/src/features/album/hooks/useStampDesignChange", () => ({
  useStampDesignChange: jest.fn(),
}));
jest.mock("expo-router", () => ({ useRouter: jest.fn() }));
jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));
jest.mock("@/src/libs/i18n/I18nProvider", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const deleteStampMock = jest.mocked(deleteStamp);
const getStampMock = jest.mocked(getStamp);
const useStampFieldEditorsMock = jest.mocked(useStampFieldEditors);
const useStampDesignChangeMock = jest.mocked(useStampDesignChange);
const useRouterMock = jest.mocked(useRouter);

const back = jest.fn();
const dismissTo = jest.fn();

const STAMP = {
  id: "stamp-1",
  stampImagePath: "stamps/stamp-1.png",
  lineArtPath: "originals/stamp-1.jpg",
  title: "東京タワー",
  memo: null,
  capturedAt: "2026-09-18T01:23:00.000Z",
  capturedAtOriginal: "2026-09-18T01:23:00.000Z",
  createdAt: "2026-09-18T01:23:00.000Z",
  location: null,
  address: null,
  color: "#111111",
  frameId: "simple",
  scratchLevel: 0.3,
  tiltAngle: 2,
} as const satisfies Stamp;

/** 編集欄とデザイン変更はそれぞれのフックの単体テストで見ているので中身は持たせない */
function stubHooks() {
  useStampFieldEditorsMock.mockReturnValue({} as never);
  useStampDesignChangeMock.mockReturnValue({ imageUri: undefined } as never);
}

async function setup() {
  const view = await renderHook(() => useStampDetail(STAMP.id));
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return view;
}

/** フックが返すハンドラを呼ぶ。中で走る Promise の解決までまとめて待つ */
async function press(handler: () => void) {
  await act(async () => {
    handler();
  });
}

describe("useStampDetail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stubHooks();
    useRouterMock.mockReturnValue({ back, dismissTo } as never);
    getStampMock.mockResolvedValue(STAMP);
    deleteStampMock.mockResolvedValue(undefined);
  });

  it("削除に成功したらアルバムへ戻る", async () => {
    const { result } = await setup();

    await press(result.current.confirmDelete);

    expect(deleteStampMock).toHaveBeenCalledWith("stamp-1");
    expect(back).toHaveBeenCalledTimes(1);
  });

  it("削除に失敗したら戻らず、知らせて画面に留まる", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    deleteStampMock.mockRejectedValue(new Error("boom"));
    const { result } = await setup();

    await press(result.current.confirmDelete);

    // 戻ってしまうと、一覧に残ったままのスタンプが消えたように見える
    expect(back).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith(
      "stampDetail.deleteFailedTitle",
      "stampDetail.deleteFailedMessage",
    );
    expect(result.current.unavailable).toBe(false);
    alert.mockRestore();
    error.mockRestore();
  });
});
