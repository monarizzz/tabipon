import React from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import {
  FilterRow,
  type FilterOption,
} from "@/src/components/features/album/FilterRow/FilterRow";
import {
  StampGrid,
  type StampGridItem,
} from "@/src/components/features/album/StampGrid/StampGrid";
import { CollectionSheet } from "@/src/components/features/album/CollectionSheet/CollectionSheet";
import { Header } from "@/src/components/common/layout/Header/Header";
import { colors } from "@/src/theme/tokens";

const FILTERS: FilterOption[] = [
  { id: "all", label: "すべて" },
  { id: "tokyo", label: "東京旅行" },
  { id: "kyoto", label: "京都" },
  { id: "walk", label: "散歩" },
];

const PLACEHOLDER_STAMPS: StampGridItem[] = [
  { id: "1", name: "スタンプ1", date: "2026.06.28", obtained: true },
  { id: "2", name: "スタンプ2", obtained: false },
  { id: "3", name: "スタンプ3", date: "2026.06.25", obtained: true },
  { id: "4", name: "スタンプ4", obtained: false },
];

export default function AlbumScreen() {
  const router = useRouter();
  const [selectedFilterId, setSelectedFilterId] = React.useState(FILTERS[0].id);
  const [collectionSheetVisible, setCollectionSheetVisible] =
    React.useState(false);
  const [collectionName, setCollectionName] = React.useState("");

  return (
    <View style={styles.container}>
      <Header
        title="アルバム"
        subtitle={`スタンプ ${PLACEHOLDER_STAMPS.length}枚`}
      />
      <FilterRow
        filters={FILTERS}
        selectedFilterId={selectedFilterId}
        onSelectFilter={setSelectedFilterId}
        onAddPress={() => setCollectionSheetVisible(true)}
      />
      <StampGrid
        stamps={PLACEHOLDER_STAMPS}
        onPressStamp={() => router.push("/album-stamp-detail")}
      />
      <CollectionSheet
        visible={collectionSheetVisible}
        onClose={() => setCollectionSheetVisible(false)}
        name={collectionName}
        onChangeName={setCollectionName}
        onAdd={() => {
          setCollectionName("");
          setCollectionSheetVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
