import { useLocalSearchParams } from "expo-router";

import { PhotoAdjustMain } from "@/src/features/camera/components/PhotoAdjustMain/PhotoAdjustMain";
import { usePhotoAdjust } from "@/src/features/camera/hooks/usePhotoAdjust";

export default function PhotoAdjustScreen() {
  const { uri } = useLocalSearchParams<{ uri?: string }>();

  return <PhotoAdjustMain {...usePhotoAdjust(uri)} />;
}
