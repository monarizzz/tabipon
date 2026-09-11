import React from 'react';
import { Modal as RNModal, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '@/src/theme/tokens';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function Modal({ visible, onClose, children }: Props) {
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.content} activeOpacity={1}>
          {children}
        </TouchableOpacity>
      </TouchableOpacity>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: colors.white,
    borderRadius: radii.card,
    padding: spacing.xxl,
    width: '85%',
  },
});
