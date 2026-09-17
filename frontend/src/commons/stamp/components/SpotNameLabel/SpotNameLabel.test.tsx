/**
 * スポット名の読み上げ内容を固定するテスト。
 *
 * `accessibilityLabel` は子孫の `Text` から組まれる既定ラベルを上書きするため、
 * 操作の説明（「タイトルを編集」）だけを入れると現在のスポット名が読み上げられ
 * なくなる。ラベルが画面表示と一致し、操作は `accessibilityHint` 側にあることを
 * 確かめる。
 */
import { render, within } from "@testing-library/react-native";

import { I18nProvider } from "@/src/libs/i18n/I18nProvider";
import { SpotNameLabel } from "./SpotNameLabel";

type Screen = Awaited<ReturnType<typeof render>>;
type Element = ReturnType<Screen["getByRole"]>;

/** 要素の中に描画されている文字列を、上から順に並べる */
function visibleTexts(element: Element): string[] {
  return within(element)
    .getAllByText(/.+/)
    .map((node) => String(node.props.children));
}

function renderLabel(props: Parameters<typeof SpotNameLabel>[0]) {
  return render(
    <I18nProvider>
      <SpotNameLabel {...props} />
    </I18nProvider>,
  );
}

describe("SpotNameLabel", () => {
  test("スポット名が入っているとき、読み上げラベルにその値が含まれる", async () => {
    const screen = await renderLabel({
      spotName: "東京スカイツリー",
      onPress: () => {},
    });

    const button = screen.getByRole("button");
    expect(button.props.accessibilityLabel).toBe("東京スカイツリー");
  });

  test("未入力のとき、読み上げラベルは画面のプレースホルダー文言と一致する", async () => {
    const screen = await renderLabel({ spotName: "", onPress: () => {} });

    const button = screen.getByRole("button");
    const label = String(button.props.accessibilityLabel);
    expect(label).not.toBe("");
    // 「スポット名を追加」など、画面に出ている文言がそのまま読み上げられる
    expect(visibleTexts(button)).toEqual([label]);
  });

  test("操作の説明は accessibilityHint にあり、ラベルを潰していない", async () => {
    const screen = await renderLabel({
      spotName: "東京スカイツリー",
      onPress: () => {},
    });

    const button = screen.getByRole("button");
    const hint = String(button.props.accessibilityHint);
    expect(hint).not.toBe("");
    expect(hint).not.toBe(button.props.accessibilityLabel);
  });

  test("1 文字でも横方向の当たり判定が 44pt を下回らない", async () => {
    const screen = await renderLabel({ spotName: "山", onPress: () => {} });

    // 行の中身は 鉛筆 14pt ＋ gap 6pt ＋ 文字ぶん。文字幅を 0 と見ても
    // 左右の hitSlop が 24pt あれば 44pt に届く
    const hitSlop = screen.getByRole("button").props.hitSlop;
    expect(hitSlop.left + hitSlop.right).toBeGreaterThanOrEqual(24);
  });

  test("onPress が無いときはボタンとして読み上げない", async () => {
    const screen = await renderLabel({ spotName: "東京スカイツリー" });

    expect(screen.queryByRole("button")).toBeNull();
  });
});
