// 「0 件のときに引いて更新できない」(Issue #270) の再発を防ぐためのテスト。
// 見た目はストーリーのスモークテストに任せ、ここでは空のときも RefreshControl が
// 描かれること・スクロール領域が潰れないこと・導線が繋がっていることを見る。
import { fireEvent, render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import type { RenderResult } from "@testing-library/react-native";

import {
  StampGrid,
  type StampGridItem,
} from "@/src/features/album/components/StampGrid/StampGrid";

jest.mock("@/src/libs/i18n/I18nProvider", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const STAMPS: StampGridItem[] = [
  { id: "1", name: "東京タワー", date: "2026.09.18", obtained: true },
];

/**
 * ホスト要素を型名で 1 つ取る。
 *
 * RNTL 14 の render 結果に UNSAFE_getByType は無く、container から辿るしかない。
 * FlatList / RefreshControl はホスト要素としては RCTScrollView / RCTRefreshControl
 * という名前で出てくる。
 */
function getHost(view: RenderResult, type: string) {
  const [found] = view.container.queryAll((instance) => instance.type === type);
  expect(found).toBeTruthy();
  return found;
}

describe("スタンプが 0 件のとき", () => {
  test("空表示と撮影への導線が出る", async () => {
    const onPressStartStamp = jest.fn();
    const view = await render(
      <StampGrid stamps={[]} onPressStartStamp={onPressStartStamp} />,
    );

    expect(view.getByText("album.emptyTitle")).toBeTruthy();
    expect(view.getByText("album.empty")).toBeTruthy();

    fireEvent.press(view.getByText("album.emptyAction"));
    expect(onPressStartStamp).toHaveBeenCalledTimes(1);
  });

  test("下に引いて再読み込みできる", async () => {
    const onRefresh = jest.fn();
    const view = await render(<StampGrid stamps={[]} onRefresh={onRefresh} />);

    // 0 件でもリストごと消さず、RefreshControl を残していること
    fireEvent(getHost(view, "RCTRefreshControl"), "refresh");
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  test("中身を画面いっぱいに伸ばしてスクロール領域を作る", async () => {
    const view = await render(<StampGrid stamps={[]} onRefresh={jest.fn()} />);

    // flexGrow が無いと中身がビューポートより小さいままで、引けるだけの
    // スクロール領域が生まれない
    const list = getHost(view, "RCTScrollView");
    expect(StyleSheet.flatten(list.props.contentContainerStyle)).toMatchObject({
      flexGrow: 1,
    });
  });
});

describe("スタンプが 1 件以上あるとき", () => {
  test("空表示を出さずにスタンプを並べる", async () => {
    const view = await render(
      <StampGrid stamps={STAMPS} onRefresh={jest.fn()} />,
    );

    expect(view.queryByText("album.emptyTitle")).toBeNull();
    expect(view.getByText("東京タワー")).toBeTruthy();
  });

  test("引いて再読み込みできる", async () => {
    const onRefresh = jest.fn();
    const view = await render(
      <StampGrid stamps={STAMPS} onRefresh={onRefresh} />,
    );

    fireEvent(getHost(view, "RCTRefreshControl"), "refresh");
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  test("スタンプを押すと選んだ 1 件が渡る", async () => {
    const onPressStamp = jest.fn();
    const view = await render(
      <StampGrid stamps={STAMPS} onPressStamp={onPressStamp} />,
    );

    fireEvent.press(view.getByText("東京タワー"));
    expect(onPressStamp).toHaveBeenCalledWith(STAMPS[0]);
  });
});
