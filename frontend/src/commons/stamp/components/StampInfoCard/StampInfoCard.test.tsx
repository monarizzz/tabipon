/**
 * 日時・場所・メモの読み上げ内容を固定するテスト。
 *
 * `accessibilityLabel` は子孫の `Text` から組まれる既定ラベルを上書きするため、
 * 操作の説明（「日時を編集」など）だけを入れると項目名と現在値が読み上げられ
 * なくなる。ラベルが画面表示（項目名 + 値、未入力ならプレースホルダー）と
 * 一致し、操作は `accessibilityHint` 側にあることを確かめる。
 */
import { render, within } from "@testing-library/react-native";

import { I18nProvider } from "@/src/libs/i18n/I18nProvider";
import { StampInfoCard } from "./StampInfoCard";

type Screen = Awaited<ReturnType<typeof render>>;
type Element = ReturnType<Screen["getByRole"]>;

/** 要素の中に描画されている文字列を、上から順に並べる */
function visibleTexts(element: Element): string[] {
  return within(element)
    .getAllByText(/.+/)
    .map((node) => String(node.props.children));
}

function renderCard(props: Parameters<typeof StampInfoCard>[0]) {
  return render(
    <I18nProvider>
      <StampInfoCard {...props} />
    </I18nProvider>,
  );
}

const handlers = {
  onPressDate: () => {},
  onPressLocation: () => {},
  onPressMemo: () => {},
};

describe("StampInfoCard", () => {
  test("値が入っているとき、読み上げラベルに項目名と現在値が含まれる", async () => {
    const screen = await renderCard({
      date: "2025年9月18日",
      location: "東京スカイツリー",
      memo: "天気が良かった",
      ...handlers,
    });

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    // 項目名と値が空白区切りで並ぶ（項目名は表示中の翻訳をそのまま使う）
    for (const button of buttons) {
      expect(button.props.accessibilityLabel).toBe(
        visibleTexts(button).join(" "),
      );
    }

    const values = buttons.map((button) =>
      String(button.props.accessibilityLabel),
    );
    expect(values[0]).toContain("2025年9月18日");
    expect(values[1]).toContain("東京スカイツリー");
    expect(values[2]).toContain("天気が良かった");
  });

  test("未入力のとき、読み上げラベルは画面のプレースホルダー文言と一致する", async () => {
    const screen = await renderCard({ date: "", location: "", ...handlers });

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    for (const button of buttons) {
      const texts = visibleTexts(button);
      // 項目名 + プレースホルダーの 2 つが読み上げられる（値だけが欠けない）
      expect(texts).toHaveLength(2);
      expect(button.props.accessibilityLabel).toBe(texts.join(" "));
    }
  });

  test("操作の説明は accessibilityHint にあり、ラベルを潰していない", async () => {
    const screen = await renderCard({
      date: "2025年9月18日",
      location: "東京",
      ...handlers,
    });

    for (const button of screen.getAllByRole("button")) {
      const hint = String(button.props.accessibilityHint);
      expect(hint).not.toBe("");
      expect(hint).not.toBe(button.props.accessibilityLabel);
    }
  });

  test("onPress が無いときはボタンとして読み上げない", async () => {
    const screen = await renderCard({
      date: "2025年9月18日",
      location: "東京",
    });

    expect(screen.queryByRole("button")).toBeNull();
  });
});
