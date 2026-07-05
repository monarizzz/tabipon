import { View, Text, Pressable, StyleSheet } from "react-native";
import { Card } from "@/src/components/common/Card/Card";
import { Stamp } from "@/src/components/common/Stamp/Stamp";
import { colors, typography, spacing } from "@/src/theme/tokens";

type Props = {
  name: string;
  nameUnset?: boolean;
  date?: string;
  imageUri?: string;
  obtained?: boolean;
  onPress?: () => void;
};

export function StampCard({
  name,
  nameUnset = false,
  date,
  imageUri,
  obtained = false,
  onPress,
}: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.circleArea}>
        <Pressable disabled={!onPress} onPress={onPress}>
          <Stamp
            size={100}
            imageUri={obtained ? imageUri : undefined}
            muted={!obtained}
          />
        </Pressable>
      </View>
      <Text
        style={[styles.name, nameUnset && styles.nameUnset]}
        numberOfLines={1}
      >
        {name}
      </Text>
      {obtained && date ? <Text style={styles.date}>{date}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: spacing.xs,
    backgroundColor: colors.surface,
    padding: spacing.m,
  },
  circleArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.l,
  },
  name: {
    fontSize: typography.labelBold.fontSize,
    fontWeight: typography.labelBold.fontWeight,
    color: colors.textPrimary,
  },
  nameUnset: {
    color: colors.textPlaceholder,
  },
  date: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
});
