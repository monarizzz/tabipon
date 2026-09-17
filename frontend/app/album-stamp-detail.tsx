import { useLocalSearchParams } from "expo-router";

import { StampDetailMain } from "@/src/features/album/components/StampDetailMain/StampDetailMain";
import { useStampDetail } from "@/src/features/album/hooks/useStampDetail";

export default function StampDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  return <StampDetailMain {...useStampDetail(id)} />;
}
