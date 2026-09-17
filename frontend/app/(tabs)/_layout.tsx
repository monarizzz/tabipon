import { Tabs } from "expo-router";
import { TabBar } from "@/src/commons/layout/components/TabBar/TabBar";
import {
  TAB_DEFINITIONS,
  type TabKey,
} from "@/src/commons/layout/components/TabBar/tabDefinitions";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";

const TAB_BY_KEY = new Map(TAB_DEFINITIONS.map((tab) => [tab.key, tab]));

export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, descriptors, navigation }) => (
        <TabBar
          items={state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const { options } = descriptors[route.key];
            // 並び・文言・アイコンは TAB_DEFINITIONS に集約してある
            const definition = TAB_BY_KEY.get(route.name as TabKey);
            return {
              key: route.key,
              label: definition
                ? t(definition.labelKey)
                : ((options.title ?? route.name) as string),
              icon: definition?.icon ?? TAB_DEFINITIONS[0].icon,
              active: isFocused,
              activeColor: definition?.activeColor,
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
      {TAB_DEFINITIONS.map((tab) => (
        <Tabs.Screen
          key={tab.key}
          name={tab.key}
          options={{ title: t(tab.labelKey) }}
        />
      ))}
    </Tabs>
  );
}
