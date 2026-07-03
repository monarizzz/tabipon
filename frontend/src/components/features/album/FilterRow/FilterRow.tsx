import { View, StyleSheet } from "react-native";
import { spacing } from "@/src/theme/tokens";
import { FilterChip } from "@/src/components/features/album/FilterChip/FilterChip";

export type FilterOption = {
  id: string;
  label: string;
};

type Props = {
  filters: FilterOption[];
  selectedFilterId: string;
  onSelectFilter: (id: string) => void;
  onAddPress?: () => void;
};

export function FilterRow({
  filters,
  selectedFilterId,
  onSelectFilter,
  onAddPress,
}: Props) {
  return (
    <View style={styles.row}>
      {filters.map((filter) => (
        <FilterChip
          key={filter.id}
          label={filter.label}
          selected={filter.id === selectedFilterId}
          onPress={() => onSelectFilter(filter.id)}
        />
      ))}
      {onAddPress ? (
        <FilterChip label="+" variant="add" onPress={onAddPress} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: spacing.xl,
    paddingBottom: 12,
  },
});
