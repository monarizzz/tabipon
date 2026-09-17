import { SettingsDetailMain } from "@/src/features/mypage/components/SettingsDetailMain/SettingsDetailMain";
import { useSettingsDetail } from "@/src/features/mypage/hooks/useSettingsDetail";

export default function NotificationsScreen() {
  return <SettingsDetailMain {...useSettingsDetail("mypage.notifications")} />;
}
