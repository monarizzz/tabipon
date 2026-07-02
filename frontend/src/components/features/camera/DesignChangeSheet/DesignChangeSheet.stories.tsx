import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native';
import { View, Text, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { fn } from 'storybook/test';

import { DesignChangeSheet, type FrameStyleOption } from './DesignChangeSheet';
import { colors } from '@/src/theme/tokens';

const Thumb = ({ color = colors.textMuted }: { color?: string }) => (
  <View
    style={{
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 2.5,
      borderColor: color,
    }}
  />
);

const FRAME_STYLES: FrameStyleOption[] = [
  { id: 'classic', label: 'クラシック', preview: <Thumb color={colors.textMuted} /> },
  { id: 'vintage', label: 'ヴィンテージ', preview: <Thumb /> },
  { id: 'minimal', label: 'ミニマル', preview: <Thumb /> },
];

const COLOR_OPTIONS = ['#333333', '#ff6b6b', '#fcc06d', '#6de8b9', '#6bc1ff', '#be91fa', '#ff94dd'];

const meta = {
  title: 'features/camera/DesignChangeSheet',
  component: DesignChangeSheet,
  decorators: [
    (Story) => (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Story />
      </GestureHandlerRootView>
    ),
  ],
  tags: ['autodocs'],
  args: {
    frameStyles: FRAME_STYLES,
    colorOptions: COLOR_OPTIONS,
    onSelectFrameStyle: fn(),
    onSelectColor: fn(),
    onToggleShowLandmarkName: fn(),
    onConfirm: fn(),
    onClose: fn(),
  },
} satisfies Meta<typeof DesignChangeSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    visible: false,
    selectedFrameStyleId: 'classic',
    selectedColor: '#333333',
    showLandmarkName: true,
  },
  render: function Render(args) {
    const [visible, setVisible] = React.useState(false);
    const [selectedFrameStyleId, setSelectedFrameStyleId] = React.useState(
      args.selectedFrameStyleId
    );
    const [selectedColor, setSelectedColor] = React.useState(args.selectedColor);
    const [showLandmarkName, setShowLandmarkName] = React.useState(args.showLandmarkName);

    return (
      <View style={{ flex: 1, padding: 16 }}>
        <TouchableOpacity
          onPress={() => setVisible(true)}
          style={{ padding: 12, backgroundColor: colors.surface, borderRadius: 12 }}
        >
          <Text style={{ color: colors.textPrimary }}>デザインを変更する</Text>
        </TouchableOpacity>
        <DesignChangeSheet
          {...args}
          visible={visible}
          onClose={() => {
            args.onClose();
            setVisible(false);
          }}
          selectedFrameStyleId={selectedFrameStyleId}
          onSelectFrameStyle={(id) => {
            args.onSelectFrameStyle(id);
            setSelectedFrameStyleId(id);
          }}
          selectedColor={selectedColor}
          onSelectColor={(color) => {
            args.onSelectColor(color);
            setSelectedColor(color);
          }}
          showLandmarkName={showLandmarkName}
          onToggleShowLandmarkName={(value) => {
            args.onToggleShowLandmarkName(value);
            setShowLandmarkName(value);
          }}
        />
      </View>
    );
  },
};
