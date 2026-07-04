import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { MapPin } from "lucide-react-native";
import { useTranslation } from "@/src/i18n/I18nProvider";
import { colors, typography, spacing } from "@/src/theme/tokens";

export type RecentCollectionItem = {
  id: string;
  name: string;
  imageUri?: string;
};

type Props = {
  items: RecentCollectionItem[];
  onPressSeeAll: () => void;
  onPressItem?: (item: RecentCollectionItem) => void;
};

export function RecentCollectionsSection({
  items,
  onPressSeeAll,
  onPressItem,
}: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("mypage.recentCollections")}</Text>
        <TouchableOpacity onPress={onPressSeeAll}>
          <Text style={styles.seeAll}>{t("mypage.seeAll")}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.item}
            onPress={onPressItem ? () => onPressItem(item) : undefined}
            disabled={!onPressItem}
            activeOpacity={0.8}
          >
            <View style={styles.thumb}>
              {item.imageUri ? (
                <Image source={{ uri: item.imageUri }} style={styles.image} />
              ) : (
                <MapPin size={24} color={colors.textMuted} />
              )}
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: typography.body.fontSize,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  seeAll: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    color: colors.textMuted,
  },
  row: {
    flexDirection: "row",
    gap: spacing.m,
  },
  item: {
    flex: 1,
    alignItems: "center",
    gap: spacing.s,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  name: {
    fontSize: typography.caption.fontSize,
    color: colors.textPrimary,
  },
});
