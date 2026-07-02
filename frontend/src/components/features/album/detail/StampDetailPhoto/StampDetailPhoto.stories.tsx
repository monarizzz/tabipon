import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { StampDetailPhoto } from './StampDetailPhoto';

const meta = {
  title: 'features/album/stamp-rally/StampDetailPhoto',
  component: StampDetailPhoto,
  decorators: [
    (Story) => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ['autodocs'],
  args: {
    spotName: '東京スカイツリー',
    onPressDesignChange: fn(),
  },
} satisfies Meta<typeof StampDetailPhoto>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithPhoto: Story = {
  args: { imageUri: 'https://picsum.photos/seed/skytree/260/260' },
};
