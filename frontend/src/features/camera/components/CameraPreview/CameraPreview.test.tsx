// ピンチで上げた倍率を、倍率バッジのタップで初期値へ戻せること。
// バッジは以前 pointerEvents="none" で触れず、戻す手段がピンチしか無かった。
import { render, fireEvent, act } from "@testing-library/react-native";
import {
  fireGestureHandler,
  getByGestureTestId,
} from "react-native-gesture-handler/jest-utils";
import {
  GestureHandlerRootView,
  State,
  type LegacyPinchGesture,
} from "react-native-gesture-handler";

import {
  CameraPreview,
  DEFAULT_ZOOM,
} from "@/src/features/camera/components/CameraPreview/CameraPreview";

// expo-camera はネイティブモジュールなので、渡った zoom を読める View に差し替える
jest.mock("expo-camera", () => {
  // jest.mock のファクトリは巻き上げられるため、モジュールは中で require する
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { View } = require("react-native");
  const { createElement, forwardRef } = require("react");
  /* eslint-enable @typescript-eslint/no-require-imports */
  const CameraView = forwardRef(
    (props: Record<string, unknown>, ref: unknown) =>
      createElement(View, { testID: "camera", ref, ...props }),
  );
  CameraView.displayName = "CameraView";
  return { __esModule: true, CameraView };
});

const LAYOUT = { nativeEvent: { layout: { width: 320, height: 640 } } };

async function renderPreview(onZoomChange: (value: number) => void) {
  // gesture-handler v3 の GestureDetector は GestureHandlerRootView の外だと例外を投げる
  const view = await render(
    <GestureHandlerRootView>
      <CameraPreview facing="back" flash="off" onZoomChange={onZoomChange} />
    </GestureHandlerRootView>,
  );
  // コンテナ幅が確定するまでプレビューは描画されない
  await fireEvent(view.getByTestId("camera-preview"), "layout", LAYOUT);
  return view;
}

describe("CameraPreview", () => {
  it("倍率バッジをタップすると初期倍率に戻る", async () => {
    const onZoomChange = jest.fn();
    const view = await renderPreview(onZoomChange);

    await act(async () => {
      fireGestureHandler<LegacyPinchGesture>(getByGestureTestId("pinch"), [
        { state: State.BEGAN, scale: 1 },
        { state: State.ACTIVE, scale: 1 },
        { scale: 1.5 },
        { state: State.END, scale: 1.5 },
      ]);
    });
    expect(view.getByTestId("zoom-badge")).not.toHaveTextContent("1.0x");

    await fireEvent.press(view.getByTestId("zoom-badge"));

    expect(view.getByTestId("zoom-badge")).toHaveTextContent("1.0x");
    expect(view.getByTestId("camera").props.zoom).toBe(DEFAULT_ZOOM);
    expect(onZoomChange).toHaveBeenLastCalledWith(DEFAULT_ZOOM);
  });
});
