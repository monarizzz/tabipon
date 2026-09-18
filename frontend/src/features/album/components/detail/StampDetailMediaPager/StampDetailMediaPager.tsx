import React from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SpotNameLabel } from "@/src/commons/stamp/components/SpotNameLabel/SpotNameLabel";
import { StampDetailPhoto } from "@/src/features/album/components/detail/StampDetailPhoto/StampDetailPhoto";
import { StampLocationMap } from "@/src/features/album/components/detail/StampLocationMap/StampLocationMap";
import { colors, spacing } from "@/src/style/tokens";

const PAGE_WIDTH = Dimensions.get("window").width;

type Props = {
  spotName: string;
  imageUri?: string;
  onPressDesignChange: () => void;
  onPressSpotName?: () => void;
  latitude: number | null;
  longitude: number | null;
};

export function StampDetailMediaPager({
  spotName,
  imageUri,
  onPressDesignChange,
  onPressSpotName,
  latitude,
  longitude,
}: Props) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  // 地図のパンとページ送りは同じ横方向のジェスチャで、放っておくとページャが
  // 先に取ってしまう。地図カードに指が乗っている間だけページ送りを止めて
  // 地図へ譲る。カードの外側の余白では止めないので、地図ページからでも
  // 写真ページへ戻れる
  const [mapTouched, setMapTouched] = React.useState(false);

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / PAGE_WIDTH);
    setActiveIndex(page);
  };

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEnabled={!mapTouched}
      >
        <View style={{ width: PAGE_WIDTH }}>
          <StampDetailPhoto
            imageUri={imageUri}
            onPressDesignChange={onPressDesignChange}
          />
        </View>
        <View style={{ width: PAGE_WIDTH }}>
          <StampLocationMap
            spotName={spotName}
            latitude={latitude}
            longitude={longitude}
            onTouchStart={() => setMapTouched(true)}
            onTouchEnd={() => setMapTouched(false)}
          />
        </View>
      </ScrollView>
      {/* 置き場の方針は docs/front-architecture.md「スポット名の描画」を参照 */}
      <View style={styles.spotName}>
        <SpotNameLabel spotName={spotName} onPress={onPressSpotName} />
      </View>
      <View style={styles.dots}>
        {[0, 1].map((index) => (
          <View
            key={index}
            style={[styles.dot, index === activeIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  spotName: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.l,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.s,
    paddingBottom: spacing.s,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
});
