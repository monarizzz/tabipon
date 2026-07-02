import type { Meta, StoryObj } from '@storybook/react-native';
import { View, Text } from 'react-native';
import { fn } from 'storybook/test';

import { CommonButton } from './CommonButton';
import { colors } from '@/src/theme/tokens';

const meta = {
  title: 'common/CommonButton',
  component: CommonButton,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, alignItems: 'flex-start', padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ['autodocs'],
  args: { onPress: fn(), label: 'Button' },
} satisfies Meta<typeof CommonButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { variant: 'primary' },
};

export const Secondary: Story = {
  args: { variant: 'secondary' },
};

export const Ghost: Story = {
  args: { variant: 'ghost' },
};

export const Disabled: Story = {
  args: { variant: 'primary', disabled: true },
};

export const WithIcon: Story = {
  args: {
    variant: 'secondary',
    label: 'デザインを変更する',
    icon: <Text style={{ color: colors.secondary, fontSize: 14 }}>🎨</Text>,
  },
};
