// ここで確かめるのは、撮影画面から運ばれてきた撮影時刻を押印画面まで落とさずに
// 渡すこと。パラメータの組み立てそのものは `stampPressParams.test.ts` で見ている。
import { act, renderHook } from "@testing-library/react-native";
import { useRouter } from "expo-router";

import { usePhotoAdjust } from "@/src/features/camera/hooks/usePhotoAdjust";
import { getCurrentStampPlace } from "@/src/libs/location";

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  usePathname: () => "/photo-adjust",
}));
jest.mock("@/src/libs/location", () => ({
  getCurrentStampPlace: jest.fn(),
}));
jest.mock("@/src/libs/i18n/I18nProvider", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const useRouterMock = jest.mocked(useRouter);
const getCurrentStampPlaceMock = jest.mocked(getCurrentStampPlace);

const push = jest.fn();
const CAPTURED_AT = "2026-09-18T14:58:00.000Z";

beforeEach(() => {
  jest.clearAllMocks();
  useRouterMock.mockReturnValue({ push, back: jest.fn() } as never);
  getCurrentStampPlaceMock.mockResolvedValue({ location: null, address: null });
});

describe("usePhotoAdjust", () => {
  it("切り出した写真と一緒に、撮影時刻を押印画面へ渡す", async () => {
    const { result } = await renderHook(() =>
      usePhotoAdjust({
        imageUri: "file:///photos/1.jpg",
        capturedAt: CAPTURED_AT,
      }),
    );

    await act(async () => {
      await result.current.confirm("file:///photos/1-cropped.jpg");
    });

    expect(push).toHaveBeenCalledWith({
      pathname: "/stamp-press",
      params: expect.objectContaining({
        uri: "file:///photos/1-cropped.jpg",
        capturedAt: CAPTURED_AT,
      }),
    });
  });

  it("撮影時刻が来ていなければ capturedAt を渡さない", async () => {
    const { result } = await renderHook(() =>
      usePhotoAdjust({
        imageUri: "file:///photos/1.jpg",
        capturedAt: undefined,
      }),
    );

    await act(async () => {
      await result.current.confirm(null);
    });

    expect(push).toHaveBeenCalledWith({
      pathname: "/stamp-press",
      params: { uri: "file:///photos/1.jpg" },
    });
  });
});
