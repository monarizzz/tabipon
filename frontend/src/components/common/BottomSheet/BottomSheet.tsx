import React, { useEffect, useRef } from 'react';
import GorhomBottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '@/src/theme/tokens';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  contentPaddingBottom?: number;
  onOpened?: () => void;
};

export function BottomSheet({
  visible,
  onClose,
  children,
  snapPoints,
  contentPaddingBottom = spacing.xxl,
  onOpened,
}: Props) {
  const sheetRef = useRef<React.ElementRef<typeof GorhomBottomSheet>>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      sheetRef.current?.expand();
    } else {
      sheetRef.current?.close();
    }
  }, [visible]);

  return (
    <GorhomBottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enableDynamicSizing={!snapPoints}
      enablePanDownToClose
      onClose={onClose}
      onChange={(index) => {
        if (index >= 0) {
          onOpened?.();
        }
      }}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
      )}
      backgroundStyle={{
        backgroundColor: colors.white,
        borderTopLeftRadius: radii.button,
        borderTopRightRadius: radii.button,
      }}
      handleIndicatorStyle={{
        backgroundColor: colors.border,
        width: 36,
        height: 4,
      }}
    >
      <BottomSheetView
        style={{
          paddingHorizontal: spacing.xl,
          paddingBottom: contentPaddingBottom + insets.bottom,
        }}
      >
        {children}
      </BottomSheetView>
    </GorhomBottomSheet>
  );
}
