// 撮影が失敗したときに、利用者へ知らせが出て開発側にもログが残ることを固定する。
// 以前はどちらも無く、シャッターが効かないようにしか見えなかった（Issue #258）。
// あわせて、調整画面へ渡す撮影時刻がシャッターを切った瞬間のものであることも見る。
// 写真の切り出しそのものは `cropToPreview.test.ts` で見ているのでモックする。
import { act, renderHook } from "@testing-library/react-native";
import { Alert, AppState, type AppStateStatus } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { useCamera } from "@/src/features/camera/hooks/useCamera";
import { cropToPreview } from "@/src/features/camera/utils/cropToPreview";

jest.mock("@/src/features/camera/utils/cropToPreview", () => ({
  cropToPreview: jest.fn(),
}));
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useFocusEffect: jest.fn(),
}));
// useCameraPermissions() は [現在値, 要求, 読み直し] の 3 要素を返す。
// 第 3 要素を省くと useCamera 側の読み直しが undefined になって落ちる。
// 返す関数は毎レンダー作り直さない。作り直すと useCamera 内の
// useCallback の同一性が毎回変わり、latestFocusEffects() が
// 古い分まで拾ってしまう
// 第 1 要素は OS への問い合わせが終わるまで null
const mockPermission: {
  current: { granted: boolean; canAskAgain: boolean } | null;
} = { current: { granted: true, canAskAgain: false } };
const mockRequestPermission = jest.fn();
const mockGetPermission = jest.fn();
jest.mock("expo-camera", () => ({
  useCameraPermissions: () => [
    mockPermission.current,
    mockRequestPermission,
    mockGetPermission,
  ],
}));
jest.mock("@/src/libs/i18n/I18nProvider", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const cropToPreviewMock = jest.mocked(cropToPreview);
const useRouterMock = jest.mocked(useRouter);
const useFocusEffectMock = jest.mocked(useFocusEffect);

const push = jest.fn();
const takePictureAsync = jest.fn();

const SHUTTER = new Date("2026-09-18T14:58:00.000Z");
/** 切り出しに時間がかかり、その間に日付をまたいだ状況 */
const AFTER_CROP = new Date("2026-09-19T00:01:00.000Z");

let alertSpy: jest.SpyInstance;
let errorSpy: jest.SpyInstance;
let appStateSpy: jest.SpyInstance;

/** AppState へ登録された処理。設定アプリから戻った場面を作るのに使う */
let appStateHandlers: ((status: AppStateStatus) => void)[] = [];

/** 設定アプリなどから、このアプリの前面に戻ってくる */
async function returnToApp(status: AppStateStatus = "active") {
  await act(async () => {
    for (const handler of appStateHandlers) handler(status);
  });
}

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

/**
 * これまでに useFocusEffect へ渡された処理を、同じものを除いて集める。
 * useCamera は useFocusEffect を複数登録し、再レンダーのたびに同じ処理が
 * 積まれるため、呼び出し履歴をそのまま使うと同じ処理を何度も呼んでしまう
 */
function latestFocusEffects() {
  const effects = useFocusEffectMock.mock.calls.map(([effect]) => effect);
  return [...new Set(effects)];
}

/**
 * カメラ画面から別のタブへ移る。
 * 実機では useFocusEffect に渡した後始末が blur で走るので、それを直に呼ぶ。
 * useCamera は useFocusEffect を複数登録するため、1 つだけを選ばず
 * 最後のレンダーで登録されたぶんをまとめて呼ぶ（実機の focus / blur と同じ）
 */
async function leaveCameraScreen() {
  const effects = latestFocusEffects();
  await act(async () => {
    const cleanups = effects.map((effect) => effect());
    for (const cleanup of cleanups) {
      if (typeof cleanup === "function") cleanup();
    }
  });
}

/** 撮影の成否を後から決められるようにする */
function pendingShot() {
  let resolveShot: (photo: unknown) => void = () => {};
  let rejectShot: (reason: unknown) => void = () => {};
  takePictureAsync.mockReturnValue(
    new Promise((resolve, reject) => {
      resolveShot = resolve;
      rejectShot = reject;
    }),
  );
  return {
    succeed: (photo: unknown) => resolveShot(photo),
    fail: (reason: unknown) => rejectShot(reason),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPermission.current = { granted: true, canAskAgain: false };
  useRouterMock.mockReturnValue({ push } as never);
  takePictureAsync.mockResolvedValue({ uri: "file:///photos/raw.jpg" });
  cropToPreviewMock.mockResolvedValue("file:///photos/cropped.jpg");
  alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  appStateHandlers = [];
  appStateSpy = jest
    .spyOn(AppState, "addEventListener")
    .mockImplementation((type, handler) => {
      if (type === "change") {
        appStateHandlers.push(handler as (status: AppStateStatus) => void);
      }
      return { remove: () => {} } as never;
    });
});

afterEach(() => {
  alertSpy.mockRestore();
  errorSpy.mockRestore();
  appStateSpy.mockRestore();
});

describe("useCamera", () => {
  it("撮れたら切り抜いた写真を持って調整画面へ進む", async () => {
    const { result } = await setup();

    await shutter(result.current.capture);

    expect(push).toHaveBeenCalledWith({
      pathname: "/photo-adjust",
      params: {
        uri: "file:///photos/cropped.jpg",
        capturedAt: expect.any(String),
      },
    });
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it("シャッターを切った瞬間の時刻を、切り出し後の写真と一緒に調整画面へ渡す", async () => {
    jest.useFakeTimers().setSystemTime(SHUTTER);
    // 切り出しのあいだに日付をまたいでも、渡す時刻はシャッターの瞬間のまま
    cropToPreviewMock.mockImplementation(async () => {
      jest.setSystemTime(AFTER_CROP);
      return "file:///photos/cropped.jpg";
    });
    try {
      const { result } = await setup();

      await shutter(result.current.capture);
    } finally {
      jest.useRealTimers();
    }

    expect(push).toHaveBeenCalledWith({
      pathname: "/photo-adjust",
      params: {
        uri: "file:///photos/cropped.jpg",
        capturedAt: SHUTTER.toISOString(),
      },
    });
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

  // タブを移っても useCamera はマウントされたまま残るため、あとから解決した
  // 撮影が今表示している画面に割り込んでしまう
  describe("撮影中にカメラ画面を離れた場合", () => {
    it("失敗しても Alert は出さず、ログだけ残す", async () => {
      const error = new Error("カメラを掴めなかった");
      const shot = pendingShot();
      const { result } = await setup();
      let capturing: Promise<void> | undefined;
      await act(async () => {
        capturing = result.current.capture();
      });

      await leaveCameraScreen();
      await act(async () => {
        shot.fail(error);
        await capturing;
      });

      expect(errorSpy).toHaveBeenCalledWith(
        "[camera] failed to capture",
        error,
      );
      expect(alertSpy).not.toHaveBeenCalled();
    });

    it("撮れていても、離れた先の画面へ勝手に遷移しない", async () => {
      const shot = pendingShot();
      const { result } = await setup();
      let capturing: Promise<void> | undefined;
      await act(async () => {
        capturing = result.current.capture();
      });

      await leaveCameraScreen();
      await act(async () => {
        shot.succeed({ uri: "file:///photos/raw.jpg" });
        await capturing;
      });

      expect(push).not.toHaveBeenCalled();
      expect(alertSpy).not.toHaveBeenCalled();
    });
  });

  it("カメラ画面にいるまま失敗した場合は、これまでどおり Alert を出す", async () => {
    const error = new Error("カメラを掴めなかった");
    const shot = pendingShot();
    const { result } = await setup();
    let capturing: Promise<void> | undefined;
    await act(async () => {
      capturing = result.current.capture();
    });

    await act(async () => {
      shot.fail(error);
      await capturing;
    });

    expect(errorSpy).toHaveBeenCalledWith("[camera] failed to capture", error);
    expect(alertSpy).toHaveBeenCalledWith(
      "camera.captureFailedTitle",
      "camera.captureFailedMessage",
    );
  });

  // 起動直後は権限の読み込みが終わっておらず、そこを拒否扱いにすると
  // 許可済みの端末でも許可を求める画面が一瞬出る（Issue #299）
  describe("権限の読み込みが終わっていない場合", () => {
    it("拒否扱いにせず、許可済みとして扱う", async () => {
      mockPermission.current = null;

      const { result } = await setup();

      expect(result.current.permissionGranted).toBe(true);
      expect(result.current.permissionCanAskAgain).toBe(true);
    });

    it("マウント時の問い合わせと重ならないよう、読み直しは投げない", async () => {
      mockPermission.current = null;
      await setup();

      await returnToApp();

      expect(mockGetPermission).not.toHaveBeenCalled();
    });
  });

  // 拒否画面は「設定アプリでオンにしてから戻ってください」と案内している。
  // 設定アプリからの復帰では画面遷移が起きず useFocusEffect は発火しないので、
  // AppState を見ていないと拒否のままの表示が残る（Issue #259）
  describe("設定アプリから戻ってきた場合", () => {
    /** アプリからはもう許可を求められず、設定アプリへ促している状態 */
    function denyPermission() {
      mockPermission.current = { granted: false, canAskAgain: false };
    }

    it("権限がまだ無ければ、前面に戻った時点で読み直す", async () => {
      denyPermission();
      await setup();
      expect(mockGetPermission).not.toHaveBeenCalled();

      await returnToApp();

      expect(mockGetPermission).toHaveBeenCalledTimes(1);
    });

    it("前面に戻る前 (background / inactive) では読み直さない", async () => {
      denyPermission();
      await setup();

      await returnToApp("background");
      await returnToApp("inactive");

      expect(mockGetPermission).not.toHaveBeenCalled();
    });

    it("すでに許可済みなら、前面に戻っても問い合わせ直さない", async () => {
      await setup();

      await returnToApp();

      expect(mockGetPermission).not.toHaveBeenCalled();
    });

    // AppState と useFocusEffect の両方から読み直しており、
    // 同じ復帰で二重に OS へ問い合わせないことを見る
    it("前面へ戻った 1 回につき、読み直しも 1 回で済ませる", async () => {
      denyPermission();
      await setup();

      await returnToApp();

      expect(mockGetPermission).toHaveBeenCalledTimes(1);
    });
  });

  it("失敗したあとでもう一度押すと、撮り直せる", async () => {
    takePictureAsync.mockRejectedValueOnce(new Error("boom"));
    const { result } = await setup();
    await shutter(result.current.capture);

    await shutter(result.current.capture);

    expect(push).toHaveBeenCalledWith({
      pathname: "/photo-adjust",
      params: {
        uri: "file:///photos/cropped.jpg",
        capturedAt: expect.any(String),
      },
    });
  });
});
