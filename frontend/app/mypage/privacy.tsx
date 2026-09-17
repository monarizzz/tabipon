import { useRouter } from "expo-router";

import { SettingsDetailMain } from "@/src/features/mypage/components/SettingsDetailMain/SettingsDetailMain";

export default function PrivacyScreen() {
  const router = useRouter();

  return <SettingsDetailMain titleKey="mypage.privacy" onBack={router.back} />;
}
