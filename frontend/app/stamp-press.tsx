import { useLocalSearchParams } from "expo-router";

import { StampPressMain } from "@/src/features/camera/components/StampPressMain/StampPressMain";
import { useStampPress } from "@/src/features/camera/hooks/useStampPress";

export default function StampPressScreen() {
  const { uri, latitude, longitude, address } = useLocalSearchParams<{
    uri?: string;
    latitude?: string;
    longitude?: string;
    address?: string;
  }>();

  return (
    <StampPressMain
      {...useStampPress({ imageUri: uri, latitude, longitude, address })}
    />
  );
}
