import React from "react";
import { FlatList, View, Text, StyleSheet } from "react-native";
import { StampCard } from "@/src/components/features/album/StampCard";
import { colors, typography, spacing } from "@/src/theme/tokens";

export type StampGridItem = {
  id: string;
  name: string;
  date?: string;
  imageUri?: string;
  obtained?: boolean;
};

type Props = {
  stamps: StampGridItem[];
  onPressStamp?: (item: StampGridItem) => void;
};

export function StampGrid({ stamps, onPressStamp }: Props) {
  if (stamps.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>まだスタンプがありません</Text>
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
      renderItem={({ item }) => (
        <StampCard
          name={item.name}
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
    gap: spacing.m,
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
