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
import {
  isStampDeleted,
  reconcileDeletedStamps,
} from "@/src/api/deletedStamps";
import { useTranslation } from "@/src/i18n/I18nProvider";
import { colors, typography, spacing } from "@/src/theme/tokens";

// フィルターの id は固定。ラベルは描画時に翻訳・整形する。
// tokyo/kyoto/walk はデモ用のコレクション名（ユーザーデータ相当）なので翻訳対象外。
const FILTER_IDS: { id: string; label?: string }[] = [
  { id: "all" },
  { id: "tokyo", label: "東京旅行" },
  { id: "kyoto", label: "京都" },
  { id: "walk", label: "散歩" },
];

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function toGridItem(stamp: StampListItem, defaultName: string): StampGridItem {
  return {
    id: stamp.id,
    // スポット名連携は未実装のため固定ラベルで表示する
    name: defaultName,
    date: formatDate(stamp.acquired_at),
    imageUri: stamp.image_url,
    obtained: true,
  };
}

export default function AlbumScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const filters: FilterOption[] = FILTER_IDS.map((f) => ({
    id: f.id,
    label: f.label ?? t("album.filterAll"),
  }));
  const [selectedFilterId, setSelectedFilterId] = React.useState(FILTER_IDS[0].id);
  const [collectionSheetVisible, setCollectionSheetVisible] =
    React.useState(false);
  const [collectionName, setCollectionName] = React.useState("");
  const [fetchedStamps, setFetchedStamps] = React.useState<StampListItem[]>([]);
  const [stamps, setStamps] = React.useState<StampGridItem[] | null>(null);
  const [loadFailed, setLoadFailed] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadStamps = React.useCallback(() => {
    setLoadFailed(false);
    return fetchStamps()
      .then((items) => {
        reconcileDeletedStamps(items.map((item) => item.id));
        setFetchedStamps(items);
        setStamps(
          items
            .filter((item) => !isStampDeleted(item.id))
            .map((item) => toGridItem(item, t("album.stampName"))),
        );
      })
      .catch(() => setLoadFailed(true));
  }, [t]);

  // 一覧を下に引っ張ったときの再読み込み
  const handleRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadStamps().finally(() => setRefreshing(false));
  }, [loadStamps]);

  // スタンプ獲得直後にタブへ戻ったときも最新化する
  useFocusEffect(
    React.useCallback(() => {
      loadStamps();
    }, [loadStamps]),
  );

  return (
    <View style={styles.container}>
      <Header
        title={t("album.title")}
        subtitle={t("album.stampCount", { count: stamps?.length ?? 0 })}
      />
      <FilterRow
        filters={filters}
        selectedFilterId={selectedFilterId}
        onSelectFilter={setSelectedFilterId}
        onAddPress={() => setCollectionSheetVisible(true)}
      />
      {loadFailed ? (
        <View style={styles.status}>
          <Text style={styles.statusText}>{t("album.loadError")}</Text>
          <CommonButton label={t("common.reload")} onPress={loadStamps} variant="secondary" />
        </View>
      ) : stamps === null ? (
        <View style={styles.status}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <StampGrid
          stamps={stamps}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onPressStamp={(item) => {
            const stamp = stamps && Array.isArray(stamps)
              ? (fetchedStamps.find((s) => s.id === item.id) ?? null)
              : null;
            router.push({
              pathname: "/album-stamp-detail",
              params: {
                id: item.id,
                imageUri: item.imageUri ?? "",
                date: item.date ?? "",
                latitude: String(stamp?.latitude ?? ""),
                longitude: String(stamp?.longitude ?? ""),
                spotName: stamp?.spot_name ?? "",
              },
            });
          }
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
