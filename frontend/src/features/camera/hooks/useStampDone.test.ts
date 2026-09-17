// 完成画面の共有で確かめるのは「何を共有シートに渡すか」。
// 画像 URI を渡さずテキストだけ共有していた不具合の再発を止める。
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import * as Sharing from "expo-sharing";

import { useStampFieldEditors } from "@/src/commons/stamp/hooks/useStampFieldEditors";
import { useStampDone } from "@/src/features/camera/hooks/useStampDone";
import { getStamp, type Stamp } from "@/src/infra/db/stamps";

jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));
jest.mock("@/src/libs/i18n/I18nProvider", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("@/src/commons/layout/hooks/useTabBarItems", () => ({
  useTabBarItems: () => [],
}));
jest.mock("@/src/commons/stamp/hooks/useStampFieldEditors", () => ({
  useStampFieldEditors: jest.fn(),
}));
jest.mock("@/src/infra/db/stamps", () => ({
  getStamp: jest.fn(),
  deleteStamp: jest.fn(),
  stampImageUri: (stamp: { stampImagePath: string }) =>
    `file:///documents/${stamp.stampImagePath}`,
}));

const useStampFieldEditorsMock = jest.mocked(useStampFieldEditors);
const getStampMock = jest.mocked(getStamp);
const isAvailableAsyncMock = jest.mocked(Sharing.isAvailableAsync);
const shareAsyncMock = jest.mocked(Sharing.shareAsync);

const STAMP = { id: "stamp-1", stampImagePath: "stamps/stamp-1.png" } as Stamp;

/** 保存済みスタンプの読み込みが終わった状態のフックを返す */
async function setup(spotName = "") {
  useStampFieldEditorsMock.mockReturnValue({ spotName } as never);
  const view = await renderHook(() =>
    useStampDone({ stampId: "stamp-1", stampTop: "413" }),
  );
  await waitFor(() => expect(view.result.current.imageUri).toBeDefined());
  return view;
}

/** 共有ボタンの中で走る Promise の解決までまとめて待つ */
async function share(handler: () => void) {
  await act(async () => {
    handler();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  getStampMock.mockResolvedValue(STAMP);
  isAvailableAsyncMock.mockResolvedValue(true);
  shareAsyncMock.mockResolvedValue(undefined);
});

describe("useStampDone の共有", () => {
  it("スタンプ画像の URI を共有シートへ渡す", async () => {
    const { result } = await setup();

    await share(result.current.share);

    expect(shareAsyncMock).toHaveBeenCalledWith(
      "file:///documents/stamps/stamp-1.png",
      { dialogTitle: "stampDone.shareMessage" },
    );
  });

  it("スポット名が入っていれば、それをダイアログの表題に使う", async () => {
    const { result } = await setup("東京タワー");

    await share(result.current.share);

    expect(shareAsyncMock).toHaveBeenCalledWith(expect.any(String), {
      dialogTitle: "東京タワー",
    });
  });

  it("スタンプを読み込めていなければ共有しない", async () => {
    getStampMock.mockResolvedValue(null);
    useStampFieldEditorsMock.mockReturnValue({ spotName: "" } as never);
    const { result } = await renderHook(() =>
      useStampDone({ stampId: "stamp-1", stampTop: "413" }),
    );

    await share(result.current.share);

    expect(shareAsyncMock).not.toHaveBeenCalled();
  });

  it("端末が共有に対応していなければ、共有せずに知らせる", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    isAvailableAsyncMock.mockResolvedValue(false);
    const { result } = await setup();

    await share(result.current.share);

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

    await share(result.current.share);

    expect(alert).toHaveBeenCalledWith(
      "stampDone.shareFailedTitle",
      "stampDone.shareFailedMessage",
    );
    alert.mockRestore();
    error.mockRestore();
  });
});
