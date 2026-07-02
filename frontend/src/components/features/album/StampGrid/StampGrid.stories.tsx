import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { StampGrid, type StampGridItem } from './StampGrid';

const STAMPS: StampGridItem[] = [
  { id: '1', name: 'スカイツリー', date: '2026.06.28', obtained: true },
  { id: '2', name: '浅草寺', obtained: false },
  { id: '3', name: '皇居', date: '2026.06.25', obtained: true },
  { id: '4', name: '東京タワー', obtained: false },
];

const meta = {
  title: 'features/album/stamp-rally/StampGrid',
  component: StampGrid,
  decorators: [
    (Story) => (
      <View style={{ flex: 1 }}>
        <Story />
      </View>
    ),
  ],
  tags: ['autodocs'],
  args: {
    onPressStamp: fn(),
  },
} satisfies Meta<typeof StampGrid>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { stamps: STAMPS },
};

export const Empty: Story = {
  args: { stamps: [] },
};
