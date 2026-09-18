// ここで確かめるのは撮影時刻の出どころ —
// **シャッターを切った瞬間の時刻**を調整画面まで運ぶこと。
// 写真の切り出しは `cropToPreview.test.ts` で見ているのでモックする。
import { act, renderHook } from "@testing-library/react-native";
import { useRouter } from "expo-router";

import { useCamera } from "@/src/features/camera/hooks/useCamera";
import { cropToPreview } from "@/src/features/camera/utils/cropToPreview";

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useFocusEffect: jest.fn(),
}));
jest.mock("expo-camera", () => ({
  useCameraPermissions: () => [{ granted: true }, jest.fn()],
}));
jest.mock("@/src/features/camera/utils/cropToPreview", () => ({
  cropToPreview: jest.fn(),
}));

const useRouterMock = jest.mocked(useRouter);
const cropToPreviewMock = jest.mocked(cropToPreview);

const push = jest.fn();
const takePictureAsync = jest.fn();

const SHUTTER = new Date("2026-09-18T14:58:00.000Z");
/** 切り出しに時間がかかり、その間に日付をまたいだ状況 */
const AFTER_CROP = new Date("2026-09-19T00:01:00.000Z");

async function setup() {
  const hook = await renderHook(() => useCamera());
  hook.result.current.changeContainerSize({ width: 300, height: 400 });
  // ref は画面が `<CameraView />` に差す。テストでは撮影だけ差し替える
  (hook.result.current.cameraRef as React.MutableRefObject<unknown>).current = {
    takePictureAsync,
  };
  return hook;
}

beforeEach(() => {
  jest.clearAllMocks();
  useRouterMock.mockReturnValue({ push } as never);
  takePictureAsync.mockResolvedValue({ uri: "file:///photos/1.jpg" });
  cropToPreviewMock.mockResolvedValue("file:///photos/1-cropped.jpg");
});

describe("useCamera", () => {
  it("シャッターを切った瞬間の時刻を、切り出し後の写真と一緒に調整画面へ渡す", async () => {
    jest.useFakeTimers().setSystemTime(SHUTTER);
    // 切り出しのあいだに日付をまたいでも、渡す時刻はシャッターの瞬間のまま
    cropToPreviewMock.mockImplementation(async () => {
      jest.setSystemTime(AFTER_CROP);
      return "file:///photos/1-cropped.jpg";
    });
    try {
      const { result } = await setup();

      await act(async () => {
        await result.current.capture();
      });
    } finally {
      jest.useRealTimers();
    }

    expect(push).toHaveBeenCalledWith({
      pathname: "/photo-adjust",
      params: {
        uri: "file:///photos/1-cropped.jpg",
        capturedAt: SHUTTER.toISOString(),
      },
    });
  });

  it("写真が撮れなければ進まず、また撮れる状態に戻す", async () => {
    takePictureAsync.mockResolvedValue(undefined);
    const { result } = await setup();

    await act(async () => {
      await result.current.capture();
    });

    expect(push).not.toHaveBeenCalled();
    expect(result.current.capturing).toBe(false);
  });
});
