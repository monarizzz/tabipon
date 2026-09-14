import React from "react";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DATABASE_NAME, migrateDbIfNeeded } from "@/src/infra/db/migrations";
import { I18nProvider } from "@/src/libs/i18n/I18nProvider";

function RootNavigator() {
  return (
    <Stack>
      <Stack.Screen name="photo-adjust" options={{ headerShown: false }} />
      <Stack.Screen name="stamp-press" options={{ headerShown: false }} />
      <Stack.Screen
        name="album-stamp-detail"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="stamp-done"
        options={{
          headerShown: false,
          animation: "none",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="mypage/notifications"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="mypage/privacy" options={{ headerShown: false }} />
      <Stack.Screen name="mypage/help" options={{ headerShown: false }} />
      <Stack.Screen name="mypage/language" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* マイグレーションが終わるまで子は描画されない。DB に触る画面はすべてこの内側に置く */}
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
        <I18nProvider>
          <SafeAreaProvider>
            <RootNavigator />
          </SafeAreaProvider>
        </I18nProvider>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}
