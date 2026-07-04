import { Tabs } from "expo-router";
import { Camera, Image, User } from "lucide-react-native";
import {
  TabBar,
  type TabBarIcon,
} from "@/src/components/common/layout/TabBar/TabBar";
import { colors } from "@/src/theme/tokens";

const ICONS: Record<string, TabBarIcon> = {
  index: Camera,
  album: Image,
  mypage: User,
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, descriptors, navigation }) => (
        <TabBar
          items={state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const { options } = descriptors[route.key];
            return {
              key: route.key,
              label: (options.title ?? route.name) as string,
              icon: ICONS[route.name] ?? Camera,
              active: isFocused,
              activeColor: route.name === "mypage" ? colors.textPrimary : colors.primary,
              onPress: () => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              },
            };
          })}
        />
      )}
    >
      <Tabs.Screen name="index" options={{ title: "カメラ" }} />
      <Tabs.Screen name="album" options={{ title: "アルバム" }} />
      <Tabs.Screen name="mypage" options={{ title: "マイページ" }} />
    </Tabs>
  );
}
