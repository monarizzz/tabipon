import type { Preview } from "@storybook/react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { I18nProvider } from "@/src/i18n/I18nProvider";

const preview: Preview = {
  // アプリ本体 (app/_layout.tsx) と同じ Provider でストーリーを包む。
  // useTranslation や useSafeAreaInsets を使うコンポーネントは Provider が
  // 無いと例外を投げるため、Storybook でもテストでも同じ土台を用意する。
  // AuthProvider は含めない。認証状態に依存するコンポーネントは
  // props で受け取る作りにしておき、ストーリー側で状態を指定する
  decorators: [
    (Story) => (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <I18nProvider>
          <SafeAreaProvider
            // 実機では端末から取れるが、テスト環境では取得できず
            // 0 幅のまま描画が止まるので初期値を渡す
            initialMetrics={{
              frame: { x: 0, y: 0, width: 390, height: 844 },
              insets: { top: 47, left: 0, right: 0, bottom: 34 },
            }}
          >
            <Story />
          </SafeAreaProvider>
        </I18nProvider>
      </GestureHandlerRootView>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
