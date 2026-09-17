import { useLocalSearchParams } from "expo-router";

import { StampDoneMain } from "@/src/features/camera/components/StampDoneMain/StampDoneMain";
import { useStampDone } from "@/src/features/camera/hooks/useStampDone";

export default function StampDoneScreen() {
  const { stampTop, stampId } = useLocalSearchParams<{
    stampTop?: string;
    stampId?: string;
  }>();

  return <StampDoneMain {...useStampDone({ stampId, stampTop })} />;
}
