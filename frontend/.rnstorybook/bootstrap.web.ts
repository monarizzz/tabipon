import { LoadSkiaWeb } from "@shopify/react-native-skia/lib/module/web";

import { registerStorybook } from "./registerStorybook";

// Skia の web 実装は import された時点で `global.CanvasKit` を読み、
// その値を掴んだまま離さない。undefined のまま掴まれると、以降 Skia の
// API を呼ぶたびに `Cannot read properties of undefined` で落ちる。
// wasm は `public/canvaskit.wasm` に置く（`npm run storybook:web` が配置する）
//
// このファイルを `.web.ts` に分けているのは、`canvaskit-wasm` が node の
// `fs` を require しており、native のバンドルに混ざると解決できずに
// バンドルが失敗するため。実行時の `Platform.OS` 分岐では防げない
LoadSkiaWeb()
  .then(registerStorybook)
  .catch((error: unknown) => {
    // 載せられなくても Storybook 自体は出す。Skia を使わないストーリーは
    // そのまま確認できるため、ここで止める方が損が大きい
    console.error("[storybook] failed to load CanvasKit", error);
    registerStorybook();
  });
