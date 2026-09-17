import { useRouter } from "expo-router";

import { LanguageMain } from "@/src/features/mypage/components/LanguageMain/LanguageMain";

export default function LanguageScreen() {
  const router = useRouter();

  return <LanguageMain onBack={router.back} />;
}
