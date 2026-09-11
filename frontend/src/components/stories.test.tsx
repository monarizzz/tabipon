/**
 * 全ストーリーのスモークテスト。
 *
 * `src/components/**\/*.stories.tsx` を実行時に走査し、Storybook の
 * portable stories (composeStories) として 1 ストーリーずつレンダリングする。
 * 「壊れたコンポーネントに気づけない」のを防ぐのが目的なので、見た目の検証は
 * せず「例外を投げずにレンダリングできること」だけを確認する。
 * ストーリーに play 関数があれば、それも併せて実行する。
 *
 * ストーリーを追加してもこのファイルを直す必要は無い (自動で対象に入る)。
 */
import fs from "node:fs";
import path from "node:path";

import { composeStories } from "@storybook/react";
import { render } from "@testing-library/react-native";

const COMPONENTS_DIR = path.join(__dirname);

/** components 配下を再帰的に辿って *.stories.tsx を集める */
function collectStoryFiles(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return collectStoryFiles(fullPath);
      return entry.name.endsWith(".stories.tsx") ? [fullPath] : [];
    })
    .sort();
}

const storyFiles = collectStoryFiles(COMPONENTS_DIR);

// ストーリーが 1 件も見つからないのに全部 pass するのが一番まずいので、
// 走査そのものが壊れていないことを先に確かめる
test("ストーリーファイルを検出できている", () => {
  expect(storyFiles.length).toBeGreaterThan(0);
});

/** composeStories が返すストーリー (React コンポーネント + play) */
type ComposedStory = React.ComponentType & { play?: () => Promise<void> };

describe.each(
  storyFiles.map(
    (file) => [path.relative(COMPONENTS_DIR, file), file] as const,
  ),
)("%s", (_name, file) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const storyModule = require(file) as Parameters<typeof composeStories>[0];
  const composed = Object.entries(composeStories(storyModule)) as [
    string,
    ComposedStory,
  ][];

  test.each(composed)("%s がレンダリングできる", async (_storyName, Story) => {
    await render(<Story />);
    await Story.play?.();
  });
});
