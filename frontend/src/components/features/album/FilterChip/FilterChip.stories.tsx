import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { FilterChip } from './FilterChip';

const meta = {
  title: 'features/album/stamp-rally/FilterChip',
  component: FilterChip,
  decorators: [
    (Story) => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ['autodocs'],
  args: { label: 'すべて', onPress: fn() },
} satisfies Meta<typeof FilterChip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: { selected: true },
};

export const Add: Story = {
  args: { label: '+', variant: 'add' },
};
