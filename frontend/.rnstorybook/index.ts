import { registerRootComponent } from "expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

/**
 * This file is user-editable.
 *
 * Use it as your React Native Storybook entrypoint and wrap `StorybookUIRoot`
 * with application decorators/providers (theme, i18n, state, navigation, etc).
 */
function registerStorybook() {
  // `storybook.requires` は全ストーリーを読み込む。Skia を使うストーリーが
  // 混ざっているため、web では CanvasKit を載せ終えてからでないと import できない。
  // static import だと巻き上げられてその順序を作れないので require で読む
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { view } = require("./storybook.requires") as {
    view: { getStorybookUI: (options: object) => React.ComponentType };
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

if (Platform.OS === "web") {
  // Skia の web 実装は import された時点で `global.CanvasKit` を読み、
  // その値を掴んだまま離さない。undefined のまま掴まれると、以降 Skia の
  // API を呼ぶたびに `Cannot read properties of undefined` で落ちる。
  // wasm は `public/canvaskit.wasm` に置く（`npm run storybook:web` が配置する）
  //
  // ここだけ require なのは、web 専用のモジュールを native のバンドルに
  // 持ち込まないため
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const skiaWeb = require("@shopify/react-native-skia/lib/module/web") as {
    LoadSkiaWeb: () => Promise<void>;
  };

  skiaWeb
    .LoadSkiaWeb()
    .then(registerStorybook)
    .catch((error: unknown) => {
      // 載せられなくても Storybook 自体は出す。Skia を使わないストーリーは
      // そのまま確認できるため、ここで止める方が損が大きい
      console.error("[storybook] failed to load CanvasKit", error);
      registerStorybook();
    });
} else {
  registerStorybook();
}
