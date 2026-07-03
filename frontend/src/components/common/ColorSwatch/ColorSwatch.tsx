import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { colors } from '@/src/theme/tokens';

type Props = {
  color: string;
  selected?: boolean;
  onPress?: () => void;
};

export function ColorSwatch({ color, selected = false, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.wrap, selected && styles.selected]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!onPress}
    >
      <View style={[styles.dot, selected && styles.dotSelected, { backgroundColor: color }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    borderWidth: 2,
    borderColor: colors.selectedRing,
  },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  dotSelected: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
});
