import React from "react";
import { BottomSheet } from "@/src/commons/sheet/components/BottomSheet/BottomSheet";
import { DesignChangeForm } from "@/src/commons/stamp/components/DesignChangeForm/DesignChangeForm";
import type { FrameStyleOption } from "@/src/commons/stamp/types/frameStyleOption";
import { spacing } from "@/src/style/tokens";
import type { StampFrame } from "@/src/utils/stamp/types/stampFrame";

type Props = {
  visible: boolean;
  onClose: () => void;
  frameStyles: FrameStyleOption[];
  selectedFrameStyleId: StampFrame;
  onSelectFrameStyle: (id: StampFrame) => void;
  colorOptions: readonly string[];
  selectedColor: string;
  onSelectColor: (color: string) => void;
  onConfirm: () => void;
};

export function DesignChangeSheet({
  visible,
  onClose,
  frameStyles,
  selectedFrameStyleId,
  onSelectFrameStyle,
  colorOptions,
  selectedColor,
  onSelectColor,
  onConfirm,
}: Props) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      snapPoints={["50%"]}
      contentPaddingBottom={spacing.xxxl}
    >
      <DesignChangeForm
        frameStyles={frameStyles}
        selectedFrameStyleId={selectedFrameStyleId}
        onSelectFrameStyle={onSelectFrameStyle}
        colorOptions={colorOptions}
        selectedColor={selectedColor}
        onSelectColor={onSelectColor}
        onConfirm={onConfirm}
      />
    </BottomSheet>
  );
}
