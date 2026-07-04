import React from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { StampDetailPhoto } from "@/src/components/features/album/detail/StampDetailPhoto/StampDetailPhoto";
import { StampLocationMap } from "@/src/components/features/album/detail/StampLocationMap/StampLocationMap";
import { colors, spacing } from "@/src/theme/tokens";

const PAGE_WIDTH = Dimensions.get("window").width;

type Props = {
  spotName: string;
  imageUri?: string;
  previewLoading?: boolean;
  onPressDesignChange: () => void;
  onPressSpotName?: () => void;
  latitude: number;
  longitude: number;
};

export function StampDetailMediaPager({
  spotName,
  imageUri,
  previewLoading,
  onPressDesignChange,
  onPressSpotName,
  latitude,
  longitude,
}: Props) {
  const [activeIndex, setActiveIndex] = React.useState(0);

  const handleScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
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
      >
        <View style={{ width: PAGE_WIDTH }}>
          <StampDetailPhoto
            spotName={spotName}
            imageUri={imageUri}
            loading={previewLoading}
            onPressDesignChange={onPressDesignChange}
            onPressSpotName={onPressSpotName}
          />
        </View>
        <View style={{ width: PAGE_WIDTH }}>
          <StampLocationMap
            spotName={spotName}
            latitude={latitude}
            longitude={longitude}
          />
        </View>
      </ScrollView>
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
