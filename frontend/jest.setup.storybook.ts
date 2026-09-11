// .rnstorybook/preview.tsx のグローバル設定 (デコレーター・parameters) を
// portable stories にも適用する。これが無いと、preview 側で包んでいる
// Provider がテスト時だけ効かず、Storybook と挙動がずれる
import { setProjectAnnotations } from "@storybook/react";

import * as previewAnnotations from "./.rnstorybook/preview";

setProjectAnnotations(previewAnnotations);
