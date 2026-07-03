import React, { useEffect, useRef } from 'react';
import GorhomBottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { colors, radii, spacing } from '@/src/theme/tokens';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: (string | number)[];
};

export function BottomSheet({ visible, onClose, children, snapPoints = ['50%'] }: Props) {
  const sheetRef = useRef<React.ElementRef<typeof GorhomBottomSheet>>(null);

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
      enablePanDownToClose
      onClose={onClose}
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
      <BottomSheetView style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl }}>
        {children}
      </BottomSheetView>
    </GorhomBottomSheet>
  );
}
