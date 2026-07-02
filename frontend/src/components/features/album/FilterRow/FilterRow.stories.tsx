import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { FilterRow, type FilterOption } from './FilterRow';

const FILTERS: FilterOption[] = [
  { id: 'all', label: 'すべて' },
  { id: 'tokyo', label: '東京旅行' },
  { id: 'kyoto', label: '京都' },
  { id: 'walk', label: '散歩' },
];

const meta = {
  title: 'features/album/stamp-rally/FilterRow',
  component: FilterRow,
  decorators: [
    (Story) => (
      <View style={{ paddingVertical: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ['autodocs'],
  args: {
    filters: FILTERS,
    selectedFilterId: 'all',
    onSelectFilter: fn(),
    onAddPress: fn(),
  },
} satisfies Meta<typeof FilterRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
