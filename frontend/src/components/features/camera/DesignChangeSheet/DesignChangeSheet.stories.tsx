import React from "react";
import type { Meta, StoryObj } from "@storybook/react-native";
import { View, Text, TouchableOpacity } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { fn } from "storybook/test";

import { DesignChangeSheet, type FrameStyleOption } from "./DesignChangeSheet";
import { colors } from "@/src/theme/tokens";

type FrameThumbVariant = "classic" | "vintage" | "minimal" | "wave";

const FrameThumb = ({
  variant,
  color = colors.textPlaceholder,
}: {
  variant: FrameThumbVariant;
  color?: string;
}) => {
  const dot = (x: number, y: number) => (
    <View
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: color,
      }}
    />
  );

  return (
    <View style={{ width: 48, height: 48 }}>
      <View
        style={{
          position: "absolute",
          left: 2,
          top: 2,
          width: 44,
          height: 44,
          borderRadius: 22,
          borderWidth: variant === "minimal" ? 1 : 2.5,
          borderColor: color,
        }}
      />
      {variant === "vintage" && (
        <View
          style={{
            position: "absolute",
            left: 7,
            top: 7,
            width: 34,
            height: 34,
            borderRadius: 17,
            borderWidth: 1,
            borderColor: color,
          }}
        />
      )}
      {variant === "wave" && (
        <>
          <View
            style={{
              position: "absolute",
              left: 6,
              top: 6,
              width: 36,
              height: 36,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: color,
            }}
          />
          {dot(21, 0)}
          {dot(21, 43)}
          {dot(0, 21)}
          {dot(43, 21)}
        </>
      )}
    </View>
  );
};

const FRAME_STYLES: FrameStyleOption[] = [
  {
    id: "classic",
    label: "クラシック",
    preview: <FrameThumb variant="classic" color={colors.textMuted} />,
  },
  {
    id: "vintage",
    label: "ヴィンテージ",
    preview: <FrameThumb variant="vintage" />,
  },
  {
    id: "minimal",
    label: "ミニマル",
    preview: <FrameThumb variant="minimal" />,
  },
  {
    id: "wave",
    label: "波形",
    preview: <FrameThumb variant="wave" />,
  },
];

const COLOR_OPTIONS = [
  "#333333",
  "#ff6b6b",
  "#fcc06d",
  "#6de8b9",
  "#6bc1ff",
  "#be91fa",
  "#ff94dd",
];

const meta = {
  component: DesignChangeSheet,
  decorators: [
    (Story) => (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Story />
      </GestureHandlerRootView>
    ),
  ],
  tags: ["autodocs"],
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
    selectedFrameStyleId: "classic",
    selectedColor: "#333333",
    showLandmarkName: true,
  },
  render: function Render(args) {
    const [visible, setVisible] = React.useState(false);
    const [selectedFrameStyleId, setSelectedFrameStyleId] = React.useState(
      args.selectedFrameStyleId,
    );
    const [selectedColor, setSelectedColor] = React.useState(
      args.selectedColor,
    );
    const [showLandmarkName, setShowLandmarkName] = React.useState(
      args.showLandmarkName,
    );

    return (
      <View style={{ flex: 1, padding: 16 }}>
        <TouchableOpacity
          onPress={() => setVisible(true)}
          style={{
            padding: 12,
            backgroundColor: colors.surface,
            borderRadius: 12,
          }}
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
