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
import { listStamps, stampImageUri, type Stamp } from "@/src/infra/db/stamps";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { formatIsoDate } from "@/src/utils/datetime/format";
import { colors, typography, spacing } from "@/src/style/tokens";

// フィルターの id は固定。ラベルは描画時に翻訳・整形する。
// tokyo/kyoto/walk はデモ用のコレクション名（ユーザーデータ相当）なので翻訳対象外。
const FILTER_IDS: { id: string; label?: string }[] = [
  { id: "all" },
  { id: "tokyo", label: "東京旅行" },
  { id: "kyoto", label: "京都" },
  { id: "walk", label: "散歩" },
];

function toGridItem(stamp: Stamp, defaultName: string): StampGridItem {
  const spotName = stamp.title?.trim() || "";
  return {
    id: stamp.id,
    name: spotName || defaultName,
    nameUnset: !spotName,
    // 一覧のカードは日付だけ。時刻は詳細画面で出す
    date: formatIsoDate(stamp.capturedAt),
    imageUri: stampImageUri(stamp),
    spotName,
    memo: stamp.memo?.trim() || "",
    obtained: true,
    tiltAngle: stamp.tiltAngle,
    scratchLevel: stamp.scratchLevel,
    color: stamp.color,
    frame: stamp.frameId,
  };
}

export default function AlbumScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const filters: FilterOption[] = FILTER_IDS.map((f) => ({
    id: f.id,
    label: f.label ?? t("album.filterAll"),
  }));
  const [selectedFilterId, setSelectedFilterId] = React.useState(
    FILTER_IDS[0].id,
  );
  const [collectionSheetVisible, setCollectionSheetVisible] =
    React.useState(false);
  const [collectionName, setCollectionName] = React.useState("");
  const [stamps, setStamps] = React.useState<StampGridItem[] | null>(null);
  const [loadFailed, setLoadFailed] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadStamps = React.useCallback(() => {
    setLoadFailed(false);
    // 削除は端末ローカルで即座に効くので、消したはずの行が返ってくることはない。
    // サーバー反映を待つ間だけ一覧から隠す仕組みは要らなくなった
    return listStamps()
      .then((items) =>
        setStamps(
          items.map((item) => toGridItem(item, t("album.unknownSpotName"))),
        ),
      )
      .catch((error) => {
        console.error("[album] failed to load stamps", error);
        setLoadFailed(true);
      });
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
          <CommonButton
            label={t("common.reload")}
            onPress={loadStamps}
            variant="secondary"
          />
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
          // 詳細画面は id から DB を引くので、渡すのは id だけでよい
          onPressStamp={(item) =>
            router.push({
              pathname: "/album-stamp-detail",
              params: { id: item.id },
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
