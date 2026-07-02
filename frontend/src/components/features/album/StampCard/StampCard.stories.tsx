import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';

import { StampCard } from './StampCard';

const meta = {
  title: 'features/album/stamp-rally/StampCard',
  component: StampCard,
  decorators: [
    (Story) => (
      <View style={{ width: 170, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ['autodocs'],
  args: { name: 'スカイツリー' },
} satisfies Meta<typeof StampCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Obtained: Story = {
  args: { obtained: true, date: '2026.06.28' },
};

export const Unobtained: Story = {
  args: { obtained: false },
};
