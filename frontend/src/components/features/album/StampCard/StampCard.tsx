import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Card } from "@/src/components/common/Card/Card";
import { Stamp } from "@/src/components/common/Stamp/Stamp";
import { colors, typography, spacing } from "@/src/theme/tokens";

type Props = {
  name: string;
  date?: string;
  imageUri?: string;
  obtained?: boolean;
  onPress?: () => void;
};

export function StampCard({
  name,
  date,
  imageUri,
  obtained = false,
  onPress,
}: Props) {
  const content = (
    <Card style={styles.card}>
      <View style={styles.circleArea}>
        <Stamp
          size={100}
          imageUri={obtained ? imageUri : undefined}
          muted={!obtained}
        />
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      {obtained && date ? <Text style={styles.date}>{date}</Text> : null}
    </Card>
  );

  if (!onPress) {
    return content;
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      {content}
    </TouchableOpacity>
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
  date: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
});
