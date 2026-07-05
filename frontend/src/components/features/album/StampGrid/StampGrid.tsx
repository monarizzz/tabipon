import {
  FlatList,
  View,
  Text,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { StampCard } from "@/src/components/features/album/StampCard/StampCard";
import { useTranslation } from "@/src/i18n/I18nProvider";
import { colors, typography, spacing } from "@/src/theme/tokens";

export type StampGridItem = {
  id: string;
  name: string;
  nameUnset?: boolean;
  date?: string;
  imageUri?: string;
  spotName?: string;
  memo?: string;
  obtained?: boolean;
  tiltAngle?: number;
  scratchLevel?: number;
  color?: string;
  frame?: string;
};

type Props = {
  stamps: StampGridItem[];
  onPressStamp?: (item: StampGridItem) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function StampGrid({
  stamps,
  onPressStamp,
  refreshing,
  onRefresh,
}: Props) {
  const { t } = useTranslation();
  if (stamps.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t("album.empty")}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={stamps}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={styles.list}
      columnWrapperStyle={styles.row}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing ?? false}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
      renderItem={({ item }) => (
        <StampCard
          name={item.name}
          nameUnset={item.nameUnset}
          date={item.date}
          imageUri={item.imageUri}
          obtained={item.obtained}
          onPress={onPressStamp ? () => onPressStamp(item) : undefined}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.xl,
    gap: spacing.m,
  },
  row: {
    justifyContent: "space-between",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    fontSize: typography.body.fontSize,
    color: colors.textPlaceholder,
  },
});
