// 権限が無いときの画面は 3 通りある（許可済み / まだ聞ける / もう聞けない）。
// ここで確かめるのは、その 3 つで出るものと押したときに走る処理が変わること。
// 文言そのものは i18n 側の責務なので、t() はキーをそのまま返すように差し替える。
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { CameraMain } from "@/src/features/camera/components/CameraMain/CameraMain";
import type { Camera } from "@/src/features/camera/types/camera";

jest.mock("@/src/libs/i18n/I18nProvider", () => ({
  ...jest.requireActual("@/src/libs/i18n/I18nProvider"),
  useTranslation: () => ({ t: (key: string) => key }),
}));

const requestPermission = jest.fn();
const openSettings = jest.fn();

const PROPS: Camera = {
  permissionGranted: false,
  permissionCanAskAgain: true,
  requestPermission,
  openSettings,

  facing: "back",
  flash: "off",
  capturing: false,

  cameraRef: React.createRef(),
  changeContainerSize: () => {},

  capture: async () => {},
  toggleFlash: () => {},
  flipCamera: () => {},
};

// このバージョンの RNTL では render() が Promise を返すので、
// 描画の完了を待ってから screen のクエリを使う
async function setup(props: Partial<Camera> = {}) {
  await render(<CameraMain {...PROPS} {...props} />, {
    // 実機では端末から取れるインセットが、テスト環境では取得できない
    wrapper: ({ children }) => (
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 47, left: 0, right: 0, bottom: 34 },
        }}
      >
        {children}
      </SafeAreaProvider>
    ),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("CameraMain のカメラ権限", () => {
  it("許可済みならカメラの画面を出し、権限の案内は出さない", async () => {
    await setup({ permissionGranted: true });

    expect(screen.getByText("camera.hint")).toBeTruthy();
    expect(screen.queryByText("camera.accessRequiredTitle")).toBeNull();
    expect(screen.queryByText("camera.accessDeniedTitle")).toBeNull();
  });

  it("まだ聞けるならアプリ内で許可を求めるボタンを出す", async () => {
    await setup({ permissionGranted: false, permissionCanAskAgain: true });

    expect(screen.getByText("camera.accessRequiredTitle")).toBeTruthy();
    expect(screen.getByText("camera.accessRequiredDescription")).toBeTruthy();
    expect(screen.queryByText("camera.accessOpenSettings")).toBeNull();

    fireEvent.press(screen.getByText("camera.accessAllow"));

    expect(requestPermission).toHaveBeenCalledTimes(1);
    expect(openSettings).not.toHaveBeenCalled();
  });

  it("もう聞けないなら設定アプリを開くボタンに変える", async () => {
    await setup({ permissionGranted: false, permissionCanAskAgain: false });

    expect(screen.getByText("camera.accessDeniedTitle")).toBeTruthy();
    expect(screen.getByText("camera.accessDeniedDescription")).toBeTruthy();
    expect(screen.queryByText("camera.accessAllow")).toBeNull();

    fireEvent.press(screen.getByText("camera.accessOpenSettings"));

    expect(openSettings).toHaveBeenCalledTimes(1);
    expect(requestPermission).not.toHaveBeenCalled();
  });
});
