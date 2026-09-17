import { useRouter } from "expo-router";

import { SettingsDetailMain } from "@/src/features/mypage/components/SettingsDetailMain/SettingsDetailMain";

export default function HelpScreen() {
  const router = useRouter();

  return <SettingsDetailMain titleKey="mypage.help" onBack={router.back} />;
}
