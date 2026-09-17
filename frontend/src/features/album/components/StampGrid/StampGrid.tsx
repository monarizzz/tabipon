import { FlatList, StyleSheet, RefreshControl } from "react-native";
import { StampCard } from "@/src/features/album/components/StampCard/StampCard";
import { StampGridEmpty } from "@/src/features/album/components/StampGridEmpty/StampGridEmpty";
import { colors, spacing } from "@/src/style/tokens";

export type StampGridItem = {
  id: string;
  name: string;
  nameUnset?: boolean;
  date?: string;
  imageUri?: string;
  obtained?: boolean;
};

type Props = {
  stamps: StampGridItem[];
  onPressStamp?: (item: StampGridItem) => void;
  onPressStartStamp?: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function StampGrid({
  stamps,
  onPressStamp,
  onPressStartStamp,
  refreshing,
  onRefresh,
}: Props) {
  const isEmpty = stamps.length === 0;
  return (
    <FlatList
      data={stamps}
      keyExtractor={(item) => item.id}
      numColumns={2}
      // 空のときは flexGrow で中身を画面いっぱいに伸ばす。伸ばさないと
      // スクロールできる領域が生まれず、RefreshControl を引けない
      contentContainerStyle={[styles.list, isEmpty && styles.listEmpty]}
      columnWrapperStyle={styles.row}
      ListEmptyComponent={<StampGridEmpty onPressStart={onPressStartStamp} />}
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
  listEmpty: {
    flexGrow: 1,
  },
  row: {
    justifyContent: "space-between",
  },
});
