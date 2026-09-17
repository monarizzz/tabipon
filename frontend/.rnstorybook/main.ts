import type { StorybookConfig } from "@storybook/react-native";

const main: StorybookConfig = {
  stories: [
    "../src/commons/**/*.stories.?(ts|tsx|js|jsx)",
    "../src/features/**/*.stories.?(ts|tsx|js|jsx)",
  ],
  deviceAddons: [
    "@storybook/addon-ondevice-controls",
    "@storybook/addon-ondevice-actions",
  ],
};

export default main;
