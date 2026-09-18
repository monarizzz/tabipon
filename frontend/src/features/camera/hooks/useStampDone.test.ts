// 完成画面の共有で確かめるのは「何を共有シートに渡すか」。
// 画像 URI を渡さずテキストだけ共有していた不具合の再発を止める。
// 削除そのもの（行とファイルをどの順で消すか）は `stamps.test.ts` で見ている。
// ここで確かめるのは画面から外した後始末 — 撮り直しの削除が失敗したときに
// カメラへ戻さないこと。
// `deleteStamp()` が投げるのは行を消せなかったときだけで、画像の後始末の失敗は
// 投げずに成功として返る。ここでの棄却は「行が残っている」場合を指す
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";

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
jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));
jest.mock("@/src/libs/i18n/I18nProvider", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const deleteStampMock = jest.mocked(deleteStamp);
const getStampMock = jest.mocked(getStamp);
const stampImageUriMock = jest.mocked(stampImageUri);
const useStampFieldEditorsMock = jest.mocked(useStampFieldEditors);
const useRouterMock = jest.mocked(useRouter);
const isAvailableAsyncMock = jest.mocked(Sharing.isAvailableAsync);
const shareAsyncMock = jest.mocked(Sharing.shareAsync);

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
async function setup(spotName = "") {
  useStampFieldEditorsMock.mockReturnValue({ spotName } as never);
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
  isAvailableAsyncMock.mockResolvedValue(true);
  shareAsyncMock.mockResolvedValue(undefined);
});

describe("useStampDone の共有", () => {
  it("スタンプ画像の URI を共有シートへ渡す", async () => {
    const { result } = await setup();

    await press(result.current.share);

    expect(shareAsyncMock).toHaveBeenCalledWith(
      "file:///documents/stamps/stamp-1.png",
      { dialogTitle: "stampDone.shareMessage" },
    );
  });

  it("スポット名が入っていれば、それをダイアログの表題に使う", async () => {
    const { result } = await setup("東京タワー");

    await press(result.current.share);

    expect(shareAsyncMock).toHaveBeenCalledWith(expect.any(String), {
      dialogTitle: "東京タワー",
    });
  });

  it("スタンプを読み込めていなければ共有しない", async () => {
    getStampMock.mockResolvedValue(null);
    useStampFieldEditorsMock.mockReturnValue({ spotName: "" } as never);
    const { result } = await renderHook(() =>
      useStampDone({ stampId: STAMP.id, stampTop: "120" }),
    );

    await press(result.current.share);

    expect(shareAsyncMock).not.toHaveBeenCalled();
  });

  it("端末が共有に対応していなければ、共有せずに知らせる", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    isAvailableAsyncMock.mockResolvedValue(false);
    const { result } = await setup();

    await press(result.current.share);

    expect(shareAsyncMock).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith(
      "stampDone.shareUnavailableTitle",
      "stampDone.shareUnavailableMessage",
    );
    alert.mockRestore();
  });

  it("共有に失敗したら知らせる", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    shareAsyncMock.mockRejectedValue(new Error("boom"));
    const { result } = await setup();

    await press(result.current.share);

    expect(alert).toHaveBeenCalledWith(
      "stampDone.shareFailedTitle",
      "stampDone.shareFailedMessage",
    );
    alert.mockRestore();
    error.mockRestore();
  });
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
