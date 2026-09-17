import type { ComponentType } from "react";
import { registerRootComponent } from "expo";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** Storybook のルートを登録する。web では CanvasKit を載せ終えてから呼ぶこと */
export function registerStorybook() {
  // `storybook.requires` は全ストーリーを読み込む。Skia を使うストーリーが
  // 混ざっているため、web では CanvasKit を載せ終えてからでないと import できない。
  // static import だと巻き上げられてその順序を作れないので require で読む
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { view } = require("./storybook.requires") as {
    view: { getStorybookUI: (options: object) => ComponentType };
  };

  const StorybookUIRoot = view.getStorybookUI({
    shouldPersistSelection: true,
    storage: {
      getItem: AsyncStorage.getItem,
      setItem: AsyncStorage.setItem,
    },
  });

  registerRootComponent(StorybookUIRoot);
}
