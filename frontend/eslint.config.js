// Expo SDK 53 以降は flat config が既定。
// https://docs.expo.dev/guides/using-eslint/
const { defineConfig, globalIgnores } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintConfigPrettier = require("eslint-config-prettier/flat");

module.exports = defineConfig([
  // /ios と /android は prebuild の生成物で git 管理外。dist は Expo のビルド成果物。
  // storybook.requires.ts は Storybook が自動生成するため、手で直しても上書きされる
  globalIgnores([
    "dist/*",
    "ios/*",
    "android/*",
    ".expo/*",
    ".rnstorybook/storybook.requires.ts",
  ]),
  expoConfig,
  // Prettier と競合する整形系ルールを無効化する。整形の検査は
  // eslint-plugin-prettier を挟まず、prettier CLI (`npm run format:check`) に任せる。
  // lint を走らせるたびに整形チェックまで動かすと、見たいエラーが埋もれるため
  eslintConfigPrettier,
]);
