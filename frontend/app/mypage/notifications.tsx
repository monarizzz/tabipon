import { useRouter } from "expo-router";

import { SettingsDetailMain } from "@/src/features/mypage/components/SettingsDetailMain/SettingsDetailMain";

export default function NotificationsScreen() {
  const router = useRouter();

  return (
    <SettingsDetailMain titleKey="mypage.notifications" onBack={router.back} />
  );
}
