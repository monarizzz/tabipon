import { Fragment } from "react";
import { StyleSheet, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { Card } from "@/src/components/common/Card/Card";
import { ListItem } from "@/src/components/common/ListItem/ListItem";
import { colors, radii } from "@/src/theme/tokens";

export type SettingsMenuItem = {
  id: string;
  label: string;
  icon?: LucideIcon;
  onPress: () => void;
};

type Props = {
  items: SettingsMenuItem[];
};

export function SettingsMenuSection({ items }: Props) {
  return (
    <Card style={styles.card}>
      {items.map((item, index) => (
        <Fragment key={item.id}>
          <ListItem
            label={item.label}
            icon={item.icon}
            onPress={item.onPress}
            showChevron
          />
          {index < items.length - 1 && <View style={styles.separator} />}
        </Fragment>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    overflow: "hidden",
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
});
