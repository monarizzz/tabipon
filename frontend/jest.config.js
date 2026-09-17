// Storybook のストーリーを「移植可能なストーリー (portable stories)」として
// Jest から実行するための設定。
// https://storybookjs.github.io/react-native/docs/intro/testing/
//
// preset は jest-expo を使う。react-native の素のプリセットでは expo-* の
// モジュールが解決できず、ストーリーを import した時点で落ちるため。
// Expo SDK 57 系に合わせて jest-expo も 57 系を使う。
/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  // Skia の描画 API を使うコンポーネントのために CanvasKit を読み込む環境を使う
  // （詳細は jest.environment.js）
  testEnvironment: "<rootDir>/jest.environment.js",
  // react-native-worklets (Reanimated 4 の基盤) は `.native.ts` 側を解決すると
  // ネイティブモジュールを掴みに行って落ちる。公式の resolver が native 拡張子を
  // 外してくれるので、それに委ねる
  resolver: "react-native-worklets/jest/resolver.js",
  setupFilesAfterEnv: [
    "<rootDir>/jest.setup.ts",
    "<rootDir>/jest.setup.storybook.ts",
  ],
  // `src/` 配下の `*.test.ts(x)` を対象にする（ストーリーのスモークテストと、
  // `stamp/seed.test.ts` のようなユーティリティの単体テスト）。
  // *.stories.tsx 自体はテストファイルではないので拾わせない
  testMatch: ["<rootDir>/src/**/*.test.ts?(x)"],
  // node_modules は基本的に変換しないが、react-native / expo / storybook の
  // パッケージは ESM や Flow のまま配布されているため変換対象に含める。
  // @shopify/react-native-skia は 2.6.2 でモック (jestSetup.js が読み込む
  // lib/module/mock) が ESM のまま配布されるようになったため追加した
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@storybook/.*|storybook|@gorhom/.*|react-native-.*|lucide-react-native|@shopify/react-native-skia)",
  ],
};
