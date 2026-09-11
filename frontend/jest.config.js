// Storybook のストーリーを「移植可能なストーリー (portable stories)」として
// Jest から実行するための設定。
// https://storybookjs.github.io/react-native/docs/intro/testing/
//
// preset は jest-expo を使う。react-native の素のプリセットでは expo-* の
// モジュールが解決できず、ストーリーを import した時点で落ちるため。
// Expo SDK 54 を使っているので jest-expo も 54 系に固定している
// (最新版は react 19.2 を peer に要求し、SDK 54 の react 19.1 と衝突する)。
/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: [
    "<rootDir>/jest.setup.ts",
    "<rootDir>/jest.setup.storybook.ts",
  ],
  // ストーリーのスモークテストだけを対象にする。
  // *.stories.tsx 自体はテストファイルではないので拾わせない
  testMatch: ["<rootDir>/src/**/*.test.ts?(x)"],
  // node_modules は基本的に変換しないが、react-native / expo / storybook の
  // パッケージは ESM や Flow のまま配布されているため変換対象に含める
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@storybook/.*|storybook|@gorhom/.*|react-native-.*|lucide-react-native)",
  ],
};
