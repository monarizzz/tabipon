import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
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
import { CommonButton } from "@/src/components/common/CommonButton/CommonButton";
import { fetchStamps, type StampListItem } from "@/src/api/stamps";
import { colors, typography, spacing } from "@/src/theme/tokens";

const FILTERS: FilterOption[] = [
  { id: "all", label: "すべて" },
  { id: "tokyo", label: "東京旅行" },
  { id: "kyoto", label: "京都" },
  { id: "walk", label: "散歩" },
];

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function toGridItem(stamp: StampListItem): StampGridItem {
  return {
    id: stamp.id,
    // スポット名連携は未実装のため固定ラベルで表示する
    name: "スタンプ",
    date: formatDate(stamp.acquired_at),
    imageUri: stamp.image_url,
    obtained: true,
  };
}

export default function AlbumScreen() {
  const router = useRouter();
  const [selectedFilterId, setSelectedFilterId] = React.useState(FILTERS[0].id);
  const [collectionSheetVisible, setCollectionSheetVisible] =
    React.useState(false);
  const [collectionName, setCollectionName] = React.useState("");
  const [stamps, setStamps] = React.useState<StampGridItem[] | null>(null);
  const [loadFailed, setLoadFailed] = React.useState(false);

  const loadStamps = React.useCallback(() => {
    setLoadFailed(false);
    fetchStamps()
      .then((items) => setStamps(items.map(toGridItem)))
      .catch(() => setLoadFailed(true));
  }, []);

  // スタンプ獲得直後にタブへ戻ったときも最新化する
  useFocusEffect(
    React.useCallback(() => {
      loadStamps();
    }, [loadStamps]),
  );

  return (
    <View style={styles.container}>
      <Header
        title="アルバム"
        subtitle={`スタンプ ${stamps?.length ?? 0}枚`}
      />
      <FilterRow
        filters={FILTERS}
        selectedFilterId={selectedFilterId}
        onSelectFilter={setSelectedFilterId}
        onAddPress={() => setCollectionSheetVisible(true)}
      />
      {loadFailed ? (
        <View style={styles.status}>
          <Text style={styles.statusText}>スタンプを読み込めませんでした</Text>
          <CommonButton label="再読み込み" onPress={loadStamps} variant="secondary" />
        </View>
      ) : stamps === null ? (
        <View style={styles.status}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <StampGrid
          stamps={stamps}
          onPressStamp={(item) =>
            router.push({
              pathname: "/album-stamp-detail",
              params: {
                id: item.id,
                imageUri: item.imageUri ?? "",
                date: item.date ?? "",
              },
            })
          }
        />
      )}
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
  status: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.l,
  },
  statusText: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
});
