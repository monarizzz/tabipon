// 削除そのもの（行とファイルをどの順で消すか）は `stamps.test.ts` で見ている。
// ここで確かめるのは画面から外した後始末 — 撮り直しの削除が失敗したときに
// カメラへ戻さないこと。
// `deleteStamp()` が投げるのは行を消せなかったときだけで、画像の後始末の失敗は
// 投げずに成功として返る。ここでの棄却は「行が残っている」場合を指す
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { useStampFieldEditors } from "@/src/commons/stamp/hooks/useStampFieldEditors";
import { useStampDone } from "@/src/features/camera/hooks/useStampDone";
import {
  deleteStamp,
  getStamp,
  stampImageUri,
  type Stamp,
} from "@/src/infra/db/stamps";

jest.mock("@/src/infra/db/stamps", () => ({
  deleteStamp: jest.fn(),
  getStamp: jest.fn(),
  stampImageUri: jest.fn(),
}));
jest.mock("@/src/commons/stamp/hooks/useStampFieldEditors", () => ({
  useStampFieldEditors: jest.fn(),
}));
jest.mock("@/src/commons/layout/hooks/useTabBarItems", () => ({
  useTabBarItems: () => [],
}));
jest.mock("expo-router", () => ({ useRouter: jest.fn() }));
jest.mock("@/src/libs/i18n/I18nProvider", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const deleteStampMock = jest.mocked(deleteStamp);
const getStampMock = jest.mocked(getStamp);
const stampImageUriMock = jest.mocked(stampImageUri);
const useStampFieldEditorsMock = jest.mocked(useStampFieldEditors);
const useRouterMock = jest.mocked(useRouter);

const push = jest.fn();
const replace = jest.fn();

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

/** 保存済みスタンプの読み込みが終わった状態のフックを返す */
async function setup() {
  const view = await renderHook(() =>
    useStampDone({ stampId: STAMP.id, stampTop: "120" }),
  );
  await waitFor(() => expect(view.result.current.imageUri).toBeDefined());
  return view;
}

/** フックが返すハンドラを呼ぶ。中で走る Promise の解決までまとめて待つ */
async function press(handler: () => void) {
  await act(async () => {
    handler();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  // 編集欄は useStampFieldEditors の側で見ているので中身は持たせない
  useStampFieldEditorsMock.mockReturnValue({} as never);
  useRouterMock.mockReturnValue({ push, replace } as never);
  getStampMock.mockResolvedValue(STAMP);
  stampImageUriMock.mockReturnValue("file:///documents/stamps/stamp-1.png");
  deleteStampMock.mockResolvedValue(undefined);
});

describe("useStampDone の撮り直し", () => {
  it("撮り直しの削除に成功したらカメラへ戻る", async () => {
    const { result } = await setup();

    await press(result.current.confirmRetake);

    expect(deleteStampMock).toHaveBeenCalledWith("stamp-1");
    expect(replace).toHaveBeenCalledWith("/(tabs)");
  });

  it("撮り直しの削除に失敗したら戻らず、知らせて画面に留まる", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    deleteStampMock.mockRejectedValue(new Error("boom"));
    const { result } = await setup();

    await press(result.current.confirmRetake);

    // 戻ってしまうと、アルバムに残ったままのスタンプが消えたように見える
    expect(replace).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith(
      "stampDone.retakeFailedTitle",
      "stampDone.retakeFailedMessage",
    );
    alert.mockRestore();
    error.mockRestore();
  });
});
