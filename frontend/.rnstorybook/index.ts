/**
 * This file is user-editable.
 *
 * Use it as your React Native Storybook entrypoint and wrap `StorybookUIRoot`
 * with application decorators/providers (theme, i18n, state, navigation, etc).
 */

// Storybook はこのファイルをエントリに差し替えるが、その解決に
// platform 拡張子（`.web.ts` など）は効かない。プラットフォームごとの分岐は
// ここから読む `./bootstrap` 側で行う
import "./bootstrap";
