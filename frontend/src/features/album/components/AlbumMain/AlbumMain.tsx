import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

import { CommonButton } from "@/src/commons/button/components/CommonButton/CommonButton";
import { Header } from "@/src/commons/layout/components/Header/Header";
import { CollectionSheet } from "@/src/features/album/components/CollectionSheet/CollectionSheet";
import { StampGrid } from "@/src/features/album/components/StampGrid/StampGrid";
import type { Album } from "@/src/features/album/types/album";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { colors, typography, spacing } from "@/src/style/tokens";

type Props = Album;

export function AlbumMain({
  stamps,
  loadFailed,
  refreshing,
  collectionSheetVisible,
  collectionName,
  reload,
  refresh,
  pressStamp,
  closeCollectionSheet,
  changeCollectionName,
  addCollection,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Header
        title={t("album.title")}
        subtitle={t("album.stampCount", { count: stamps?.length ?? 0 })}
      />
      {loadFailed ? (
        <View style={styles.status}>
          <Text style={styles.statusText}>{t("album.loadError")}</Text>
          <CommonButton
            label={t("common.reload")}
            onPress={reload}
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
          onRefresh={refresh}
          onPressStamp={pressStamp}
        />
      )}
      <CollectionSheet
        visible={collectionSheetVisible}
        onClose={closeCollectionSheet}
        name={collectionName}
        onChangeName={changeCollectionName}
        onAdd={addCollection}
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
