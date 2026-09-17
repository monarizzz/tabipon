// 撮影が失敗したときに、利用者へ知らせが出て開発側にもログが残ることを固定する。
// 以前はどちらも無く、シャッターが効かないようにしか見えなかった（Issue #258）。
import { act, renderHook } from "@testing-library/react-native";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { useCamera } from "@/src/features/camera/hooks/useCamera";
import { cropToPreview } from "@/src/features/camera/utils/cropToPreview";

jest.mock("@/src/features/camera/utils/cropToPreview", () => ({
  cropToPreview: jest.fn(),
}));
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useFocusEffect: jest.fn(),
}));
jest.mock("expo-camera", () => ({
  useCameraPermissions: () => [{ granted: true }, jest.fn()],
}));
jest.mock("@/src/libs/i18n/I18nProvider", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const cropToPreviewMock = jest.mocked(cropToPreview);
const useRouterMock = jest.mocked(useRouter);

const push = jest.fn();
const takePictureAsync = jest.fn();

let alertSpy: jest.SpyInstance;
let errorSpy: jest.SpyInstance;

/** シャッターを押す。中で走る Promise の解決までまとめて待つ */
async function shutter(capture: () => Promise<void>) {
  await act(async () => {
    await capture();
  });
}

/** カメラの実体を掴んだ状態のフックを用意する */
async function setup() {
  const rendered = await renderHook(() => useCamera());
  // ref はプレビューが実体を差し込む。テストでは撮影だけ差し替える
  rendered.result.current.cameraRef.current = {
    takePictureAsync,
  } as never;
  return rendered;
}

beforeEach(() => {
  jest.clearAllMocks();
  useRouterMock.mockReturnValue({ push } as never);
  takePictureAsync.mockResolvedValue({ uri: "file:///photos/raw.jpg" });
  cropToPreviewMock.mockResolvedValue("file:///photos/cropped.jpg");
  alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  alertSpy.mockRestore();
  errorSpy.mockRestore();
});

describe("useCamera", () => {
  it("撮れたら切り抜いた写真を持って調整画面へ進む", async () => {
    const { result } = await setup();

    await shutter(result.current.capture);

    expect(push).toHaveBeenCalledWith({
      pathname: "/photo-adjust",
      params: { uri: "file:///photos/cropped.jpg" },
    });
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it("撮影が例外で失敗したら、知らせを出して理由をログに残す", async () => {
    const error = new Error("カメラを掴めなかった");
    takePictureAsync.mockRejectedValue(error);
    const { result } = await setup();

    await shutter(result.current.capture);

    expect(alertSpy).toHaveBeenCalledWith(
      "camera.captureFailedTitle",
      "camera.captureFailedMessage",
    );
    expect(errorSpy).toHaveBeenCalledWith("[camera] failed to capture", error);
    expect(push).not.toHaveBeenCalled();
    // 失敗したまま撮影中で固まると、シャッターが二度と押せなくなる
    expect(result.current.capturing).toBe(false);
  });

  it("写真が返らなかった場合も、例外のときと同じ知らせとログを出す", async () => {
    takePictureAsync.mockResolvedValue(undefined);
    const { result } = await setup();

    await shutter(result.current.capture);

    expect(alertSpy).toHaveBeenCalledWith(
      "camera.captureFailedTitle",
      "camera.captureFailedMessage",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "[camera] failed to capture",
      expect.any(Error),
    );
    expect(push).not.toHaveBeenCalled();
    expect(result.current.capturing).toBe(false);
  });

  it("切り抜きが失敗した場合も知らせとログを出す", async () => {
    const error = new Error("切り抜きに失敗した");
    cropToPreviewMock.mockRejectedValue(error);
    const { result } = await setup();

    await shutter(result.current.capture);

    expect(alertSpy).toHaveBeenCalledWith(
      "camera.captureFailedTitle",
      "camera.captureFailedMessage",
    );
    expect(errorSpy).toHaveBeenCalledWith("[camera] failed to capture", error);
    expect(push).not.toHaveBeenCalled();
  });

  it("失敗したあとでもう一度押すと、撮り直せる", async () => {
    takePictureAsync.mockRejectedValueOnce(new Error("boom"));
    const { result } = await setup();
    await shutter(result.current.capture);

    await shutter(result.current.capture);

    expect(push).toHaveBeenCalledWith({
      pathname: "/photo-adjust",
      params: { uri: "file:///photos/cropped.jpg" },
    });
  });
});
