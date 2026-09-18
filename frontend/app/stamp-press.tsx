import { useLocalSearchParams } from "expo-router";

import { StampPressMain } from "@/src/features/camera/components/StampPressMain/StampPressMain";
import { useStampPress } from "@/src/features/camera/hooks/useStampPress";

export default function StampPressScreen() {
  const { uri, capturedAt, latitude, longitude, address } =
    useLocalSearchParams<{
      uri?: string;
      capturedAt?: string;
      latitude?: string;
      longitude?: string;
      address?: string;
    }>();

  return (
    <StampPressMain
      {...useStampPress({
        imageUri: uri,
        capturedAt,
        latitude,
        longitude,
        address,
      })}
    />
  );
}
