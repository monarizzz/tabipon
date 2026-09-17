// Jest のテスト環境。React Native 用の環境に CanvasKit の読み込みを足したもの。
//
// Skia の公式モック (`jestSetup.js`) は `global.CanvasKit` を見て、
// ネイティブ実装の代わりに CanvasKit(WASM) の実装を返す。
// この変数を用意しないとモックの中身が空になり、`Skia.Paint()` のような
// 描画 API を呼んだ時点で落ちる（フレームを Skia で描くコンポーネントが該当）。
//
// 読み込みは非同期なので setup ファイルからは行えず、環境側で待つ必要がある。
// Skia が配る `jestEnv.js` は素の node 環境を継承しており、react-native の
// 条件付き exports が効かなくなるため、そちらではなくこのファイルを使う。
const ReactNativeEnv = require("@react-native/jest-preset/jest/react-native-env");
const CanvasKitInit = require("canvaskit-wasm/bin/full/canvaskit");

module.exports = class SkiaReactNativeEnv extends ReactNativeEnv {
  async setup() {
    await super.setup();
    this.global.CanvasKit = await CanvasKitInit({});
  }
};
